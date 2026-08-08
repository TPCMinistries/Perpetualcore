-- =============================================================================
-- RFP Engine — Proposal no-bid lifecycle status
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Phase 20 — SUBMIT-02
-- =============================================================================
-- SAFETY: Constraint-only migration. Keeps legacy 'withdrawn' accepted for
-- existing rows/backward compatibility, and adds canonical 'no_bid' for the
-- roadmap-facing pursuit lifecycle.
-- =============================================================================

ALTER TABLE public.rfp_proposals
  DROP CONSTRAINT IF EXISTS rfp_proposals_status_check;

ALTER TABLE public.rfp_proposals
  ADD CONSTRAINT rfp_proposals_status_check
  CHECK (status = ANY (ARRAY[
    'draft'::text,
    'submitted'::text,
    'won'::text,
    'lost'::text,
    'no_bid'::text,
    'withdrawn'::text
  ]));
