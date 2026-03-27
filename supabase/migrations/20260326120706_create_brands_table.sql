-- enable extension (if not already)
create extension if not exists pgcrypto;

--  BRANDS TABLE
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  full_name text,
  email text,
  brand_description text,
  website_url text,
  store_currency text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id)
);

--  ENABLE RLS
alter table public.brands enable row level security;

--  SELECT POLICY
create policy "Users can view their own brand"
on public.brands
for select
using (auth.uid() = user_id);

--  INSERT POLICY
create policy "Users can insert their own brand"
on public.brands
for insert
with check (auth.uid() = user_id);

--  UPDATE POLICY
create policy "Users can update their own brand"
on public.brands
for update
using (auth.uid() = user_id);

--  AUTO UPDATE TIMESTAMP
create or replace function public.set_brands_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brands_updated_at on public.brands;

create trigger set_brands_updated_at
before update on public.brands
for each row execute procedure public.set_brands_updated_at();