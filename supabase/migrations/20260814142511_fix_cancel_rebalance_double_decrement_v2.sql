-- Fix: cancel_and_rebalance decrements/backfills a second time on the
-- past_due -> cancelled transition, even though the seat was already
-- vacated and backfilled when the member first went past_due.
-- The vacate/backfill block now keys off the PRIOR status (must be
-- 'active') rather than the target status.
-- Also adds FOR UPDATE to serialize concurrent webhook deliveries for
-- the same subscription (e.g. payment_failed and subscription.deleted
-- arriving close together).

DROP FUNCTION IF EXISTS public.cancel_and_rebalance(INTEGER, TEXT);

CREATE FUNCTION public.cancel_and_rebalance(
    p_subscription_id INTEGER,
    p_new_status TEXT DEFAULT 'cancelled'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_circle_id INTEGER; v_replacement_sub_id INTEGER;
    v_source_circle_id INTEGER; v_tier TEXT; v_status TEXT;
BEGIN
    IF p_new_status NOT IN ('cancelled', 'past_due') THEN
        RAISE EXCEPTION 'Invalid target status "%".', p_new_status;
    END IF;

    -- Lock the row so two near-simultaneous webhook deliveries for the
    -- same subscription can't both read the pre-transition status and
    -- both attempt a vacate/backfill.
    SELECT s.circle_id, s.tier, s.status
    INTO v_target_circle_id, v_tier, v_status
    FROM public."Subscriptions" s
    WHERE s.id = p_subscription_id
    FOR UPDATE;

    -- Idempotency guard. NULL status means the row does not exist.
    IF v_status IS NULL OR v_status = p_new_status OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    UPDATE public."Subscriptions" SET status = p_new_status WHERE id = p_subscription_id;

    -- *** THE FIX ***
    -- Only an 'active' subscriber occupies a circle seat. A subscriber
    -- already at 'past_due' had their seat vacated and backfilled on the
    -- way INTO that state. past_due -> cancelled is therefore a pure
    -- status flip with no further circle math. Without this guard the
    -- circle's counter is decremented again and a second Bump-Up runs
    -- against a circle that is already full, silently pushing the real
    -- active headcount above 400 while current_members keeps reporting
    -- <= 400 the entire time.
    IF v_status <> 'active' OR v_target_circle_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.circles
    SET current_members = current_members - 1, status = 'filling'
    WHERE id = v_target_circle_id;

    SELECT s.id, s.circle_id INTO v_replacement_sub_id, v_source_circle_id
    FROM public."Subscriptions" s JOIN public.circles c ON s.circle_id = c.id
    WHERE s.status = 'active' AND c.status = 'filling' AND c.tier = v_tier
      AND c.circle_number > (SELECT circle_number FROM public.circles WHERE id = v_target_circle_id)
    ORDER BY s.created_at ASC LIMIT 1;

    IF v_replacement_sub_id IS NOT NULL THEN
        UPDATE public."Subscriptions" SET circle_id = v_target_circle_id WHERE id = v_replacement_sub_id;

        UPDATE public.circles
        SET current_members = current_members + 1,
            status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END
        WHERE id = v_target_circle_id;

        UPDATE public.circles SET current_members = current_members - 1 WHERE id = v_source_circle_id;
    END IF;

    -- public.communities is intentionally NOT touched. All-time vanity
    -- metrics must never decrease. True figures come from
    -- backend_accurate_stats.
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_and_rebalance(INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_and_rebalance(INTEGER, TEXT) TO service_role;

-- Backstop constraint: circle headcount should never leave the valid
-- range. This does not catch the specific bug above by itself (the
-- counter never actually left [0,400] during the double-backfill -- it
-- is the REAL active count that overshot to 401 while the counter kept
-- reporting 400). It only guards against a future logic error that
-- increments current_members without routing through the waterfall's
-- < 400 check.
ALTER TABLE public.circles
  ADD CONSTRAINT circles_current_members_range
  CHECK (current_members >= 0 AND current_members <= 400);

-- Reconciliation view: compares the circle's counter against the real
-- count of active Subscriptions rows pointing at it. This is the check
-- that WOULD have caught the past_due/cancelled bug, since it compares
-- ground truth to the counter rather than checking the counter alone.
-- Run this before every drawing. Empty result = healthy.
CREATE OR REPLACE VIEW public.circle_reconciliation
WITH (security_invoker = on) AS
SELECT
    c.id AS circle_id,
    c.tier,
    c.circle_number,
    c.current_members AS counter_value,
    count(s.id) FILTER (WHERE s.status = 'active') AS real_active_count,
    c.current_members - count(s.id) FILTER (WHERE s.status = 'active') AS drift
FROM public.circles c
LEFT JOIN public."Subscriptions" s ON s.circle_id = c.id
GROUP BY c.id, c.tier, c.circle_number, c.current_members
HAVING c.current_members <> count(s.id) FILTER (WHERE s.status = 'active');

REVOKE ALL ON public.circle_reconciliation FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.circle_reconciliation TO service_role;;
