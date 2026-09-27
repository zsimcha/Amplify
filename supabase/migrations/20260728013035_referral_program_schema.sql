-- ============================================================================
-- Referral / affiliate program — schema
--
-- Conventions followed from the existing project:
--   * Reads are granted by RLS SELECT policies scoped to auth.uid().
--   * There are NO INSERT/UPDATE/DELETE policies. Every write goes through a
--     SECURITY DEFINER RPC that re-derives the caller's identity server-side,
--     exactly like process_checkout / cancel_my_subscription / change_my_tier.
--   * Affiliate rows are created by hand (dashboard / service role), so the
--     absence of write policies is deliberate, not an oversight.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Milestone lifecycle.
--   not_earned  -> milestone hasn't been triggered yet (no qualifying charge)
--   pending     -> triggered, inside the refund/dispute hold window
--   ready       -> hold elapsed, safe to pay
--   paid        -> money sent (recorded manually)
--   void        -> cancelled before payment (e.g. refund during the hold)
--   clawed_back -> was paid, then recovered under the terms' clawback clause
-- ---------------------------------------------------------------------------
create type public.referral_payout_status as enum (
  'not_earned', 'pending', 'ready', 'paid', 'void', 'clawed_back'
);

-- ---------------------------------------------------------------------------
-- Program settings. Singleton row so payout amounts and the hold window are
-- tunable without a code change or migration.
--
-- NOTE: hold_days defaults to 14. The published referral terms at /referral
-- say payouts run on a net-30 schedule — set this to 30 to match, or update
-- that line in the terms.
-- ---------------------------------------------------------------------------
create table public.referral_settings (
  id                     boolean primary key default true check (id),
  payout_1_amount_cents  integer not null default 2500 check (payout_1_amount_cents >= 0),
  payout_2_amount_cents  integer not null default 2500 check (payout_2_amount_cents >= 0),
  hold_days              integer not null default 14   check (hold_days between 0 and 120),
  updated_at             timestamptz not null default now()
);
insert into public.referral_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Admins. Membership in this table is the only thing that grants access to
-- other people's payout data. Add yourself with:
--   insert into public.admins (user_id) values ('<your auth user id>');
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Reserved slug namespace. amplifygive.com/{slug} shares a namespace with the
-- real routes, so a slug must never be able to shadow one. Kept as a table so
-- new routes can be reserved without a migration.
-- ---------------------------------------------------------------------------
create table public.reserved_slugs (
  slug text primary key
);

insert into public.reserved_slugs (slug) values
  -- live application routes
  ('how-it-works'), ('about'), ('grant'), ('faq'), ('circles'), ('checkout'),
  ('contact'), ('login'), ('reset-password'), ('welcome'), ('account'),
  ('rules'), ('privacy'), ('terms'), ('referral'), ('admin'),
  -- infrastructure / static asset paths
  ('api'), ('assets'), ('static'), ('public'), ('_next'), ('www'), ('cdn'),
  ('auth'), ('functions'), ('storage'), ('rest'), ('realtime'),
  -- routes that plausibly get added later, reserved defensively
  ('signup'), ('sign-up'), ('signin'), ('sign-in'), ('logout'), ('sign-out'),
  ('register'), ('dashboard'), ('settings'), ('profile'), ('billing'),
  ('support'), ('help'), ('blog'), ('press'), ('careers'), ('legal'),
  ('winners'), ('sweepstakes'), ('donate'), ('give'), ('join'), ('refer'),
  ('referrals'), ('affiliate'), ('affiliates'), ('partners'), ('team'),
  ('security'), ('status'), ('robots.txt'), ('sitemap.xml'), ('favicon.ico');

-- ---------------------------------------------------------------------------
-- Affiliates. One row per ambassador, created by hand before they have an
-- account — so user_id starts NULL and is backfilled by email when they accept
-- their invite (see link_affiliate_to_user below).
-- ---------------------------------------------------------------------------
create table public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null,
  user_id        uuid references auth.users(id) on delete set null,
  email          text not null,
  display_name   text,
  payout_method  text,   -- 'venmo' | 'paypal' | anything else you use
  payout_handle  text,   -- the @handle / email money actually goes to
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),

  -- 3-30 chars, lowercase alphanumeric and hyphens, no leading/trailing hyphen.
  constraint affiliates_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$')
);

create unique index affiliates_slug_key    on public.affiliates (slug);
create unique index affiliates_email_key   on public.affiliates (lower(email));
create unique index affiliates_user_id_key on public.affiliates (user_id) where user_id is not null;

-- Normalize on write so hand-entered rows can't drift (trailing spaces,
-- capitalised slugs) and silently break link resolution.
create or replace function public.normalize_affiliate()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  new.slug  := lower(trim(new.slug));
  new.email := lower(trim(new.email));

  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'Slug "%" is reserved and would collide with a site route.', new.slug;
  end if;

  return new;
end;
$$;

create trigger affiliates_normalize
  before insert or update on public.affiliates
  for each row execute function public.normalize_affiliate();

-- ---------------------------------------------------------------------------
-- Referrals. One row per referred person, carrying both payout milestones.
--
-- Amounts are snapshotted onto the row when it's created, so changing
-- referral_settings later never rewrites what is already owed.
-- ---------------------------------------------------------------------------
create table public.referrals (
  id                       uuid primary key default gen_random_uuid(),
  affiliate_id             uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id         uuid references auth.users(id) on delete set null,
  referred_subscription_id bigint references public."Subscriptions"(id) on delete set null,
  referred_email           text not null,

  clicked_at               timestamptz,
  signed_up_at             timestamptz not null default now(),
  first_charge_at          timestamptz,
  second_charge_at         timestamptz,

  payout_1_status          public.referral_payout_status not null default 'not_earned',
  payout_1_amount_cents    integer not null,
  payout_1_paid_at         timestamptz,
  payout_1_note            text,

  payout_2_status          public.referral_payout_status not null default 'not_earned',
  payout_2_amount_cents    integer not null,
  payout_2_paid_at         timestamptz,
  payout_2_note            text,

  created_at               timestamptz not null default now()
);

-- Anti-double-credit. A given person can only ever be referred once, whichever
-- identifier we happen to know them by.
create unique index referrals_email_key        on public.referrals (lower(referred_email));
create unique index referrals_user_key         on public.referrals (referred_user_id)         where referred_user_id is not null;
create unique index referrals_subscription_key on public.referrals (referred_subscription_id) where referred_subscription_id is not null;

create index referrals_affiliate_idx on public.referrals (affiliate_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Click log. Lets you see link traffic even when it never converts, which is
-- the difference between "this ambassador isn't sharing" and "they're sharing
-- and it isn't landing". Deliberately stores no IP address.
-- ---------------------------------------------------------------------------
create table public.referral_clicks (
  id           bigint generated by default as identity primary key,
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  clicked_at   timestamptz not null default now(),
  user_agent   text,
  referrer     text
);

create index referral_clicks_affiliate_idx on public.referral_clicks (affiliate_id, clicked_at desc);

-- ---------------------------------------------------------------------------
-- Backfill affiliates.user_id once the ambassador accepts their invite.
-- Mirrors the existing sync_user_to_subscriptions pattern, but fires on INSERT
-- too, since inviteUserByEmail creates the auth row up front.
-- ---------------------------------------------------------------------------
create or replace function public.link_affiliate_to_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  update public.affiliates a
  set user_id = new.id
  where a.user_id is null
    and lower(a.email) = lower(new.email);

  return new;
end;
$$;

create trigger on_auth_user_created_link_affiliate
  after insert on auth.users
  for each row execute function public.link_affiliate_to_user();

create trigger on_auth_user_updated_link_affiliate
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.link_affiliate_to_user();

-- ---------------------------------------------------------------------------
-- Row level security.
-- ---------------------------------------------------------------------------
alter table public.referral_settings enable row level security;
alter table public.admins            enable row level security;
alter table public.reserved_slugs    enable row level security;
alter table public.affiliates        enable row level security;
alter table public.referrals         enable row level security;
alter table public.referral_clicks   enable row level security;

-- SECURITY DEFINER so the referrals policy doesn't have to re-enter the
-- affiliates policy to resolve the caller's own affiliate row.
create or replace function public.my_affiliate_id()
returns uuid
language sql
stable
security definer
set search_path to ''
as $$
  select a.id from public.affiliates a where a.user_id = auth.uid() limit 1;
$$;

create policy "Affiliates can view their own row"
  on public.affiliates for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Affiliates can view their own referrals"
  on public.referrals for select to authenticated
  using (affiliate_id = public.my_affiliate_id() or public.is_admin());

create policy "Affiliates can view their own clicks"
  on public.referral_clicks for select to authenticated
  using (affiliate_id = public.my_affiliate_id() or public.is_admin());

create policy "Signed-in users can read program settings"
  on public.referral_settings for select to authenticated
  using (true);

create policy "Admins can view the admin list"
  on public.admins for select to authenticated
  using (public.is_admin());

-- Reserved slugs are not secret; the vanity resolver needs to read them.
create policy "Anyone can read reserved slugs"
  on public.reserved_slugs for select to anon, authenticated
  using (true);

comment on table public.affiliates      is 'Referral ambassadors. Rows are created manually; user_id is backfilled on invite acceptance.';
comment on table public.referrals       is 'One row per referred person, carrying both $25 payout milestones.';
comment on table public.referral_clicks is 'Vanity-link click log. No IP addresses stored.';
comment on table public.admins          is 'Membership here is the sole grant for viewing other usersّ payout data.';;
