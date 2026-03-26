create extension if not exists pgcrypto;

create table if not exists public.brand_store_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('shopify', 'non_shopify', 'headless_shopify')),
  store_name text,
  store_url text not null,
  store_domain text not null,
  access_token text not null,
  storefront_access_token text,
  api_version text not null default '2026-01',
  status text not null default 'pending' check (status in ('connected', 'pending', 'error')),
  product_count integer not null default 0,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id)
);

create table if not exists public.brand_store_products (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.brand_store_connections(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  external_product_id text not null,
  title text not null,
  handle text,
  vendor text,
  product_type text,
  image_url text,
  status text,
  price numeric(10, 2),
  currency text,
  raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (connection_id, external_product_id)
);

create index if not exists brand_store_connections_brand_id_idx
  on public.brand_store_connections (brand_id);
create index if not exists brand_store_products_brand_id_idx
  on public.brand_store_products (brand_id);
create index if not exists brand_store_products_connection_id_idx
  on public.brand_store_products (connection_id);

create or replace function public.set_store_connection_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brand_store_connections_updated_at on public.brand_store_connections;

create trigger set_brand_store_connections_updated_at
before update on public.brand_store_connections
for each row execute procedure public.set_store_connection_updated_at();

alter table public.brand_store_connections enable row level security;
alter table public.brand_store_products enable row level security;
