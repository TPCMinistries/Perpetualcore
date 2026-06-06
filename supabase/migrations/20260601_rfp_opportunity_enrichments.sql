-- =============================================================================
-- RFP Engine — Opportunity Enrichments
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Additive table only. Stores normalized capture intelligence derived
-- from source payloads so discovery/pursuit screens can show eligibility,
-- requirements, submission details, contacts, and missing-data risk flags.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_opportunity_enrichments (
  opp_id             uuid        PRIMARY KEY REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  source             text        NOT NULL DEFAULT 'rules_v1',
  eligibility        text[]      NOT NULL DEFAULT '{}',
  required_documents text[]      NOT NULL DEFAULT '{}',
  submission_method  text,
  submission_url     text,
  contact            text,
  matching_funds     text,
  funding_method     text,
  award_range        text,
  timeline           text[]      NOT NULL DEFAULT '{}',
  risks              text[]      NOT NULL DEFAULT '{}',
  missing_fields     text[]      NOT NULL DEFAULT '{}',
  quality_score      integer     NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  raw                jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_opportunity_enrichments_quality_idx
  ON public.rfp_opportunity_enrichments (quality_score DESC);

ALTER TABLE public.rfp_opportunity_enrichments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_opportunity_enrichments_select ON public.rfp_opportunity_enrichments;
CREATE POLICY rfp_opportunity_enrichments_select ON public.rfp_opportunity_enrichments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.rfp_opp_matches m
      WHERE m.opp_id = rfp_opportunity_enrichments.opp_id
        AND m.org_id = ANY(public.rfp_my_org_ids())
    )
  );
