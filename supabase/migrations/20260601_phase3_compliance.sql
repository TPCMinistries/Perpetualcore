-- Phase 3 Enterprise: Compliance & Security Tables
-- Creates ip_whitelist, session_policies, compliance_attestations

-- IP Whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ip_range CIDR NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ip_whitelist_org ON ip_whitelist(organization_id);
CREATE INDEX idx_ip_whitelist_enabled ON ip_whitelist(organization_id, enabled) WHERE enabled = true;

-- Session Policies table
CREATE TABLE IF NOT EXISTS session_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  max_session_duration_hours INTEGER NOT NULL DEFAULT 24,
  idle_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  enforce_mfa BOOLEAN NOT NULL DEFAULT false,
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
  require_re_auth_for_sensitive BOOLEAN NOT NULL DEFAULT false,
  allowed_auth_methods TEXT[] NOT NULL DEFAULT ARRAY['password', 'sso', 'magic_link'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE INDEX idx_session_policies_org ON session_policies(organization_id);

-- Compliance Attestations table
CREATE TABLE IF NOT EXISTS compliance_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attestation_type TEXT NOT NULL CHECK (attestation_type IN ('hipaa_baa', 'soc2_type2', 'pen_test', 'gdpr_dpa', 'iso27001', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired', 'needs_renewal')),
  evidence_url TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_attestations_org ON compliance_attestations(organization_id);
CREATE INDEX idx_compliance_attestations_type ON compliance_attestations(organization_id, attestation_type);
CREATE INDEX idx_compliance_attestations_status ON compliance_attestations(organization_id, status);

-- Data Retention Policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('audit_logs', 'conversations', 'documents', 'voice_memos', 'analytics')),
  retention_days INTEGER NOT NULL DEFAULT 365,
  auto_delete BOOLEAN NOT NULL DEFAULT false,
  archive_before_delete BOOLEAN NOT NULL DEFAULT true,
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, resource_type)
);

CREATE INDEX idx_data_retention_org ON data_retention_policies(organization_id);

-- RLS Policies
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- IP Whitelist RLS: org members can view, admins/owners can manage
CREATE POLICY "ip_whitelist_select" ON ip_whitelist
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "ip_whitelist_insert" ON ip_whitelist
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "ip_whitelist_update" ON ip_whitelist
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "ip_whitelist_delete" ON ip_whitelist
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Session Policies RLS
CREATE POLICY "session_policies_select" ON session_policies
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "session_policies_manage" ON session_policies
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Compliance Attestations RLS
CREATE POLICY "compliance_attestations_select" ON compliance_attestations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "compliance_attestations_manage" ON compliance_attestations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Data Retention Policies RLS
CREATE POLICY "data_retention_select" ON data_retention_policies
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "data_retention_manage" ON data_retention_policies
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ip_whitelist_updated
  BEFORE UPDATE ON ip_whitelist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_session_policies_updated
  BEFORE UPDATE ON session_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_attestations_updated
  BEFORE UPDATE ON compliance_attestations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_data_retention_updated
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
