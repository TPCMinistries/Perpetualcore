-- GHL (GoHighLevel) Integration
-- Adds columns to profiles for GHL sub-account tracking

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ghl_location_id TEXT,
  ADD COLUMN IF NOT EXISTS ghl_provisioned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ghl_snapshot_applied BOOLEAN DEFAULT false;

-- Index for quick lookups by GHL location
CREATE INDEX IF NOT EXISTS idx_profiles_ghl_location_id
  ON profiles(ghl_location_id) WHERE ghl_location_id IS NOT NULL;

-- Track GHL provisioning events for audit/debugging
CREATE TABLE IF NOT EXISTS ghl_provisioning_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ghl_location_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('provisioned', 'snapshot_applied', 'deprovisioned', 'error')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_provisioning_log_user_id
  ON ghl_provisioning_log(user_id);

-- RLS
ALTER TABLE ghl_provisioning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GHL logs"
  ON ghl_provisioning_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage GHL logs"
  ON ghl_provisioning_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
