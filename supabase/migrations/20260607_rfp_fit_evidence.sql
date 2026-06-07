-- =============================================================================
-- rfp_fit_evidence — Cited vault chunks per (opp, org, dimension)
-- Phase 18-01: Explainable Fit Scoring — Evidence Persistence Layer
-- Applied via: supabase MCP apply_migration
--
-- Purpose: Store vault artifact citations produced by the vault-grounded scorer.
-- Keeps rfp_opp_matches.score_breakdown compact for fast feed queries while
-- giving the detail pane UI a queryable source of evidence per dimension.
-- SCORE-02 requires citing specific vault artifacts by name with an excerpt.
--
-- Design notes:
--  - artifact_id is NOT a FK to rfp_vault_artifacts — artifact may be deleted
--    after scoring; citation must survive artifact removal
--  - scored_version mirrors rfp_opp_matches.scored_version so evidence rows
--    are trivially linkable to the match that produced them
--  - UNIQUE (opp_id, org_id, scored_version, artifact_id, dimension) — safe
--    upsert on rescore; lower-version rows pruned at write time in evidence-store.ts
--  - excerpt stored ≤200 chars (truncated at write time by evidence-store.ts)
--  - RLS uses rfp_my_org_ids() SECURITY DEFINER helper — do NOT inline
--    EXISTS(SELECT FROM rfp_user_orgs) which caused recursion in Phase 04-01
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfp_fit_evidence (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  org_id          uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  scored_version  int         NOT NULL,  -- mirrors rfp_opp_matches.scored_version
  dimension       text        NOT NULL CHECK (dimension IN (
                                'mission_fit',
                                'eligibility',
                                'track_record',
                                'capacity',
                                'funder_relationship'
                              )),
  artifact_id     uuid        NOT NULL,  -- rfp_vault_artifacts.id (NOT FK — artifact may be deleted)
  artifact_doc_id text        NOT NULL,  -- source_metadata.doc_id from vault artifact
  artifact_title  text        NOT NULL,
  artifact_type   text        NOT NULL,
  excerpt         text        NOT NULL,  -- ≤200 chars from chunk body (truncated at write time)
  similarity      float       NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (opp_id, org_id, scored_version, artifact_id, dimension)
);

-- Index for the feed/detail read path: lookup by opp + org + version
CREATE INDEX IF NOT EXISTS rfp_fit_evidence_opp_org_idx
  ON rfp_fit_evidence (opp_id, org_id, scored_version);

ALTER TABLE rfp_fit_evidence ENABLE ROW LEVEL SECURITY;

-- Org members read only their own evidence rows.
-- Uses the existing SECURITY DEFINER helper — do NOT inline
-- EXISTS(SELECT FROM rfp_user_orgs) which caused recursion in 04-01.
DROP POLICY IF EXISTS rfp_fit_evidence_select ON rfp_fit_evidence;
CREATE POLICY rfp_fit_evidence_select ON rfp_fit_evidence
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));

-- Only service role writes (cron scorer uses createAdminClient → service_role).
DROP POLICY IF EXISTS rfp_fit_evidence_service_write ON rfp_fit_evidence;
CREATE POLICY rfp_fit_evidence_service_write ON rfp_fit_evidence
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
