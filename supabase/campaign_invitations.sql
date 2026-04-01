create extension if not exists pgcrypto;

create table if not exists public.campaign_invitations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  message text,
  offered_rate numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, creator_id),
  check (brand_id <> creator_id)
);

alter table public.campaign_invitations
  add column if not exists offered_rate numeric(10, 2) not null default 0;

create index if not exists campaign_invitations_brand_id_idx
  on public.campaign_invitations (brand_id, created_at desc);
create index if not exists campaign_invitations_creator_id_idx
  on public.campaign_invitations (creator_id, created_at desc);
create index if not exists campaign_invitations_campaign_id_idx
  on public.campaign_invitations (campaign_id);

create or replace function public.set_campaign_invitations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_campaign_invitations_updated_at on public.campaign_invitations;

create trigger set_campaign_invitations_updated_at
before update on public.campaign_invitations
for each row execute procedure public.set_campaign_invitations_updated_at();

alter table public.campaign_invitations enable row level security;

drop policy if exists "Brands can view own invitations" on public.campaign_invitations;
drop policy if exists "Brands can insert own invitations" on public.campaign_invitations;
drop policy if exists "Brands can update own invitations" on public.campaign_invitations;
drop policy if exists "Creators can view own invitations" on public.campaign_invitations;
drop policy if exists "Creators can update own invitations" on public.campaign_invitations;

create policy "Brands can view own invitations"
on public.campaign_invitations
for select
to authenticated
using (brand_id = auth.uid());

create policy "Brands can insert own invitations"
on public.campaign_invitations
for insert
to authenticated
with check (
  brand_id = auth.uid()
  and exists (
    select 1
    from public.campaigns
    where public.campaigns.id = public.campaign_invitations.campaign_id
      and public.campaigns.brand_id = auth.uid()
  )
  and exists (
    select 1
    from public.users
    where public.users.id = public.campaign_invitations.creator_id
      and public.users.role = 'creator'
  )
);

create policy "Brands can update own invitations"
on public.campaign_invitations
for update
to authenticated
using (brand_id = auth.uid())
with check (brand_id = auth.uid());

create policy "Creators can view own invitations"
on public.campaign_invitations
for select
to authenticated
using (creator_id = auth.uid());

create policy "Creators can update own invitations"
on public.campaign_invitations
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());
