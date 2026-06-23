create table public.shopify_webhook_subscriptions (
    id uuid primary key default gen_random_uuid(),

    connection_id uuid not null
        references public.brand_store_connections(id)
        on delete cascade,

    shopify_webhook_id text not null,
    topic text not null,
    uri text not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_shopify_webhook_subscriptions_connection_id
on public.shopify_webhook_subscriptions(connection_id);

create unique index idx_shopify_webhook_subscriptions_shopify_id
on public.shopify_webhook_subscriptions(shopify_webhook_id);