-- ============================================================================
-- Lets a signed-in member see the name of their own community even while it's
-- pending approval, without exposing pending communities to anyone else.
--
-- communities_select_approved (status = 'approved', role public) stays exactly
-- as-is — this adds a second, additive SELECT policy scoped to authenticated
-- users who actually own a subscription pointing at that community. RLS
-- combines multiple permissive policies with OR, so visibility becomes:
-- approved, OR it's yours.
-- ============================================================================

create or replace function public.owns_community(p_community_id bigint)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public."Subscriptions" s
    where s.community_id = p_community_id
      and s.user_id = auth.uid()
  );
$$;

-- Internal to the policy below; not a standalone API surface.
revoke all on function public.owns_community(bigint) from public, anon;
grant execute on function public.owns_community(bigint) to authenticated;

create policy "Members can view their own community"
  on public.communities for select to authenticated
  using (public.owns_community(id));;
