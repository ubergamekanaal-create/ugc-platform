-- Add token column
ALTER TABLE team_invitations
ADD COLUMN token TEXT;

-- Make it unique (important)
ALTER TABLE team_invitations
ADD CONSTRAINT unique_invite_token UNIQUE (token);

-- Add expires_at (optional but recommended)
ALTER TABLE team_invitations
ADD COLUMN expires_at TIMESTAMP;

-- Add invited_by (optional)
ALTER TABLE team_invitations
ADD COLUMN invited_by UUID;