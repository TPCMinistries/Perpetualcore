-- Fix RLS policies to allow manager role to create/update/delete teams
-- The API allows manager role but original RLS only allowed admin/owner

-- ================================================
-- Fix teams table policies
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can create teams" ON teams;
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;

-- Recreate policies with manager role included
CREATE POLICY "Admins and managers can create teams"
  ON teams FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update teams"
  ON teams FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete teams"
  ON teams FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'owner', 'manager')
    )
  );

-- ================================================
-- Fix team_members table policies
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Team leads and admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Team leads and admins can update members" ON team_members;
DROP POLICY IF EXISTS "Team leads and admins can remove members" ON team_members;

-- Recreate with manager role included
CREATE POLICY "Team leads, admins and managers can add members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner', 'manager') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );

CREATE POLICY "Team leads, admins and managers can update members"
  ON team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner', 'manager') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );

CREATE POLICY "Team leads, admins and managers can remove members"
  ON team_members FOR DELETE
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid() AND (
        p.user_role IN ('admin', 'owner', 'manager') OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.can_manage_members = true
        )
      )
    )
  );
