-- Remove default write grants Supabase applies to new tables. All writes
-- on these tables go through SECURITY DEFINER RPCs; RLS currently blocks
-- direct writes only because no permissive write policy exists, which is
-- one accidental policy or RLS-disable away from a real exposure.
-- member_causes is excluded: it has correct own-row RLS write policies
-- and is the one table clients are meant to write directly.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES
  ON public.admins,
     public.affiliates,
     public.referrals,
     public.referral_clicks,
     public.referral_settings,
     public.reserved_slugs,
     public.cause_requests
  FROM anon, authenticated;

-- Prevent the same over-grant from reappearing on future tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon, authenticated;;
