alter table campaign_submission_assets
add column workspace_id uuid;

update campaign_submission_assets csa
set workspace_id = tm.workspace_id
from team_members tm
where csa.brand_id = tm.user_id;