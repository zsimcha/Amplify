-- ============================================================================
-- Two corrections to the referral functions.
--
-- 1. process_checkout assigned GET DIAGNOSTICS ROW_COUNT (an integer) into a
--    boolean. That raises, and because the assignment sits inside the
--    attribution block's EXCEPTION handler, the raise would have rolled the
--    block back — silently discarding every referral insert while the checkout
--    itself succeeded. Now counted into an integer.
--
-- 2. get_my_affiliate_dashboard was marked STABLE and therefore could not run
--    the hold-window refresh, so an affiliate could sit looking at "pending"
--    for a milestone that had already matured. Now volatile and refreshing,
--    matching the admin read paths.
-- ============================================================================

create or replace function public.process_checkout(
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
    v_inserted INTEGER := 0;
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

                GET DIAGNOSTICS v_inserted = ROW_COUNT;
                v_referral_recorded := (v_inserted > 0);
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

create or replace function public.get_my_affiliate_dashboard()
returns json
language plpgsql
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

  -- Mature any milestones whose hold window has elapsed, so the affiliate sees
  -- the same status the admin screen would show.
  perform public.refresh_referral_payout_statuses();

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
$$;;
