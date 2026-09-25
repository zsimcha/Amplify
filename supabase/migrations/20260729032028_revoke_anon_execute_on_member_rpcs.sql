-- Supabase's default privileges grant EXECUTE on new public-schema functions
-- to both anon and authenticated. These two RPCs are member-only (they bail on
-- a null auth.uid()), so drop anon's ability to call them at all.
revoke execute on function public.request_cause(text, text, text) from anon;
revoke execute on function public.set_my_causes(text[]) from anon;;
