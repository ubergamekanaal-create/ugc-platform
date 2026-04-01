-- =========================
-- TEAM MEMBERS TABLE
-- =========================

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),

  brand_id uuid not null references public.users(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,

  role text not null check (role in ('owner', 'admin', 'member')) default 'member',

  created_at timestamptz not null default now(),

  unique (brand_id, user_id)
);

-- =========================
-- TEAM INVITATIONS TABLE
-- =========================

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),

  brand_id uuid not null references public.users(id) on delete cascade,

  email text not null,
  role text not null check (role in ('admin', 'member')) default 'member',

  status text not null check (status in ('pending', 'accepted', 'expired')) default 'pending',

  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- =========================
-- INDEXES (performance)
-- =========================

create index if not exists team_members_brand_id_idx
on public.team_members (brand_id);

create index if not exists team_members_user_id_idx
on public.team_members (user_id);

create index if not exists team_invitations_brand_id_idx
on public.team_invitations (brand_id);

create index if not exists team_invitations_email_idx
on public.team_invitations (email);

-- =========================
-- ENABLE RLS
-- =========================

alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

-- =========================
-- TEAM MEMBERS POLICIES
-- =========================

-- Brand owner can view their team
create policy "Brand can view their team"
on public.team_members
for select
using (auth.uid() = brand_id);

-- Brand owner can add/update/remove team
create policy "Brand can manage team"
on public.team_members
for all
using (auth.uid() = brand_id)
with check (auth.uid() = brand_id);

-- =========================
-- TEAM INVITATIONS POLICIES
-- =========================

-- Brand can manage invitations
create policy "Brand manage invitations"
on public.team_invitations
for all
using (auth.uid() = brand_id)
with check (auth.uid() = brand_id);