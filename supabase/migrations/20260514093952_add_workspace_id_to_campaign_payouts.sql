alter table campaign_payouts
add column workspace_id uuid;

update campaign_payouts cp
set workspace_id = tm.workspace_id
from team_members tm
where cp.brand_id = tm.user_id;