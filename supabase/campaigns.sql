create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  product_name text not null default '',
  product_details text not null default '',
  content_type text not null default 'UGC Video',
  budget numeric(10, 2) not null default 0,
  status text not null default 'open' check (status in ('open', 'in_review', 'active', 'completed')),
  platforms text[] not null default '{}',
  deliverables text not null default '',
  creator_slots integer not null default 1 check (creator_slots > 0),
  duration text not null default '14 days',
  deadline date,
  payment_type text not null default 'Fixed',
  usage_rights text not null default '',
  creator_requirements text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns
  add column if not exists product_name text not null default '',
  add column if not exists product_details text not null default '',
  add column if not exists content_type text not null default 'UGC Video',
  add column if not exists deadline date,
  add column if not exists usage_rights text not null default '',
  add column if not exists creator_requirements text not null default '';

create table if not exists public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  pitch text not null,
  rate numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'shortlisted', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

create index if not exists campaigns_brand_id_idx on public.campaigns (brand_id);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists applications_campaign_id_idx on public.campaign_applications (campaign_id);
create index if not exists applications_creator_id_idx on public.campaign_applications (creator_id);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_campaign_application(
  target_campaign_id uuid,
  target_creator_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_applications
    where campaign_id = target_campaign_id
      and creator_id = target_creator_id
  );
$$;

create or replace function public.is_brand_campaign(
  target_campaign_id uuid,
  target_brand_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns
    where id = target_campaign_id
      and brand_id = target_brand_id
  );
$$;

create or replace function public.is_open_campaign(target_campaign_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns
    where id = target_campaign_id
      and status = 'open'
  );
$$;

drop trigger if exists set_campaigns_updated_at on public.campaigns;

create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute procedure public.set_row_updated_at();

alter table public.campaigns enable row level security;
alter table public.campaign_applications enable row level security;

drop policy if exists "Brands can view own campaigns" on public.campaigns;
drop policy if exists "Creators can view open campaigns" on public.campaigns;
drop policy if exists "Creators can view applied campaigns" on public.campaigns;
drop policy if exists "Brands can insert campaigns" on public.campaigns;
drop policy if exists "Brands can update own campaigns" on public.campaigns;
drop policy if exists "Brands can delete own campaigns" on public.campaigns;

create policy "Brands can view own campaigns"
on public.campaigns
for select
to authenticated
using (auth.uid() = brand_id);

create policy "Creators can view open campaigns"
on public.campaigns
for select
to authenticated
using (
  status = 'open'
  and exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'creator'
  )
);

create policy "Creators can view applied campaigns"
on public.campaigns
for select
to authenticated
using (public.has_campaign_application(public.campaigns.id, auth.uid()));

create policy "Brands can insert campaigns"
on public.campaigns
for insert
to authenticated
with check (
  auth.uid() = brand_id
  and exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'brand'
  )
);

create policy "Brands can update own campaigns"
on public.campaigns
for update
to authenticated
using (auth.uid() = brand_id)
with check (auth.uid() = brand_id);

create policy "Brands can delete own campaigns"
on public.campaigns
for delete
to authenticated
using (auth.uid() = brand_id);

drop policy if exists "Creators can view own applications" on public.campaign_applications;
drop policy if exists "Brands can view campaign applications" on public.campaign_applications;
drop policy if exists "Creators can insert applications" on public.campaign_applications;
drop policy if exists "Brands can update application status" on public.campaign_applications;

create policy "Creators can view own applications"
on public.campaign_applications
for select
to authenticated
using (creator_id = auth.uid());

create policy "Brands can view campaign applications"
on public.campaign_applications
for select
to authenticated
using (public.is_brand_campaign(public.campaign_applications.campaign_id, auth.uid()));

create policy "Creators can insert applications"
on public.campaign_applications
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'creator'
  )
  and public.is_open_campaign(public.campaign_applications.campaign_id)
);

create policy "Brands can update application status"
on public.campaign_applications
for update
to authenticated
using (public.is_brand_campaign(public.campaign_applications.campaign_id, auth.uid()))
with check (public.is_brand_campaign(public.campaign_applications.campaign_id, auth.uid()));
