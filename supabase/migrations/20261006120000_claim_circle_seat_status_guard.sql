-- ============================================================================
-- claim_circle_seat routes a brand-new paid checkout to "the oldest circle in
-- the tier with room" by filtering on current_members < 400 alone — it never
-- checks status. That's harmless today only because circles.status is
-- constrained to 'filling' or 'full', so every circle under 400 members is
-- necessarily still filling. Official Rules §8 describes a third circle
-- state this schema doesn't have yet: a "Retired Circle" that hit its
-- Backstop End Date under 400 members, held its guaranteed first Drawing
-- anyway, and must never take another Contribution afterward. Nothing in
-- this codebase marks a circle retired yet (grepped the full migration
-- history — no such status is ever set), so the gap can't be hit today. But
-- the day a Backstop/retirement job gets built, it has no reason to also
-- remember to fix this query, and an under-filled retired circle would
-- silently start collecting new paid members it's legally closed to.
--
-- This widens the constraint to admit the two states Rules §3 actually
-- defines (Active and Retired circles, alongside Filling), and adds the
-- status filter now, while it's a no-op, rather than leaving it as a trap
-- for whoever builds retirement later. release_circle_seat's bump-up query
-- already filters on c.status = 'filling' for the same reason; this brings
-- claim_circle_seat in line with it.
--
-- Building the Backstop End Date / retirement / reassignment mechanism
-- itself (Rules §8) is deliberately out of scope here.
-- ============================================================================

alter table public.circles
  drop constraint circles_status_check,
  add constraint circles_status_check check (status in ('filling', 'full', 'active', 'retired'));

create or replace function public.claim_circle_seat(
  p_tier text,
  out o_circle_id integer,
  out o_circle_number integer
)
language plpgsql
set search_path to ''
as $$
begin
  perform public.lock_circle_tier(p_tier);

  select c.id, c.circle_number into o_circle_id, o_circle_number
  from public.circles c
  where c.tier = p_tier and c.status = 'filling' and c.current_members < 400
  order by c.circle_number asc
  limit 1
  for update;

  if o_circle_id is null then
    select coalesce(max(c.circle_number), 0) + 1 into o_circle_number
    from public.circles c
    where c.tier = p_tier;

    insert into public.circles (tier, circle_number, current_members, status)
    values (p_tier, o_circle_number, 0, 'filling')
    returning id into o_circle_id;
  end if;

  update public.circles
  set current_members = current_members + 1,
      status = case when current_members + 1 >= 400 then 'full' else 'filling' end
  where id = o_circle_id;
end;
$$;
