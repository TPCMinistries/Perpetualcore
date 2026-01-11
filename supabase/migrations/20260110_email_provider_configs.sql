-- Migration: Add email_provider_configs table for multi-tenant email configuration
-- This enables per-organization email settings for SaaS

-- Create the email_provider_configs table
CREATE TABLE IF NOT EXISTS email_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider Configuration
  provider VARCHAR(50) NOT NULL DEFAULT 'resend', -- resend, sendgrid, ses
  api_key_encrypted TEXT, -- Encrypted API key (null = use system default)

  -- Domain Configuration
  sending_domain VARCHAR(255),
  is_domain_verified BOOLEAN DEFAULT false,
  domain_verification_token VARCHAR(255),
  domain_verified_at TIMESTAMPTZ,

  -- Default From Configuration
  default_from_email VARCHAR(255) NOT NULL,
  default_from_name VARCHAR(255) NOT NULL,
  default_reply_to VARCHAR(255),

  -- Branding
  email_signature_html TEXT,
  email_footer_html TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',

  -- Settings
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,

  -- Rate Limiting
  daily_send_limit INTEGER DEFAULT 1000,
  sends_today INTEGER DEFAULT 0,
  last_send_reset_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_org_domain UNIQUE (organization_id, sending_domain)
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_org
  ON email_provider_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_domain
  ON email_provider_configs(sending_domain);
CREATE INDEX IF NOT EXISTS idx_email_provider_configs_active
  ON email_provider_configs(organization_id, is_active) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE email_provider_configs ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's email configs
CREATE POLICY "Users can view own org email configs" ON email_provider_configs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only admins can insert/update email configs
CREATE POLICY "Admins can manage email configs" ON email_provider_configs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Add columns to email_outbox for tracking provider config
ALTER TABLE email_outbox
  ADD COLUMN IF NOT EXISTS email_config_id UUID REFERENCES email_provider_configs(id),
  ADD COLUMN IF NOT EXISTS from_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS resend_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
  ADD COLUMN IF NOT EXISTS n8n_workflow_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS n8n_execution_id VARCHAR(255);

-- Create index for tracking Resend message IDs
CREATE INDEX IF NOT EXISTS idx_email_outbox_resend_id
  ON email_outbox(resend_id) WHERE resend_id IS NOT NULL;

-- Function to reset daily send counts at midnight
CREATE OR REPLACE FUNCTION reset_daily_email_counts()
RETURNS void AS $$
BEGIN
  UPDATE email_provider_configs
  SET sends_today = 0, last_send_reset_date = CURRENT_DATE
  WHERE last_send_reset_date < CURRENT_DATE OR last_send_reset_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to increment send count
CREATE OR REPLACE FUNCTION increment_email_send_count(config_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_provider_configs
  SET sends_today = sends_today + 1
  WHERE id = config_id;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE email_provider_configs IS 'Per-organization email provider configuration for multi-tenant SaaS email sending';
