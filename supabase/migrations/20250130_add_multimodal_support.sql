-- Multi-modal Support: Images, Audio, Video, Web clips

-- Extend documents table with media fields
ALTER TABLE documents ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('document', 'image', 'audio', 'video', 'web_clip'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS media_metadata JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_description TEXT;

-- Index for media type filtering
CREATE INDEX IF NOT EXISTS idx_documents_media_type ON documents(media_type);

-- Web clips storage
CREATE TABLE IF NOT EXISTS web_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- URL info
  source_url TEXT NOT NULL,
  final_url TEXT, -- After redirects
  domain TEXT,

  -- Metadata
  page_title TEXT,
  page_description TEXT,
  og_image TEXT,
  favicon_url TEXT,

  -- Content
  full_text TEXT,
  html_content TEXT,
  reading_time_minutes INT,
  word_count INT,

  -- Extraction status
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_web_clips_document ON web_clips(document_id);
CREATE INDEX IF NOT EXISTS idx_web_clips_org ON web_clips(organization_id);
CREATE INDEX IF NOT EXISTS idx_web_clips_domain ON web_clips(domain);

-- Enable RLS
ALTER TABLE web_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view web clips in their organization"
  ON web_clips
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create web clips in their organization"
  ON web_clips
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update web clips in their organization"
  ON web_clips
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete web clips in their organization"
  ON web_clips
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_web_clips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER web_clips_updated_at
  BEFORE UPDATE ON web_clips
  FOR EACH ROW
  EXECUTE FUNCTION update_web_clips_updated_at();

-- Update existing documents to have document media_type
UPDATE documents SET media_type = 'document' WHERE media_type IS NULL;
