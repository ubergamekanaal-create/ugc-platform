-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Safe recreate policy
DROP POLICY IF EXISTS "Users can view their invites" ON team_invitations;

-- Case-insensitive policy (BEST)
CREATE POLICY "Users can view their invites"
ON team_invitations
FOR SELECT
USING (LOWER(auth.email()) = LOWER(email));