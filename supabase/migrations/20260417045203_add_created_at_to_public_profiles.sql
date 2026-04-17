create or replace view public.public_profiles as
select
  id,
  role,
  coalesce(company_name, full_name, split_part(email, '@', 1)) as display_name,
  full_name,
  company_name,
  headline,
  avatar_url,
  active,
  created_at
from public.users;

grant select on public.public_profiles to authenticated;