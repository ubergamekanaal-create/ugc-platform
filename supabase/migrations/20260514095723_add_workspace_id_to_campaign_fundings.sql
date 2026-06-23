alter table campaign_fundings
add column workspace_id uuid;

update campaign_fundings cf
set workspace_id = tm.workspace_id
from team_members tm
where cf.brand_id = tm.user_id;