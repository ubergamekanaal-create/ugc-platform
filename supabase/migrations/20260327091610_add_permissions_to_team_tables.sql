-- =========================
-- TEAM INVITATIONS
-- =========================
alter table if exists public.team_invitations
add column if not exists permissions jsonb
default '{
  "include_in_chats": true,
  "view_analytics": true,
  "manage_submissions": true,
  "manage_creators": true,
  "view_finance": true,
  "manage_campaigns": true,
  "manage_integrations": true,
  "manage_settings": true
}'::jsonb;


-- =========================
-- TEAM MEMBERS
-- =========================
alter table if exists public.team_members
add column if not exists permissions jsonb
default '{
  "include_in_chats": true,
  "view_analytics": true,
  "manage_submissions": true,
  "manage_creators": true,
  "view_finance": true,
  "manage_campaigns": true,
  "manage_integrations": true,
  "manage_settings": true
}'::jsonb;


-- =========================
-- INDEX (OPTIONAL)
-- =========================
create index if not exists idx_team_members_permissions
on public.team_members using gin (permissions);

create index if not exists idx_team_invitations_permissions
on public.team_invitations using gin (permissions);