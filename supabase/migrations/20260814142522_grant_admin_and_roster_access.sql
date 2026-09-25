-- Make zsimcha1@gmail.com (Zachary Shron) an admin.
INSERT INTO public.admins (user_id, note)
VALUES ('899bf1ba-3960-48ba-ba87-e64ca815017b', 'Zachary Shron - founder/CEO, initial admin')
ON CONFLICT (user_id) DO NOTHING;

-- Give admins real RLS visibility into Subscriptions, so an admin querying
-- from their own logged-in session (not just service_role) sees the whole
-- table -- and by extension sees the correct sweepstakes_roster, which
-- inherits the caller's RLS via security_invoker = on.
CREATE POLICY "Admins can view all subscriptions"
ON public."Subscriptions"
FOR SELECT
TO authenticated
USING (public.is_admin());;
