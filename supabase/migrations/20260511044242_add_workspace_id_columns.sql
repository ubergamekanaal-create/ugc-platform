
alter table public.team_members
add column workspace_id uuid;


alter table public.team_invitations
add column workspace_id uuid;