-- =============================================================================
-- RFP Engine — Enrichment-backed Submission Tasks
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Constraint-only expansion. Allows the workroom generator to identify
-- tasks created from opportunity capture/enrichment intelligence.
-- =============================================================================

ALTER TABLE public.rfp_submission_tasks
  DROP CONSTRAINT IF EXISTS rfp_submission_tasks_source_type_check;

ALTER TABLE public.rfp_submission_tasks
  ADD CONSTRAINT rfp_submission_tasks_source_type_check
  CHECK (
    source_type IN (
      'verify_marker',
      'compliance',
      'packet',
      'reviewer',
      'enrichment',
      'manual'
    )
  );
