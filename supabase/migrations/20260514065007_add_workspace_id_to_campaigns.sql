alter table campaigns
add column workspace_id uuid;

alter table campaigns
add constraint campaigns_workspace_id_fkey
foreign key (workspace_id)
references brands(id)
on delete cascade;

update campaigns c
set workspace_id = tm.workspace_id
from team_members tm
where c.brand_id = tm.user_id;