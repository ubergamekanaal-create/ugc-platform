-- =========================
-- ENABLE RLS (if not already)
-- =========================

alter table public.users enable row level security;

-- =========================
-- POLICY: restrict users access
-- =========================

create policy "Users can be viewed if part of team"
on public.users
for select
using (
  id = auth.uid()
  OR
  id IN (
    select user_id from public.team_members
    where brand_id = auth.uid()
  )
);