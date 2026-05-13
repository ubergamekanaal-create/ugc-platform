update public.team_members tm
set workspace_id = b.id
from public.brands b
where tm.brand_id = b.user_id;


update public.team_invitations ti
set workspace_id = b.id
from public.brands b
where ti.brand_id = b.user_id;