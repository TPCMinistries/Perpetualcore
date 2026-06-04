-- =============================================================================
-- RFP Engine — Opportunity canonical/alias layer
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Additive tables + indexes + RLS policies only.
-- Does not merge, delete, or rewrite existing rfp_opportunities rows.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_opportunity_canonicals (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_opp_id uuid       NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE RESTRICT,
  canonical_key text        NOT NULL UNIQUE,
  title          text       NOT NULL,
  agency         text,
  source_count   int        NOT NULL DEFAULT 1 CHECK (source_count >= 1),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rfp_opportunity_aliases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id uuid       NOT NULL REFERENCES public.rfp_opportunity_canonicals(id) ON DELETE CASCADE,
  opp_id       uuid       NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  source       text       NOT NULL,
  source_id    text       NOT NULL,
  confidence   numeric    NOT NULL DEFAULT 1 CHECK (confidence >= 0 AND confidence <= 1),
  evidence     jsonb      NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS rfp_opportunity_canonicals_primary_opp_idx
  ON public.rfp_opportunity_canonicals (primary_opp_id);

CREATE INDEX IF NOT EXISTS rfp_opportunity_canonicals_updated_at_idx
  ON public.rfp_opportunity_canonicals (updated_at DESC);

CREATE INDEX IF NOT EXISTS rfp_opportunity_aliases_canonical_idx
  ON public.rfp_opportunity_aliases (canonical_id);

CREATE INDEX IF NOT EXISTS rfp_opportunity_aliases_opp_idx
  ON public.rfp_opportunity_aliases (opp_id);

ALTER TABLE public.rfp_opportunity_canonicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_opportunity_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_opportunity_canonicals_select
  ON public.rfp_opportunity_canonicals;
CREATE POLICY rfp_opportunity_canonicals_select
  ON public.rfp_opportunity_canonicals
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS rfp_opportunity_aliases_select
  ON public.rfp_opportunity_aliases;
CREATE POLICY rfp_opportunity_aliases_select
  ON public.rfp_opportunity_aliases
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
