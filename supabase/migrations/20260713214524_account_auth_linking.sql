-- ============================================================================
-- MY ACCOUNT: link subscriptions to Supabase Auth users, expose safe
-- self-service reads, and add a tamper-proof cancellation RPC.
-- Passwords are handled entirely by Supabase Auth (auth.users) — they are
-- never stored in application tables.
-- ============================================================================

-- 1. Link column: which auth user owns this subscription.
ALTER TABLE public."Subscriptions"
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public."Subscriptions" (user_id);

-- 2. RLS: a signed-in user may read ONLY their own subscription rows.
--    (Table has RLS enabled with no other policies, so everything else
--    remains locked; writes still only happen through definer functions.)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public."Subscriptions";
CREATE POLICY "Users can view own subscriptions"
  ON public."Subscriptions"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. process_checkout: same signature, now records auth.uid() when the
--    caller is signed in (anonymous checkouts get linked later, see trigger).
CREATE OR REPLACE FUNCTION public.process_checkout(p_full_name text, p_display_name text, p_is_anonymous boolean, p_email text, p_phone text, p_address text, p_city text, p_state text, p_zip_code text, p_tier text, p_community_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_community_id public.communities.id%TYPE;
    v_circle_id public.circles.id%TYPE;
    v_circle_number INTEGER;
    v_subscription_id public."Subscriptions".id%TYPE;
    v_tier_price NUMERIC;
BEGIN
    -- 1. SERVER-SIDE PRICING
    IF p_tier = 'silver' THEN v_tier_price := 250;
    ELSIF p_tier = 'gold' THEN v_tier_price := 500;
    ELSIF p_tier = 'diamond' THEN v_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

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

    -- 4. INSERT SUBSCRIPTION (now linked to the signed-in user when present)
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

    -- 6. RETURN FRONTEND DATA
    RETURN json_build_object('success', true, 'subscription_id', v_subscription_id, 'assigned_circle', v_circle_number);
END;
$function$;

-- 4. Self-service cancellation. Identity comes from auth.uid() and ownership
--    is verified server-side, so a caller can never cancel anyone else's
--    subscription regardless of what id they pass. Reuses the existing
--    cancel_and_rebalance circle logic (which stays service-role-only).
CREATE OR REPLACE FUNCTION public.cancel_my_subscription(p_subscription_id bigint)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_owner uuid;
    v_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    SELECT user_id, status INTO v_owner, v_status
    FROM public."Subscriptions" WHERE id = p_subscription_id;

    IF v_owner IS NULL OR v_owner <> auth.uid() THEN
        -- Same error for "not found" and "not yours": no existence oracle.
        RAISE EXCEPTION 'Subscription not found.';
    END IF;

    IF v_status = 'cancelled' THEN
        RETURN json_build_object('success', true, 'status', 'cancelled');
    END IF;

    -- NOTE: when Stripe billing goes live, the Stripe subscription must be
    -- cancelled server-side (edge function) before/with this call.
    PERFORM public.cancel_and_rebalance(p_subscription_id::integer, 'cancelled');

    RETURN json_build_object('success', true, 'status', 'cancelled');
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_my_subscription(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_my_subscription(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_subscription(bigint) TO authenticated;

-- 5. Keep auth.users and Subscriptions in sync:
--    a) when a user confirms their email, adopt any subscription rows that
--       were created at checkout before they had a session (safe: Supabase
--       has just verified they own that mailbox);
--    b) when a user completes a (double-confirmed) email change, propagate
--       the new email to their subscription rows.
CREATE OR REPLACE FUNCTION public.sync_user_to_subscriptions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- (a) first email confirmation → link anonymous checkout rows
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public."Subscriptions"
        SET user_id = NEW.id
        WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
    END IF;

    -- (b) confirmed email change → sync stored email
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public."Subscriptions"
        SET email = NEW.email
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_updated_sync_subscriptions ON auth.users;
CREATE TRIGGER on_auth_user_updated_sync_subscriptions
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_subscriptions();;
