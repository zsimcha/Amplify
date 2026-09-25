-- ============================================================================
-- Referral / affiliate program — functions
-- ============================================================================

comment on table public.admins is 'Membership here is the sole grant for viewing other users'' payout data.';

-- ---------------------------------------------------------------------------
-- Masks a referred user's email for display to their affiliate. The affiliate
-- knows who they invited; this just stops the dashboard from being a way to
-- read back member email addresses in bulk.
-- ---------------------------------------------------------------------------
create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then null
    else left(split_part(p_email, '@', 1), 1) || repeat('*', 3) || '@' || split_part(p_email, '@', 2)
  end;
$$;

-- ---------------------------------------------------------------------------
-- Promotes milestones out of the hold window. Called at the top of every read
-- path, so statuses are always current without needing a scheduler.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_referral_payout_statuses()
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_hold integer;
begin
  select hold_days into v_hold from public.referral_settings limit 1;
  v_hold := coalesce(v_hold, 14);

  update public.referrals
  set payout_1_status = 'ready'
  where payout_1_status = 'pending'
    and first_charge_at is not null
    and first_charge_at + make_interval(days => v_hold) <= now();

  update public.referrals
  set payout_2_status = 'ready'
  where payout_2_status = 'pending'
    and second_charge_at is not null
    and second_charge_at + make_interval(days => v_hold) <= now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Vanity link resolver. Called by amplifygive.com/{slug} before redirecting.
-- Returns whether the slug is a live affiliate and logs the click.
-- Callable anonymously — visitors clicking a link are not signed in.
-- ---------------------------------------------------------------------------
create or replace function public.record_referral_click(
  p_slug       text,
  p_user_agent text default null,
  p_referrer   text default null
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_affiliate public.affiliates%rowtype;
begin
  select * into v_affiliate
  from public.affiliates
  where slug = lower(trim(coalesce(p_slug, '')))
    and is_active
  limit 1;

  if v_affiliate.id is null then
    return json_build_object('found', false);
  end if;

  insert into public.referral_clicks (affiliate_id, user_agent, referrer)
  values (v_affiliate.id, left(p_user_agent, 500), left(p_referrer, 500));

  return json_build_object(
    'found', true,
    'slug', v_affiliate.slug,
    'display_name', v_affiliate.display_name
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Checkout, with referral attribution folded in.
--
-- Rebuilt rather than replaced because the signature gains p_referral_slug.
-- The new argument is defaulted, so the existing 11-argument call still works.
--
-- Attribution is deliberately best-effort: a bad, self-referring or ineligible
-- slug silently records no referral. It must never be able to fail a checkout.
-- ---------------------------------------------------------------------------
drop function if exists public.process_checkout(text, text, boolean, text, text, text, text, text, text, text, text);

create function public.process_checkout(
  p_full_name      text,
  p_display_name   text,
  p_is_anonymous   boolean,
  p_email          text,
  p_phone          text,
  p_address        text,
  p_city           text,
  p_state          text,
  p_zip_code       text,
  p_tier           text,
  p_community_name text,
  p_referral_slug  text default null
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
    v_community_id public.communities.id%TYPE;
    v_circle_id public.circles.id%TYPE;
    v_circle_number INTEGER;
    v_subscription_id public."Subscriptions".id%TYPE;
    v_tier_price NUMERIC;
    v_is_existing_donor BOOLEAN;
    v_affiliate public.affiliates%ROWTYPE;
    v_settings public.referral_settings%ROWTYPE;
    v_referral_recorded BOOLEAN := false;
BEGIN
    -- 1. SERVER-SIDE PRICING
    IF p_tier = 'silver' THEN v_tier_price := 250;
    ELSIF p_tier = 'gold' THEN v_tier_price := 500;
    ELSIF p_tier = 'diamond' THEN v_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    -- 1b. REFERRAL ELIGIBILITY SNAPSHOT
    -- Taken before the insert below, so "new member" means new as of arrival.
    -- The first wave pays for new members only, not existing donors.
    SELECT EXISTS (
        SELECT 1 FROM public."Subscriptions"
        WHERE lower(email) = lower(p_email)
           OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    ) INTO v_is_existing_donor;

    -- 2. COMMUNITY ROUTING
    SELECT id INTO v_community_id FROM public.communities WHERE name = p_community_name LIMIT 1;
    IF v_community_id IS NULL THEN
        INSERT INTO public.communities (name, members, monthly, silver, gold, diamond)
        VALUES (p_community_name, 0, 0, 0, 0, 0) RETURNING id INTO v_community_id;
    END IF;

    -- 3. CIRCLE ROUTING
    SELECT id, circle_number INTO v_circle_id, v_circle_number
    FROM public.circles
    WHERE current_members < 400 AND tier = p_tier
    ORDER BY circle_number ASC LIMIT 1 FOR UPDATE;

    IF v_circle_id IS NULL THEN
        SELECT COALESCE(MAX(circle_number), 0) + 1 INTO v_circle_number FROM public.circles WHERE tier = p_tier;
        INSERT INTO public.circles (tier, circle_number, current_members, status)
        VALUES (p_tier, v_circle_number, 0, 'filling')
        RETURNING id INTO v_circle_id;
    END IF;

    -- 4. INSERT SUBSCRIPTION (linked to the signed-in user when present)
    INSERT INTO public."Subscriptions" (
        "full name", display_name, is_anonymous, email, phone, address, city, state, zip_code, tier, community_id, circle_id, status, user_id
    ) VALUES (
        p_full_name, p_display_name, p_is_anonymous, p_email, p_phone, p_address, p_city, p_state, p_zip_code, p_tier, v_community_id, v_circle_id, 'active', auth.uid()
    ) RETURNING id INTO v_subscription_id;

    -- 5. UPDATE METRICS (*** STANDARDIZED MATH PATTERN ***)
    UPDATE public.circles
    SET current_members = current_members + 1,
        status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END
    WHERE id = v_circle_id;

    UPDATE public.communities SET
        members = members + 1,
        monthly = monthly + v_tier_price,
        silver = silver + CASE WHEN p_tier = 'silver' THEN 1 ELSE 0 END,
        gold = gold + CASE WHEN p_tier = 'gold' THEN 1 ELSE 0 END,
        diamond = diamond + CASE WHEN p_tier = 'diamond' THEN 1 ELSE 0 END
    WHERE id = v_community_id;

    -- 6. REFERRAL ATTRIBUTION (best-effort; never fails the checkout)
    IF p_referral_slug IS NOT NULL AND btrim(p_referral_slug) <> '' AND NOT v_is_existing_donor THEN
        BEGIN
            SELECT * INTO v_affiliate
            FROM public.affiliates
            WHERE slug = lower(btrim(p_referral_slug)) AND is_active
            LIMIT 1;

            -- Self-referral guard: an ambassador cannot refer themselves,
            -- by account or by the email on their affiliate row.
            IF v_affiliate.id IS NOT NULL
               AND lower(v_affiliate.email) <> lower(p_email)
               AND (v_affiliate.user_id IS NULL OR auth.uid() IS NULL OR v_affiliate.user_id <> auth.uid())
            THEN
                SELECT * INTO v_settings FROM public.referral_settings LIMIT 1;

                -- ON CONFLICT DO NOTHING covers the unique indexes on email /
                -- user / subscription, so a repeat referral is a no-op.
                INSERT INTO public.referrals (
                    affiliate_id, referred_user_id, referred_subscription_id, referred_email,
                    signed_up_at, payout_1_amount_cents, payout_2_amount_cents
                ) VALUES (
                    v_affiliate.id, auth.uid(), v_subscription_id, lower(p_email),
                    now(),
                    COALESCE(v_settings.payout_1_amount_cents, 2500),
                    COALESCE(v_settings.payout_2_amount_cents, 2500)
                )
                ON CONFLICT DO NOTHING;

                GET DIAGNOSTICS v_referral_recorded = ROW_COUNT;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Attribution problems must never cost the member their checkout.
            v_referral_recorded := false;
        END;
    END IF;

    -- 7. RETURN FRONTEND DATA
    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'assigned_circle', v_circle_number,
        'referral_recorded', v_referral_recorded
    );
END;
$function$;

-- ---------------------------------------------------------------------------
-- Backfill referred_user_id once the referred member confirms their email,
-- alongside the existing affiliate linking. Extends the trigger function
-- installed by the schema migration.
-- ---------------------------------------------------------------------------
create or replace function public.link_affiliate_to_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- Ambassador accepted their invite -> attach their auth account.
  update public.affiliates a
  set user_id = new.id
  where a.user_id is null
    and lower(a.email) = lower(new.email);

  -- Referred member confirmed their email -> attach them to their referral.
  update public.referrals r
  set referred_user_id = new.id
  where r.referred_user_id is null
    and lower(r.referred_email) = lower(new.email);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- THE STRIPE SEAM.
--
-- This is the single entry point the future Stripe webhook calls, and the only
-- thing standing between today's build and a fully live program. When billing
-- goes live, an edge function verifying the Stripe signature should call this
-- on invoice.payment_succeeded:
--
--   charge 1  ->  billing_reason = 'subscription_create'
--   charge 2  ->  billing_reason = 'subscription_cycle', first occurrence
--
-- Idempotent: replaying the same webhook is a no-op, because each milestone
-- only advances out of 'not_earned'.
--
-- Restricted to service_role. No browser session can call this.
-- ---------------------------------------------------------------------------
create or replace function public.record_referral_charge_event(
  p_subscription_id bigint,
  p_charge_number   integer,
  p_occurred_at     timestamptz default now()
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_referral public.referrals%rowtype;
begin
  if p_charge_number not in (1, 2) then
    raise exception 'charge_number must be 1 or 2, got %', p_charge_number;
  end if;

  select * into v_referral
  from public.referrals
  where referred_subscription_id = p_subscription_id
  limit 1;

  if v_referral.id is null then
    -- Not a referred subscription. Perfectly normal, not an error.
    return json_build_object('matched', false);
  end if;

  if p_charge_number = 1 then
    update public.referrals
    set first_charge_at = coalesce(first_charge_at, p_occurred_at),
        payout_1_status = 'pending'
    where id = v_referral.id
      and payout_1_status = 'not_earned';
  else
    update public.referrals
    set second_charge_at = coalesce(second_charge_at, p_occurred_at),
        payout_2_status = 'pending'
    where id = v_referral.id
      and payout_2_status = 'not_earned';
  end if;

  perform public.refresh_referral_payout_statuses();

  return json_build_object('matched', true, 'referral_id', v_referral.id, 'milestone', p_charge_number);
end;
$$;

revoke all on function public.record_referral_charge_event(bigint, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.record_referral_charge_event(bigint, integer, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- The affiliate's own dashboard payload. Returns null when the caller has no
-- affiliate row — which is what gates the account-page section.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_affiliate_dashboard()
returns json
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_affiliate public.affiliates%rowtype;
  v_referrals json;
  v_clicks integer;
begin
  select * into v_affiliate
  from public.affiliates
  where user_id = auth.uid()
  limit 1;

  if v_affiliate.id is null then
    return null;
  end if;

  select count(*)::integer into v_clicks
  from public.referral_clicks where affiliate_id = v_affiliate.id;

  select coalesce(json_agg(row_to_json(x) order by x.signed_up_at desc), '[]'::json) into v_referrals
  from (
    select
      r.id,
      public.mask_email(r.referred_email) as referred_email_masked,
      r.signed_up_at,
      r.first_charge_at,
      r.second_charge_at,
      r.payout_1_status,
      r.payout_1_amount_cents,
      r.payout_1_paid_at,
      r.payout_2_status,
      r.payout_2_amount_cents,
      r.payout_2_paid_at
    from public.referrals r
    where r.affiliate_id = v_affiliate.id
  ) x;

  return json_build_object(
    'affiliate', json_build_object(
      'slug', v_affiliate.slug,
      'display_name', v_affiliate.display_name,
      'payout_method', v_affiliate.payout_method,
      'payout_handle', v_affiliate.payout_handle,
      'is_active', v_affiliate.is_active
    ),
    'click_count', v_clicks,
    'hold_days', (select hold_days from public.referral_settings limit 1),
    'referrals', v_referrals,
    'totals', (
      select json_build_object(
        'referral_count', count(*),
        'earned_cents',   coalesce(sum(case when payout_1_status in ('pending','ready','paid') then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status in ('pending','ready','paid') then payout_2_amount_cents else 0 end), 0),
        'paid_cents',     coalesce(sum(case when payout_1_status = 'paid' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'paid' then payout_2_amount_cents else 0 end), 0),
        'pending_cents',  coalesce(sum(case when payout_1_status = 'pending' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'pending' then payout_2_amount_cents else 0 end), 0),
        'ready_cents',    coalesce(sum(case when payout_1_status = 'ready' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'ready' then payout_2_amount_cents else 0 end), 0)
      )
      from public.referrals where affiliate_id = v_affiliate.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: every affiliate with what they are owed and what they have been paid.
-- The is_admin() check is inside the function, so the gate holds regardless of
-- what the front end does.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_affiliates()
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  perform public.refresh_referral_payout_statuses();

  select coalesce(json_agg(row_to_json(a) order by a.ready_cents desc, a.slug), '[]'::json) into v_result
  from (
    select
      af.id,
      af.slug,
      af.email,
      af.display_name,
      af.payout_method,
      af.payout_handle,
      af.notes,
      af.is_active,
      af.user_id is not null as has_account,
      af.created_at,
      (select count(*) from public.referral_clicks c where c.affiliate_id = af.id)::integer as click_count,
      coalesce(s.referral_count, 0)  as referral_count,
      coalesce(s.ready_cents, 0)     as ready_cents,
      coalesce(s.pending_cents, 0)   as pending_cents,
      coalesce(s.paid_cents, 0)      as paid_cents,
      coalesce(s.earned_cents, 0)    as earned_cents
    from public.affiliates af
    left join lateral (
      select
        count(*)::integer as referral_count,
        sum(case when r.payout_1_status = 'ready'   then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'ready'   then r.payout_2_amount_cents else 0 end) as ready_cents,
        sum(case when r.payout_1_status = 'pending' then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'pending' then r.payout_2_amount_cents else 0 end) as pending_cents,
        sum(case when r.payout_1_status = 'paid'    then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'paid'    then r.payout_2_amount_cents else 0 end) as paid_cents,
        sum(case when r.payout_1_status in ('pending','ready','paid') then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status in ('pending','ready','paid') then r.payout_2_amount_cents else 0 end) as earned_cents
      from public.referrals r where r.affiliate_id = af.id
    ) s on true
  ) a;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: the individual milestones behind one affiliate's totals.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_referrals(p_affiliate_id uuid)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  perform public.refresh_referral_payout_statuses();

  select coalesce(json_agg(row_to_json(x) order by x.signed_up_at desc), '[]'::json) into v_result
  from (
    select
      r.id,
      r.referred_email,
      r.signed_up_at,
      r.first_charge_at,
      r.second_charge_at,
      r.payout_1_status, r.payout_1_amount_cents, r.payout_1_paid_at, r.payout_1_note,
      r.payout_2_status, r.payout_2_amount_cents, r.payout_2_paid_at, r.payout_2_note,
      sub.status as subscription_status,
      sub.tier   as subscription_tier
    from public.referrals r
    left join public."Subscriptions" sub on sub.id = r.referred_subscription_id
    where r.affiliate_id = p_affiliate_id
  ) x;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: move one milestone's status. Marking paid is the common case; void
-- and clawed_back exist so the states in the terms are recordable by hand.
--
-- Milestones are independent — paying milestone 1 on one referral leaves every
-- other milestone, on that referral and all others, exactly where it was.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_payout_status(
  p_referral_id uuid,
  p_milestone   integer,
  p_status      text,
  p_note        text default null
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status public.referral_payout_status;
  v_paid_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  if p_milestone not in (1, 2) then
    raise exception 'Milestone must be 1 or 2.';
  end if;

  if p_status not in ('pending', 'ready', 'paid', 'void', 'clawed_back') then
    raise exception 'Unsupported status "%".', p_status;
  end if;

  v_status  := p_status::public.referral_payout_status;
  v_paid_at := case when p_status = 'paid' then now() else null end;

  if p_milestone = 1 then
    update public.referrals
    set payout_1_status  = v_status,
        payout_1_paid_at = case when p_status = 'paid' then coalesce(payout_1_paid_at, now()) else null end,
        payout_1_note    = coalesce(p_note, payout_1_note)
    where id = p_referral_id
      and payout_1_status <> 'not_earned';
  else
    update public.referrals
    set payout_2_status  = v_status,
        payout_2_paid_at = case when p_status = 'paid' then coalesce(payout_2_paid_at, now()) else null end,
        payout_2_note    = coalesce(p_note, payout_2_note)
    where id = p_referral_id
      and payout_2_status <> 'not_earned';
  end if;

  if not found then
    raise exception 'That milestone has not been earned yet, so it cannot be marked %.', p_status;
  end if;

  return json_build_object('success', true);
end;
$$;;
