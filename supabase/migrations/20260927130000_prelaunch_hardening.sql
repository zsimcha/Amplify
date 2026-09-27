-- ============================================================================
-- Pre-launch hardening. Each change below closes a gap reproduced against a
-- replay of this migration history:
--
--  1. Circle routing races. Two checkouts landing while a circle is full both
--     tried to create the next circle, and one failed with a duplicate-key
--     error; two checkouts naming the same brand-new community did the same.
--     All seat changes in a tier now run under one per-tier advisory lock, via
--     shared claim/release helpers instead of four hand-copied variants.
--  2. process_checkout accepted anything: a malformed email, a 5,000-character
--     name, state 'ZZ', zip 'abc', a 1,000-character community name. It is
--     callable by anon (guest checkout), and every accepted row fires the
--     welcome email, so inputs are now validated server-side.
--  3. Official Rules §5 (Method A) allow one paid entry per person per tier;
--     nothing enforced it. Checkout, reactivation and tier changes now refuse
--     a second active entry in the same tier.
--  4. link_affiliate_to_user attached an ambassador row to whoever *signed up*
--     with that email, before the address was verified — so anyone who knew
--     an ambassador's email could register first and read their dashboard and
--     payout details. Linking now requires a confirmed email.
--  5. member_causes kept direct INSERT/UPDATE/DELETE/TRUNCATE grants for anon
--     and authenticated, so the 4-cause cap in set_my_causes could be skipped
--     with a plain table insert. Writes now go only through set_my_causes, and
--     the table itself caps a member at 4 rows.
--  6. A database rebuilt from this history did not match production's grants
--     (see "Pin privileges" below).
-- Plus integrity constraints and grant cleanup, noted inline.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

-- The original single-argument overload from the initial schema dump. Already
-- absent in production; dropping it here keeps fresh environments identical,
-- and removes the ambiguity that made cancel_and_rebalance(<id>) unresolvable.
drop function if exists public.cancel_and_rebalance(integer);

-- 'causes' became a route (/causes) after the reserved list was written.
insert into public.reserved_slugs (slug) values ('causes') on conflict do nothing;

-- Pin privileges to what production already has. The initial schema dump
-- records production's grants but not the revokes that produced them, so a
-- database rebuilt from these migrations (supabase db reset, a preview
-- branch, disaster recovery) came up with process_tier_change and
-- reactivate_subscription callable by anon, and anon holding INSERT/UPDATE/
-- DELETE/TRUNCATE on the core tables. All no-ops on production.
revoke insert, update, delete, truncate on public."Subscriptions", public.circles, public.communities from anon, authenticated;
revoke all on public.backend_accurate_stats from anon, authenticated;
revoke all on public.sweepstakes_roster from anon;
revoke insert, update, delete, truncate on public.sweepstakes_roster from authenticated;
revoke all on function public.process_tier_change(integer, text)       from public, anon, authenticated;
revoke all on function public.reactivate_subscription(integer)         from public, anon, authenticated;
revoke all on function public.cancel_and_rebalance(integer, text)      from public, anon, authenticated;
grant execute on function public.process_tier_change(integer, text)   to service_role;
grant execute on function public.reactivate_subscription(integer)     to service_role;
grant execute on function public.cancel_and_rebalance(integer, text)  to service_role;

-- ---------------------------------------------------------------------------
-- Integrity constraints
-- ---------------------------------------------------------------------------
alter table public."Subscriptions"
  add constraint subscriptions_tier_check   check (tier in ('silver', 'gold', 'diamond')),
  add constraint subscriptions_status_check check (status in ('active', 'past_due', 'cancelled'));

alter table public.circles
  add constraint circles_tier_check   check (tier in ('silver', 'gold', 'diamond')),
  add constraint circles_status_check check (status in ('filling', 'full'));

-- Community names match case-insensitively ("bergen county" is Bergen County).
create unique index if not exists communities_name_lower_key on public.communities (lower(name));

-- Helps the one-active-entry-per-tier check and the email linking triggers.
create index if not exists subscriptions_lower_email_idx on public."Subscriptions" (lower(email));

-- ---------------------------------------------------------------------------
-- Circle seat helpers
-- ---------------------------------------------------------------------------

-- Serializes every seat change within one tier for the rest of the
-- transaction. Callers needing two tiers must lock them in sorted order.
create or replace function public.lock_circle_tier(p_tier text)
returns void
language plpgsql
set search_path to ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('amplify.circle_routing'), hashtext(p_tier));
end;
$$;

-- Seats one member in the oldest circle of the tier that has room, opening
-- the next circle when all are full. Returns the circle's id and number.
create or replace function public.claim_circle_seat(
  p_tier text,
  out o_circle_id integer,
  out o_circle_number integer
)
language plpgsql
set search_path to ''
as $$
begin
  perform public.lock_circle_tier(p_tier);

  select c.id, c.circle_number into o_circle_id, o_circle_number
  from public.circles c
  where c.tier = p_tier and c.current_members < 400
  order by c.circle_number asc
  limit 1
  for update;

  if o_circle_id is null then
    select coalesce(max(c.circle_number), 0) + 1 into o_circle_number
    from public.circles c
    where c.tier = p_tier;

    insert into public.circles (tier, circle_number, current_members, status)
    values (p_tier, o_circle_number, 0, 'filling')
    returning id into o_circle_id;
  end if;

  update public.circles
  set current_members = current_members + 1,
      status = case when current_members + 1 >= 400 then 'full' else 'filling' end
  where id = o_circle_id;
end;
$$;

-- Vacates one seat, then pulls the oldest active member of a later, still
-- filling circle in the same tier backward to fill it (the Bump-Up). The
-- caller must already have moved the departing member out of 'active' (or out
-- of this circle) so they can't be chosen as their own replacement.
create or replace function public.release_circle_seat(p_circle_id integer)
returns void
language plpgsql
set search_path to ''
as $$
declare
  v_tier               text;
  v_number             integer;
  v_replacement_sub_id bigint;
  v_source_circle_id   integer;
begin
  select c.tier, c.circle_number into v_tier, v_number
  from public.circles c
  where c.id = p_circle_id;

  if v_tier is null then
    return;
  end if;

  perform public.lock_circle_tier(v_tier);

  update public.circles
  set current_members = current_members - 1, status = 'filling'
  where id = p_circle_id;

  select s.id, s.circle_id into v_replacement_sub_id, v_source_circle_id
  from public."Subscriptions" s
  join public.circles c on c.id = s.circle_id
  where s.status = 'active'
    and c.status = 'filling'
    and c.tier = v_tier
    and c.circle_number > v_number
  order by s.created_at asc, s.id asc
  limit 1;

  if v_replacement_sub_id is not null then
    update public."Subscriptions" set circle_id = p_circle_id where id = v_replacement_sub_id;

    update public.circles
    set current_members = current_members + 1,
        status = case when current_members + 1 >= 400 then 'full' else 'filling' end
    where id = p_circle_id;

    update public.circles
    set current_members = current_members - 1
    where id = v_source_circle_id;
  end if;
end;
$$;

revoke all on function public.lock_circle_tier(text)      from public, anon, authenticated;
revoke all on function public.claim_circle_seat(text)     from public, anon, authenticated;
revoke all on function public.release_circle_seat(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- process_checkout — validated inputs, one active entry per tier, race-free
-- community and circle routing. Referral attribution is unchanged apart from
-- using the normalized email. Vanity metrics keep their all-time semantics.
-- ---------------------------------------------------------------------------
create or replace function public.process_checkout(
    p_full_name text, p_display_name text, p_is_anonymous boolean, p_email text,
    p_phone text, p_address text, p_city text, p_state text, p_zip_code text,
    p_tier text, p_community_name text,
    p_referral_slug text default null, p_click_token uuid default null)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
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

    IF v_community_name = '' THEN
        v_community_name := 'General';
    END IF;
    IF length(v_community_name) > 50 THEN
        RAISE EXCEPTION 'Community name must be 50 characters or fewer.';
    END IF;

    -- 4. ONE ACTIVE ENTRY PER PERSON PER TIER (Official Rules §5, Method A).
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
        tier, community_id, circle_id, status, user_id
    ) VALUES (
        v_full_name, v_display_name, coalesce(p_is_anonymous, false), v_email, v_phone, v_address, v_city, v_state, v_zip,
        p_tier, v_community_id, v_circle_id, 'active', v_uid
    ) RETURNING id INTO v_subscription_id;

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
        'referral_recorded', v_referral_recorded
    );
END;
$function$;

-- ---------------------------------------------------------------------------
-- process_tier_change — locks both tiers (sorted, so opposite-direction
-- changes can't deadlock) and the subscription row, re-verifies under the
-- lock, and refuses a second active entry in the target tier. Vanity metrics
-- keep the net-difference behaviour.
-- ---------------------------------------------------------------------------
create or replace function public.process_tier_change(p_subscription_id integer, p_new_tier text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
    v_seen_tier      TEXT;
    v_old_tier       TEXT;
    v_status         TEXT;
    v_old_circle_id  INTEGER;
    v_community_id   BIGINT;
    v_email          TEXT;
    v_user_id        UUID;
    v_new_circle_id  INTEGER;
    v_new_circle_number INTEGER;
    v_new_tier_price NUMERIC;
BEGIN
    IF p_new_tier = 'silver' THEN v_new_tier_price := 250;
    ELSIF p_new_tier = 'gold' THEN v_new_tier_price := 500;
    ELSIF p_new_tier = 'diamond' THEN v_new_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    -- Unlocked read, only to learn which tier locks to take.
    SELECT s.tier INTO v_seen_tier FROM public."Subscriptions" s WHERE s.id = p_subscription_id;

    IF v_seen_tier IS NULL OR v_seen_tier = p_new_tier THEN
        RETURN json_build_object('success', false, 'message', 'Invalid tier change');
    END IF;

    IF v_seen_tier < p_new_tier THEN
        PERFORM public.lock_circle_tier(v_seen_tier);
        PERFORM public.lock_circle_tier(p_new_tier);
    ELSE
        PERFORM public.lock_circle_tier(p_new_tier);
        PERFORM public.lock_circle_tier(v_seen_tier);
    END IF;

    SELECT s.tier, s.status, s.circle_id, s.community_id, lower(s.email), s.user_id
    INTO v_old_tier, v_status, v_old_circle_id, v_community_id, v_email, v_user_id
    FROM public."Subscriptions" s
    WHERE s.id = p_subscription_id
    FOR UPDATE;

    IF v_status IS DISTINCT FROM 'active' OR v_old_tier IS DISTINCT FROM v_seen_tier THEN
        -- Cancelled, or changed by a concurrent request since the read above.
        RETURN json_build_object('success', false, 'message', 'Your membership changed while this request was in progress. Please refresh and try again.');
    END IF;

    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.id <> p_subscription_id AND s.status = 'active' AND s.tier = p_new_tier
          AND (lower(s.email) = v_email OR (v_user_id IS NOT NULL AND s.user_id = v_user_id))
    ) THEN
        RETURN json_build_object('success', false, 'message', format('You already have an active %s membership.', initcap(p_new_tier)));
    END IF;

    -- Phase 1: leave the old circle (the Bump-Up backfills behind them).
    PERFORM public.release_circle_seat(v_old_circle_id);

    -- Phase 2: join a circle in the new tier.
    SELECT o_circle_id, o_circle_number INTO v_new_circle_id, v_new_circle_number
    FROM public.claim_circle_seat(p_new_tier);

    UPDATE public."Subscriptions" SET tier = p_new_tier, circle_id = v_new_circle_id WHERE id = p_subscription_id;

    -- Phase 3: vanity metrics move by net difference.
    UPDATE public.communities SET
        monthly = monthly + v_new_tier_price - (
            CASE WHEN v_old_tier = 'silver' THEN 250
                 WHEN v_old_tier = 'gold' THEN 500
                 WHEN v_old_tier = 'diamond' THEN 1000 ELSE 0 END
        ),
        silver  = silver  + CASE WHEN p_new_tier = 'silver'  THEN 1 ELSE 0 END - CASE WHEN v_old_tier = 'silver'  THEN 1 ELSE 0 END,
        gold    = gold    + CASE WHEN p_new_tier = 'gold'    THEN 1 ELSE 0 END - CASE WHEN v_old_tier = 'gold'    THEN 1 ELSE 0 END,
        diamond = diamond + CASE WHEN p_new_tier = 'diamond' THEN 1 ELSE 0 END - CASE WHEN v_old_tier = 'diamond' THEN 1 ELSE 0 END
    WHERE id = v_community_id;

    RETURN json_build_object('success', true, 'new_tier', p_new_tier, 'assigned_circle', v_new_circle_number);
END;
$function$;

-- ---------------------------------------------------------------------------
-- cancel_and_rebalance — same semantics as the v2 fix (only an 'active' member
-- holds a seat; past_due -> cancelled is a pure status flip), now taking the
-- tier lock before the row lock like every other seat change.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_and_rebalance(p_subscription_id integer, p_new_status text default 'cancelled')
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
    v_seen_tier TEXT;
    v_tier      TEXT;
    v_status    TEXT;
    v_circle_id INTEGER;
BEGIN
    IF p_new_status NOT IN ('cancelled', 'past_due') THEN
        RAISE EXCEPTION 'Invalid target status "%".', p_new_status;
    END IF;

    SELECT s.tier INTO v_seen_tier FROM public."Subscriptions" s WHERE s.id = p_subscription_id;
    IF v_seen_tier IS NULL THEN
        RETURN;
    END IF;
    PERFORM public.lock_circle_tier(v_seen_tier);

    SELECT s.tier, s.status, s.circle_id INTO v_tier, v_status, v_circle_id
    FROM public."Subscriptions" s
    WHERE s.id = p_subscription_id
    FOR UPDATE;

    -- A tier change committed between the two reads: hold that tier too.
    IF v_tier IS DISTINCT FROM v_seen_tier THEN
        PERFORM public.lock_circle_tier(v_tier);
    END IF;

    -- Idempotency guard: missing row, already there, or already cancelled.
    IF v_status IS NULL OR v_status = p_new_status OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    UPDATE public."Subscriptions" SET status = p_new_status WHERE id = p_subscription_id;

    -- Only an 'active' member occupies a seat; past_due already gave theirs up.
    IF v_status <> 'active' OR v_circle_id IS NULL THEN
        RETURN;
    END IF;

    PERFORM public.release_circle_seat(v_circle_id);

    -- public.communities is intentionally NOT touched: all-time vanity metrics.
END;
$function$;

-- ---------------------------------------------------------------------------
-- reactivate_subscription — past_due -> active under the tier lock, back of
-- the queue, refusing a second active entry in the same tier.
-- ---------------------------------------------------------------------------
create or replace function public.reactivate_subscription(p_subscription_id integer)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
    v_seen_tier TEXT;
    v_tier      TEXT;
    v_status    TEXT;
    v_email     TEXT;
    v_user_id   UUID;
    v_new_circle_id INTEGER;
    v_new_circle_number INTEGER;
BEGIN
    SELECT s.tier INTO v_seen_tier FROM public."Subscriptions" s WHERE s.id = p_subscription_id;
    IF v_seen_tier IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Subscription is not past_due');
    END IF;
    PERFORM public.lock_circle_tier(v_seen_tier);

    SELECT s.tier, s.status, lower(s.email), s.user_id INTO v_tier, v_status, v_email, v_user_id
    FROM public."Subscriptions" s
    WHERE s.id = p_subscription_id
    FOR UPDATE;

    IF v_tier IS DISTINCT FROM v_seen_tier THEN
        PERFORM public.lock_circle_tier(v_tier);
    END IF;

    IF v_status IS DISTINCT FROM 'past_due' THEN
        RETURN json_build_object('success', false, 'message', 'Subscription is not past_due');
    END IF;

    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.id <> p_subscription_id AND s.status = 'active' AND s.tier = v_tier
          AND (lower(s.email) = v_email OR (v_user_id IS NOT NULL AND s.user_id = v_user_id))
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Another active membership in this tier already exists for this member.');
    END IF;

    SELECT o_circle_id, o_circle_number INTO v_new_circle_id, v_new_circle_number
    FROM public.claim_circle_seat(v_tier);

    UPDATE public."Subscriptions"
    SET status = 'active', circle_id = v_new_circle_id
    WHERE id = p_subscription_id;

    RETURN json_build_object('success', true, 'new_circle', v_new_circle_number);
END;
$function$;

-- ---------------------------------------------------------------------------
-- Affiliate / referral linking — only to a verified email.
-- ---------------------------------------------------------------------------
create or replace function public.link_affiliate_to_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- Fires on signup too, when the address is still unverified: anyone could
  -- register an ambassador's email first. Wait for confirmation (invite
  -- acceptance and signup confirmation both set email_confirmed_at, which
  -- fires the UPDATE trigger).
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  update public.affiliates a
  set user_id = new.id
  where a.user_id is null
    and lower(a.email) = lower(new.email);

  update public.referrals r
  set referred_user_id = new.id
  where r.referred_user_id is null
    and lower(r.referred_email) = lower(new.email);

  return new;
end;
$$;

-- An existing, verified member made an ambassador never produces another
-- auth.users event, so attach their account when the affiliate row is written.
create or replace function public.normalize_affiliate()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  new.slug  := lower(trim(new.slug));
  new.email := lower(trim(new.email));

  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'Slug "%" is reserved and would collide with a site route.', new.slug;
  end if;

  if new.user_id is null and (tg_op = 'INSERT' or new.email is distinct from old.email) then
    select u.id into new.user_id
    from auth.users u
    where lower(u.email) = new.email
      and u.email_confirmed_at is not null
    limit 1;
  end if;

  return new;
end;
$$;

-- Trigger functions are never meant to be RPC endpoints (Supabase advisor
-- 0028/0029). Triggers still fire; EXECUTE is only checked at CREATE TRIGGER.
revoke all on function public.link_affiliate_to_user()     from public, anon, authenticated;
revoke all on function public.normalize_affiliate()        from public, anon, authenticated;
revoke all on function public.sync_user_to_subscriptions() from public, anon, authenticated;
revoke all on function public.fire_welcome_email_webhook() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- member_causes — writes only through set_my_causes; the table caps at 4.
-- ---------------------------------------------------------------------------
revoke all on public.member_causes from anon;
revoke insert, update, delete, truncate, references, trigger on public.member_causes from authenticated;

drop policy if exists "member_causes_insert_own" on public.member_causes;
drop policy if exists "member_causes_update_own" on public.member_causes;
drop policy if exists "member_causes_delete_own" on public.member_causes;

-- Ranks 0-3, unique per member: four rows at most, enforced by the schema.
alter table public.member_causes
  add constraint member_causes_rank_range  check (rank between 0 and 3),
  add constraint member_causes_slug_format check (org_slug ~ '^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$');
create unique index if not exists member_causes_user_rank_key on public.member_causes (user_id, rank);

create or replace function public.set_my_causes(p_slugs text[])
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_slugs text[];
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Normalize, drop blanks, and de-duplicate (a repeated slug used to hit the
  -- primary key and fail the whole save), keeping first-seen order.
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

  -- Serializes concurrent saves for one member (e.g. the pending-selection
  -- flush firing from two tabs) so they replace rather than collide.
  perform pg_advisory_xact_lock(hashtext('amplify.member_causes'), hashtext(v_uid::text));

  delete from public.member_causes where user_id = v_uid;

  insert into public.member_causes (user_id, org_slug, rank)
  select v_uid, u.s, (u.o - 1)::smallint
  from unnest(v_slugs) with ordinality as u(s, o);
end;
$$;
