-- ============================================================================
-- Checkout cause selections saved server-side, and reliable welcome emails
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Cause selections made right after a guest checkout
--
-- A guest has no session at the post-checkout "pick your causes" step (their
-- email isn't confirmed yet), so set_my_causes can't be used. The selection
-- used to be stashed in the browser's localStorage and applied the next time
-- that same browser signed in, which silently dropped it for anyone who
-- confirmed on another device or inside a mail app's built-in browser.
--
-- Now process_checkout hands the checkout browser a one-time token for the
-- new membership. The causes step sends the selection with that token; it is
-- stored here and moved into member_causes the moment the email is confirmed
-- (sync_user_to_subscriptions). If the email was already confirmed by the
-- time the selection arrives, it is applied immediately.
--
-- The token is a random UUID returned only to the browser that checked out;
-- only its SHA-256 is stored. It stops working after 24 hours.
-- ----------------------------------------------------------------------------
create table if not exists public.pending_member_causes (
  subscription_id bigint primary key references public."Subscriptions"(id) on delete cascade,
  token_hash      text not null,
  slugs           text[],
  created_at      timestamptz not null default now()
);
comment on table public.pending_member_causes is
  'Cause selections made after a guest checkout, held until the email is confirmed. No client access; written only through set_checkout_causes.';

alter table public.pending_member_causes enable row level security;
revoke all on public.pending_member_causes from anon, authenticated;

-- Normalize, de-duplicate (first-seen order) and validate a selection.
create or replace function public.normalize_cause_slugs(p_slugs text[])
returns text[]
language plpgsql
immutable
set search_path to ''
as $$
declare
  v_slugs text[];
begin
  select coalesce(array_agg(d.slug order by d.first_ord), '{}')
  into v_slugs
  from (
    select lower(btrim(t.slug)) as slug, min(t.ord) as first_ord
    from unnest(coalesce(p_slugs, '{}'::text[])) with ordinality as t(slug, ord)
    where t.slug is not null and btrim(t.slug) <> ''
    group by lower(btrim(t.slug))
  ) d;

  if cardinality(v_slugs) > 4 then
    raise exception 'You can select up to 4 causes';
  end if;

  if exists (select 1 from unnest(v_slugs) s where s !~ '^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$') then
    raise exception 'Unknown cause.';
  end if;

  return v_slugs;
end;
$$;

-- Atomically replace one member's selection. Internal: callers are the
-- definer functions below, never the API.
create or replace function public.replace_member_causes(p_uid uuid, p_slugs text[])
returns void
language plpgsql
set search_path to ''
as $$
declare
  v_slugs text[] := public.normalize_cause_slugs(p_slugs);
begin
  -- Serializes concurrent saves for one member so they replace rather than collide.
  perform pg_advisory_xact_lock(hashtext('amplify.member_causes'), hashtext(p_uid::text));

  delete from public.member_causes where user_id = p_uid;

  insert into public.member_causes (user_id, org_slug, rank)
  select p_uid, u.s, (u.o - 1)::smallint
  from unnest(v_slugs) with ordinality as u(s, o);
end;
$$;

revoke all on function public.normalize_cause_slugs(text[]) from public, anon, authenticated;
revoke all on function public.replace_member_causes(uuid, text[]) from public, anon, authenticated;

-- Signed-in members: unchanged behavior, now sharing the helper above.
create or replace function public.set_my_causes(p_slugs text[])
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  perform public.replace_member_causes(auth.uid(), p_slugs);
end;
$$;

-- Guests, right after checkout.
create or replace function public.set_checkout_causes(
  p_subscription_id bigint,
  p_token           uuid,
  p_slugs           text[]
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_created_at timestamptz;
  v_user       uuid;
  v_slugs      text[];
begin
  select p.created_at into v_created_at
  from public.pending_member_causes p
  where p.subscription_id = p_subscription_id
    and p.token_hash = encode(extensions.digest(coalesce(p_token::text, ''), 'sha256'), 'hex')
  for update;

  if v_created_at is null or v_created_at < now() - interval '24 hours' then
    raise exception 'This page has expired. You can choose your causes anytime from My Account.';
  end if;

  v_slugs := public.normalize_cause_slugs(p_slugs);

  select s.user_id into v_user from public."Subscriptions" s where s.id = p_subscription_id;

  if v_user is not null then
    -- Email already confirmed (e.g. on another device): apply now.
    perform public.replace_member_causes(v_user, v_slugs);
    delete from public.pending_member_causes where subscription_id = p_subscription_id;
    return json_build_object('applied', true);
  end if;

  update public.pending_member_causes set slugs = v_slugs where subscription_id = p_subscription_id;
  return json_build_object('applied', false);
end;
$$;

revoke all on function public.set_checkout_causes(bigint, uuid, text[]) from public;
grant execute on function public.set_checkout_causes(bigint, uuid, text[]) to anon, authenticated, service_role;

-- Apply a held selection when the email is confirmed. Wrapped so that a bad
-- pending row can never block the confirmation itself.
create or replace function public.sync_user_to_subscriptions()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_slugs text[];
begin
    -- (a) first email confirmation -> link anonymous checkout rows
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public."Subscriptions"
        SET user_id = NEW.id
        WHERE user_id IS NULL AND lower(email) = lower(NEW.email);

        BEGIN
            SELECT p.slugs INTO v_slugs
            FROM public.pending_member_causes p
            JOIN public."Subscriptions" s ON s.id = p.subscription_id
            WHERE s.user_id = NEW.id AND p.slugs IS NOT NULL
            ORDER BY p.created_at DESC
            LIMIT 1;

            IF v_slugs IS NOT NULL THEN
                PERFORM public.replace_member_causes(NEW.id, v_slugs);
                DELETE FROM public.pending_member_causes p
                USING public."Subscriptions" s
                WHERE s.id = p.subscription_id AND s.user_id = NEW.id AND p.slugs IS NOT NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not apply checkout cause selection for user %: %', NEW.id, SQLERRM;
        END;
    END IF;

    -- (b) confirmed email change -> sync stored email
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public."Subscriptions"
        SET email = NEW.email
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- process_checkout: unchanged except for issuing the causes token (step 8b)
-- and returning it.
CREATE OR REPLACE FUNCTION public.process_checkout(p_full_name text, p_display_name text, p_is_anonymous boolean, p_email text, p_phone text, p_address text, p_city text, p_state text, p_zip_code text, p_tier text, p_community_name text, p_referral_slug text DEFAULT NULL::text, p_click_token uuid DEFAULT NULL::uuid, p_date_of_birth date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_uid            uuid := auth.uid();
    v_email          text;
    v_full_name      text := btrim(coalesce(p_full_name, ''));
    v_display_name   text;
    v_phone          text := btrim(coalesce(p_phone, ''));
    v_address        text := btrim(coalesce(p_address, ''));
    v_city           text := btrim(coalesce(p_city, ''));
    v_state          text := upper(btrim(coalesce(p_state, '')));
    v_zip            text := btrim(coalesce(p_zip_code, ''));
    v_community_name text := regexp_replace(btrim(coalesce(p_community_name, '')), '\s+', ' ', 'g');
    v_min_age        integer;
    v_age            integer;
    v_community_id   public.communities.id%TYPE;
    v_circle_id      public.circles.id%TYPE;
    v_circle_number  INTEGER;
    v_subscription_id public."Subscriptions".id%TYPE;
    v_tier_price     NUMERIC;
    v_is_existing_donor BOOLEAN;
    v_affiliate      public.affiliates%ROWTYPE;
    v_click          public.referral_clicks%ROWTYPE;
    v_settings       public.referral_settings%ROWTYPE;
    v_inserted       INTEGER := 0;
    v_referral_recorded BOOLEAN := false;
    v_causes_token   uuid := gen_random_uuid();
BEGIN
    -- 1. SERVER-SIDE PRICING
    IF p_tier = 'silver' THEN v_tier_price := 250;
    ELSIF p_tier = 'gold' THEN v_tier_price := 500;
    ELSIF p_tier = 'diamond' THEN v_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    -- 2. IDENTITY. A signed-in member always checks out under their account
    -- email, so the row can't be linked to one account but addressed to
    -- another inbox.
    IF v_uid IS NOT NULL THEN
        SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = v_uid;
    END IF;
    v_email := coalesce(v_email, lower(btrim(coalesce(p_email, ''))));

    IF length(v_email) > 254 OR v_email !~ '^[^\s@]+@[^\s@]+\.[a-z]{2,}$' THEN
        RAISE EXCEPTION 'Enter a valid email address.';
    END IF;

    -- A guest checkout for an email that already has a verified account would
    -- create a row that never links to that account (linking happens on first
    -- confirmation). The site already sends these visitors to sign in first;
    -- this holds the same line for direct API calls.
    IF v_uid IS NULL AND EXISTS (
        SELECT 1 FROM auth.users u
        WHERE lower(u.email) = v_email AND u.email_confirmed_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'An account already exists for this email. Please sign in first, then complete your checkout.';
    END IF;

    -- 3. INPUT VALIDATION (mirrors the checkout form; this RPC is public)
    IF v_full_name = '' OR length(v_full_name) > 120 THEN
        RAISE EXCEPTION 'Enter your full name (up to 120 characters).';
    END IF;

    IF coalesce(p_is_anonymous, false) THEN
        v_display_name := 'Anonymous';
    ELSE
        v_display_name := coalesce(nullif(btrim(coalesce(p_display_name, '')), ''), v_full_name);
    END IF;
    IF length(v_display_name) > 80 THEN
        RAISE EXCEPTION 'Display name must be 80 characters or fewer.';
    END IF;

    IF length(v_phone) > 30 OR length(regexp_replace(v_phone, '\D', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'Enter a valid phone number.';
    END IF;
    IF v_address = '' OR length(v_address) > 200 THEN
        RAISE EXCEPTION 'Enter your street address.';
    END IF;
    IF v_city = '' OR length(v_city) > 100 THEN
        RAISE EXCEPTION 'Enter your city.';
    END IF;
    IF NOT (v_state = ANY (ARRAY[
        'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS',
        'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
        'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'])) THEN
        RAISE EXCEPTION 'Select a valid US state.';
    END IF;
    IF v_zip !~ '^\d{5}(-\d{4})?$' THEN
        RAISE EXCEPTION 'Enter a valid ZIP code.';
    END IF;

    -- Official Rules §4: 18 everywhere, except 19 in AL/NE and 21 in MS,
    -- keyed off state of residence (the address just validated above).
    v_min_age := CASE v_state WHEN 'AL' THEN 19 WHEN 'NE' THEN 19 WHEN 'MS' THEN 21 ELSE 18 END;
    IF p_date_of_birth IS NULL OR p_date_of_birth > current_date THEN
        RAISE EXCEPTION 'Enter a valid date of birth.';
    END IF;
    v_age := extract(year FROM age(current_date, p_date_of_birth))::integer;
    IF v_age < v_min_age THEN
        RAISE EXCEPTION 'You must be at least % to enter from %.', v_min_age, v_state;
    END IF;

    IF v_community_name = '' THEN
        v_community_name := 'General';
    END IF;
    IF length(v_community_name) > 50 THEN
        RAISE EXCEPTION 'Community name must be 50 characters or fewer.';
    END IF;

    -- 4. ONE ACTIVE ENTRY PER PERSON PER TIER (Official Rules §7).
    -- Taken under the tier lock, which every path that activates a seat in
    -- this tier also holds, so two simultaneous submits can't both pass.
    PERFORM public.lock_circle_tier(p_tier);

    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.status = 'active' AND s.tier = p_tier
          AND (lower(s.email) = v_email OR (v_uid IS NOT NULL AND s.user_id = v_uid))
    ) THEN
        RAISE EXCEPTION 'You already have an active % membership. You can manage it from My Account.', initcap(p_tier);
    END IF;

    -- 5. REFERRAL ELIGIBILITY SNAPSHOT (before the insert: "new member" means
    -- new as of arrival)
    SELECT EXISTS (
        SELECT 1 FROM public."Subscriptions"
        WHERE lower(email) = v_email
           OR (v_uid IS NOT NULL AND user_id = v_uid)
    ) INTO v_is_existing_donor;

    -- 6. COMMUNITY ROUTING. New names start 'pending' (hidden from the public
    -- list until approved). ON CONFLICT covers a simultaneous checkout that
    -- creates the same new name first.
    SELECT c.id INTO v_community_id
    FROM public.communities c
    WHERE lower(c.name) = lower(v_community_name)
    ORDER BY (c.status = 'approved') DESC, c.id
    LIMIT 1;

    IF v_community_id IS NULL THEN
        INSERT INTO public.communities (name, members, monthly, silver, gold, diamond, status)
        VALUES (v_community_name, 0, 0, 0, 0, 0, 'pending')
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_community_id;

        IF v_community_id IS NULL THEN
            SELECT c.id INTO v_community_id
            FROM public.communities c
            WHERE lower(c.name) = lower(v_community_name)
            LIMIT 1;
        END IF;
    END IF;

    -- 7. CIRCLE ROUTING
    SELECT o_circle_id, o_circle_number INTO v_circle_id, v_circle_number
    FROM public.claim_circle_seat(p_tier);

    -- 8. INSERT SUBSCRIPTION
    INSERT INTO public."Subscriptions" (
        "full name", display_name, is_anonymous, email, phone, address, city, state, zip_code,
        tier, community_id, circle_id, status, user_id, age_verified_at, age_at_verification
    ) VALUES (
        v_full_name, v_display_name, coalesce(p_is_anonymous, false), v_email, v_phone, v_address, v_city, v_state, v_zip,
        p_tier, v_community_id, v_circle_id, 'active', v_uid, now(), v_age
    ) RETURNING id INTO v_subscription_id;

    -- 8b. One-time token for the post-checkout causes step (see
    -- set_checkout_causes). Housekeeping: drop tokens nobody used.
    DELETE FROM public.pending_member_causes
    WHERE slugs IS NULL AND created_at < now() - interval '2 days';

    INSERT INTO public.pending_member_causes (subscription_id, token_hash)
    VALUES (v_subscription_id, encode(extensions.digest(v_causes_token::text, 'sha256'), 'hex'));

    -- 9. All-time vanity metrics: joins only ever add.
    UPDATE public.communities SET
        members = members + 1,
        monthly = monthly + v_tier_price,
        silver = silver + CASE WHEN p_tier = 'silver' THEN 1 ELSE 0 END,
        gold = gold + CASE WHEN p_tier = 'gold' THEN 1 ELSE 0 END,
        diamond = diamond + CASE WHEN p_tier = 'diamond' THEN 1 ELSE 0 END
    WHERE id = v_community_id;

    -- 10. REFERRAL ATTRIBUTION (best-effort; never fails the checkout)
    IF p_referral_slug IS NOT NULL AND btrim(p_referral_slug) <> '' AND NOT v_is_existing_donor THEN
        BEGIN
            SELECT * INTO v_affiliate
            FROM public.affiliates
            WHERE slug = lower(btrim(p_referral_slug)) AND is_active
            LIMIT 1;

            IF v_affiliate.id IS NOT NULL
               AND lower(v_affiliate.email) <> v_email
               AND (v_affiliate.user_id IS NULL OR v_uid IS NULL OR v_affiliate.user_id <> v_uid)
            THEN
                SELECT * INTO v_settings FROM public.referral_settings LIMIT 1;

                IF p_click_token IS NOT NULL THEN
                    SELECT * INTO v_click
                    FROM public.referral_clicks
                    WHERE token = p_click_token AND affiliate_id = v_affiliate.id
                    LIMIT 1;
                END IF;

                INSERT INTO public.referrals (
                    affiliate_id, referred_user_id, referred_subscription_id, referred_email,
                    clicked_at, signed_up_at, payout_1_amount_cents, payout_2_amount_cents
                ) VALUES (
                    v_affiliate.id, v_uid, v_subscription_id, v_email,
                    v_click.clicked_at, now(),
                    COALESCE(v_settings.payout_1_amount_cents, 2500),
                    COALESCE(v_settings.payout_2_amount_cents, 2500)
                )
                ON CONFLICT DO NOTHING;

                GET DIAGNOSTICS v_inserted = ROW_COUNT;
                v_referral_recorded := (v_inserted > 0);

                IF v_referral_recorded AND v_click.id IS NOT NULL THEN
                    UPDATE public.referral_clicks
                    SET converted_at = now()
                    WHERE id = v_click.id AND converted_at IS NULL;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_referral_recorded := false;
        END;
    END IF;

    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'assigned_circle', v_circle_number,
        'referral_recorded', v_referral_recorded,
        'causes_token', v_causes_token
    );
END;
$function$;

-- ----------------------------------------------------------------------------
-- 2. Welcome emails that are recorded and retried
--
-- The insert trigger queues an HTTP call to send-welcome-email (pg_net sends
-- it after the checkout commits, so a failure never affects the checkout).
-- But if that call failed (Resend down, a timeout, a cold-start error), the
-- email was simply never sent and nothing noticed.
--
-- Now the edge function stamps welcome_email_sent_at when Resend accepts the
-- message, and a pg_cron job every 10 minutes re-queues any active membership
-- that is 10+ minutes old and still unsent, up to 3 retries within 3 days.
-- The edge function skips rows already stamped, and sends with an
-- idempotency key, so a retry can't produce a duplicate email.
-- ----------------------------------------------------------------------------
alter table public."Subscriptions"
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists welcome_email_retries smallint not null default 0;

comment on column public."Subscriptions".welcome_email_sent_at is
  'When Resend accepted the welcome email. Null = not (yet) sent; retried by retry_welcome_emails().';

-- Memberships that existed before this column was added already got (or
-- missed) their email; don't retry them.
update public."Subscriptions" set welcome_email_sent_at = created_at where welcome_email_sent_at is null;

create or replace function public.queue_welcome_email(p_record json)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'welcome_email_webhook_secret';

  perform net.http_post(
    url := 'https://gloncuhgefzrpuwbzoke.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'Subscriptions',
      'schema', 'public',
      'record', p_record
    ),
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function public.queue_welcome_email(json) from public, anon, authenticated;

create or replace function public.fire_welcome_email_webhook()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  begin
    perform public.queue_welcome_email(row_to_json(new));
  exception when others then
    -- Never fail a checkout over its welcome email; the retry job picks it up.
    raise warning 'Could not queue welcome email for subscription %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.retry_welcome_emails()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row   public."Subscriptions"%rowtype;
  v_count integer := 0;
begin
  for v_row in
    select s.*
    from public."Subscriptions" s
    where s.status = 'active'
      and s.welcome_email_sent_at is null
      and s.welcome_email_retries < 3
      and s.created_at < now() - interval '10 minutes'
      and s.created_at > now() - interval '3 days'
    for update skip locked
  loop
    update public."Subscriptions"
    set welcome_email_retries = welcome_email_retries + 1
    where id = v_row.id;

    perform public.queue_welcome_email(row_to_json(v_row));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.retry_welcome_emails() from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'retry-welcome-emails') then
    perform cron.unschedule('retry-welcome-emails');
  end if;
  perform cron.schedule('retry-welcome-emails', '*/10 * * * *', 'select public.retry_welcome_emails()');
end;
$$;
