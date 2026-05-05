create extension if not exists pgcrypto;

create table if not exists campaign_products (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null references campaigns(id) on delete cascade,
  product_id uuid not null references brand_store_products(id) on delete cascade,

  created_at timestamp with time zone default now(),

  unique (campaign_id, product_id)
);

create index if not exists idx_campaign_products_campaign_id
on campaign_products(campaign_id);

create index if not exists idx_campaign_products_product_id
on campaign_products(product_id);