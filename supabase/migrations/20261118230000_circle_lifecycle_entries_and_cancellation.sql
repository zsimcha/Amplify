-- ============================================================================
-- Circle lifecycle, drawings and entries, cancellation, and account deletion
--
-- Seats and entries are tracked separately:
--   * a SEAT is a place in a Circle (max 400), held by an active member, or by
--     a 'cancelling' member until the drawing they've paid for is held;
--   * an ENTRY is one paid ticket into one specific Drawing, created by a
--     Contribution (Official Rules §6). An entry stays with the drawing it was
--     bought for even if its owner later cancels or moves to another Circle.
--
-- Circle statuses (Official Rules §3, §8):
--   filling  -> has not held its first drawing. Reaching 400 members sets
--               filled_at and schedules the first drawing for the first
--               Drawing Date at least 14 days later (or the Backstop End Date,
--               whichever is earlier).
--   active   -> held its first drawing after filling; monthly drawings follow.
--   retired  -> held its guaranteed first drawing without ever filling. Takes
--               no new members; its members move to Active Circles with room.
--   ("full" is no longer a status: it's just current_members = 400.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Settings and dates
-- ---------------------------------------------------------------------------
create table if not exists public.program_settings (
  id                         boolean primary key default true check (id),
  drawing_day                smallint not null default 5 check (drawing_day between 1 and 28),
  min_days_fill_to_first_drawing smallint not null default 14 check (min_days_fill_to_first_drawing >= 0),
  updated_at                 timestamptz not null default now()
);
comment on table public.program_settings is
  'Single row. drawing_day is the Official Rules "Drawing Date" (day of month; moved to the next weekday if it falls on a weekend). Holidays are not accounted for.';
insert into public.program_settings (id) values (true) on conflict (id) do nothing;
alter table public.program_settings enable row level security;
revoke all on public.program_settings from anon, authenticated;

-- "Today" by the Official Rules' clock (Eastern Time, Rules §2).
create or replace function public.amplify_today()
returns date
language sql
stable
set search_path to ''
as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- The first fixed monthly Drawing Date on or after p_date.
create or replace function public.drawing_date_on_or_after(p_date date)
returns date
language plpgsql
stable
set search_path to ''
as $$
declare
  v_day       integer;
  v_month     date := date_trunc('month', p_date)::date;
  v_candidate date;
begin
  select drawing_day into v_day from public.program_settings where id;
  v_day := coalesce(v_day, 5);
  loop
    v_candidate := v_month + (v_day - 1);
    while extract(isodow from v_candidate) > 5 loop
      v_candidate := v_candidate + 1;  -- weekend -> next business day
    end loop;
    if v_candidate >= p_date then
      return v_candidate;
    end if;
    v_month := (v_month + interval '1 month')::date;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Circles
-- ---------------------------------------------------------------------------
alter table public.circles
  add column if not exists created_at        timestamptz not null default now(),
  add column if not exists filled_at         timestamptz,
  add column if not exists backstop_end_date date,
  add column if not exists activated_at      timestamptz,
  add column if not exists retired_at        timestamptz;

update public.circles set status = 'filling' where status = 'full';
alter table public.circles drop constraint if exists circles_status_check;
alter table public.circles add constraint circles_status_check
  check (status in ('filling', 'active', 'retired'));

comment on column public.circles.current_members is
  'Seats taken: active members plus cancelling members still holding a seat until their paid drawing.';
comment on column public.circles.filled_at is 'When the circle first reached 400 members (triggers scheduling of its first drawing).';
comment on column public.circles.backstop_end_date is 'Backstop End Date from the Circle Launch Addendum (Rules §8). Set with set_circle_backstop().';

-- ---------------------------------------------------------------------------
-- Drawings and entries
-- ---------------------------------------------------------------------------
create table if not exists public.drawings (
  id           bigint generated always as identity primary key,
  circle_id    integer not null references public.circles(id),
  kind         text not null check (kind in ('first', 'monthly')),
  drawing_date date,
  status       text not null default 'scheduled' check (status in ('scheduled', 'held')),
  held_at      timestamptz,
  created_at   timestamptz not null default now()
);
comment on table public.drawings is
  'One row per Circle drawing. A filling circle''s first drawing has no date until the circle fills or a backstop date is set.';
create unique index if not exists drawings_one_first_per_circle on public.drawings (circle_id) where kind = 'first';
create unique index if not exists drawings_circle_date_key on public.drawings (circle_id, drawing_date) where drawing_date is not null;
create index if not exists drawings_open_idx on public.drawings (circle_id) where status = 'scheduled';

create table if not exists public.drawing_entries (
  id              bigint generated always as identity primary key,
  drawing_id      bigint not null references public.drawings(id),
  subscription_id bigint not null references public."Subscriptions"(id),
  charge_ref      text,
  created_at      timestamptz not null default now(),
  unique (drawing_id, subscription_id)
);
comment on table public.drawing_entries is
  'Paid entries (one per Contribution, Rules §6). charge_ref is the payment processor reference once billing is live, so a retried payment webhook can''t create a second entry.';
comment on column public.drawing_entries.charge_ref is 'e.g. the Stripe invoice id. Null for entries recorded before billing went live.';
create unique index if not exists drawing_entries_charge_ref_key on public.drawing_entries (charge_ref) where charge_ref is not null;
create index if not exists drawing_entries_subscription_idx on public.drawing_entries (subscription_id);

alter table public.drawings enable row level security;
alter table public.drawing_entries enable row level security;
revoke all on public.drawings, public.drawing_entries from anon, authenticated;
grant select on public.drawings, public.drawing_entries to authenticated;
drop policy if exists "Admins can view drawings" on public.drawings;
create policy "Admins can view drawings" on public.drawings for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admins can view entries" on public.drawing_entries;
create policy "Admins can view entries" on public.drawing_entries for select to authenticated using ((select public.is_admin()));
-- Members can see their own entries and the drawings they're in (My Account
-- shows which already-paid drawing a cancelled membership is still entered in).
drop policy if exists "Members can view their own entries" on public.drawing_entries;
create policy "Members can view their own entries" on public.drawing_entries for select to authenticated
  using (exists (
    select 1 from public."Subscriptions" s
    where s.id = drawing_entries.subscription_id and s.user_id = (select auth.uid())
  ));
drop policy if exists "Members can view drawings they are entered in" on public.drawings;
create policy "Members can view drawings they are entered in" on public.drawings for select to authenticated
  using (exists (
    select 1 from public.drawing_entries e
    join public."Subscriptions" s on s.id = e.subscription_id
    where e.drawing_id = drawings.id and s.user_id = (select auth.uid())
  ));

-- Every circle gets its first-drawing row up front, so first contributions
-- have somewhere to attach.
insert into public.drawings (circle_id, kind)
select c.id, 'first' from public.circles c
where not exists (select 1 from public.drawings d where d.circle_id = c.id and d.kind = 'first');

-- ---------------------------------------------------------------------------
-- Memberships: 'cancelling' status and timestamps
-- ---------------------------------------------------------------------------
alter table public."Subscriptions"
  add column if not exists cancel_requested_at timestamptz,
  add column if not exists cancelled_at        timestamptz;

alter table public."Subscriptions" drop constraint if exists "Subscriptions_status_check";
alter table public."Subscriptions" drop constraint if exists subscriptions_status_check;
alter table public."Subscriptions" add constraint subscriptions_status_check
  check (status in ('active', 'past_due', 'cancelling', 'cancelled'));

comment on column public."Subscriptions".status is
  'active | past_due (payment failed, seat released) | cancelling (cancelled, keeps seat until the drawing already paid for is held) | cancelled';

-- A cancelling membership still counts as the person's membership in that
-- tier until it ends (they can resume it instead of joining again).
drop index if exists public.one_active_sub_per_email_tier;
create unique index one_active_sub_per_email_tier on public."Subscriptions" (lower(email), tier)
  where status in ('active', 'cancelling');

-- ---------------------------------------------------------------------------
-- Scheduling helpers
-- ---------------------------------------------------------------------------

-- First drawing = the earlier of (a) the first Drawing Date at least N days
-- after the circle filled, and (b) the Backstop End Date (Rules §8).
create or replace function public.schedule_first_drawing(p_circle_id integer)
returns date
language plpgsql
set search_path to ''
as $$
declare
  v_circle public.circles%rowtype;
  v_min    integer;
  v_fill   date;
  v_date   date;
begin
  select * into v_circle from public.circles where id = p_circle_id;
  select min_days_fill_to_first_drawing into v_min from public.program_settings where id;

  if v_circle.filled_at is not null then
    v_fill := public.drawing_date_on_or_after(
      (v_circle.filled_at at time zone 'America/New_York')::date + coalesce(v_min, 14));
  end if;
  v_date := least(v_fill, v_circle.backstop_end_date);  -- least() ignores nulls

  update public.drawings
  set drawing_date = v_date
  where circle_id = p_circle_id and kind = 'first' and status = 'scheduled';

  return v_date;
end;
$$;

-- Called whenever a circle gains a member.
create or replace function public.note_circle_fill(p_circle_id integer)
returns void
language plpgsql
set search_path to ''
as $$
begin
  update public.circles
  set filled_at = now()
  where id = p_circle_id and status = 'filling' and filled_at is null and current_members >= 400;

  if found then
    perform public.schedule_first_drawing(p_circle_id);
  end if;
end;
$$;

-- The drawing a contribution charged now buys an entry into.
create or replace function public.open_drawing_for_circle(p_circle_id integer)
returns bigint
language plpgsql
set search_path to ''
as $$
declare
  v_status text;
  v_id     bigint;
  v_last   date;
begin
  select status into v_status from public.circles where id = p_circle_id;

  if v_status = 'filling' then
    select id into v_id from public.drawings
    where circle_id = p_circle_id and kind = 'first' and status = 'scheduled';
    if v_id is null then
      insert into public.drawings (circle_id, kind) values (p_circle_id, 'first')
      on conflict do nothing
      returning id into v_id;
    end if;
    return v_id;

  elsif v_status = 'active' then
    select id into v_id from public.drawings
    where circle_id = p_circle_id and status = 'scheduled' and drawing_date > public.amplify_today()
    order by drawing_date
    limit 1;
    if v_id is null then
      select max(drawing_date) into v_last from public.drawings where circle_id = p_circle_id;
      insert into public.drawings (circle_id, kind, drawing_date)
      values (p_circle_id, 'monthly',
              public.drawing_date_on_or_after(greatest(coalesce(v_last, public.amplify_today()), public.amplify_today()) + 1))
      returning id into v_id;
    end if;
    return v_id;
  end if;

  return null;  -- retired circles hold no further drawings
end;
$$;

-- Record one paid entry for a Contribution. Called by process_checkout for
-- the first Contribution today; once Stripe is live, the payment webhook
-- calls it with the invoice id for every successful charge instead.
create or replace function public.record_contribution(p_subscription_id bigint, p_charge_ref text default null)
returns bigint
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_circle  integer;
  v_status  text;
  v_drawing bigint;
  v_entry   bigint;
begin
  if p_charge_ref is not null then
    select id into v_entry from public.drawing_entries where charge_ref = p_charge_ref;
    if v_entry is not null then
      return v_entry;  -- already recorded (webhook retry)
    end if;
  end if;

  select circle_id, status into v_circle, v_status
  from public."Subscriptions" where id = p_subscription_id;
  if v_circle is null or v_status <> 'active' then
    return null;
  end if;

  v_drawing := public.open_drawing_for_circle(v_circle);
  if v_drawing is null then
    return null;
  end if;

  insert into public.drawing_entries (drawing_id, subscription_id, charge_ref)
  values (v_drawing, p_subscription_id, p_charge_ref)
  on conflict (drawing_id, subscription_id) do nothing
  returning id into v_entry;

  return v_entry;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seats
-- ---------------------------------------------------------------------------

-- New members go to the lowest-numbered Filling or Active circle in the tier
-- with room (Rules §5), or a new circle.
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
  where c.tier = p_tier and c.status in ('filling', 'active') and c.current_members < 400
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

    insert into public.drawings (circle_id, kind) values (o_circle_id, 'first');
  end if;

  update public.circles set current_members = current_members + 1 where id = o_circle_id;
  perform public.note_circle_fill(o_circle_id);
end;
$$;

-- Free one seat, then fill it by moving a waiting member up:
--   1. someone in a Retired circle of the tier waiting for room, longest first;
--   2. otherwise the earliest-joined member of a higher-numbered Filling circle.
-- The move cascades: the seat that member left is refilled the same way.
-- A moved member's existing entries stay with the drawings they were bought for.
create or replace function public.release_circle_seat(p_circle_id integer)
returns void
language plpgsql
set search_path to ''
as $$
declare
  v_tier        text;
  v_dest        integer := p_circle_id;
  v_dest_number integer;
  v_dest_status text;
  v_sub         bigint;
  v_src         integer;
  v_src_status  text;
  v_guard       integer := 0;
begin
  select c.tier into v_tier from public.circles c where c.id = p_circle_id;
  if v_tier is null then
    return;
  end if;
  perform public.lock_circle_tier(v_tier);

  update public.circles set current_members = greatest(current_members - 1, 0) where id = p_circle_id;

  loop
    v_guard := v_guard + 1;
    exit when v_guard > 10000;

    select c.circle_number, c.status into v_dest_number, v_dest_status
    from public.circles c where c.id = v_dest;
    exit when v_dest_status not in ('filling', 'active');

    select s.id, s.circle_id, c.status into v_sub, v_src, v_src_status
    from public."Subscriptions" s
    join public.circles c on c.id = s.circle_id
    where s.status = 'active'
      and c.tier = v_tier
      and c.id <> v_dest
      and (c.status = 'retired' or (c.status = 'filling' and c.circle_number > v_dest_number))
    order by (c.status = 'retired') desc, s.created_at asc, s.id asc
    limit 1
    for update of s;

    exit when v_sub is null;

    update public."Subscriptions" set circle_id = v_dest where id = v_sub;
    update public.circles set current_members = current_members + 1 where id = v_dest;
    update public.circles set current_members = greatest(current_members - 1, 0) where id = v_src;
    perform public.note_circle_fill(v_dest);

    exit when v_src_status = 'retired';  -- retired circles don't take members back
    v_dest := v_src;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cancellation
-- ---------------------------------------------------------------------------

-- The member's next un-held entry, for telling them which drawing they're
-- still in after cancelling.
create or replace function public.next_entry_for(p_subscription_id bigint, out o_drawing_date date, out o_has_entry boolean)
language sql
stable
set search_path to ''
as $$
  select d.drawing_date, true
  from public.drawing_entries e
  join public.drawings d on d.id = e.drawing_id
  where e.subscription_id = p_subscription_id and d.status = 'scheduled'
  order by d.drawing_date nulls last
  limit 1;
$$;

-- Cancel a membership (Rules §6, §17: stops all future charges and entries,
-- keeps any entry already paid for).
--   * Active circle, and they've paid for its upcoming drawing: 'cancelling'.
--     They keep their seat until that drawing is held, then mark_drawing_held()
--     ends the membership and the seat opens.
--   * Otherwise (Filling circle, or nothing paid for the next drawing):
--     'cancelled' now, and the seat opens immediately. Any entry they hold in
--     a not-yet-held drawing still counts.
create or replace function public.cancel_subscription(p_subscription_id bigint)
returns json
language plpgsql
set search_path to ''
as $$
declare
  v_seen_tier     text;
  v_tier          text;
  v_status        text;
  v_circle_id     integer;
  v_circle_status text;
  v_hold          boolean := false;
  v_new_status    text;
  v_entry         record;
begin
  select s.tier into v_seen_tier from public."Subscriptions" s where s.id = p_subscription_id;
  if v_seen_tier is null then
    raise exception 'Subscription not found.';
  end if;
  perform public.lock_circle_tier(v_seen_tier);

  select s.tier, s.status, s.circle_id into v_tier, v_status, v_circle_id
  from public."Subscriptions" s where s.id = p_subscription_id
  for update;
  if v_tier is distinct from v_seen_tier then
    perform public.lock_circle_tier(v_tier);
  end if;

  if v_status in ('cancelling', 'cancelled') then
    v_new_status := v_status;  -- already done; idempotent
  elsif v_status = 'active' and v_circle_id is not null then
    select c.status into v_circle_status from public.circles c where c.id = v_circle_id;
    v_hold := v_circle_status = 'active' and exists (
      select 1
      from public.drawing_entries e
      join public.drawings d on d.id = e.drawing_id
      where e.subscription_id = p_subscription_id
        and d.circle_id = v_circle_id
        and d.status = 'scheduled'
    );

    if v_hold then
      v_new_status := 'cancelling';
      update public."Subscriptions"
      set status = 'cancelling', cancel_requested_at = now()
      where id = p_subscription_id;
    else
      v_new_status := 'cancelled';
      update public."Subscriptions"
      set status = 'cancelled', cancel_requested_at = now(), cancelled_at = now()
      where id = p_subscription_id;
      perform public.release_circle_seat(v_circle_id);
    end if;
  else
    -- past_due (seat already released) or no circle
    v_new_status := 'cancelled';
    update public."Subscriptions"
    set status = 'cancelled', cancel_requested_at = now(), cancelled_at = now()
    where id = p_subscription_id;
  end if;

  select * into v_entry from public.next_entry_for(p_subscription_id);

  -- public.communities is intentionally NOT touched: all-time vanity metrics.
  return json_build_object(
    'success', true,
    'status', v_new_status,
    'still_entered', coalesce(v_entry.o_has_entry, false),
    'drawing_date', v_entry.o_drawing_date
  );
end;
$$;

-- Kept for the payment-failure path (active -> past_due) and older callers.
create or replace function public.cancel_and_rebalance(p_subscription_id integer, p_new_status text default 'cancelled')
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_seen_tier text;
    v_tier      text;
    v_status    text;
    v_circle_id integer;
begin
    if p_new_status not in ('cancelled', 'past_due') then
        raise exception 'Invalid target status "%".', p_new_status;
    end if;

    if p_new_status = 'cancelled' then
        perform public.cancel_subscription(p_subscription_id);
        return;
    end if;

    select s.tier into v_seen_tier from public."Subscriptions" s where s.id = p_subscription_id;
    if v_seen_tier is null then
        return;
    end if;
    perform public.lock_circle_tier(v_seen_tier);

    select s.tier, s.status, s.circle_id into v_tier, v_status, v_circle_id
    from public."Subscriptions" s
    where s.id = p_subscription_id
    for update;

    if v_tier is distinct from v_seen_tier then
        perform public.lock_circle_tier(v_tier);
    end if;

    -- Only an active member moves to past_due; it gives up the seat.
    if v_status is distinct from 'active' then
        return;
    end if;

    update public."Subscriptions" set status = 'past_due' where id = p_subscription_id;
    if v_circle_id is not null then
        perform public.release_circle_seat(v_circle_id);
    end if;
end;
$$;

create or replace function public.cancel_my_subscription(p_subscription_id bigint)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_owner uuid;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    select user_id into v_owner from public."Subscriptions" where id = p_subscription_id;
    if v_owner is null or v_owner <> auth.uid() then
        -- Same error for "not found" and "not yours": no existence oracle.
        raise exception 'Subscription not found.';
    end if;

    -- NOTE: when Stripe billing goes live, the Stripe subscription must be
    -- cancelled server-side (edge function) before/with this call.
    return public.cancel_subscription(p_subscription_id);
end;
$$;

-- Undo a cancellation that hasn't taken effect yet.
create or replace function public.resume_my_subscription(p_subscription_id bigint)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_owner  uuid;
  v_tier   text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select s.user_id, s.tier into v_owner, v_tier from public."Subscriptions" s where s.id = p_subscription_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Subscription not found.';
  end if;

  perform public.lock_circle_tier(v_tier);
  select s.status into v_status from public."Subscriptions" s where s.id = p_subscription_id for update;

  if v_status = 'active' then
    return json_build_object('success', true, 'status', 'active');
  end if;
  if v_status <> 'cancelling' then
    return json_build_object('success', false, 'message', 'This membership has already ended. You can join again from the Circles page.');
  end if;

  -- NOTE: when Stripe billing goes live, re-enable the Stripe subscription here.
  update public."Subscriptions"
  set status = 'active', cancel_requested_at = null
  where id = p_subscription_id;

  return json_build_object('success', true, 'status', 'active');
end;
$$;

-- ---------------------------------------------------------------------------
-- After a drawing is held
-- ---------------------------------------------------------------------------
-- Run this once the winners for a drawing have been selected. It:
--   1. marks the drawing held (its entries are now spent, Rules §6);
--   2. for a first drawing: the circle becomes Active if it ever filled,
--      otherwise Retired (Rules §8);
--   3. ends every 'cancelling' membership in the circle that was only waiting
--      for this drawing, opening their seats (and moving waiting members up);
--   4. for a Retired circle: moves its members into Active circles of the
--      tier with room, in join order; anyone left waits and is moved first
--      when a seat opens;
--   5. for an Active circle: creates the next monthly drawing.
create or replace function public.mark_drawing_held(p_drawing_id bigint)
returns json
language plpgsql
set search_path to ''
as $$
declare
  v_drawing     public.drawings%rowtype;
  v_tier        text;
  v_circle_stat text;
  v_filled_at   timestamptz;
  v_sub         record;
  v_target      integer;
  v_finalized   integer := 0;
  v_reassigned  integer := 0;
  v_waiting     integer := 0;
  v_next        bigint;
begin
  select * into v_drawing from public.drawings where id = p_drawing_id for update;
  if v_drawing.id is null then
    raise exception 'Drawing % not found.', p_drawing_id;
  end if;
  if v_drawing.status = 'held' then
    return json_build_object('success', true, 'already_held', true);
  end if;
  if v_drawing.drawing_date is null then
    raise exception 'Drawing % has no date yet (its circle has not filled and has no backstop date).', p_drawing_id;
  end if;
  if v_drawing.drawing_date > public.amplify_today() then
    raise exception 'Drawing % is scheduled for %; it can''t be marked held before then.', p_drawing_id, v_drawing.drawing_date;
  end if;

  select c.tier, c.filled_at into v_tier, v_filled_at from public.circles c where c.id = v_drawing.circle_id;
  perform public.lock_circle_tier(v_tier);

  update public.drawings set status = 'held', held_at = now() where id = p_drawing_id;

  if v_drawing.kind = 'first' then
    if v_filled_at is not null then
      update public.circles set status = 'active', activated_at = now() where id = v_drawing.circle_id;
    else
      update public.circles set status = 'retired', retired_at = now() where id = v_drawing.circle_id;
    end if;
  end if;

  for v_sub in
    select s.id, s.circle_id
    from public."Subscriptions" s
    where s.circle_id = v_drawing.circle_id
      and s.status = 'cancelling'
      and not exists (
        select 1 from public.drawing_entries e
        join public.drawings d on d.id = e.drawing_id
        where e.subscription_id = s.id and d.circle_id = s.circle_id and d.status = 'scheduled'
      )
    order by s.id
  loop
    update public."Subscriptions" set status = 'cancelled', cancelled_at = now() where id = v_sub.id;
    perform public.release_circle_seat(v_sub.circle_id);
    v_finalized := v_finalized + 1;
  end loop;

  select c.status into v_circle_stat from public.circles c where c.id = v_drawing.circle_id;

  if v_circle_stat = 'retired' then
    for v_sub in
      select s.id from public."Subscriptions" s
      where s.circle_id = v_drawing.circle_id and s.status = 'active'
      order by s.created_at, s.id
    loop
      select c.id into v_target
      from public.circles c
      where c.tier = v_tier and c.status = 'active' and c.current_members < 400
      order by c.circle_number
      limit 1
      for update;

      if v_target is null then
        v_waiting := v_waiting + 1;
        continue;
      end if;

      update public."Subscriptions" set circle_id = v_target where id = v_sub.id;
      update public.circles set current_members = current_members + 1 where id = v_target;
      update public.circles set current_members = greatest(current_members - 1, 0) where id = v_drawing.circle_id;
      v_reassigned := v_reassigned + 1;
    end loop;
  elsif v_circle_stat = 'active' then
    v_next := public.open_drawing_for_circle(v_drawing.circle_id);
  end if;

  return json_build_object(
    'success', true,
    'circle_status', v_circle_stat,
    'cancellations_completed', v_finalized,
    'members_reassigned', v_reassigned,
    'members_waiting_for_room', v_waiting,
    'next_drawing_id', v_next
  );
end;
$$;

-- Backstop End Date from a Circle Launch Addendum. Must be a fixed monthly
-- Drawing Date (Rules §3).
create or replace function public.set_circle_backstop(p_circle_id integer, p_backstop date)
returns date
language plpgsql
set search_path to ''
as $$
begin
  if p_backstop is not null and public.drawing_date_on_or_after(p_backstop) <> p_backstop then
    raise exception '% is not a Drawing Date. The nearest one on or after it is %.',
      p_backstop, public.drawing_date_on_or_after(p_backstop);
  end if;
  update public.circles set backstop_end_date = p_backstop where id = p_circle_id and status = 'filling';
  if not found then
    raise exception 'Circle % is not a filling circle.', p_circle_id;
  end if;
  return public.schedule_first_drawing(p_circle_id);
end;
$$;

-- Admin wrappers for a future admin screen (same pattern as the other admin_ RPCs).
create or replace function public.admin_mark_drawing_held(p_drawing_id bigint)
returns json
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;
  return public.mark_drawing_held(p_drawing_id);
end;
$$;

create or replace function public.admin_set_circle_backstop(p_circle_id integer, p_backstop date)
returns date
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;
  return public.set_circle_backstop(p_circle_id, p_backstop);
end;
$$;

-- ---------------------------------------------------------------------------
-- Account deletion
-- ---------------------------------------------------------------------------
-- Deleting a login (dashboard, admin API, or a future "delete my account")
-- runs the normal cancellation on every current membership first, so a
-- deleted account can never leave an active membership, a held seat, or
-- future charges behind. Membership history stays (user_id becomes null) for
-- the records the Privacy Policy says are retained. If the person signs up
-- again with the same email, that history re-attaches to the new account.
create or replace function public.close_memberships_on_user_delete()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id bigint;
begin
  for v_id in
    select s.id from public."Subscriptions" s
    where s.user_id = old.id and s.status in ('active', 'past_due')
  loop
    perform public.cancel_subscription(v_id);
  end loop;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted_close_memberships on auth.users;
create trigger on_auth_user_deleted_close_memberships
  before delete on auth.users
  for each row execute function public.close_memberships_on_user_delete();

-- ---------------------------------------------------------------------------
-- Existing functions that check for "already a member in this tier" now treat
-- a cancelling membership the same way, and contact details stay editable
-- while a cancellation is pending.
-- ---------------------------------------------------------------------------
create or replace function public.reactivate_subscription(p_subscription_id integer)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_seen_tier TEXT;
    v_tier      TEXT;
    v_status    TEXT;
    v_email     TEXT;
    v_user_id   UUID;
    v_new_circle_id INTEGER;
    v_new_circle_number INTEGER;
begin
    select s.tier into v_seen_tier from public."Subscriptions" s where s.id = p_subscription_id;
    if v_seen_tier is null then
        return json_build_object('success', false, 'message', 'Subscription is not past_due');
    end if;
    perform public.lock_circle_tier(v_seen_tier);

    select s.tier, s.status, lower(s.email), s.user_id into v_tier, v_status, v_email, v_user_id
    from public."Subscriptions" s
    where s.id = p_subscription_id
    for update;

    if v_tier is distinct from v_seen_tier then
        perform public.lock_circle_tier(v_tier);
    end if;

    if v_status is distinct from 'past_due' then
        return json_build_object('success', false, 'message', 'Subscription is not past_due');
    end if;

    if exists (
        select 1 from public."Subscriptions" s
        where s.id <> p_subscription_id and s.status in ('active', 'cancelling') and s.tier = v_tier
          and (lower(s.email) = v_email or (v_user_id is not null and s.user_id = v_user_id))
    ) then
        return json_build_object('success', false, 'message', 'Another membership in this tier already exists for this member.');
    end if;

    select o_circle_id, o_circle_number into v_new_circle_id, v_new_circle_number
    from public.claim_circle_seat(v_tier);

    update public."Subscriptions"
    set status = 'active', circle_id = v_new_circle_id
    where id = p_subscription_id;

    return json_build_object('success', true, 'new_circle', v_new_circle_number);
end;
$$;

create or replace function public.process_tier_change(p_subscription_id integer, p_new_tier text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_seen_tier      TEXT;
    v_old_tier       TEXT;
    v_status         TEXT;
    v_old_circle_id  INTEGER;
    v_community_id   BIGINT;
    v_email          TEXT;
    v_user_id        UUID;
    v_new_circle_id  INTEGER;
    v_new_circle_number INTEGER;
    v_new_tier_price NUMERIC;
begin
    if p_new_tier = 'silver' then v_new_tier_price := 250;
    elsif p_new_tier = 'gold' then v_new_tier_price := 500;
    elsif p_new_tier = 'diamond' then v_new_tier_price := 1000;
    else raise exception 'Invalid tier selected.'; end if;

    select s.tier into v_seen_tier from public."Subscriptions" s where s.id = p_subscription_id;

    if v_seen_tier is null or v_seen_tier = p_new_tier then
        return json_build_object('success', false, 'message', 'Invalid tier change');
    end if;

    if v_seen_tier < p_new_tier then
        perform public.lock_circle_tier(v_seen_tier);
        perform public.lock_circle_tier(p_new_tier);
    else
        perform public.lock_circle_tier(p_new_tier);
        perform public.lock_circle_tier(v_seen_tier);
    end if;

    select s.tier, s.status, s.circle_id, s.community_id, lower(s.email), s.user_id
    into v_old_tier, v_status, v_old_circle_id, v_community_id, v_email, v_user_id
    from public."Subscriptions" s
    where s.id = p_subscription_id
    for update;

    if v_status is distinct from 'active' or v_old_tier is distinct from v_seen_tier then
        return json_build_object('success', false, 'message', 'Your membership changed while this request was in progress. Please refresh and try again.');
    end if;

    if exists (
        select 1 from public."Subscriptions" s
        where s.id <> p_subscription_id and s.status in ('active', 'cancelling') and s.tier = p_new_tier
          and (lower(s.email) = v_email or (v_user_id is not null and s.user_id = v_user_id))
    ) then
        return json_build_object('success', false, 'message', format('You already have a %s membership.', initcap(p_new_tier)));
    end if;

    -- Phase 1: leave the old circle (members waiting move up behind them).
    -- Any entry already paid for in the old circle's drawing still counts.
    perform public.release_circle_seat(v_old_circle_id);

    -- Phase 2: join a circle in the new tier.
    select o_circle_id, o_circle_number into v_new_circle_id, v_new_circle_number
    from public.claim_circle_seat(p_new_tier);

    update public."Subscriptions" set tier = p_new_tier, circle_id = v_new_circle_id where id = p_subscription_id;

    -- Phase 3: vanity metrics move by net difference.
    update public.communities set
        monthly = monthly + v_new_tier_price - (
            case when v_old_tier = 'silver' then 250
                 when v_old_tier = 'gold' then 500
                 when v_old_tier = 'diamond' then 1000 else 0 end
        ),
        silver  = silver  + case when p_new_tier = 'silver'  then 1 else 0 end - case when v_old_tier = 'silver'  then 1 else 0 end,
        gold    = gold    + case when p_new_tier = 'gold'    then 1 else 0 end - case when v_old_tier = 'gold'    then 1 else 0 end,
        diamond = diamond + case when p_new_tier = 'diamond' then 1 else 0 end - case when v_old_tier = 'diamond' then 1 else 0 end
    where id = v_community_id;

    return json_build_object('success', true, 'new_tier', p_new_tier, 'assigned_circle', v_new_circle_number);
end;
$$;

-- Contact details: also editable while a cancellation is pending.
do $$
declare
  v_def text := pg_get_functiondef('public.update_my_contact_details(text, boolean, text, text, text, text, text)'::regprocedure);
begin
  if position($q$s.status in ('active', 'past_due')$q$ in v_def) = 0 then
    raise exception 'update_my_contact_details changed shape; update this migration.';
  end if;
  execute replace(v_def, $q$s.status in ('active', 'past_due')$q$, $q$s.status in ('active', 'past_due', 'cancelling')$q$);
end;
$$;

-- process_checkout: a cancelling membership blocks rejoining the same tier
-- (resume it instead), and the first Contribution records its entry.
do $$
declare
  v_def text := pg_get_functiondef('public.process_checkout(text, text, boolean, text, text, text, text, text, text, text, text, text, uuid, date)'::regprocedure);
  v_old_dup text := $q$    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.status = 'active' AND s.tier = p_tier
          AND (lower(s.email) = v_email OR (v_uid IS NOT NULL AND s.user_id = v_uid))
    ) THEN
        RAISE EXCEPTION 'You already have an active % membership. You can manage it from My Account.', initcap(p_tier);
    END IF;$q$;
  v_new_dup text := $q$    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.status = 'cancelling' AND s.tier = p_tier
          AND (lower(s.email) = v_email OR (v_uid IS NOT NULL AND s.user_id = v_uid))
    ) THEN
        RAISE EXCEPTION 'Your % membership is set to end after its next drawing. You can keep it from My Account instead of joining again.', initcap(p_tier);
    END IF;

    IF EXISTS (
        SELECT 1 FROM public."Subscriptions" s
        WHERE s.status = 'active' AND s.tier = p_tier
          AND (lower(s.email) = v_email OR (v_uid IS NOT NULL AND s.user_id = v_uid))
    ) THEN
        RAISE EXCEPTION 'You already have an active % membership. You can manage it from My Account.', initcap(p_tier);
    END IF;$q$;
  v_old_ins text := $q$    -- 8b. One-time token for the post-checkout causes step$q$;
  v_new_ins text := $q$    -- 8a. The first Contribution's entry (Rules §6). When Stripe goes live this
    -- moves to the payment webhook, which calls record_contribution with the
    -- charge reference once the payment succeeds.
    PERFORM public.record_contribution(v_subscription_id, NULL);

    -- 8b. One-time token for the post-checkout causes step$q$;
begin
  if position(v_old_dup in v_def) = 0 or position(v_old_ins in v_def) = 0 then
    raise exception 'process_checkout changed shape; update this migration.';
  end if;
  v_def := replace(v_def, v_old_dup, v_new_dup);
  v_def := replace(v_def, v_old_ins, v_new_ins);
  execute v_def;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin views
-- ---------------------------------------------------------------------------
drop view if exists public.circle_reconciliation;
create view public.circle_reconciliation with (security_invoker = on) as
select c.id as circle_id,
       c.tier,
       c.circle_number,
       c.current_members as counter_value,
       count(s.id) filter (where s.status in ('active', 'cancelling')) as real_seated_count,
       c.current_members - count(s.id) filter (where s.status in ('active', 'cancelling')) as drift
from public.circles c
left join public."Subscriptions" s on s.circle_id = c.id
group by c.id, c.tier, c.circle_number, c.current_members
having c.current_members <> count(s.id) filter (where s.status in ('active', 'cancelling'));

-- Admin/service only, as before.
revoke all on public.circle_reconciliation from anon, authenticated;

-- The roster for each upcoming drawing is now its paid entries.
drop view if exists public.sweepstakes_roster;
create view public.sweepstakes_roster with (security_invoker = on) as
select d.id as drawing_id,
       d.drawing_date,
       d.kind as drawing_kind,
       c.tier as circle_tier,
       c.circle_number,
       s."full name",
       s.email,
       s.phone,
       s.status as membership_status,
       e.created_at as entered_at
from public.drawing_entries e
join public.drawings d on d.id = e.drawing_id
join public.circles c on c.id = d.circle_id
join public."Subscriptions" s on s.id = e.subscription_id
where d.status = 'scheduled'
order by c.tier, c.circle_number, d.drawing_date, e.created_at;

-- Read-only for signed-in users; RLS on the underlying tables limits rows to admins.
revoke all on public.sweepstakes_roster from anon, authenticated;
grant select on public.sweepstakes_roster to authenticated;

-- ---------------------------------------------------------------------------
-- Grants: internal helpers are never callable from the browser.
-- ---------------------------------------------------------------------------
revoke all on function public.amplify_today() from public, anon, authenticated;
revoke all on function public.drawing_date_on_or_after(date) from public, anon, authenticated;
revoke all on function public.schedule_first_drawing(integer) from public, anon, authenticated;
revoke all on function public.note_circle_fill(integer) from public, anon, authenticated;
revoke all on function public.open_drawing_for_circle(integer) from public, anon, authenticated;
revoke all on function public.record_contribution(bigint, text) from public, anon, authenticated;
revoke all on function public.claim_circle_seat(text) from public, anon, authenticated;
revoke all on function public.release_circle_seat(integer) from public, anon, authenticated;
revoke all on function public.next_entry_for(bigint) from public, anon, authenticated;
revoke all on function public.cancel_subscription(bigint) from public, anon, authenticated;
revoke all on function public.cancel_and_rebalance(integer, text) from public, anon, authenticated;
revoke all on function public.mark_drawing_held(bigint) from public, anon, authenticated;
revoke all on function public.set_circle_backstop(integer, date) from public, anon, authenticated;
revoke all on function public.close_memberships_on_user_delete() from public, anon, authenticated;
revoke all on function public.reactivate_subscription(integer) from public, anon, authenticated;
revoke all on function public.process_tier_change(integer, text) from public, anon, authenticated;

revoke all on function public.resume_my_subscription(bigint) from public, anon;
grant execute on function public.resume_my_subscription(bigint) to authenticated;
revoke all on function public.admin_mark_drawing_held(bigint) from public, anon;
grant execute on function public.admin_mark_drawing_held(bigint) to authenticated;
revoke all on function public.admin_set_circle_backstop(integer, date) from public, anon;
grant execute on function public.admin_set_circle_backstop(integer, date) to authenticated;
