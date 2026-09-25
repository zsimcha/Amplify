-- Member-submitted requests for organizations to add to the partner roster.
create table if not exists public.cause_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  org_name   text not null,
  org_url    text not null,
  note       text,
  status     text not null default 'pending'
             check (status in ('pending', 'reviewing', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists cause_requests_user_idx on public.cause_requests(user_id, created_at desc);

alter table public.cause_requests enable row level security;

-- Members see and create only their own requests. Status is set by staff, so
-- there is deliberately no member update/delete policy.
create policy "cause_requests_select_own" on public.cause_requests
  for select using (auth.uid() = user_id);

-- Admins (existing public.admins table) can review every request.
create policy "cause_requests_select_admin" on public.cause_requests
  for select using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Submits a request on behalf of the caller. Validation lives server-side so
-- the rules hold regardless of client, including a cap on open requests to
-- keep the queue from being flooded from one account.
create or replace function public.request_cause(
  p_org_name text,
  p_org_url  text,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_org_name, ''));
  v_url  text := btrim(coalesce(p_org_url, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_open int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Enter the organization name.';
  end if;

  -- Accept bare domains by defaulting the scheme, then require a plausible host.
  if v_url !~* '^https?://' then
    v_url := 'https://' || v_url;
  end if;
  if v_url !~* '^https?://[a-z0-9-]+(\.[a-z0-9-]+)+' or length(v_url) > 500 then
    raise exception 'Enter a valid website address.';
  end if;

  if v_note is not null and length(v_note) > 1000 then
    raise exception 'Please keep your note under 1000 characters.';
  end if;

  select count(*) into v_open
  from public.cause_requests
  where user_id = auth.uid() and status in ('pending', 'reviewing');

  if v_open >= 10 then
    raise exception 'You already have several requests under review. Please wait for those before adding more.';
  end if;

  insert into public.cause_requests (user_id, org_name, org_url, note)
  values (auth.uid(), v_name, v_url, v_note);
end;
$$;

revoke all on function public.request_cause(text, text, text) from public;
grant execute on function public.request_cause(text, text, text) to authenticated;;
