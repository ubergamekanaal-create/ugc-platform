create extension if not exists pgcrypto;

create table if not exists public.brand_meta_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  meta_user_id text not null,
  meta_user_name text,
  business_id text,
  business_name text,
  ad_account_id text,
  ad_account_name text,
  access_token text not null,
  token_expires_at timestamptz,
  permissions text[] not null default '{}',
  status text not null default 'pending' check (status in ('connected', 'pending', 'error')),
  last_error text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id)
);

alter table public.brand_meta_connections
  add column if not exists meta_user_id text,
  add column if not exists meta_user_name text,
  add column if not exists business_id text,
  add column if not exists business_name text,
  add column if not exists ad_account_id text,
  add column if not exists ad_account_name text,
  add column if not exists access_token text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists permissions text[] not null default '{}',
  add column if not exists status text not null default 'pending',
  add column if not exists last_error text,
  add column if not exists connected_at timestamptz not null default now(),
  add column if not exists last_synced_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.brand_meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.brand_meta_connections(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  meta_account_id text not null,
  account_name text not null,
  account_status text,
  currency text,
  business_id text,
  business_name text,
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, meta_account_id)
);

alter table public.brand_meta_ad_accounts
  add column if not exists connection_id uuid references public.brand_meta_connections(id) on delete cascade,
  add column if not exists brand_id uuid references public.users(id) on delete cascade,
  add column if not exists meta_account_id text,
  add column if not exists account_name text,
  add column if not exists account_status text,
  add column if not exists currency text,
  add column if not exists business_id text,
  add column if not exists business_name text,
  add column if not exists is_selected boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.brand_meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.brand_meta_connections(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  ad_account_id text not null,
  meta_campaign_id text not null unique,
  source_submission_id uuid references public.campaign_submissions(id) on delete set null,
  name text not null,
  objective text,
  status text,
  effective_status text,
  daily_budget numeric(12, 2),
  lifetime_budget numeric(12, 2),
  spend numeric(12, 2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  ctr numeric(8, 4) not null default 0,
  cpc numeric(12, 4),
  cpm numeric(12, 4),
  raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_meta_campaigns
  add column if not exists connection_id uuid references public.brand_meta_connections(id) on delete cascade,
  add column if not exists brand_id uuid references public.users(id) on delete cascade,
  add column if not exists ad_account_id text,
  add column if not exists meta_campaign_id text,
  add column if not exists source_submission_id uuid references public.campaign_submissions(id) on delete set null,
  add column if not exists name text,
  add column if not exists objective text,
  add column if not exists status text,
  add column if not exists effective_status text,
  add column if not exists daily_budget numeric(12, 2),
  add column if not exists lifetime_budget numeric(12, 2),
  add column if not exists spend numeric(12, 2) not null default 0,
  add column if not exists impressions bigint not null default 0,
  add column if not exists clicks bigint not null default 0,
  add column if not exists ctr numeric(8, 4) not null default 0,
  add column if not exists cpc numeric(12, 4),
  add column if not exists cpm numeric(12, 4),
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists synced_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists brand_meta_connections_brand_id_idx
  on public.brand_meta_connections (brand_id);
create index if not exists brand_meta_ad_accounts_brand_id_idx
  on public.brand_meta_ad_accounts (brand_id);
create index if not exists brand_meta_ad_accounts_connection_id_idx
  on public.brand_meta_ad_accounts (connection_id);
create index if not exists brand_meta_campaigns_brand_id_idx
  on public.brand_meta_campaigns (brand_id, synced_at desc);
create index if not exists brand_meta_campaigns_connection_id_idx
  on public.brand_meta_campaigns (connection_id);
create index if not exists brand_meta_campaigns_ad_account_id_idx
  on public.brand_meta_campaigns (ad_account_id, synced_at desc);

create or replace function public.set_brand_meta_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brand_meta_connections_updated_at on public.brand_meta_connections;
create trigger set_brand_meta_connections_updated_at
before update on public.brand_meta_connections
for each row execute procedure public.set_brand_meta_updated_at();

drop trigger if exists set_brand_meta_ad_accounts_updated_at on public.brand_meta_ad_accounts;
create trigger set_brand_meta_ad_accounts_updated_at
before update on public.brand_meta_ad_accounts
for each row execute procedure public.set_brand_meta_updated_at();

drop trigger if exists set_brand_meta_campaigns_updated_at on public.brand_meta_campaigns;
create trigger set_brand_meta_campaigns_updated_at
before update on public.brand_meta_campaigns
for each row execute procedure public.set_brand_meta_updated_at();

alter table public.brand_meta_connections enable row level security;
alter table public.brand_meta_ad_accounts enable row level security;
alter table public.brand_meta_campaigns enable row level security;

drop policy if exists "Brands can view own meta connections" on public.brand_meta_connections;
drop policy if exists "Brands can insert own meta connections" on public.brand_meta_connections;
drop policy if exists "Brands can update own meta connections" on public.brand_meta_connections;
drop policy if exists "Brands can delete own meta connections" on public.brand_meta_connections;

create policy "Brands can view own meta connections"
on public.brand_meta_connections
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own meta connections"
on public.brand_meta_connections
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
);

create policy "Brands can update own meta connections"
on public.brand_meta_connections
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

create policy "Brands can delete own meta connections"
on public.brand_meta_connections
for delete
to authenticated
using (brand_id = auth.uid());

drop policy if exists "Brands can view own meta ad accounts" on public.brand_meta_ad_accounts;
drop policy if exists "Brands can insert own meta ad accounts" on public.brand_meta_ad_accounts;
drop policy if exists "Brands can update own meta ad accounts" on public.brand_meta_ad_accounts;
drop policy if exists "Brands can delete own meta ad accounts" on public.brand_meta_ad_accounts;

create policy "Brands can view own meta ad accounts"
on public.brand_meta_ad_accounts
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own meta ad accounts"
on public.brand_meta_ad_accounts
for insert
to authenticated
with check (brand_id = auth.uid());

create policy "Brands can update own meta ad accounts"
on public.brand_meta_ad_accounts
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

create policy "Brands can delete own meta ad accounts"
on public.brand_meta_ad_accounts
for delete
to authenticated
using (brand_id = auth.uid());

drop policy if exists "Brands can view own meta campaigns" on public.brand_meta_campaigns;
drop policy if exists "Brands can insert own meta campaigns" on public.brand_meta_campaigns;
drop policy if exists "Brands can update own meta campaigns" on public.brand_meta_campaigns;
drop policy if exists "Brands can delete own meta campaigns" on public.brand_meta_campaigns;

create policy "Brands can view own meta campaigns"
on public.brand_meta_campaigns
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own meta campaigns"
on public.brand_meta_campaigns
for insert
to authenticated
with check (brand_id = auth.uid());

create policy "Brands can update own meta campaigns"
on public.brand_meta_campaigns
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

create policy "Brands can delete own meta campaigns"
on public.brand_meta_campaigns
for delete
to authenticated
using (brand_id = auth.uid());
