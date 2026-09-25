-- Remove the duplicate unique constraint (circles_tier_circle_number_key
-- already covers the same (tier, circle_number) pair).
ALTER TABLE public.circles DROP CONSTRAINT IF EXISTS circles_tier_number_unique;;
