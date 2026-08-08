-- Migration: rfp_ai_disclosure_ack
-- Additive columns on rfp_proposals for AI-use disclosure acknowledgment.
-- No new table; existing org-scoped RLS policies on rfp_proposals cover these columns.

ALTER TABLE public.rfp_proposals
  ADD COLUMN IF NOT EXISTS ai_disclosure_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_disclosure_acknowledged_at timestamptz;
