-- Email attachments table to store attachment metadata
-- Attachments are fetched on-demand from Gmail, not stored locally (to save storage)
-- Users can optionally "Save to Library" to add to documents

CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Gmail attachment identifiers
  provider_attachment_id TEXT NOT NULL, -- Gmail attachment ID for fetching
  message_id TEXT NOT NULL, -- Gmail message ID

  -- Attachment metadata
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,

  -- Optional: if saved to library
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  saved_to_library_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id, provider_attachment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_user_id ON email_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_document_id ON email_attachments(document_id) WHERE document_id IS NOT NULL;

-- RLS Policies
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email attachments"
ON email_attachments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email attachments"
ON email_attachments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email attachments"
ON email_attachments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own email attachments"
ON email_attachments FOR DELETE
TO authenticated
USING (user_id = auth.uid());
