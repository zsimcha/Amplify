-- ============================================================================
-- 1. Self-service contact details
--
-- A member's phone and mailing address are captured once, at checkout, and
-- until now could only be changed by emailing support. Winners are contacted
-- "using the contact information on file" (Official Rules §12) and the Terms
-- (§5) require members to keep their information current, so they need a way
-- to do that themselves.
--
-- Contact details live on each membership row rather than on a profile, so a
-- member with more than one Tier has more than one copy. This updates all of
-- the caller's current (active or past_due) memberships together so the
-- copies can't drift apart. Cancelled rows are left as the historical record
-- of what was on file while the membership ran.
--
-- The legal name ("full name") is deliberately not editable here: it is the
-- identity an entry belongs to, and accounts are non-transferable (Terms §5).
-- A genuine correction goes through support.
--
-- Validation mirrors process_checkout. The age gate is re-checked because the
-- minimum age depends on state of residence (Official Rules §4: 19 in AL/NE,
-- 21 in MS). The date of birth is never stored, so the check uses the lowest
-- age the member can be today: their age when verified at signup plus the
-- whole years elapsed since. Someone that can't be shown to meet the new
-- state's minimum is sent to support rather than waved through.
-- ============================================================================
create or replace function public.update_my_contact_details(
  p_display_name text,
  p_is_anonymous boolean,
  p_phone        text,
  p_address      text,
  p_city         text,
  p_state        text,
  p_zip_code     text
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_anonymous boolean := coalesce(p_is_anonymous, false);
  v_display   text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_phone     text := btrim(coalesce(p_phone, ''));
  v_address   text := btrim(coalesce(p_address, ''));
  v_city      text := btrim(coalesce(p_city, ''));
  v_state     text := upper(btrim(coalesce(p_state, '')));
  v_zip       text := btrim(coalesce(p_zip_code, ''));
  v_min_age   integer;
  v_known_age integer;
  v_updated   integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;

  if v_display is not null and length(v_display) > 80 then
    raise exception 'Display name must be 80 characters or fewer.';
  end if;
  if length(v_phone) > 30 or length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then
    raise exception 'Enter a valid phone number.';
  end if;
  if v_address = '' or length(v_address) > 200 then
    raise exception 'Enter your street address.';
  end if;
  if v_city = '' or length(v_city) > 100 then
    raise exception 'Enter your city.';
  end if;
  if not (v_state = any (array[
      'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS',
      'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
      'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'])) then
    raise exception 'Select a valid US state.';
  end if;
  if v_zip !~ '^\d{5}(-\d{4})?$' then
    raise exception 'Enter a valid ZIP code.';
  end if;

  -- Lowest age this member can be today. Every membership was verified as at
  -- least 18 at signup, which is the floor when no age was recorded.
  select coalesce(max(
           s.age_at_verification
           + extract(year from age(current_date, s.age_verified_at::date))::integer
         ), 18)
    into v_known_age
  from public."Subscriptions" s
  where s.user_id = v_uid
    and s.age_at_verification is not null
    and s.age_verified_at is not null;

  v_min_age := case v_state when 'AL' then 19 when 'NE' then 19 when 'MS' then 21 else 18 end;
  if v_known_age < v_min_age then
    raise exception 'Members in % must be at least %. Please email support@amplifygive.com so we can update your address.', v_state, v_min_age;
  end if;

  update public."Subscriptions" s
  set display_name = case
                       when v_anonymous then 'Anonymous'
                       else coalesce(v_display, s."full name")
                     end,
      is_anonymous = v_anonymous,
      phone        = v_phone,
      address      = v_address,
      city         = v_city,
      state        = v_state,
      zip_code     = v_zip
  where s.user_id = v_uid
    and s.status in ('active', 'past_due');

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'You have no current membership to update.';
  end if;

  return json_build_object('success', true, 'memberships_updated', v_updated);
end;
$$;

revoke all on function public.update_my_contact_details(text, boolean, text, text, text, text, text) from public, anon;
grant execute on function public.update_my_contact_details(text, boolean, text, text, text, text, text) to authenticated, service_role;

-- ============================================================================
-- 2. Clear pre-launch test residue from the community counters
--
-- The counters are all-time totals that only ever go up, so they can't be
-- recomputed from current memberships once real members exist. Before
-- launch, though, a community with no membership rows at all can only be
-- carrying numbers left behind by testing (e.g. "General" showing $250
-- monthly with zero members). Zero those; leave every community that has a
-- real membership, and the preset community list itself, untouched.
-- ============================================================================
update public.communities c
set members = 0, monthly = 0, silver = 0, gold = 0, diamond = 0
where not exists (
  select 1 from public."Subscriptions" s where s.community_id = c.id
)
and (coalesce(c.members, 0) <> 0 or coalesce(c.monthly, 0) <> 0
  or coalesce(c.silver, 0) <> 0 or coalesce(c.gold, 0) <> 0 or coalesce(c.diamond, 0) <> 0);
