-- Migration: Contact Linking Tables
-- Adds junction tables for notes, ideas, and opportunities

-- ============================================
-- CONTACT NOTES - Personal notes about contacts
-- ============================================
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACT IDEAS - Link contacts to ideas
-- ============================================
CREATE TABLE IF NOT EXISTS contact_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,

  relevance_note TEXT,
  suggested_by VARCHAR(20) DEFAULT 'user', -- 'user' or 'ai'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, idea_id)
);

-- ============================================
-- CONTACT OPPORTUNITIES - Link contacts to work_items (deals)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,

  role VARCHAR(50), -- decision_maker, influencer, champion, blocker, contact

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, work_item_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user ON contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created ON contact_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_ideas_contact ON contact_ideas(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_ideas_idea ON contact_ideas(idea_id);

CREATE INDEX IF NOT EXISTS idx_contact_opportunities_contact ON contact_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_opportunities_work_item ON contact_opportunities(work_item_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_opportunities ENABLE ROW LEVEL SECURITY;

-- Contact Notes: Users can manage notes for their contacts
CREATE POLICY "Users can view notes for their contacts"
  ON contact_notes FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can create notes for their contacts"
  ON contact_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_notes.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes"
  ON contact_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON contact_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Contact Ideas: Users can manage idea links for their contacts
CREATE POLICY "Users can view idea links for their contacts"
  ON contact_ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_ideas.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create idea links for their contacts"
  ON contact_ideas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_ideas.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete idea links for their contacts"
  ON contact_ideas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_ideas.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Contact Opportunities: Users can manage opportunity links for their contacts
CREATE POLICY "Users can view opportunity links for their contacts"
  ON contact_opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create opportunity links for their contacts"
  ON contact_opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete opportunity links for their contacts"
  ON contact_opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGER for updated_at on notes
-- ============================================
CREATE TRIGGER contact_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Comments
COMMENT ON TABLE contact_notes IS 'Personal notes about contacts';
COMMENT ON TABLE contact_ideas IS 'Links between contacts and ideas for collaboration opportunities';
COMMENT ON TABLE contact_opportunities IS 'Links between contacts and deals/opportunities';
