create extension if not exists pgcrypto;

create table if not exists public.campaign_fundings (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  brand_id uuid not null references public.users(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_transfer_group text,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.campaign_payouts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  submission_id uuid not null unique references public.campaign_submissions(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.campaign_applications(id) on delete set null,
  source_funding_id uuid references public.campaign_fundings(id) on delete set null,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  platform_fee_percent numeric(5, 2) not null default 0 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
  platform_fee_amount numeric(10, 2) not null default 0 check (platform_fee_amount >= 0),
  creator_amount numeric(10, 2) not null default 0 check (creator_amount >= 0),
  currency text not null default 'usd',
  status text not null default 'payout_ready' check (status in ('payout_ready', 'paid', 'failed', 'reversed')),
  stripe_transfer_id text unique,
  stripe_account_id text,
  stripe_source_charge_id text,
  stripe_transfer_group text,
  reversed_amount numeric(10, 2) not null default 0 check (reversed_amount >= 0),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  reversed_at timestamptz,
  check (brand_id <> creator_id)
);

alter table public.campaign_fundings
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists brand_id uuid references public.users(id) on delete cascade,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_transfer_group text,
  add column if not exists amount numeric(10, 2) not null default 0,
  add column if not exists currency text not null default 'usd',
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists paid_at timestamptz;

alter table public.campaign_payouts
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade,
  add column if not exists submission_id uuid references public.campaign_submissions(id) on delete cascade,
  add column if not exists brand_id uuid references public.users(id) on delete cascade,
  add column if not exists creator_id uuid references public.users(id) on delete cascade,
  add column if not exists application_id uuid references public.campaign_applications(id) on delete set null,
  add column if not exists source_funding_id uuid references public.campaign_fundings(id) on delete set null,
  add column if not exists amount numeric(10, 2) not null default 0,
  add column if not exists platform_fee_percent numeric(5, 2) not null default 0,
  add column if not exists platform_fee_amount numeric(10, 2) not null default 0,
  add column if not exists creator_amount numeric(10, 2) not null default 0,
  add column if not exists currency text not null default 'usd',
  add column if not exists status text not null default 'payout_ready',
  add column if not exists stripe_transfer_id text,
  add column if not exists stripe_account_id text,
  add column if not exists stripe_source_charge_id text,
  add column if not exists stripe_transfer_group text,
  add column if not exists reversed_amount numeric(10, 2) not null default 0,
  add column if not exists failure_reason text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists paid_at timestamptz,
  add column if not exists reversed_at timestamptz;

alter table public.campaign_payouts
  drop constraint if exists campaign_payouts_status_check;

alter table public.campaign_payouts
  add constraint campaign_payouts_status_check
  check (status in ('payout_ready', 'paid', 'failed', 'reversed'));

create unique index if not exists campaign_fundings_checkout_session_idx
  on public.campaign_fundings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists campaign_fundings_charge_id_idx
  on public.campaign_fundings (stripe_charge_id)
  where stripe_charge_id is not null;
create index if not exists campaign_fundings_brand_id_idx
  on public.campaign_fundings (brand_id, created_at desc);
create index if not exists campaign_fundings_campaign_id_idx
  on public.campaign_fundings (campaign_id, created_at desc);

create unique index if not exists campaign_payouts_submission_id_idx
  on public.campaign_payouts (submission_id);
create unique index if not exists campaign_payouts_transfer_id_idx
  on public.campaign_payouts (stripe_transfer_id)
  where stripe_transfer_id is not null;
create index if not exists campaign_payouts_brand_id_idx
  on public.campaign_payouts (brand_id, created_at desc);
create index if not exists campaign_payouts_creator_id_idx
  on public.campaign_payouts (creator_id, created_at desc);
create index if not exists campaign_payouts_campaign_id_idx
  on public.campaign_payouts (campaign_id, created_at desc);
create index if not exists campaign_payouts_source_funding_id_idx
  on public.campaign_payouts (source_funding_id, created_at desc);

create or replace function public.set_campaign_payouts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_campaign_payouts_updated_at on public.campaign_payouts;

create trigger set_campaign_payouts_updated_at
before update on public.campaign_payouts
for each row execute procedure public.set_campaign_payouts_updated_at();

alter table public.campaign_fundings enable row level security;
alter table public.campaign_payouts enable row level security;

drop policy if exists "Brands can view own fundings" on public.campaign_fundings;
drop policy if exists "Brands can insert own fundings" on public.campaign_fundings;
drop policy if exists "Brands can update own fundings" on public.campaign_fundings;

create policy "Brands can view own fundings"
on public.campaign_fundings
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own fundings"
on public.campaign_fundings
for insert
to authenticated
with check (
  brand_id = auth.uid()
  and exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'brand'
  )
  and (
    campaign_id is null
    or public.is_brand_campaign(campaign_id, auth.uid())
  )
);

create policy "Brands can update own fundings"
on public.campaign_fundings
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

drop policy if exists "Brands can view own payouts" on public.campaign_payouts;
drop policy if exists "Creators can view own payouts" on public.campaign_payouts;
drop policy if exists "Brands can insert own payouts" on public.campaign_payouts;
drop policy if exists "Brands can update own payouts" on public.campaign_payouts;

create policy "Brands can view own payouts"
on public.campaign_payouts
for select
to authenticated
using (brand_id = auth.uid());

create policy "Creators can view own payouts"
on public.campaign_payouts
for select
to authenticated
using (creator_id = auth.uid());

create policy "Brands can insert own payouts"
on public.campaign_payouts
for insert
to authenticated
with check (
  brand_id = auth.uid()
  and public.is_brand_campaign(campaign_id, auth.uid())
);

create policy "Brands can update own payouts"
on public.campaign_payouts
for update
to authenticated
using (
  brand_id = auth.uid()
  and public.is_brand_campaign(campaign_id, auth.uid())
)
with check (
  brand_id = auth.uid()
  and public.is_brand_campaign(campaign_id, auth.uid())
);
