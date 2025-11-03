-- Advanced Search & Saved Searches Schema
-- This schema supports advanced search filters and user-saved searches

-- Saved Searches Table
-- Stores user-defined search queries with filters
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Search configuration
  name TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,

  -- Filters (stored as JSONB for flexibility)
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example filters structure:
  -- {
  --   "types": ["document", "email"],
  --   "dateRange": {"start": "2024-01-01", "end": "2024-12-31"},
  --   "authors": ["user-id-1", "user-id-2"],
  --   "status": ["completed", "in_progress"],
  --   "priority": ["high", "medium"],
  --   "tags": ["important", "project-x"],
  --   "categories": ["work", "personal"]
  -- }

  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- Share with organization
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Notifications (optional: notify when new results match)
  notifications_enabled BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'instant', -- instant, daily, weekly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_pinned ON saved_searches(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_shared ON saved_searches(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_filters ON saved_searches USING gin(filters);

-- Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved searches or shared searches in their org
CREATE POLICY "Users can view own and shared saved searches"
  ON saved_searches FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_shared = true AND organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    ))
  );

-- Users can create their own saved searches
CREATE POLICY "Users can create own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Search History Table (optional: track recent searches)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- RLS for search history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS saved_searches_updated_at ON saved_searches;
CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_search_updated_at();

-- Function to increment usage count and update last_used_at
CREATE OR REPLACE FUNCTION increment_saved_search_usage(search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE saved_searches
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old search history (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void AS $$
BEGIN
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
      FROM search_history
    ) sub
    WHERE row_num > 100
  );
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE saved_searches IS 'Stores user-defined search queries with advanced filters for quick re-use';
COMMENT ON COLUMN saved_searches.filters IS 'JSONB object containing search filters (types, date ranges, authors, status, priority, tags, categories)';
COMMENT ON COLUMN saved_searches.is_shared IS 'When true, search is visible to all members of the organization';
COMMENT ON COLUMN saved_searches.notifications_enabled IS 'When true, user receives notifications when new items match this search';

COMMENT ON TABLE search_history IS 'Tracks recent searches for autocomplete and analytics';
COMMENT ON FUNCTION cleanup_old_search_history() IS 'Keeps only the 100 most recent searches per user to prevent table bloat';
