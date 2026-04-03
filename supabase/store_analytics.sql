create extension if not exists pgcrypto;

create table if not exists public.brand_store_analytics_settings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  connection_id uuid,
  public_tracking_token text not null default encode(gen_random_bytes(18), 'hex'),
  utm_source_default text not null default 'circl',
  utm_medium_default text not null default 'paid_social',
  utm_campaign_prefix text not null default 'creator',
  utm_term_default text,
  enable_page_view boolean not null default true,
  enable_product_view boolean not null default true,
  enable_add_to_cart boolean not null default true,
  enable_checkout_started boolean not null default true,
  enable_checkout_completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id)
);

alter table public.brand_store_analytics_settings
  add column if not exists connection_id uuid,
  add column if not exists public_tracking_token text default encode(gen_random_bytes(18), 'hex'),
  add column if not exists utm_source_default text not null default 'circl',
  add column if not exists utm_medium_default text not null default 'paid_social',
  add column if not exists utm_campaign_prefix text not null default 'creator',
  add column if not exists utm_term_default text,
  add column if not exists enable_page_view boolean not null default true,
  add column if not exists enable_product_view boolean not null default true,
  add column if not exists enable_add_to_cart boolean not null default true,
  add column if not exists enable_checkout_started boolean not null default true,
  add column if not exists enable_checkout_completed boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.brand_store_analytics_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  connection_id uuid,
  event_name text not null,
  event_id text,
  client_id text,
  session_id text,
  shop_domain text,
  shop_order_id text,
  campaign_id uuid,
  submission_id uuid,
  meta_campaign_id text,
  page_url text,
  landing_url text,
  referrer_url text,
  referral_code text,
  currency text,
  value numeric(12, 2),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbc text,
  fbp text,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.brand_store_analytics_events
  add column if not exists connection_id uuid,
  add column if not exists event_name text,
  add column if not exists event_id text,
  add column if not exists client_id text,
  add column if not exists session_id text,
  add column if not exists shop_domain text,
  add column if not exists shop_order_id text,
  add column if not exists campaign_id uuid,
  add column if not exists submission_id uuid,
  add column if not exists meta_campaign_id text,
  add column if not exists page_url text,
  add column if not exists landing_url text,
  add column if not exists referrer_url text,
  add column if not exists referral_code text,
  add column if not exists currency text,
  add column if not exists value numeric(12, 2),
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists fbclid text,
  add column if not exists fbc text,
  add column if not exists fbp text,
  add column if not exists event_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.brand_store_attributed_orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  connection_id uuid,
  shop_domain text not null,
  shop_order_id text not null,
  shopify_order_gid text,
  order_name text,
  customer_email text,
  financial_status text,
  fulfillment_status text,
  source_name text,
  currency text,
  subtotal numeric(12, 2),
  discount_total numeric(12, 2),
  shipping_total numeric(12, 2),
  tax_total numeric(12, 2),
  total numeric(12, 2),
  landing_url text,
  referrer_url text,
  referral_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbc text,
  fbp text,
  campaign_id uuid,
  submission_id uuid,
  meta_campaign_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  ordered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_domain, shop_order_id)
);

alter table public.brand_store_attributed_orders
  add column if not exists connection_id uuid,
  add column if not exists shop_domain text,
  add column if not exists shop_order_id text,
  add column if not exists shopify_order_gid text,
  add column if not exists order_name text,
  add column if not exists customer_email text,
  add column if not exists financial_status text,
  add column if not exists fulfillment_status text,
  add column if not exists source_name text,
  add column if not exists currency text,
  add column if not exists subtotal numeric(12, 2),
  add column if not exists discount_total numeric(12, 2),
  add column if not exists shipping_total numeric(12, 2),
  add column if not exists tax_total numeric(12, 2),
  add column if not exists total numeric(12, 2),
  add column if not exists landing_url text,
  add column if not exists referrer_url text,
  add column if not exists referral_code text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists fbclid text,
  add column if not exists fbc text,
  add column if not exists fbp text,
  add column if not exists campaign_id uuid,
  add column if not exists submission_id uuid,
  add column if not exists meta_campaign_id text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists ordered_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists brand_store_analytics_settings_public_tracking_token_idx
  on public.brand_store_analytics_settings (public_tracking_token);

create index if not exists brand_store_analytics_settings_brand_id_idx
  on public.brand_store_analytics_settings (brand_id);

create index if not exists brand_store_analytics_events_brand_id_idx
  on public.brand_store_analytics_events (brand_id, created_at desc);

create index if not exists brand_store_analytics_events_event_name_idx
  on public.brand_store_analytics_events (event_name, created_at desc);

create index if not exists brand_store_analytics_events_utm_campaign_idx
  on public.brand_store_analytics_events (utm_campaign, created_at desc);

create index if not exists brand_store_analytics_events_submission_id_idx
  on public.brand_store_analytics_events (submission_id, created_at desc);

create index if not exists brand_store_analytics_events_meta_campaign_id_idx
  on public.brand_store_analytics_events (meta_campaign_id, created_at desc);

create index if not exists brand_store_analytics_events_session_id_idx
  on public.brand_store_analytics_events (session_id, created_at desc);

create index if not exists brand_store_attributed_orders_brand_id_idx
  on public.brand_store_attributed_orders (brand_id, ordered_at desc nulls last, created_at desc);

create unique index if not exists brand_store_attributed_orders_shop_domain_order_id_idx
  on public.brand_store_attributed_orders (shop_domain, shop_order_id);

create index if not exists brand_store_attributed_orders_utm_campaign_idx
  on public.brand_store_attributed_orders (utm_campaign, ordered_at desc nulls last, created_at desc);

create index if not exists brand_store_attributed_orders_submission_id_idx
  on public.brand_store_attributed_orders (submission_id, ordered_at desc nulls last, created_at desc);

create index if not exists brand_store_attributed_orders_meta_campaign_id_idx
  on public.brand_store_attributed_orders (meta_campaign_id, ordered_at desc nulls last, created_at desc);

create or replace function public.set_brand_store_analytics_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brand_store_analytics_settings_updated_at on public.brand_store_analytics_settings;
create trigger set_brand_store_analytics_settings_updated_at
before update on public.brand_store_analytics_settings
for each row execute procedure public.set_brand_store_analytics_updated_at();

drop trigger if exists set_brand_store_attributed_orders_updated_at on public.brand_store_attributed_orders;
create trigger set_brand_store_attributed_orders_updated_at
before update on public.brand_store_attributed_orders
for each row execute procedure public.set_brand_store_analytics_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'brand_store_connections'
  ) then
    begin
      alter table public.brand_store_analytics_settings
        add constraint brand_store_analytics_settings_connection_id_fkey
        foreign key (connection_id) references public.brand_store_connections(id) on delete set null;
    exception
      when duplicate_object then null;
    end;

    begin
      alter table public.brand_store_analytics_events
        add constraint brand_store_analytics_events_connection_id_fkey
        foreign key (connection_id) references public.brand_store_connections(id) on delete set null;
    exception
      when duplicate_object then null;
    end;

    begin
      alter table public.brand_store_attributed_orders
        add constraint brand_store_attributed_orders_connection_id_fkey
        foreign key (connection_id) references public.brand_store_connections(id) on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'campaigns'
  ) then
    begin
      alter table public.brand_store_analytics_events
        add constraint brand_store_analytics_events_campaign_id_fkey
        foreign key (campaign_id) references public.campaigns(id) on delete set null;
    exception
      when duplicate_object then null;
    end;

    begin
      alter table public.brand_store_attributed_orders
        add constraint brand_store_attributed_orders_campaign_id_fkey
        foreign key (campaign_id) references public.campaigns(id) on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'campaign_submissions'
  ) then
    begin
      alter table public.brand_store_analytics_events
        add constraint brand_store_analytics_events_submission_id_fkey
        foreign key (submission_id) references public.campaign_submissions(id) on delete set null;
    exception
      when duplicate_object then null;
    end;

    begin
      alter table public.brand_store_attributed_orders
        add constraint brand_store_attributed_orders_submission_id_fkey
        foreign key (submission_id) references public.campaign_submissions(id) on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;
end
$$;

alter table public.brand_store_analytics_settings enable row level security;
alter table public.brand_store_analytics_events enable row level security;
alter table public.brand_store_attributed_orders enable row level security;

drop policy if exists "Brands can view own store analytics settings" on public.brand_store_analytics_settings;
drop policy if exists "Brands can insert own store analytics settings" on public.brand_store_analytics_settings;
drop policy if exists "Brands can update own store analytics settings" on public.brand_store_analytics_settings;
drop policy if exists "Brands can view own store analytics events" on public.brand_store_analytics_events;
drop policy if exists "Brands can view own attributed store orders" on public.brand_store_attributed_orders;

create policy "Brands can view own store analytics settings"
on public.brand_store_analytics_settings
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own store analytics settings"
on public.brand_store_analytics_settings
for insert
to authenticated
with check (brand_id = auth.uid());

create policy "Brands can update own store analytics settings"
on public.brand_store_analytics_settings
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

create policy "Brands can view own store analytics events"
on public.brand_store_analytics_events
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can view own attributed store orders"
on public.brand_store_attributed_orders
for select
to authenticated
using (brand_id = auth.uid());
