-- Migration: Add folders and tags for document organization
-- Created: 2024-01-15

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 3. Create document-tags junction table
CREATE TABLE IF NOT EXISTS document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, tag_id)
);

-- 4. Add folder_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_organization_id ON folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id);

-- 6. Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for folders
CREATE POLICY "Users can view folders in their organization"
  ON folders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create folders in their organization"
  ON folders FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (user_id = auth.uid());

-- 8. RLS Policies for tags
CREATE POLICY "Users can view tags in their organization"
  ON tags FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their organization"
  ON tags FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their organization"
  ON tags FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- 9. RLS Policies for document_tags
CREATE POLICY "Users can view document tags in their organization"
  ON document_tags FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document tags"
  ON document_tags FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 10. Function to update folder updated_at timestamp
CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folder_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();

-- 11. Function to prevent circular folder references
CREATE OR REPLACE FUNCTION check_circular_folder_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_depth INT := 0;
  v_max_depth INT := 10;
BEGIN
  -- If no parent, no circular reference possible
  IF NEW.parent_folder_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if trying to set self as parent
  IF NEW.id = NEW.parent_folder_id THEN
    RAISE EXCEPTION 'A folder cannot be its own parent';
  END IF;

  -- Walk up the folder tree to check for circular reference
  v_parent_id := NEW.parent_folder_id;

  WHILE v_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    -- If we find our own ID in the parent chain, it's circular
    IF v_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Circular folder reference detected';
    END IF;

    -- Get the next parent
    SELECT parent_folder_id INTO v_parent_id
    FROM folders
    WHERE id = v_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  -- Check if we hit max depth (possible infinite loop)
  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Folder nesting too deep (max % levels)', v_max_depth;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_circular_folder_reference
  BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_folder_reference();

-- 12. Comments for documentation
COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing documents';
COMMENT ON TABLE tags IS 'Tags for categorizing documents (many-to-many relationship)';
COMMENT ON TABLE document_tags IS 'Junction table connecting documents to tags';
COMMENT ON COLUMN folders.parent_folder_id IS 'Reference to parent folder for nested structure';
COMMENT ON COLUMN folders.color IS 'Display color for folder (e.g., blue, green, red)';
COMMENT ON COLUMN folders.icon IS 'Icon name for folder display';
