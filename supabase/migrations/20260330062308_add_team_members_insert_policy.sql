-- Allow users to join team when accepting invite

DROP POLICY IF EXISTS "Users can join team" ON team_members;

CREATE POLICY "Users can join team"
ON team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);