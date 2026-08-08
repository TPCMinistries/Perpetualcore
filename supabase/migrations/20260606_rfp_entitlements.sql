-- =============================================================================
-- rfp_entitlements — Coverage level + per-operation quota structure
-- Phase 14-03: Canonical Data Foundation — Entitlement Layer
-- Applied via: supabase MCP apply_migration
--
-- Purpose: Decouple entitlement from Stripe so an operator can override a
-- single org without touching billing. Gives Phase 17 the quota structure it
-- reads for AI-cost preflight. Phase 14 owns structure ONLY — enforcement
-- and AI-cost ledger are Phase 17 (do not add budget/enforcement here).
--
-- Design notes:
--  - UNIQUE(org_id): one entitlement row per org; webhook upserts on conflict
--  - coverage_level CHECK (not enum) to avoid enum-value migration complexity
--  - quota columns are nullable (NULL = unlimited for tier; Phase 17 enforces)
--  - Override fields are additive; webhook upsert NEVER overwrites them
--  - RLS uses rfp_my_org_ids() SECURITY DEFINER helper — no inline
--    EXISTS(SELECT FROM rfp_user_orgs) to avoid the recursion in 04-01
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfp_entitlements (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid        NOT NULL UNIQUE REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  coverage_level       text        NOT NULL DEFAULT 'free'
                          CHECK (coverage_level IN ('free','l1','l2','l3')),
  monthly_score_quota  int,        -- NULL = unlimited for tier; Phase 17 enforces
  monthly_draft_quota  int,
  monthly_review_quota int,
  monthly_vault_mb     int,
  override_by          uuid        REFERENCES auth.users(id),
  override_reason      text,
  override_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rfp_entitlements ENABLE ROW LEVEL SECURITY;

-- Org members read their own org's entitlement.
-- Uses the existing SECURITY DEFINER helper — do NOT inline
-- EXISTS(SELECT FROM rfp_user_orgs) which caused recursion in 04-01.
DROP POLICY IF EXISTS rfp_entitlements_select ON rfp_entitlements;
CREATE POLICY rfp_entitlements_select ON rfp_entitlements
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

-- Only service role writes (operator overrides + webhook use createAdminClient).
DROP POLICY IF EXISTS rfp_entitlements_service_write ON rfp_entitlements;
CREATE POLICY rfp_entitlements_service_write ON rfp_entitlements
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
