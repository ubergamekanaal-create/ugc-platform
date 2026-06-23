alter table campaign_invitations
add column workspace_id uuid;

update campaign_invitations ci
set workspace_id = tm.workspace_id
from team_members tm
where ci.brand_id = tm.user_id;