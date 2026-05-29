-- RFP Engine — Opportunity Triage
--
-- Adds org-specific triage state to rfp_opp_matches so Discovery can become a
-- working queue: watch, pursuing, passed, or no explicit triage yet.
--
-- SAFETY: Additive columns only. Existing RLS on rfp_opp_matches remains the
-- enforcement boundary: members can read their org's match rows; owner/writer
-- can update them.

ALTER TABLE rfp_opp_matches
  ADD COLUMN IF NOT EXISTS triage_status text NOT NULL DEFAULT 'untriaged',
  ADD COLUMN IF NOT EXISTS triage_note text,
  ADD COLUMN IF NOT EXISTS triaged_at timestamptz,
  ADD COLUMN IF NOT EXISTS triaged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rfp_opp_matches_triage_status_check'
      AND conrelid = 'rfp_opp_matches'::regclass
  ) THEN
    ALTER TABLE rfp_opp_matches
      ADD CONSTRAINT rfp_opp_matches_triage_status_check
      CHECK (triage_status IN ('untriaged', 'watch', 'pursuing', 'passed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS rfp_opp_matches_org_triage_idx
  ON rfp_opp_matches (org_id, triage_status, fit_score DESC);
