create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('brand', 'creator')),
  full_name text,
  company_name text,
  headline text,
  avatar_url text,
  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,
  stripe_details_submitted boolean not null default false,
  stripe_charges_enabled boolean not null default false,
  stripe_payouts_enabled boolean not null default false,
  stripe_transfers_enabled boolean not null default false,
  stripe_onboarding_updated_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'naam'
  ) then
    alter table public.users rename column naam to full_name;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'aangemaakt_op'
  ) then
    alter table public.users rename column aangemaakt_op to created_at;
  end if;
end $$;

alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists company_name text;
alter table public.users add column if not exists headline text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists stripe_account_id text;
alter table public.users add column if not exists stripe_onboarding_complete boolean not null default false;
alter table public.users add column if not exists stripe_details_submitted boolean not null default false;
alter table public.users add column if not exists stripe_charges_enabled boolean not null default false;
alter table public.users add column if not exists stripe_payouts_enabled boolean not null default false;
alter table public.users add column if not exists stripe_transfers_enabled boolean not null default false;
alter table public.users add column if not exists stripe_onboarding_updated_at timestamptz;
alter table public.users add column if not exists created_at timestamptz not null default now();

alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Service role can insert users" on public.users;

create policy "Users can view own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace view public.public_profiles as
select
  id,
  role,
  coalesce(company_name, full_name, split_part(email, '@', 1)) as display_name,
  full_name,
  company_name,
  headline,
  avatar_url
from public.users;

grant select on public.public_profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'brand' then 'brand'
    else 'creator'
  end;

  insert into public.users (
    id,
    email,
    role,
    full_name,
    company_name,
    headline
  )
  values (
    new.id,
    new.email,
    requested_role,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'headline', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        company_name = coalesce(excluded.company_name, public.users.company_name),
        headline = coalesce(excluded.headline, public.users.headline);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
