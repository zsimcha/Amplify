-- Per-member charity selection (up to 4 orgs). Slugs match the frontend
-- partner roster in src/data/partners.js.
create table if not exists public.member_causes (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  org_slug   text        not null,
  rank       smallint    not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, org_slug)
);

create index if not exists member_causes_user_idx on public.member_causes(user_id);

alter table public.member_causes enable row level security;

-- Members can only ever see / change their own rows.
create policy "member_causes_select_own" on public.member_causes
  for select using (auth.uid() = user_id);
create policy "member_causes_insert_own" on public.member_causes
  for insert with check (auth.uid() = user_id);
create policy "member_causes_update_own" on public.member_causes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "member_causes_delete_own" on public.member_causes
  for delete using (auth.uid() = user_id);

-- Atomic replace of the caller's selection. Enforces auth + the 4-cause cap
-- server-side so the rule holds regardless of client. Ranked by array order.
create or replace function public.set_my_causes(p_slugs text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(array_length(p_slugs, 1), 0) > 4 then
    raise exception 'You can select up to 4 causes';
  end if;

  delete from public.member_causes where user_id = auth.uid();

  insert into public.member_causes (user_id, org_slug, rank)
  select auth.uid(), slug, (ord - 1)::smallint
  from unnest(p_slugs) with ordinality as t(slug, ord)
  where slug is not null and slug <> '';
end;
$$;

revoke all on function public.set_my_causes(text[]) from public;
grant execute on function public.set_my_causes(text[]) to authenticated;;
