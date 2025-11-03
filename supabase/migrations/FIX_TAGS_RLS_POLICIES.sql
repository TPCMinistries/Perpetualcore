-- Fix RLS policies for tags and document_tags to use 'profiles' instead of 'user_profiles'
-- This fixes the tag functionality issue

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can create tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can view document tags in their organization" ON document_tags;
DROP POLICY IF EXISTS "Users can manage document tags" ON document_tags;

-- Recreate RLS Policies for tags with correct table name
CREATE POLICY "Users can view tags in their organization"
  ON tags FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their organization"
  ON tags FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their organization"
  ON tags FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Recreate RLS Policies for document_tags with correct table name
CREATE POLICY "Users can view document tags in their organization"
  ON document_tags FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document tags"
  ON document_tags FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
