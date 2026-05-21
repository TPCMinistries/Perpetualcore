-- =============================================================================
-- RFP & Proposal Engine — RLS Policies Migration v1
-- Phase 04-01: Foundations & Salvage Port
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_rls_policies_v1)
-- =============================================================================
-- POLICY MODEL:
--   rfp_user_orgs is the membership source of truth.
--   A user can read/write a row in any tenant-scoped table iff that row's
--   org_id is in (SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()).
--   Role-based gates apply on top of tenant isolation.
-- =============================================================================

-- =============================================================================
-- 1. rfp_orgs — Tenant root (org_id IS the row id)
-- =============================================================================
ALTER TABLE rfp_orgs ENABLE ROW LEVEL SECURITY;

-- SELECT: user must be a member of the org
CREATE POLICY rfp_orgs_select ON rfp_orgs
  FOR SELECT
  USING (id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

-- INSERT: any authenticated user can create an org
-- (API layer inserts rfp_user_orgs owner row in the same transaction)
CREATE POLICY rfp_orgs_insert ON rfp_orgs
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: only org owners
CREATE POLICY rfp_orgs_update ON rfp_orgs
  FOR UPDATE
  USING (id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- DELETE: only org owners
CREATE POLICY rfp_orgs_delete ON rfp_orgs
  FOR DELETE
  USING (id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- =============================================================================
-- 2. rfp_users — Self-only access (profile mirror)
-- =============================================================================
ALTER TABLE rfp_users ENABLE ROW LEVEL SECURITY;

-- SELECT: own row only
CREATE POLICY rfp_users_select_own ON rfp_users
  FOR SELECT
  USING (id = auth.uid());

-- ALL (insert, update, delete): own row only
CREATE POLICY rfp_users_upsert_own ON rfp_users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================================================
-- 3. rfp_user_orgs — Own memberships + org owners can manage
-- =============================================================================
ALTER TABLE rfp_user_orgs ENABLE ROW LEVEL SECURITY;

-- SELECT: own memberships OR org_id where user is owner
CREATE POLICY rfp_user_orgs_select ON rfp_user_orgs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- INSERT: user accepts own invite, or owner adds someone to their org
CREATE POLICY rfp_user_orgs_insert ON rfp_user_orgs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- DELETE: own membership (leaving), or owner removes someone
CREATE POLICY rfp_user_orgs_delete ON rfp_user_orgs
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =============================================================================
-- 4. rfp_capture_profiles — Tenant-scoped (org_id column)
-- =============================================================================
ALTER TABLE rfp_capture_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_capture_profiles_select ON rfp_capture_profiles
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

CREATE POLICY rfp_capture_profiles_insert ON rfp_capture_profiles
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
  ));

CREATE POLICY rfp_capture_profiles_update ON rfp_capture_profiles
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
  ));

CREATE POLICY rfp_capture_profiles_delete ON rfp_capture_profiles
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- =============================================================================
-- 5. rfp_vault_artifacts — Tenant-scoped (org_id column)
-- =============================================================================
ALTER TABLE rfp_vault_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_vault_artifacts_select ON rfp_vault_artifacts
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

CREATE POLICY rfp_vault_artifacts_insert ON rfp_vault_artifacts
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
  ));

CREATE POLICY rfp_vault_artifacts_update ON rfp_vault_artifacts
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
  ));

CREATE POLICY rfp_vault_artifacts_delete ON rfp_vault_artifacts
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- =============================================================================
-- 6. rfp_opportunities — Global read for any authenticated user
--    Only service_role can write (cron worker uses admin client, bypasses RLS)
-- =============================================================================
ALTER TABLE rfp_opportunities ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read opportunities
CREATE POLICY rfp_opportunities_select ON rfp_opportunities
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- No INSERT/UPDATE/DELETE policies → only service_role can write

-- =============================================================================
-- 7. rfp_opp_matches — Tenant-scoped (org_id column)
-- =============================================================================
ALTER TABLE rfp_opp_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_opp_matches_select ON rfp_opp_matches
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

CREATE POLICY rfp_opp_matches_insert ON rfp_opp_matches
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
  ));

CREATE POLICY rfp_opp_matches_update ON rfp_opp_matches
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
  ));

CREATE POLICY rfp_opp_matches_delete ON rfp_opp_matches
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- =============================================================================
-- 8. rfp_proposals — Tenant-scoped (org_id column)
-- =============================================================================
ALTER TABLE rfp_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_proposals_select ON rfp_proposals
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

CREATE POLICY rfp_proposals_insert ON rfp_proposals
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
  ));

CREATE POLICY rfp_proposals_update ON rfp_proposals
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
  ));

CREATE POLICY rfp_proposals_delete ON rfp_proposals
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- =============================================================================
-- 9. rfp_proposal_sections — Gated by parent proposal's org (via subquery)
-- =============================================================================
ALTER TABLE rfp_proposal_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_proposal_sections_select ON rfp_proposal_sections
  FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY rfp_proposal_sections_insert ON rfp_proposal_sections
  FOR INSERT
  WITH CHECK (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
    )
  ));

CREATE POLICY rfp_proposal_sections_update ON rfp_proposal_sections
  FOR UPDATE
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
    )
  ));

CREATE POLICY rfp_proposal_sections_delete ON rfp_proposal_sections
  FOR DELETE
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
    )
  ));

-- =============================================================================
-- 10. rfp_compliance_checks — Tenant-scoped (org_id via proposal)
-- =============================================================================
ALTER TABLE rfp_compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_compliance_checks_select ON rfp_compliance_checks
  FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY rfp_compliance_checks_insert ON rfp_compliance_checks
  FOR INSERT
  WITH CHECK (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
    )
  ));

CREATE POLICY rfp_compliance_checks_update ON rfp_compliance_checks
  FOR UPDATE
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
    )
  ));

CREATE POLICY rfp_compliance_checks_delete ON rfp_compliance_checks
  FOR DELETE
  USING (proposal_id IN (
    SELECT id FROM rfp_proposals
    WHERE org_id IN (
      SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
    )
  ));

-- =============================================================================
-- 11. rfp_agent_sessions — Tenant-scoped (org_id denormalized column)
-- =============================================================================
ALTER TABLE rfp_agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rfp_agent_sessions_select ON rfp_agent_sessions
  FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()
  ));

CREATE POLICY rfp_agent_sessions_insert ON rfp_agent_sessions
  FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer', 'reviewer')
  ));

CREATE POLICY rfp_agent_sessions_update ON rfp_agent_sessions
  FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role IN ('owner', 'writer')
  ));

CREATE POLICY rfp_agent_sessions_delete ON rfp_agent_sessions
  FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid() AND role = 'owner'
  ));
