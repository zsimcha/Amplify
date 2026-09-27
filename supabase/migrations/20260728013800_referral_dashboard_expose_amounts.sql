-- Surface the configured payout amounts so the account-page copy quotes the
-- real numbers instead of hard-coding $25, and stays correct if the amounts
-- in referral_settings ever change.
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

  select count(*)::integer into v_clicks
  from public.referral_clicks where affiliate_id = v_affiliate.id;

  select coalesce(json_agg(row_to_json(x) order by x.signed_up_at desc), '[]'::json) into v_referrals
  from (
    select
      r.id,
      public.mask_email(r.referred_email) as referred_email_masked,
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
$$;;
