-- ============================================================================
-- Tightens what the referral functions expose, per the Supabase security
-- advisors. Everything the program needs stays reachable; nothing else does.
--
-- Two functions must remain callable by `anon` and are deliberately left that
-- way: record_referral_click (visitors clicking an ambassador link are not
-- signed in) and process_checkout (guest checkout, pre-existing behaviour).
-- ============================================================================

-- Pin the search path on the one function that was missing it.
create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
set search_path to ''
as $$
  select case
    when p_email is null or position('@' in p_email) = 0 then null
    else left(split_part(p_email, '@', 1), 1) || repeat('*', 3) || '@' || split_part(p_email, '@', 2)
  end;
$$;

-- Internal only. Every caller is itself SECURITY DEFINER, so it still runs;
-- it just stops being an unauthenticated write endpoint on the REST API.
revoke all on function public.refresh_referral_payout_statuses() from public, anon, authenticated;
revoke all on function public.mask_email(text)                    from public, anon, authenticated;

-- Signed-in surface only. NOTE: is_admin() and my_affiliate_id() are called
-- from RLS policy expressions, which evaluate as the querying role — so
-- `authenticated` must keep EXECUTE or every policy using them fails closed.
revoke all on function public.is_admin()                    from public, anon;
revoke all on function public.my_affiliate_id()             from public, anon;
revoke all on function public.get_my_affiliate_dashboard()  from public, anon;
revoke all on function public.admin_list_affiliates()       from public, anon;
revoke all on function public.admin_list_referrals(uuid)    from public, anon;
revoke all on function public.admin_set_payout_status(uuid, integer, text, text) from public, anon;

grant execute on function public.is_admin()                   to authenticated;
grant execute on function public.my_affiliate_id()            to authenticated;
grant execute on function public.get_my_affiliate_dashboard() to authenticated;
grant execute on function public.admin_list_affiliates()      to authenticated;
grant execute on function public.admin_list_referrals(uuid)   to authenticated;
grant execute on function public.admin_set_payout_status(uuid, integer, text, text) to authenticated;;
