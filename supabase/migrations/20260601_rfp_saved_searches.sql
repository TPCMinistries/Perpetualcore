-- =============================================================================
-- RFP Engine — Saved Searches
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Additive table only. RLS restricts saved search rows to org members,
-- with private rows visible only to the creator unless shared.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_saved_searches (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  filters         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  mode            text        NOT NULL DEFAULT 'all' CHECK (mode IN ('all', 'nonprofit', 'forprofit')),
  is_shared       boolean     NOT NULL DEFAULT false,
  alert_enabled   boolean     NOT NULL DEFAULT false,
  alert_frequency text        NOT NULL DEFAULT 'weekly' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  min_fit_score   numeric     NOT NULL DEFAULT 70 CHECK (min_fit_score BETWEEN 0 AND 100),
  last_run_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_saved_searches_org_idx
  ON public.rfp_saved_searches (org_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS rfp_saved_searches_creator_idx
  ON public.rfp_saved_searches (created_by, updated_at DESC);

CREATE INDEX IF NOT EXISTS rfp_saved_searches_alert_idx
  ON public.rfp_saved_searches (alert_enabled, alert_frequency, min_fit_score)
  WHERE alert_enabled = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rfp_saved_searches_set_updated_at'
  ) THEN
    CREATE TRIGGER rfp_saved_searches_set_updated_at
      BEFORE UPDATE ON public.rfp_saved_searches
      FOR EACH ROW EXECUTE FUNCTION public.rfp_set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.rfp_saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_saved_searches_select ON public.rfp_saved_searches;
CREATE POLICY rfp_saved_searches_select ON public.rfp_saved_searches
  FOR SELECT
  USING (
    org_id = ANY(public.rfp_my_org_ids())
    AND (is_shared = true OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS rfp_saved_searches_insert ON public.rfp_saved_searches;
CREATE POLICY rfp_saved_searches_insert ON public.rfp_saved_searches
  FOR INSERT
  WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS rfp_saved_searches_update ON public.rfp_saved_searches;
CREATE POLICY rfp_saved_searches_update ON public.rfp_saved_searches
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR org_id = ANY(public.rfp_my_owned_org_ids())
  )
  WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids())
    AND (
      created_by = auth.uid()
      OR org_id = ANY(public.rfp_my_owned_org_ids())
    )
  );

DROP POLICY IF EXISTS rfp_saved_searches_delete ON public.rfp_saved_searches;
CREATE POLICY rfp_saved_searches_delete ON public.rfp_saved_searches
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR org_id = ANY(public.rfp_my_owned_org_ids())
  );
