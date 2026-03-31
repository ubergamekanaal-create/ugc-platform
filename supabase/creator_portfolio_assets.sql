create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('creator-portfolio-assets', 'creator-portfolio-assets', false)
on conflict (id) do nothing;

create table if not exists public.creator_profile_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  kind text not null default 'image' check (kind in ('image', 'video', 'file')),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.creator_profile_assets
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists file_name text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists kind text not null default 'image',
  add column if not exists size_bytes bigint not null default 0,
  add column if not exists caption text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists creator_profile_assets_storage_path_idx
  on public.creator_profile_assets (storage_path);
create index if not exists creator_profile_assets_user_id_idx
  on public.creator_profile_assets (user_id, sort_order asc, created_at desc);

alter table public.creator_profile_assets enable row level security;

drop policy if exists "Creators can view own profile assets" on public.creator_profile_assets;
drop policy if exists "Brands can view creator profile assets" on public.creator_profile_assets;
drop policy if exists "Creators can insert own profile assets" on public.creator_profile_assets;
drop policy if exists "Creators can delete own profile assets" on public.creator_profile_assets;

create policy "Creators can view own profile assets"
on public.creator_profile_assets
for select
to authenticated
using (user_id = auth.uid());

create policy "Brands can view creator profile assets"
on public.creator_profile_assets
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

create policy "Creators can insert own profile assets"
on public.creator_profile_assets
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

create policy "Creators can delete own profile assets"
on public.creator_profile_assets
for delete
to authenticated
using (user_id = auth.uid());
