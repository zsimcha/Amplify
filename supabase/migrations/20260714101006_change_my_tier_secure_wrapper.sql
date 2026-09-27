-- ============================================================================
-- Self-service tier change (upgrade/downgrade). Identity comes from auth.uid()
-- and ownership is verified server-side, so a caller can never change anyone
-- else's membership regardless of the subscription id they pass. Delegates the
-- circle rebalancing to the existing process_tier_change (which stays
-- service-role-only), mirroring the cancel_my_subscription pattern.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.change_my_tier(p_subscription_id bigint, p_new_tier text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_owner uuid;
    v_status text;
    v_current_tier text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    IF p_new_tier NOT IN ('silver', 'gold', 'diamond') THEN
        RAISE EXCEPTION 'Invalid tier selected.';
    END IF;

    SELECT user_id, status, tier INTO v_owner, v_status, v_current_tier
    FROM public."Subscriptions" WHERE id = p_subscription_id;

    IF v_owner IS NULL OR v_owner <> auth.uid() THEN
        -- Same error for "not found" and "not yours": no existence oracle.
        RAISE EXCEPTION 'Subscription not found.';
    END IF;

    IF v_status <> 'active' THEN
        RETURN json_build_object('success', false, 'message', 'Only active memberships can change plan.');
    END IF;

    IF v_current_tier = p_new_tier THEN
        RETURN json_build_object('success', false, 'message', 'You are already on this plan.');
    END IF;

    -- NOTE: when Stripe billing goes live, the Stripe subscription's price must
    -- be updated (with proration) server-side before/with this call.
    RETURN public.process_tier_change(p_subscription_id::integer, p_new_tier);
END;
$function$;

REVOKE ALL ON FUNCTION public.change_my_tier(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.change_my_tier(bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.change_my_tier(bigint, text) TO authenticated;;
