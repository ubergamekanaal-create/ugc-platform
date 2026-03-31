create extension if not exists pgcrypto;

create table if not exists public.creator_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  bio text,
  niches text[] not null default '{}',
  platform_specialties text[] not null default '{}',
  portfolio_url text,
  instagram_url text,
  instagram_handle text,
  instagram_followers integer not null default 0,
  tiktok_url text,
  tiktok_handle text,
  tiktok_followers integer not null default 0,
  youtube_url text,
  youtube_handle text,
  youtube_subscribers integer not null default 0,
  website_url text,
  base_rate numeric(10, 2) not null default 0,
  engagement_rate numeric(5, 2) not null default 0,
  average_views integer not null default 0,
  featured_brands text[] not null default '{}',
  featured_result text,
  audience_summary text,
  past_work text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_profiles
  add column if not exists bio text,
  add column if not exists niches text[] not null default '{}',
  add column if not exists platform_specialties text[] not null default '{}',
  add column if not exists portfolio_url text,
  add column if not exists instagram_url text,
  add column if not exists instagram_handle text,
  add column if not exists instagram_followers integer not null default 0,
  add column if not exists tiktok_url text,
  add column if not exists tiktok_handle text,
  add column if not exists tiktok_followers integer not null default 0,
  add column if not exists youtube_url text,
  add column if not exists youtube_handle text,
  add column if not exists youtube_subscribers integer not null default 0,
  add column if not exists website_url text,
  add column if not exists base_rate numeric(10, 2) not null default 0,
  add column if not exists engagement_rate numeric(5, 2) not null default 0,
  add column if not exists average_views integer not null default 0,
  add column if not exists featured_brands text[] not null default '{}',
  add column if not exists featured_result text,
  add column if not exists audience_summary text,
  add column if not exists past_work text,
  add column if not exists location text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists creator_profiles_base_rate_idx
  on public.creator_profiles (base_rate);
create index if not exists creator_profiles_engagement_rate_idx
  on public.creator_profiles (engagement_rate);
create index if not exists creator_profiles_average_views_idx
  on public.creator_profiles (average_views);

create or replace function public.set_creator_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_creator_profiles_updated_at on public.creator_profiles;

create trigger set_creator_profiles_updated_at
before update on public.creator_profiles
for each row execute procedure public.set_creator_profiles_updated_at();

alter table public.creator_profiles enable row level security;

drop policy if exists "Creators can view own creator profile" on public.creator_profiles;
drop policy if exists "Brands can view creator profiles" on public.creator_profiles;
drop policy if exists "Creators can insert own creator profile" on public.creator_profiles;
drop policy if exists "Creators can update own creator profile" on public.creator_profiles;

create policy "Creators can view own creator profile"
on public.creator_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Brands can view creator profiles"
on public.creator_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'brand'
  )
);

create policy "Creators can insert own creator profile"
on public.creator_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'creator'
  )
);

create policy "Creators can update own creator profile"
on public.creator_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.users
    where public.users.id = auth.uid()
      and public.users.role = 'creator'
  )
);
