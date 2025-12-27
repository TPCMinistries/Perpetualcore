-- Migration: Relationship Intelligence System
-- Comprehensive contact management with AI-powered insights

-- ============================================
-- CONTACTS TABLE - Main contact records
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  full_name TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  avatar_url TEXT,

  -- Classification
  contact_type TEXT DEFAULT 'professional' CHECK (contact_type IN ('personal', 'professional', 'both')),
  relationship_strength TEXT DEFAULT 'new' CHECK (relationship_strength IN ('new', 'acquaintance', 'connected', 'close', 'inner_circle')),
  tags TEXT[] DEFAULT '{}',

  -- Context
  how_we_met TEXT,
  first_met_date DATE,
  location TEXT,
  timezone TEXT,

  -- Skills & Interests (for AI matching)
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  can_help_with TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',

  -- AI Fields
  ai_summary TEXT,
  ai_suggested_actions TEXT[],
  ai_connection_score INTEGER CHECK (ai_connection_score >= 0 AND ai_connection_score <= 100),
  ai_last_analyzed_at TIMESTAMPTZ,

  -- Status
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  last_interaction_at TIMESTAMPTZ,
  next_followup_date DATE,
  followup_reminder_sent BOOLEAN DEFAULT false,

  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACT INTERACTIONS - Communication log
-- ============================================
CREATE TABLE contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Interaction Details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'email', 'call', 'video_call', 'meeting', 'message',
    'social_media', 'event', 'introduction', 'note', 'other'
  )),
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'mutual')),

  -- Content
  subject TEXT,
  summary TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Context
  location TEXT,
  duration_minutes INTEGER,
  participants TEXT[] DEFAULT '{}',

  -- Links
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  related_task_id UUID,
  attachments JSONB DEFAULT '[]',

  -- AI Analysis
  ai_summary TEXT,
  ai_topics TEXT[] DEFAULT '{}',

  -- Metadata
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACT PROJECTS - Link contacts to projects
-- ============================================
CREATE TABLE contact_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  role TEXT,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, project_id)
);

-- ============================================
-- CONTACT CONNECTIONS - The "web" of relationships
-- ============================================
CREATE TABLE contact_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_a_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_b_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  relationship_type TEXT,
  strength TEXT DEFAULT 'known' CHECK (strength IN ('known', 'connected', 'close')),
  notes TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_a_id, contact_b_id),
  CHECK (contact_a_id < contact_b_id)
);

-- ============================================
-- CONTACT MESSAGES - In-app messaging
-- ============================================
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,

  external_message_id TEXT,
  external_thread_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_last_interaction ON contacts(last_interaction_at);
CREATE INDEX idx_contacts_followup ON contacts(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX idx_contacts_archived ON contacts(is_archived) WHERE is_archived = false;
CREATE INDEX idx_contacts_favorite ON contacts(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_contacts_name ON contacts(full_name);
CREATE INDEX idx_contacts_company ON contacts(company);

CREATE INDEX idx_interactions_contact ON contact_interactions(contact_id);
CREATE INDEX idx_interactions_date ON contact_interactions(interaction_date);
CREATE INDEX idx_interactions_type ON contact_interactions(interaction_type);

CREATE INDEX idx_contact_projects_contact ON contact_projects(contact_id);
CREATE INDEX idx_contact_projects_project ON contact_projects(project_id);

CREATE INDEX idx_contact_connections_a ON contact_connections(contact_a_id);
CREATE INDEX idx_contact_connections_b ON contact_connections(contact_b_id);

CREATE INDEX idx_contact_messages_contact ON contact_messages(contact_id);
CREATE INDEX idx_contact_messages_unread ON contact_messages(is_read) WHERE is_read = false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can only see their own contacts
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Interactions: Users can manage interactions for their contacts
CREATE POLICY "Users can view interactions for their contacts"
  ON contact_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create interactions for their contacts"
  ON contact_interactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interactions for their contacts"
  ON contact_interactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interactions for their contacts"
  ON contact_interactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Contact Projects: Users can manage project links for their contacts
CREATE POLICY "Users can view project links for their contacts"
  ON contact_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_projects.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project links for their contacts"
  ON contact_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_projects.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project links for their contacts"
  ON contact_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_projects.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Contact Connections: Users can manage connections between their contacts
CREATE POLICY "Users can view connections for their contacts"
  ON contact_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE (contacts.id = contact_connections.contact_a_id OR contacts.id = contact_connections.contact_b_id)
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create connections for their contacts"
  ON contact_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_connections.contact_a_id
      AND contacts.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_connections.contact_b_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections for their contacts"
  ON contact_connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_connections.contact_a_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Contact Messages: Users can manage messages with their contacts
CREATE POLICY "Users can view messages for their contacts"
  ON contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_messages.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their contacts"
  ON contact_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_messages.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Auto-update last_interaction_at when interactions are added
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET last_interaction_at = NEW.interaction_date
  WHERE id = NEW.contact_id
  AND (last_interaction_at IS NULL OR last_interaction_at < NEW.interaction_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interaction_updates_contact
  AFTER INSERT ON contact_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_interaction();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get contacts needing follow-up
CREATE OR REPLACE FUNCTION get_contacts_needing_followup(for_user_id UUID)
RETURNS TABLE (
  contact_id UUID,
  full_name TEXT,
  company TEXT,
  last_interaction_at TIMESTAMPTZ,
  relationship_strength TEXT,
  days_since_contact INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.full_name,
    c.company,
    c.last_interaction_at,
    c.relationship_strength,
    EXTRACT(DAY FROM NOW() - c.last_interaction_at)::INTEGER as days_since_contact
  FROM contacts c
  WHERE c.user_id = for_user_id
    AND c.is_archived = false
    AND (
      (c.relationship_strength = 'inner_circle' AND c.last_interaction_at < NOW() - INTERVAL '14 days')
      OR (c.relationship_strength = 'close' AND c.last_interaction_at < NOW() - INTERVAL '30 days')
      OR (c.relationship_strength = 'connected' AND c.last_interaction_at < NOW() - INTERVAL '60 days')
      OR (c.relationship_strength = 'acquaintance' AND c.last_interaction_at < NOW() - INTERVAL '90 days')
      OR (c.relationship_strength = 'new' AND c.last_interaction_at < NOW() - INTERVAL '7 days')
      OR c.last_interaction_at IS NULL
    )
  ORDER BY
    CASE c.relationship_strength
      WHEN 'inner_circle' THEN 1
      WHEN 'close' THEN 2
      WHEN 'connected' THEN 3
      WHEN 'acquaintance' THEN 4
      WHEN 'new' THEN 5
    END,
    c.last_interaction_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Search contacts
CREATE OR REPLACE FUNCTION search_contacts(
  for_user_id UUID,
  search_term TEXT
)
RETURNS SETOF contacts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM contacts c
  WHERE c.user_id = for_user_id
    AND c.is_archived = false
    AND (
      c.full_name ILIKE '%' || search_term || '%'
      OR c.email ILIKE '%' || search_term || '%'
      OR c.company ILIKE '%' || search_term || '%'
      OR c.job_title ILIKE '%' || search_term || '%'
      OR search_term = ANY(c.tags)
      OR search_term = ANY(c.skills)
    )
  ORDER BY
    CASE WHEN c.is_favorite THEN 0 ELSE 1 END,
    c.last_interaction_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_contacts_needing_followup TO authenticated;
GRANT EXECUTE ON FUNCTION search_contacts TO authenticated;

-- Comments
COMMENT ON TABLE contacts IS 'Main contacts/relationships table for relationship intelligence system';
COMMENT ON TABLE contact_interactions IS 'Log of all interactions with contacts (calls, meetings, emails, etc.)';
COMMENT ON TABLE contact_projects IS 'Links between contacts and projects';
COMMENT ON TABLE contact_connections IS 'Relationships between contacts (who knows who)';
COMMENT ON TABLE contact_messages IS 'In-app messaging with contacts';
COMMENT ON COLUMN contacts.relationship_strength IS 'new < acquaintance < connected < close < inner_circle';
COMMENT ON COLUMN contacts.can_help_with IS 'What this contact can offer/help with';
COMMENT ON COLUMN contacts.looking_for IS 'What this contact needs/is looking for';
