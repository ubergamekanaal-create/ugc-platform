create extension if not exists pgcrypto;

create table if not exists public.campaign_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.campaign_applications(id) on delete set null,
  content_links text[] not null default '{}',
  notes text,
  feedback text,
  status text not null default 'submitted' check (status in ('submitted', 'revision_requested', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  unique (campaign_id, creator_id),
  check (brand_id <> creator_id)
);

create index if not exists campaign_submissions_campaign_id_idx
  on public.campaign_submissions (campaign_id, submitted_at desc);
create index if not exists campaign_submissions_creator_id_idx
  on public.campaign_submissions (creator_id, submitted_at desc);
create index if not exists campaign_submissions_brand_id_idx
  on public.campaign_submissions (brand_id, submitted_at desc);

create or replace function public.set_campaign_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_accepted_campaign_application(
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
      and status = 'accepted'
  );
$$;

drop trigger if exists set_campaign_submissions_updated_at on public.campaign_submissions;

create trigger set_campaign_submissions_updated_at
before update on public.campaign_submissions
for each row execute procedure public.set_campaign_submissions_updated_at();

alter table public.campaign_submissions enable row level security;

drop policy if exists "Brands can view own submissions" on public.campaign_submissions;
drop policy if exists "Creators can view own submissions" on public.campaign_submissions;
drop policy if exists "Creators can insert accepted submissions" on public.campaign_submissions;
drop policy if exists "Creators can resubmit own submissions" on public.campaign_submissions;
drop policy if exists "Brands can review own submissions" on public.campaign_submissions;

create policy "Brands can view own submissions"
on public.campaign_submissions
for select
to authenticated
using (public.is_brand_campaign(public.campaign_submissions.campaign_id, auth.uid()));

create policy "Creators can view own submissions"
on public.campaign_submissions
for select
to authenticated
using (creator_id = auth.uid());

create policy "Creators can insert accepted submissions"
on public.campaign_submissions
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and public.has_accepted_campaign_application(
    public.campaign_submissions.campaign_id,
    auth.uid()
  )
  and public.is_brand_campaign(
    public.campaign_submissions.campaign_id,
    public.campaign_submissions.brand_id
  )
);

create policy "Creators can resubmit own submissions"
on public.campaign_submissions
for update
to authenticated
using (
  creator_id = auth.uid()
  and status in ('submitted', 'revision_requested')
)
with check (
  creator_id = auth.uid()
  and status = 'submitted'
  and public.has_accepted_campaign_application(
    public.campaign_submissions.campaign_id,
    auth.uid()
  )
  and public.is_brand_campaign(
    public.campaign_submissions.campaign_id,
    public.campaign_submissions.brand_id
  )
);

create policy "Brands can review own submissions"
on public.campaign_submissions
for update
to authenticated
using (
  public.is_brand_campaign(public.campaign_submissions.campaign_id, auth.uid())
  and status in ('submitted', 'revision_requested')
)
with check (
  public.is_brand_campaign(public.campaign_submissions.campaign_id, auth.uid())
  and status in ('revision_requested', 'approved', 'rejected')
);
