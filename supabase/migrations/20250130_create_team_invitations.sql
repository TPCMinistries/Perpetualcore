-- Create team_invitations table for managing team member invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Prevent duplicate pending invitations for the same email in an organization
  UNIQUE(organization_id, email, status)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_organization ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view invitations for their organization
CREATE POLICY "Users can view invitations for their organization"
  ON team_invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow admins to create invitations for their organization
CREATE POLICY "Admins can create invitations for their organization"
  ON team_invitations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Allow admins to update invitations for their organization
CREATE POLICY "Admins can update invitations for their organization"
  ON team_invitations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Allow admins to delete invitations for their organization
CREATE POLICY "Admins can delete invitations for their organization"
  ON team_invitations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitations_updated_at();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_team_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE team_invitations IS 'Stores team member invitation information with token-based authentication';
COMMENT ON COLUMN team_invitations.token IS 'Unique token for invitation verification (should be generated as a secure random string)';
COMMENT ON COLUMN team_invitations.expires_at IS 'Timestamp when the invitation expires (default 7 days from creation)';
