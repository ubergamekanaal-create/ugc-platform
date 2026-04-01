--  Remove old constraint
ALTER TABLE team_invitations
DROP CONSTRAINT IF EXISTS team_invitations_status_check;

--  Add new constraint with rejected
ALTER TABLE team_invitations
ADD CONSTRAINT team_invitations_status_check
CHECK (status IN ('pending', 'accepted', 'rejected'));