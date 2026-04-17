-- STEP 1: add column
alter table public.users 
add column if not exists active boolean not null default false;

-- STEP 2: update existing users
update public.users 
set active = true 
where active is null or active = false;

-- STEP 3: update function
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
    headline,
    active
  )
  values (
    new.id,
    new.email,
    requested_role,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'headline', ''),
    true
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

-- STEP 4: update view
create or replace view public.public_profiles as
select
  id,
  role,
  coalesce(company_name, full_name, split_part(email, '@', 1)) as display_name,
  full_name,
  company_name,
  headline,
  avatar_url,
  active
from public.users;

-- STEP 5: grant access
grant select on public.public_profiles to authenticated;