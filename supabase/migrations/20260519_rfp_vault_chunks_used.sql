-- 20260519_rfp_vault_chunks_used.sql
-- Wave 1 of "Best-Site Plan" (see .planning/research/rfp-engine/BEST-SITE-PLAN-2026-05-19.md).
--
-- Two additive columns. Both default to empty containers so existing rows
-- and existing read paths behave identically until populated.
--
-- vault_chunks_used: ordered array of chunk references used by the drafter at
--   draft time. Array position + 1 = the N in `[CITE: vault-N]` markers in
--   rfp_proposal_sections.content. Shape (per element):
--   {
--     id: uuid,
--     doc_id: uuid,
--     doc_title: text,
--     doc_type: text,
--     chunk_index: int,
--     text_preview: text (~400 chars),
--     similarity_score: numeric
--   }
--
-- onboarding_state: rfp_orgs first-run checklist state. v1 stores only:
--   { dismissed_at: timestamptz | null }
--   The five step-complete states are derived from existence checks
--   (voice_fingerprint set, vault chunk count, proposal count) so the
--   client never has to write them.

ALTER TABLE rfp_proposals
  ADD COLUMN IF NOT EXISTS vault_chunks_used jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE rfp_orgs
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb;
