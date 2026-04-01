-- Allow users to reject their own invites
DROP POLICY IF EXISTS "Users can reject invites" ON team_invitations;

CREATE POLICY "Users can reject invites"
ON team_invitations
FOR UPDATE
USING (LOWER(auth.email()) = LOWER(email));