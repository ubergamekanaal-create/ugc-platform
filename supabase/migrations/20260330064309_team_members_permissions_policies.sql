DROP POLICY IF EXISTS "Admin can update permissions" ON team_members;

CREATE POLICY "Admin can update permissions"
ON team_members
FOR UPDATE
USING (auth.uid() = brand_id);


DROP POLICY IF EXISTS "Owner can delete members" ON team_members;

CREATE POLICY "Owner can delete members"
ON team_members
FOR DELETE
USING (auth.uid() = brand_id);