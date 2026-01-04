-- =====================================================
-- LINK TEAMS AND AI ADVISORS
-- Enables dedicated team advisors and consulting advisors
-- =====================================================

-- 1. Add primary advisor to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_advisor_id UUID REFERENCES ai_assistants(id) ON DELETE SET NULL;

-- 2. Add team ownership to assistants
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE ai_assistants ADD COLUMN IF NOT EXISTS advisor_type TEXT DEFAULT 'standalone';
-- advisor_type values:
--   'standalone' - Independent advisors (CEO, CFO, Legal, etc.)
--   'dedicated'  - Team-specific advisors (created with team)
--   'consulting' - Standalone advisors attached to teams (via junction table)

-- 3. Create junction table for consulting advisors
-- Allows standalone advisors (CEO, CFO) to be attached to multiple teams
CREATE TABLE IF NOT EXISTS team_consulting_advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE(team_id, advisor_id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_primary_advisor ON teams(primary_advisor_id);
CREATE INDEX IF NOT EXISTS idx_assistants_team_id ON ai_assistants(team_id);
CREATE INDEX IF NOT EXISTS idx_assistants_advisor_type ON ai_assistants(advisor_type);
CREATE INDEX IF NOT EXISTS idx_team_consulting_team ON team_consulting_advisors(team_id);
CREATE INDEX IF NOT EXISTS idx_team_consulting_advisor ON team_consulting_advisors(advisor_id);

-- 5. RLS policies for team_consulting_advisors
ALTER TABLE team_consulting_advisors ENABLE ROW LEVEL SECURITY;

-- Users can view consulting advisors for teams they belong to
DROP POLICY IF EXISTS "Users can view team consulting advisors" ON team_consulting_advisors;
CREATE POLICY "Users can view team consulting advisors"
  ON team_consulting_advisors FOR SELECT
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()
    )
  );

-- Team leads/managers can add consulting advisors
DROP POLICY IF EXISTS "Team leads can add consulting advisors" ON team_consulting_advisors;
CREATE POLICY "Team leads can add consulting advisors"
  ON team_consulting_advisors FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('lead', 'manager')
    )
  );

-- Team leads/managers can remove consulting advisors
DROP POLICY IF EXISTS "Team leads can remove consulting advisors" ON team_consulting_advisors;
CREATE POLICY "Team leads can remove consulting advisors"
  ON team_consulting_advisors FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('lead', 'manager')
    )
  );

-- 6. Update existing seeded advisors to be 'standalone' type
UPDATE ai_assistants
SET advisor_type = 'standalone'
WHERE advisor_type IS NULL OR advisor_type = '';

-- =====================================================
-- DONE! Teams can now have dedicated and consulting advisors
-- =====================================================
