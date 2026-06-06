-- Phase 05-03 Plan: Fit-scoring engine schema extension.
--
-- Adds the four columns required to persist a structured 30/25/20/15/10 fit
-- score per (opportunity, org) pair:
--   * score_breakdown jsonb  — per-component scores + matched terms (for debug)
--   * chips text[]           — exactly 4 short labels the FeedRow renders
--   * summary text           — 1-2 sentence AI-generated reasoning prose
--   * scored_version int     — increments on every recompute; serves as cache key
--
-- Migration is purely additive — every existing row picks up the defaults
-- (empty jsonb, empty array, null summary, scored_version=1). No data loss risk.
--
-- The new (org_id, fit_score DESC) index supports the feed query in Plan 05-04
-- which is fundamentally "for org X, give me opps in fit_score-desc order".
-- Without it the feed paginates via a Seq Scan on the rfp_opp_matches table.

ALTER TABLE rfp_opp_matches
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chips text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS scored_version int NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS rfp_opp_matches_org_score_idx
  ON rfp_opp_matches (org_id, fit_score DESC);
