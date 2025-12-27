-- Smart Collections for AI-powered document organization
-- This table stores both auto-generated clusters and manual collections

CREATE TABLE IF NOT EXISTS smart_collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  collection_type TEXT NOT NULL DEFAULT 'manual' CHECK (collection_type IN ('auto', 'manual', 'hybrid')),
  document_ids TEXT[] DEFAULT '{}',
  topic_keywords TEXT[] DEFAULT '{}',
  filter_rules JSONB DEFAULT '{}',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  confidence FLOAT DEFAULT 0.5,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_smart_collections_org ON smart_collections(organization_id);
CREATE INDEX IF NOT EXISTS idx_smart_collections_type ON smart_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_smart_collections_pinned ON smart_collections(is_pinned);

-- Enable RLS
ALTER TABLE smart_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view collections in their organization"
  ON smart_collections
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create collections in their organization"
  ON smart_collections
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update collections in their organization"
  ON smart_collections
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete collections in their organization"
  ON smart_collections
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_smart_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smart_collections_updated_at
  BEFORE UPDATE ON smart_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_smart_collections_updated_at();
