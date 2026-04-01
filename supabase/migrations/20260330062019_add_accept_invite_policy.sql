
-- Safe drop (avoid duplicate error)
DROP POLICY IF EXISTS "Users can accept their invites" ON team_invitations;

-- Create update policy
CREATE POLICY "Users can accept their invites"
ON team_invitations
FOR UPDATE
USING (LOWER(auth.email()) = LOWER(email));