create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('submission-assets', 'submission-assets', false)
on conflict (id) do nothing;

alter table public.campaign_submissions
  add column if not exists revision_number integer not null default 1;

create table if not exists public.campaign_submission_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.campaign_submissions(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  revision_number integer not null default 1 check (revision_number > 0),
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  check (brand_id <> creator_id)
);

alter table public.campaign_submission_assets
  add column if not exists submission_id uuid references public.campaign_submissions(id) on delete cascade,
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade,
  add column if not exists brand_id uuid references public.users(id) on delete cascade,
  add column if not exists creator_id uuid references public.users(id) on delete cascade,
  add column if not exists revision_number integer not null default 1,
  add column if not exists file_name text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint not null default 0,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists campaign_submission_assets_storage_path_idx
  on public.campaign_submission_assets (storage_path);
create index if not exists campaign_submission_assets_submission_id_idx
  on public.campaign_submission_assets (submission_id, revision_number desc, created_at desc);
create index if not exists campaign_submission_assets_creator_id_idx
  on public.campaign_submission_assets (creator_id, created_at desc);
create index if not exists campaign_submission_assets_brand_id_idx
  on public.campaign_submission_assets (brand_id, created_at desc);

alter table public.campaign_submission_assets enable row level security;

drop policy if exists "Brands can view own submission assets" on public.campaign_submission_assets;
drop policy if exists "Creators can view own submission assets" on public.campaign_submission_assets;
drop policy if exists "Creators can insert own submission assets" on public.campaign_submission_assets;

create policy "Brands can view own submission assets"
on public.campaign_submission_assets
for select
to authenticated
using (public.is_brand_campaign(public.campaign_submission_assets.campaign_id, auth.uid()));

create policy "Creators can view own submission assets"
on public.campaign_submission_assets
for select
to authenticated
using (creator_id = auth.uid());

create policy "Creators can insert own submission assets"
on public.campaign_submission_assets
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and exists (
    select 1
    from public.campaign_submissions
    where public.campaign_submissions.id = public.campaign_submission_assets.submission_id
      and public.campaign_submissions.creator_id = auth.uid()
      and public.campaign_submissions.campaign_id = public.campaign_submission_assets.campaign_id
      and public.campaign_submissions.brand_id = public.campaign_submission_assets.brand_id
  )
);
