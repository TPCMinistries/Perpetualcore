-- =====================================================
-- WORKFLOW INTEGRATION MIGRATION
-- Adds: Task-Decision linking, Team scoping for decisions,
--       Notification FK fix
-- =====================================================

-- 1. ADD decision_id TO TASKS TABLE
-- Allows tasks to be created from and linked to decisions
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tasks_decision ON tasks(decision_id) WHERE decision_id IS NOT NULL;

-- 2. ADD team_id TO DECISIONS TABLE
-- Allows decisions to be scoped to specific teams
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for team-scoped queries
CREATE INDEX IF NOT EXISTS idx_decisions_team ON decisions(team_id) WHERE team_id IS NOT NULL;

-- 3. FIX NOTIFICATIONS triggered_by FK
-- Add foreign key relationship to profiles table for triggered_by
-- First check if the column exists, then add the FK

-- Note: The notifications table has triggered_by but no FK constraint
-- We'll add it if it doesn't exist (may need manual verification)

-- Check current notifications table structure and add FK if missing
DO $$
BEGIN
  -- Add FK constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_triggered_by_fkey'
  ) THEN
    -- The column might reference auth.users or profiles - using profiles for consistency
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_triggered_by_fkey
    FOREIGN KEY (triggered_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_column THEN
    -- Column doesn't exist, add it
    ALTER TABLE notifications ADD COLUMN triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  WHEN undefined_table THEN
    NULL; -- Table doesn't exist, skip
END;
$$;

-- 4. CREATE VIEW FOR TASKS WITH DECISION DETAILS
CREATE OR REPLACE VIEW tasks_with_decisions AS
SELECT
  t.*,
  d.title as decision_title,
  d.status as decision_status,
  d.priority as decision_priority
FROM tasks t
LEFT JOIN decisions d ON t.decision_id = d.id;

-- 5. CREATE FUNCTION TO GET TASKS BY DECISION
CREATE OR REPLACE FUNCTION get_decision_tasks(p_decision_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  assigned_to_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assigned_to,
    t.due_date,
    t.created_at,
    p.full_name as assigned_to_name
  FROM tasks t
  LEFT JOIN profiles p ON t.assigned_to = p.id
  WHERE t.decision_id = p_decision_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREATE FUNCTION TO GET TEAM DECISIONS
CREATE OR REPLACE FUNCTION get_team_decisions(p_team_id UUID, p_org_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  creator_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.description,
    d.status,
    d.priority,
    d.due_date,
    d.created_by,
    d.created_at,
    p.full_name as creator_name
  FROM decisions d
  LEFT JOIN profiles p ON d.created_by = p.id
  WHERE d.team_id = p_team_id
    AND d.organization_id = p_org_id
  ORDER BY
    CASE d.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    d.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. UPDATE RLS POLICIES FOR TEAM-SCOPED DECISIONS (optional enhancement)
-- Users can see decisions in their team or organization-wide decisions

-- Create policy for team-scoped decision viewing (if not exists)
DO $$
BEGIN
  -- Drop existing policy if it exists and recreate
  DROP POLICY IF EXISTS "Users can view team decisions" ON decisions;

  CREATE POLICY "Users can view team decisions"
    ON decisions FOR SELECT
    USING (
      -- User is in the organization
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.organization_id = decisions.organization_id
      )
      AND (
        -- Decision is org-wide (no team_id)
        team_id IS NULL
        -- OR user is member of the team
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = decisions.team_id
          AND tm.user_id = auth.uid()
        )
        -- OR user created the decision (user_id is the creator)
        OR user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- team_members doesn't exist, skip
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- Run: npm run db:migrate or execute in Supabase SQL Editor
-- =====================================================
