-- Fix schema drift between code and DB CHECK constraints.
--
-- Two constraints in 20260509_rfp_schema.sql no longer match what the
-- application writes:
--
--   1. rfp_proposals.status — code uses (draft|submitted|won|lost|withdrawn);
--      DB constrained to (draft|in_review|compliance|submitted|awarded|lost).
--      Result: marking a proposal "won" or "withdrawn" via the status pill
--      route 500s with rfp_proposals_status_check. No data uses the legacy
--      values yet (table empty), so we replace the constraint outright.
--
--   2. rfp_agent_sessions.agent — code writes descriptive snake_case
--      identifiers like 'drafter_v1', 'reviewer_v1', 'vault_indexer_v1',
--      'proposal_editor_v1', 'proposal_status_v1',
--      'voice_fingerprint_extractor_v1'. DB constrained to a five-value
--      closed set authored before the agents existed. Every best-effort audit
--      write has been silently rejected — table is empty in production.
--      Closed sets don't survive a growing agent registry; dropping outright.

alter table public.rfp_proposals
  drop constraint if exists rfp_proposals_status_check;

alter table public.rfp_proposals
  add constraint rfp_proposals_status_check
  check (status = any (array[
    'draft'::text,
    'submitted'::text,
    'won'::text,
    'lost'::text,
    'withdrawn'::text
  ]));

alter table public.rfp_agent_sessions
  drop constraint if exists rfp_agent_sessions_agent_check;
