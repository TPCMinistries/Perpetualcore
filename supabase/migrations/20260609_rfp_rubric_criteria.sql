-- =============================================================================
-- RFP Engine — Rubric Criteria
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Phase 19-01 — REVIEW-01
-- =============================================================================
-- SAFETY: Additive table only. Stores structured evaluation criteria extracted
-- from uploaded solicitation documents (Section L/M for federal RFPs; funder
-- priority sections for grants). Criteria are keyed per opportunity so they
-- are shared across proposals on the same opp.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_rubric_criteria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  package_doc_id  uuid        REFERENCES public.rfp_package_documents(id) ON DELETE SET NULL,
  section_ref     text        NOT NULL,
  criterion_text  text        NOT NULL,
  max_points      numeric,
  weight          numeric,
  is_inferred     boolean     NOT NULL DEFAULT false,
  extracted_by    text        NOT NULL DEFAULT 'claude-sonnet-4-5',
  extracted_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, section_ref)
);

CREATE INDEX IF NOT EXISTS rfp_rubric_criteria_opp_idx
  ON public.rfp_rubric_criteria (opp_id);

ALTER TABLE public.rfp_rubric_criteria ENABLE ROW LEVEL SECURITY;

-- Readable by users whose org has a proposal on this opp (rfp_my_org_ids pattern)
CREATE POLICY rfp_rubric_criteria_select ON public.rfp_rubric_criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rfp_proposals p
      WHERE p.opp_id = rfp_rubric_criteria.opp_id
        AND p.org_id = ANY(public.rfp_my_org_ids())
    )
  );

-- Writes are service-role only (admin client bypasses RLS; authenticated inserts blocked)
CREATE POLICY rfp_rubric_criteria_insert ON public.rfp_rubric_criteria
  FOR INSERT WITH CHECK (false);
