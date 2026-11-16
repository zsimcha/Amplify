-- ============================================================================
-- Lightweight audit trail for the age gate added in 20260927140000. That
-- migration validates date of birth against each state's minimum but
-- deliberately never persists it: nothing downstream needs the raw date, and
-- keeping it around for entrants who never win anything is retention with no
-- purpose.
--
-- That leaves no per-row record of what was actually checked, though — only
-- that the code exists and would have rejected an underage submission. This
-- adds two columns that record the outcome instead: when the check ran, and
-- the age it computed. That's enough to show a specific member's age was
-- verified, and to what result, without storing a birth date that pins down
-- someone's exact birthday.
-- ============================================================================

alter table public."Subscriptions"
    add column if not exists age_verified_at timestamptz,
    add column if not exists age_at_verification integer;

comment on column public."Subscriptions".age_verified_at is
    'When process_checkout validated this member''s age against their state''s minimum. Null for rows created before this column existed.';
comment on column public."Subscriptions".age_at_verification is
    'Age in years computed from the date of birth submitted at signup. The date of birth itself is never stored.';

create or replace function public.process_checkout(
    p_full_name text, p_display_name text, p_is_anonymous boolean, p_email text,
    p_phone text, p_address text, p_city text, p_state text, p_zip_code text,
    p_tier text, p_community_name text,
    p_referral_slug text default null, p_click_token uuid default null,
    p_date_of_birth date default null)
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

    -- Official Rules §3: 18 everywhere, except 19 in AL/NE and 21 in MS,
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
        tier, community_id, circle_id, status, user_id, age_verified_at, age_at_verification
    ) VALUES (
        v_full_name, v_display_name, coalesce(p_is_anonymous, false), v_email, v_phone, v_address, v_city, v_state, v_zip,
        p_tier, v_community_id, v_circle_id, 'active', v_uid, now(), v_age
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
