-- ============================================================================
-- Ties a referral back to the exact click that produced it.
--
-- Previously referrals.clicked_at was never populated: clicks were logged in
-- their own table with no link to the person who later signed up. Guessing
-- "the affiliate's most recent click" would have stamped a stranger's
-- timestamp onto the record, which is worse than leaving it null.
--
-- Instead, each click now issues a random token. The browser carries the
-- token, hands it back at checkout, and the server copies its own recorded
-- timestamp across after confirming the token belongs to the affiliate being
-- claimed. The timestamp is never client-supplied — the browser only ever
-- holds an opaque identifier.
--
-- The same link gives conversion tracking: a click knows whether it converted.
-- ============================================================================

alter table public.referral_clicks
  add column token        uuid not null default gen_random_uuid(),
  add column converted_at timestamptz;

create unique index referral_clicks_token_key on public.referral_clicks (token);

comment on column public.referral_clicks.token is
  'Opaque handle given to the visitor''s browser so a later signup can be traced to this exact click.';
comment on column public.referral_clicks.converted_at is
  'Set when this click resulted in a referred signup.';

-- ---------------------------------------------------------------------------
-- Hand the token back to the vanity landing page.
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
  v_token     uuid;
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
  values (v_affiliate.id, left(p_user_agent, 500), left(p_referrer, 500))
  returning token into v_token;

  return json_build_object(
    'found', true,
    'slug', v_affiliate.slug,
    'display_name', v_affiliate.display_name,
    'click_token', v_token
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Checkout now accepts the click token alongside the slug.
-- Rebuilt rather than replaced because the signature gains an argument; the
-- new one is defaulted, so existing 12-argument calls still work.
-- ---------------------------------------------------------------------------
drop function if exists public.process_checkout(text, text, boolean, text, text, text, text, text, text, text, text, text);

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
  p_referral_slug  text default null,
  p_click_token    uuid default null
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

                -- Resolve the originating click. The token must belong to the
                -- affiliate being claimed, so a forged or stale token simply
                -- yields no click rather than borrowing another one's.
                IF p_click_token IS NOT NULL THEN
                    SELECT * INTO v_click
                    FROM public.referral_clicks
                    WHERE token = p_click_token AND affiliate_id = v_affiliate.id
                    LIMIT 1;
                END IF;

                -- ON CONFLICT DO NOTHING covers the unique indexes on email /
                -- user / subscription, so a repeat referral is a no-op.
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

                -- Mark the click converted so click-through rates are real.
                IF v_referral_recorded AND v_click.id IS NOT NULL THEN
                    UPDATE public.referral_clicks
                    SET converted_at = now()
                    WHERE id = v_click.id AND converted_at IS NULL;
                END IF;
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
$function$;;
