-- ============================================================================
-- Two changes, per direct decision:
--
-- 1. Tier changes now move ALL vanity metrics (monthly AND the silver/gold/
--    diamond counts) by net difference: old tier -1, new tier +1. monthly
--    already worked this way; the tier counts previously only added the new
--    tier without subtracting the old one, so a member who upgraded was
--    counted in both tiers forever. Cancellations still touch nothing in
--    communities — a tier change is a correction to an existing member's
--    record, a cancellation is a departure that is never subtracted.
--
-- 2. process_checkout now creates new communities with status = 'pending'
--    instead of the column default 'approved'. The checkout itself still
--    succeeds and the member's subscription is attached to the new
--    community immediately — only public visibility (the community_review_gate
--    policy: communities_select_approved, status = 'approved') is deferred
--    until manually approved.
-- ============================================================================

-- Belt-and-suspenders: the column default changes too, so any future insert
-- path that doesn't set status explicitly fails closed (needs review) rather
-- than open (immediately public).
alter table public.communities alter column status set default 'pending';

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
    v_community_id public.communities.id%TYPE;
    v_circle_id public.circles.id%TYPE;
    v_circle_number INTEGER;
    v_subscription_id public."Subscriptions".id%TYPE;
    v_tier_price NUMERIC;
    v_is_existing_donor BOOLEAN;
    v_affiliate public.affiliates%ROWTYPE;
    v_click public.referral_clicks%ROWTYPE;
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
    SELECT EXISTS (
        SELECT 1 FROM public."Subscriptions"
        WHERE lower(email) = lower(p_email)
           OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    ) INTO v_is_existing_donor;

    -- 2. COMMUNITY ROUTING
    -- New communities start 'pending': the checkout still succeeds and this
    -- member is attached to it, but it stays out of the public list (RLS:
    -- communities_select_approved) until manually approved.
    SELECT id INTO v_community_id FROM public.communities WHERE name = p_community_name LIMIT 1;
    IF v_community_id IS NULL THEN
        INSERT INTO public.communities (name, members, monthly, silver, gold, diamond, status)
        VALUES (p_community_name, 0, 0, 0, 0, 0, 'pending') RETURNING id INTO v_community_id;
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

    -- 4. INSERT SUBSCRIPTION
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

    -- All-time vanity metrics: joins only ever add.
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

            IF v_affiliate.id IS NOT NULL
               AND lower(v_affiliate.email) <> lower(p_email)
               AND (v_affiliate.user_id IS NULL OR auth.uid() IS NULL OR v_affiliate.user_id <> auth.uid())
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
                    v_affiliate.id, auth.uid(), v_subscription_id, lower(p_email),
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
-- process_tier_change — Phase 3 now moves the tier counts by net difference,
-- the same way monthly already does. A plan change is a correction to an
-- existing member's record, not a new join or a departure.
-- ---------------------------------------------------------------------------
create or replace function public.process_tier_change(p_subscription_id integer, p_new_tier text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
    v_old_tier TEXT; v_old_circle_id INTEGER; v_community_id INTEGER;
    v_new_circle_id INTEGER; v_new_circle_number INTEGER;
    v_replacement_sub_id INTEGER; v_source_circle_id INTEGER;
    v_new_tier_price NUMERIC;
BEGIN
    -- Server-side pricing validation
    IF p_new_tier = 'silver' THEN v_new_tier_price := 250;
    ELSIF p_new_tier = 'gold' THEN v_new_tier_price := 500;
    ELSIF p_new_tier = 'diamond' THEN v_new_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    SELECT tier, circle_id, community_id INTO v_old_tier, v_old_circle_id, v_community_id
    FROM public."Subscriptions" WHERE id = p_subscription_id AND status = 'active';

    IF v_old_tier IS NULL OR v_old_tier = p_new_tier THEN
        RETURN json_build_object('success', false, 'message', 'Invalid tier change');
    END IF;

    -- Phase 1: Bump Up (Old Circle)
    UPDATE public.circles SET current_members = current_members - 1, status = 'filling' WHERE id = v_old_circle_id;

    SELECT s.id, s.circle_id INTO v_replacement_sub_id, v_source_circle_id
    FROM public."Subscriptions" s JOIN public.circles c ON s.circle_id = c.id
    WHERE s.status = 'active' AND c.status = 'filling' AND c.tier = v_old_tier
      AND c.circle_number > (SELECT circle_number FROM public.circles WHERE id = v_old_circle_id)
    ORDER BY s.created_at ASC LIMIT 1;

    IF v_replacement_sub_id IS NOT NULL THEN
        UPDATE public."Subscriptions" SET circle_id = v_old_circle_id WHERE id = v_replacement_sub_id;

        -- *** STANDARDIZED MATH PATTERN ***
        UPDATE public.circles
        SET current_members = current_members + 1,
            status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END
        WHERE id = v_old_circle_id;

        UPDATE public.circles SET current_members = current_members - 1 WHERE id = v_source_circle_id;
    END IF;

    -- Phase 2: Route to New Circle
    SELECT id, circle_number INTO v_new_circle_id, v_new_circle_number
    FROM public.circles WHERE current_members < 400 AND tier = p_new_tier ORDER BY circle_number ASC LIMIT 1 FOR UPDATE;

    IF v_new_circle_id IS NULL THEN
        SELECT COALESCE(MAX(circle_number), 0) + 1 INTO v_new_circle_number FROM public.circles WHERE tier = p_new_tier;
        INSERT INTO public.circles (tier, circle_number, current_members, status) VALUES (p_new_tier, v_new_circle_number, 0, 'filling') RETURNING id INTO v_new_circle_id;
    END IF;

    UPDATE public."Subscriptions" SET tier = p_new_tier, circle_id = v_new_circle_id WHERE id = p_subscription_id;

    -- *** STANDARDIZED MATH PATTERN ***
    UPDATE public.circles
    SET current_members = current_members + 1,
        status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END
    WHERE id = v_new_circle_id;

    -- Phase 3: vanity metrics move by net difference — old tier -1, new tier
    -- +1, monthly by the price delta. A plan change corrects the existing
    -- member's record rather than adding a second one.
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
$function$;;
