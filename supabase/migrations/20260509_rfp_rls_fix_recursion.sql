-- =============================================================================
-- RFP RLS Fix — Infinite Recursion Resolution
-- Phase 04-01: Foundations & Salvage Port (auto-fix, Rule 1 - Bug)
-- =============================================================================
-- ISSUE: rfp_user_orgs_select policy referenced rfp_user_orgs itself, causing
--        infinite recursion when any tenant-scoped table was queried.
--
-- FIX: Create a SECURITY DEFINER function rfp_auth_user_orgs(role_filter text[])
--      that queries rfp_user_orgs bypassing RLS (runs as the function owner, not
--      the calling user). All RLS policies call this function instead of inline
--      SELECT subqueries on rfp_user_orgs.
--
-- APPROACH: Drop and recreate all rfp_* policies to use the helper function.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Step 1: Create SECURITY DEFINER helper functions
-- ---------------------------------------------------------------------------

-- Returns org IDs the current user belongs to (any role)
CREATE OR REPLACE FUNCTION rfp_my_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  );
$$;

-- Returns org IDs where the current user has one of the specified roles
CREATE OR REPLACE FUNCTION rfp_my_org_ids_with_role(roles text[])
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT org_id FROM rfp_user_orgs
    WHERE user_id = auth.uid() AND role = ANY(roles)
  );
$$;

-- Returns user IDs in orgs where the current user is an owner (for rfp_user_orgs management)
CREATE OR REPLACE FUNCTION rfp_my_owned_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT org_id FROM rfp_user_orgs
    WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Step 2: Drop all existing rfp_* policies (recreate with fixed subqueries)
-- ---------------------------------------------------------------------------

-- rfp_orgs
DROP POLICY IF EXISTS rfp_orgs_select ON rfp_orgs;
DROP POLICY IF EXISTS rfp_orgs_insert ON rfp_orgs;
DROP POLICY IF EXISTS rfp_orgs_update ON rfp_orgs;
DROP POLICY IF EXISTS rfp_orgs_delete ON rfp_orgs;

-- rfp_users
DROP POLICY IF EXISTS rfp_users_select_own ON rfp_users;
DROP POLICY IF EXISTS rfp_users_upsert_own ON rfp_users;

-- rfp_user_orgs
DROP POLICY IF EXISTS rfp_user_orgs_select ON rfp_user_orgs;
DROP POLICY IF EXISTS rfp_user_orgs_insert ON rfp_user_orgs;
DROP POLICY IF EXISTS rfp_user_orgs_delete ON rfp_user_orgs;

-- rfp_capture_profiles
DROP POLICY IF EXISTS rfp_capture_profiles_select ON rfp_capture_profiles;
DROP POLICY IF EXISTS rfp_capture_profiles_insert ON rfp_capture_profiles;
DROP POLICY IF EXISTS rfp_capture_profiles_update ON rfp_capture_profiles;
DROP POLICY IF EXISTS rfp_capture_profiles_delete ON rfp_capture_profiles;

-- rfp_vault_artifacts
DROP POLICY IF EXISTS rfp_vault_artifacts_select ON rfp_vault_artifacts;
DROP POLICY IF EXISTS rfp_vault_artifacts_insert ON rfp_vault_artifacts;
DROP POLICY IF EXISTS rfp_vault_artifacts_update ON rfp_vault_artifacts;
DROP POLICY IF EXISTS rfp_vault_artifacts_delete ON rfp_vault_artifacts;

-- rfp_opportunities
DROP POLICY IF EXISTS rfp_opportunities_select ON rfp_opportunities;

-- rfp_opp_matches
DROP POLICY IF EXISTS rfp_opp_matches_select ON rfp_opp_matches;
DROP POLICY IF EXISTS rfp_opp_matches_insert ON rfp_opp_matches;
DROP POLICY IF EXISTS rfp_opp_matches_update ON rfp_opp_matches;
DROP POLICY IF EXISTS rfp_opp_matches_delete ON rfp_opp_matches;

-- rfp_proposals
DROP POLICY IF EXISTS rfp_proposals_select ON rfp_proposals;
DROP POLICY IF EXISTS rfp_proposals_insert ON rfp_proposals;
DROP POLICY IF EXISTS rfp_proposals_update ON rfp_proposals;
DROP POLICY IF EXISTS rfp_proposals_delete ON rfp_proposals;

-- rfp_proposal_sections
DROP POLICY IF EXISTS rfp_proposal_sections_select ON rfp_proposal_sections;
DROP POLICY IF EXISTS rfp_proposal_sections_insert ON rfp_proposal_sections;
DROP POLICY IF EXISTS rfp_proposal_sections_update ON rfp_proposal_sections;
DROP POLICY IF EXISTS rfp_proposal_sections_delete ON rfp_proposal_sections;

-- rfp_compliance_checks
DROP POLICY IF EXISTS rfp_compliance_checks_select ON rfp_compliance_checks;
DROP POLICY IF EXISTS rfp_compliance_checks_insert ON rfp_compliance_checks;
DROP POLICY IF EXISTS rfp_compliance_checks_update ON rfp_compliance_checks;
DROP POLICY IF EXISTS rfp_compliance_checks_delete ON rfp_compliance_checks;

-- rfp_agent_sessions
DROP POLICY IF EXISTS rfp_agent_sessions_select ON rfp_agent_sessions;
DROP POLICY IF EXISTS rfp_agent_sessions_insert ON rfp_agent_sessions;
DROP POLICY IF EXISTS rfp_agent_sessions_update ON rfp_agent_sessions;
DROP POLICY IF EXISTS rfp_agent_sessions_delete ON rfp_agent_sessions;

-- ---------------------------------------------------------------------------
-- Step 3: Recreate all policies using SECURITY DEFINER helper functions
-- ---------------------------------------------------------------------------

-- ==== rfp_orgs ====
CREATE POLICY rfp_orgs_select ON rfp_orgs
  FOR SELECT USING (id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_orgs_insert ON rfp_orgs
  FOR INSERT WITH CHECK (true);

CREATE POLICY rfp_orgs_update ON rfp_orgs
  FOR UPDATE USING (id = ANY(rfp_my_owned_org_ids()));

CREATE POLICY rfp_orgs_delete ON rfp_orgs
  FOR DELETE USING (id = ANY(rfp_my_owned_org_ids()));

-- ==== rfp_users (self-only) ====
CREATE POLICY rfp_users_select_own ON rfp_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY rfp_users_upsert_own ON rfp_users
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ==== rfp_user_orgs ====
-- SELECT: own rows OR rows in orgs where user is owner
CREATE POLICY rfp_user_orgs_select ON rfp_user_orgs
  FOR SELECT USING (
    user_id = auth.uid()
    OR org_id = ANY(rfp_my_owned_org_ids())
  );

-- INSERT: adding self, or owner adding someone to their org
CREATE POLICY rfp_user_orgs_insert ON rfp_user_orgs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR org_id = ANY(rfp_my_owned_org_ids())
  );

-- DELETE: leaving own membership, or owner removing someone
CREATE POLICY rfp_user_orgs_delete ON rfp_user_orgs
  FOR DELETE USING (
    user_id = auth.uid()
    OR org_id = ANY(rfp_my_owned_org_ids())
  );

-- ==== rfp_capture_profiles (tenant-scoped) ====
CREATE POLICY rfp_capture_profiles_select ON rfp_capture_profiles
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_capture_profiles_insert ON rfp_capture_profiles
  FOR INSERT WITH CHECK (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer'])));

CREATE POLICY rfp_capture_profiles_update ON rfp_capture_profiles
  FOR UPDATE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer'])));

CREATE POLICY rfp_capture_profiles_delete ON rfp_capture_profiles
  FOR DELETE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner'])));

-- ==== rfp_vault_artifacts (tenant-scoped) ====
CREATE POLICY rfp_vault_artifacts_select ON rfp_vault_artifacts
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_vault_artifacts_insert ON rfp_vault_artifacts
  FOR INSERT WITH CHECK (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer'])));

CREATE POLICY rfp_vault_artifacts_update ON rfp_vault_artifacts
  FOR UPDATE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer'])));

CREATE POLICY rfp_vault_artifacts_delete ON rfp_vault_artifacts
  FOR DELETE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner'])));

-- ==== rfp_opportunities (global read) ====
CREATE POLICY rfp_opportunities_select ON rfp_opportunities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ==== rfp_opp_matches (tenant-scoped) ====
CREATE POLICY rfp_opp_matches_select ON rfp_opp_matches
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_opp_matches_insert ON rfp_opp_matches
  FOR INSERT WITH CHECK (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer'])));

CREATE POLICY rfp_opp_matches_update ON rfp_opp_matches
  FOR UPDATE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer'])));

CREATE POLICY rfp_opp_matches_delete ON rfp_opp_matches
  FOR DELETE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner'])));

-- ==== rfp_proposals (tenant-scoped) ====
CREATE POLICY rfp_proposals_select ON rfp_proposals
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_proposals_insert ON rfp_proposals
  FOR INSERT WITH CHECK (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer'])));

CREATE POLICY rfp_proposals_update ON rfp_proposals
  FOR UPDATE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer'])));

CREATE POLICY rfp_proposals_delete ON rfp_proposals
  FOR DELETE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner'])));

-- ==== rfp_proposal_sections (gated by parent proposal's org) ====
CREATE POLICY rfp_proposal_sections_select ON rfp_proposal_sections
  FOR SELECT USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals WHERE org_id = ANY(rfp_my_org_ids())
    )
  );

CREATE POLICY rfp_proposal_sections_insert ON rfp_proposal_sections
  FOR INSERT WITH CHECK (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
    )
  );

CREATE POLICY rfp_proposal_sections_update ON rfp_proposal_sections
  FOR UPDATE USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer']))
    )
  );

CREATE POLICY rfp_proposal_sections_delete ON rfp_proposal_sections
  FOR DELETE USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner']))
    )
  );

-- ==== rfp_compliance_checks (gated by parent proposal's org) ====
CREATE POLICY rfp_compliance_checks_select ON rfp_compliance_checks
  FOR SELECT USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals WHERE org_id = ANY(rfp_my_org_ids())
    )
  );

CREATE POLICY rfp_compliance_checks_insert ON rfp_compliance_checks
  FOR INSERT WITH CHECK (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
    )
  );

CREATE POLICY rfp_compliance_checks_update ON rfp_compliance_checks
  FOR UPDATE USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer']))
    )
  );

CREATE POLICY rfp_compliance_checks_delete ON rfp_compliance_checks
  FOR DELETE USING (
    proposal_id IN (
      SELECT id FROM rfp_proposals
      WHERE org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner']))
    )
  );

-- ==== rfp_agent_sessions (tenant-scoped via denormalized org_id) ====
CREATE POLICY rfp_agent_sessions_select ON rfp_agent_sessions
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

CREATE POLICY rfp_agent_sessions_insert ON rfp_agent_sessions
  FOR INSERT WITH CHECK (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer'])));

CREATE POLICY rfp_agent_sessions_update ON rfp_agent_sessions
  FOR UPDATE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner','writer'])));

CREATE POLICY rfp_agent_sessions_delete ON rfp_agent_sessions
  FOR DELETE USING (org_id = ANY(rfp_my_org_ids_with_role(ARRAY['owner'])));
