alter table campaign_submissions
add column workspace_id uuid;

update campaign_submissions cs
set workspace_id = tm.workspace_id
from team_members tm
where cs.brand_id = tm.user_id;