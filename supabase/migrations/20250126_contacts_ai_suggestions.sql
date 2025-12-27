-- Migration: AI-Powered Contact Suggestions
-- Adds fields for intelligent contact matching and suggestions

-- Add suggest_for_opportunities flag to contacts
-- When true, this contact will be proactively suggested for relevant projects/tasks
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS suggest_for_opportunities BOOLEAN DEFAULT false;

-- Add AI relevance tags for better matching
-- These are AI-extracted keywords from interactions and profile
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS ai_relevance_tags TEXT[] DEFAULT '{}';

-- Add suggested_contacts to projects
-- AI-populated list of contact IDs that could help with this project
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS suggested_contact_ids UUID[] DEFAULT '{}';

-- Add last_ai_match_at to track when suggestions were generated
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ai_contacts_matched_at TIMESTAMPTZ;

-- Create index for faster opportunity lookups
CREATE INDEX IF NOT EXISTS idx_contacts_suggest_opportunities
ON contacts(suggest_for_opportunities)
WHERE suggest_for_opportunities = true;

-- Create index for relationship strength filtering
CREATE INDEX IF NOT EXISTS idx_contacts_strength_suggest
ON contacts(relationship_strength, suggest_for_opportunities);

-- Function to find matching contacts for a project
CREATE OR REPLACE FUNCTION find_matching_contacts_for_project(
  project_id_input UUID,
  for_user_id UUID,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  contact_id UUID,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  relationship_strength TEXT,
  match_reasons TEXT[],
  relevance_score INTEGER
) AS $$
DECLARE
  project_record RECORD;
  project_keywords TEXT[];
BEGIN
  -- Get project details
  SELECT p.name, p.description, p.tags
  INTO project_record
  FROM projects p
  WHERE p.id = project_id_input;

  -- Extract keywords from project (simple approach - in practice, AI would do this)
  project_keywords := project_record.tags;

  RETURN QUERY
  SELECT
    c.id as contact_id,
    c.full_name,
    c.company,
    c.avatar_url,
    c.relationship_strength,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.skills && project_keywords THEN 'Has relevant skills' END,
      CASE WHEN c.can_help_with && project_keywords THEN 'Can help with project needs' END,
      CASE WHEN c.interests && project_keywords THEN 'Interested in this area' END,
      CASE WHEN c.ai_relevance_tags && project_keywords THEN 'Previously discussed similar topics' END
    ], NULL) as match_reasons,
    (
      -- Calculate relevance score
      CASE c.relationship_strength
        WHEN 'inner_circle' THEN 50
        WHEN 'close' THEN 40
        WHEN 'connected' THEN 30
        WHEN 'acquaintance' THEN 20
        WHEN 'new' THEN 10
      END
      + CASE WHEN c.is_favorite THEN 20 ELSE 0 END
      + CASE WHEN c.suggest_for_opportunities THEN 15 ELSE 0 END
      + (COALESCE(array_length(c.skills & project_keywords, 1), 0) * 10)
      + (COALESCE(array_length(c.can_help_with & project_keywords, 1), 0) * 10)
    )::INTEGER as relevance_score
  FROM contacts c
  WHERE c.user_id = for_user_id
    AND c.is_archived = false
    AND (
      -- Only suggest close+ contacts OR those marked for opportunities
      c.relationship_strength IN ('inner_circle', 'close', 'connected')
      OR c.suggest_for_opportunities = true
      OR c.is_favorite = true
    )
    AND (
      -- Must have some overlap with project keywords
      c.skills && project_keywords
      OR c.can_help_with && project_keywords
      OR c.interests && project_keywords
      OR c.ai_relevance_tags && project_keywords
    )
  ORDER BY relevance_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_matching_contacts_for_project TO authenticated;

-- Comments
COMMENT ON COLUMN contacts.suggest_for_opportunities IS 'When true, this contact will be proactively suggested for relevant projects';
COMMENT ON COLUMN contacts.ai_relevance_tags IS 'AI-extracted keywords from interactions for better matching';
COMMENT ON COLUMN projects.suggested_contact_ids IS 'AI-suggested contacts that could help with this project';
