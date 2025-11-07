-- =====================================================
-- EMAIL SYSTEM SETUP MIGRATION
-- Creates all tables needed for Gmail/Outlook OAuth integration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Email accounts table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  provider_account_id TEXT NOT NULL,
  email_address TEXT NOT NULL,

  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT, -- For incremental syncing (historyId for Gmail)

  settings JSONB DEFAULT '{}', -- User preferences for this account

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider, provider_account_id)
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email identifiers
  provider_message_id TEXT NOT NULL,
  provider_thread_id TEXT,
  provider TEXT NOT NULL,

  -- Email metadata
  subject TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',

  -- Content
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- Short preview

  -- Gmail labels / categories
  labels TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'primary', -- 'primary', 'social', 'promotions', 'updates', 'forums'

  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB, -- Array of attachment metadata

  -- AI-enhanced fields
  ai_priority_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0 importance score
  ai_category TEXT, -- 'urgent', 'important', 'newsletter', 'spam', 'personal'
  ai_summary TEXT, -- AI-generated summary
  ai_action_items JSONB, -- Extracted action items
  ai_sentiment TEXT, -- 'positive', 'negative', 'neutral'
  ai_entities JSONB, -- Extracted entities (people, companies, dates)

  -- Response tracking
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Threading
  in_reply_to TEXT,
  message_references TEXT[], -- Message-ID references for threading

  -- Raw data
  raw_headers JSONB,
  raw_data JSONB,

  -- Direction and status
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'received' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'received')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_account_id, provider_message_id)
);

-- Email drafts table (AI-generated drafts awaiting approval)
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Draft metadata
  in_reply_to_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  provider_draft_id TEXT, -- If synced to Gmail drafts

  -- Content
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,

  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- What the user asked for
  ai_model TEXT, -- Which model generated it
  generation_context JSONB, -- Context used for generation

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'rejected')),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email rules table (auto-triage rules)
CREATE TABLE IF NOT EXISTS email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Conditions (JSON query structure)
  conditions JSONB NOT NULL,
  -- Example: {"from": "boss@company.com", "subject_contains": "urgent"}

  -- Actions
  actions JSONB NOT NULL,
  -- Example: {"mark_important": true, "add_label": "urgent", "ai_priority": 1.0}

  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Order of execution

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email analytics table (for insights)
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Counts
  emails_received INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_read INTEGER DEFAULT 0,

  -- Response metrics
  avg_response_time_hours FLOAT,
  response_rate FLOAT,

  -- AI metrics
  ai_triaged_count INTEGER DEFAULT 0,
  ai_drafts_generated INTEGER DEFAULT 0,
  ai_drafts_sent INTEGER DEFAULT 0,

  -- Time saved estimate
  time_saved_minutes INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for org-wide templates

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('sales', 'support', 'marketing', 'internal', 'custom', 'follow_up', 'introduction', 'thank_you')),

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,

  -- Variables/placeholders
  variables JSONB DEFAULT '[]'::jsonb, -- ["firstName", "company", "amount"]

  -- Template settings
  is_shared BOOLEAN DEFAULT false, -- Shared with organization
  is_ai_generated BOOLEAN DEFAULT false,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'clicked', 'bounced', 'unsubscribed', 'complained')),

  -- Click tracking
  link_url TEXT, -- For click events
  link_position INTEGER, -- Which link was clicked

  -- Context
  user_agent TEXT,
  ip_address INET,
  location JSONB, -- {city, country, timezone}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Email accounts indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_org ON email_accounts(organization_id);

-- Emails indexes
CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(email_account_id);
CREATE INDEX IF NOT EXISTS idx_emails_user ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_org ON emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(provider_thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(ai_category);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_emails_unread ON emails(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_emails_requires_response ON emails(requires_response) WHERE requires_response;
CREATE INDEX IF NOT EXISTS idx_emails_scheduled ON emails(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_direction ON emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

-- Email drafts indexes
CREATE INDEX IF NOT EXISTS idx_email_drafts_account ON email_drafts(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_user ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);

-- Email rules indexes
CREATE INDEX IF NOT EXISTS idx_email_rules_user ON email_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_account ON email_rules(email_account_id);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON email_templates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_shared ON email_templates(is_shared) WHERE is_shared = true;

-- Email tracking indexes
CREATE INDEX IF NOT EXISTS idx_tracking_email ON email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_tracking_event ON email_tracking(event_type, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Email accounts policies
DROP POLICY IF EXISTS "Users can view their own email accounts" ON email_accounts;
CREATE POLICY "Users can view their own email accounts"
  ON email_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own email accounts" ON email_accounts;
CREATE POLICY "Users can insert their own email accounts"
  ON email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own email accounts" ON email_accounts;
CREATE POLICY "Users can update their own email accounts"
  ON email_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own email accounts" ON email_accounts;
CREATE POLICY "Users can delete their own email accounts"
  ON email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Emails policies
DROP POLICY IF EXISTS "Users can view own emails" ON emails;
CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
CREATE POLICY "Users can insert own emails"
  ON emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own emails" ON emails;
CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own emails" ON emails;
CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  USING (auth.uid() = user_id);

-- Email drafts policies
DROP POLICY IF EXISTS "Users can view their own drafts" ON email_drafts;
CREATE POLICY "Users can view their own drafts"
  ON email_drafts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own drafts" ON email_drafts;
CREATE POLICY "Users can insert their own drafts"
  ON email_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own drafts" ON email_drafts;
CREATE POLICY "Users can update their own drafts"
  ON email_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own drafts" ON email_drafts;
CREATE POLICY "Users can delete their own drafts"
  ON email_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Email rules policies
DROP POLICY IF EXISTS "Users can manage their own email rules" ON email_rules;
CREATE POLICY "Users can manage their own email rules"
  ON email_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Email analytics policies
DROP POLICY IF EXISTS "Users can view their own analytics" ON email_analytics;
CREATE POLICY "Users can view their own analytics"
  ON email_analytics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert analytics" ON email_analytics;
CREATE POLICY "System can insert analytics"
  ON email_analytics FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update analytics" ON email_analytics;
CREATE POLICY "System can update analytics"
  ON email_analytics FOR UPDATE
  USING (true);

-- Email templates policies
DROP POLICY IF EXISTS "Users can view templates in their organization" ON email_templates;
CREATE POLICY "Users can view templates in their organization"
  ON email_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (is_shared = true OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage their own templates" ON email_templates;
CREATE POLICY "Users can manage their own templates"
  ON email_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Email tracking policies
DROP POLICY IF EXISTS "Users can view tracking for their emails" ON email_tracking;
CREATE POLICY "Users can view tracking for their emails"
  ON email_tracking FOR SELECT
  USING (
    email_id IN (
      SELECT id FROM emails WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create tracking events" ON email_tracking;
CREATE POLICY "System can create tracking events"
  ON email_tracking FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emails_updated_at ON emails;
CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_drafts_updated_at ON email_drafts;
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_rules_updated_at ON email_rules;
CREATE TRIGGER update_email_rules_updated_at
  BEFORE UPDATE ON email_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to process scheduled emails
CREATE OR REPLACE FUNCTION process_scheduled_emails()
RETURNS void AS $$
BEGIN
  -- Update emails that are due to be sent
  UPDATE emails
  SET status = 'sending'
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND scheduled_at > NOW() - INTERVAL '1 hour'; -- Safety check
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! Email system is ready for Gmail OAuth
-- =====================================================

COMMENT ON TABLE email_accounts IS 'Stores connected email accounts (Gmail, Outlook, etc) with OAuth tokens';
COMMENT ON TABLE emails IS 'Stores synced emails from connected accounts with AI triage data';
COMMENT ON TABLE email_drafts IS 'AI-generated email drafts awaiting user approval';
COMMENT ON TABLE email_rules IS 'User-defined rules for automatic email triage';
COMMENT ON TABLE email_analytics IS 'Daily aggregated analytics for email usage and AI performance';
COMMENT ON TABLE email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE email_tracking IS 'Tracks email opens, clicks, and engagement metrics';
