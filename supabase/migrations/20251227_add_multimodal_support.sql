-- =====================================================
-- MULTI-MODAL SUPPORT MIGRATION
-- Adds support for images, audio, video, and web clips
-- =====================================================

-- Extend documents table with media fields
ALTER TABLE documents ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('document', 'image', 'audio', 'video', 'web_clip'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS media_metadata JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text TEXT;

-- Set default media_type for existing documents
UPDATE documents SET media_type = 'document' WHERE media_type IS NULL;

-- =====================================================
-- WEB CLIPS TABLE - For saving web pages and articles
-- =====================================================

CREATE TABLE IF NOT EXISTS web_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source information
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  domain TEXT,

  -- Content
  title TEXT,
  author TEXT,
  published_date TIMESTAMPTZ,
  excerpt TEXT,
  main_content TEXT, -- Cleaned article content

  -- Metadata
  og_image TEXT,
  og_description TEXT,
  reading_time_minutes INT,
  word_count INT,
  language TEXT,

  -- Capture info
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  capture_method TEXT DEFAULT 'browser', -- 'browser', 'api', 'extension'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEDIA TRANSCRIPTIONS TABLE - For audio/video transcripts
-- =====================================================

CREATE TABLE IF NOT EXISTS media_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transcription content
  full_text TEXT NOT NULL,
  segments JSONB, -- Array of {start, end, text, confidence}

  -- Metadata
  language TEXT,
  duration_seconds FLOAT,
  word_count INT,

  -- Processing info
  model_used TEXT, -- e.g., 'whisper-1'
  processing_time_ms INT,
  confidence_score FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- IMAGE ANALYSIS TABLE - For OCR and AI vision results
-- =====================================================

CREATE TABLE IF NOT EXISTS image_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- OCR results
  ocr_text TEXT,
  ocr_confidence FLOAT,

  -- AI Vision analysis
  ai_description TEXT, -- AI-generated description
  detected_objects JSONB, -- Array of detected objects
  detected_text_blocks JSONB, -- Structured text blocks with positions
  detected_faces_count INT,
  dominant_colors JSONB,

  -- Classification
  content_type TEXT, -- 'screenshot', 'photo', 'diagram', 'document', 'artwork', etc.
  tags TEXT[],

  -- Metadata
  image_width INT,
  image_height INT,
  format TEXT,

  -- Processing info
  model_used TEXT,
  processing_time_ms INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_documents_media_type ON documents(media_type);
CREATE INDEX IF NOT EXISTS idx_documents_transcription_status ON documents(transcription_status);
CREATE INDEX IF NOT EXISTS idx_web_clips_document ON web_clips(document_id);
CREATE INDEX IF NOT EXISTS idx_web_clips_org ON web_clips(organization_id);
CREATE INDEX IF NOT EXISTS idx_web_clips_domain ON web_clips(domain);
CREATE INDEX IF NOT EXISTS idx_media_transcriptions_document ON media_transcriptions(document_id);
CREATE INDEX IF NOT EXISTS idx_media_transcriptions_org ON media_transcriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_document ON image_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_org ON image_analysis(organization_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_type ON image_analysis(content_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE web_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analysis ENABLE ROW LEVEL SECURITY;

-- Web clips policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'web_clips'
    AND policyname = 'Users can view web clips in their organization'
  ) THEN
    CREATE POLICY "Users can view web clips in their organization"
      ON web_clips FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'web_clips'
    AND policyname = 'Users can create web clips in their organization'
  ) THEN
    CREATE POLICY "Users can create web clips in their organization"
      ON web_clips FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'web_clips'
    AND policyname = 'Users can update web clips in their organization'
  ) THEN
    CREATE POLICY "Users can update web clips in their organization"
      ON web_clips FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'web_clips'
    AND policyname = 'Users can delete web clips in their organization'
  ) THEN
    CREATE POLICY "Users can delete web clips in their organization"
      ON web_clips FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Media transcriptions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'media_transcriptions'
    AND policyname = 'Users can view transcriptions in their organization'
  ) THEN
    CREATE POLICY "Users can view transcriptions in their organization"
      ON media_transcriptions FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'media_transcriptions'
    AND policyname = 'System can manage transcriptions'
  ) THEN
    CREATE POLICY "System can manage transcriptions"
      ON media_transcriptions FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Image analysis policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'image_analysis'
    AND policyname = 'Users can view image analysis in their organization'
  ) THEN
    CREATE POLICY "Users can view image analysis in their organization"
      ON image_analysis FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'image_analysis'
    AND policyname = 'System can manage image analysis'
  ) THEN
    CREATE POLICY "System can manage image analysis"
      ON image_analysis FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_web_clips_updated_at'
  ) THEN
    CREATE TRIGGER update_web_clips_updated_at
      BEFORE UPDATE ON web_clips
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_media_transcriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_media_transcriptions_updated_at
      BEFORE UPDATE ON media_transcriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_image_analysis_updated_at'
  ) THEN
    CREATE TRIGGER update_image_analysis_updated_at
      BEFORE UPDATE ON image_analysis
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- DONE! Multi-modal support is ready
-- =====================================================
