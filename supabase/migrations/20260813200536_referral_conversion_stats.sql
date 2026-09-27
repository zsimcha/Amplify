-- Surface the click -> signup link now that it exists: conversion counts on
-- both dashboards, and the originating click timestamp on each referral.

create or replace function public.get_my_affiliate_dashboard()
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_affiliate public.affiliates%rowtype;
  v_settings  public.referral_settings%rowtype;
  v_referrals json;
  v_clicks    integer;
  v_converted integer;
begin
  select * into v_affiliate
  from public.affiliates
  where user_id = auth.uid()
  limit 1;

  if v_affiliate.id is null then
    return null;
  end if;

  -- Mature any milestones whose hold window has elapsed, so the affiliate sees
  -- the same status the admin screen would show.
  perform public.refresh_referral_payout_statuses();

  select * into v_settings from public.referral_settings limit 1;

  select count(*)::integer,
         count(*) filter (where converted_at is not null)::integer
    into v_clicks, v_converted
  from public.referral_clicks where affiliate_id = v_affiliate.id;

  select coalesce(json_agg(row_to_json(x) order by x.signed_up_at desc), '[]'::json) into v_referrals
  from (
    select
      r.id,
      public.mask_email(r.referred_email) as referred_email_masked,
      r.clicked_at,
      r.signed_up_at,
      r.first_charge_at,
      r.second_charge_at,
      r.payout_1_status,
      r.payout_1_amount_cents,
      r.payout_1_paid_at,
      r.payout_2_status,
      r.payout_2_amount_cents,
      r.payout_2_paid_at
    from public.referrals r
    where r.affiliate_id = v_affiliate.id
  ) x;

  return json_build_object(
    'affiliate', json_build_object(
      'slug', v_affiliate.slug,
      'display_name', v_affiliate.display_name,
      'payout_method', v_affiliate.payout_method,
      'payout_handle', v_affiliate.payout_handle,
      'is_active', v_affiliate.is_active
    ),
    'click_count', v_clicks,
    'converted_click_count', v_converted,
    'hold_days', coalesce(v_settings.hold_days, 14),
    'payout_1_amount_cents', coalesce(v_settings.payout_1_amount_cents, 2500),
    'payout_2_amount_cents', coalesce(v_settings.payout_2_amount_cents, 2500),
    'referrals', v_referrals,
    'totals', (
      select json_build_object(
        'referral_count', count(*),
        'earned_cents',   coalesce(sum(case when payout_1_status in ('pending','ready','paid') then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status in ('pending','ready','paid') then payout_2_amount_cents else 0 end), 0),
        'paid_cents',     coalesce(sum(case when payout_1_status = 'paid' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'paid' then payout_2_amount_cents else 0 end), 0),
        'pending_cents',  coalesce(sum(case when payout_1_status = 'pending' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'pending' then payout_2_amount_cents else 0 end), 0),
        'ready_cents',    coalesce(sum(case when payout_1_status = 'ready' then payout_1_amount_cents else 0 end), 0)
                        + coalesce(sum(case when payout_2_status = 'ready' then payout_2_amount_cents else 0 end), 0)
      )
      from public.referrals where affiliate_id = v_affiliate.id
    )
  );
end;
$$;

create or replace function public.admin_list_affiliates()
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  perform public.refresh_referral_payout_statuses();

  select coalesce(json_agg(row_to_json(a) order by a.ready_cents desc, a.slug), '[]'::json) into v_result
  from (
    select
      af.id,
      af.slug,
      af.email,
      af.display_name,
      af.payout_method,
      af.payout_handle,
      af.notes,
      af.is_active,
      af.user_id is not null as has_account,
      af.created_at,
      (select count(*) from public.referral_clicks c where c.affiliate_id = af.id)::integer as click_count,
      (select count(*) from public.referral_clicks c where c.affiliate_id = af.id and c.converted_at is not null)::integer as converted_click_count,
      coalesce(s.referral_count, 0)  as referral_count,
      coalesce(s.ready_cents, 0)     as ready_cents,
      coalesce(s.pending_cents, 0)   as pending_cents,
      coalesce(s.paid_cents, 0)      as paid_cents,
      coalesce(s.earned_cents, 0)    as earned_cents
    from public.affiliates af
    left join lateral (
      select
        count(*)::integer as referral_count,
        sum(case when r.payout_1_status = 'ready'   then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'ready'   then r.payout_2_amount_cents else 0 end) as ready_cents,
        sum(case when r.payout_1_status = 'pending' then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'pending' then r.payout_2_amount_cents else 0 end) as pending_cents,
        sum(case when r.payout_1_status = 'paid'    then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status = 'paid'    then r.payout_2_amount_cents else 0 end) as paid_cents,
        sum(case when r.payout_1_status in ('pending','ready','paid') then r.payout_1_amount_cents else 0 end)
      + sum(case when r.payout_2_status in ('pending','ready','paid') then r.payout_2_amount_cents else 0 end) as earned_cents
      from public.referrals r where r.affiliate_id = af.id
    ) s on true
  ) a;

  return v_result;
end;
$$;;
