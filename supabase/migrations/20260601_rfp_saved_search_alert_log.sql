-- =============================================================================
-- RFP Engine — Saved Search Alert Dedupe Log
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Additive table only. Used by the saved-search digest cron to avoid
-- emailing the same opportunity twice for the same saved search recipient.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_saved_search_alert_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id   uuid        NOT NULL REFERENCES public.rfp_saved_searches(id) ON DELETE CASCADE,
  org_id      uuid        NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opp_id      uuid        NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  email       text,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (search_id, user_id, opp_id)
);

CREATE INDEX IF NOT EXISTS rfp_saved_search_alert_log_search_idx
  ON public.rfp_saved_search_alert_log (search_id, user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS rfp_saved_search_alert_log_org_idx
  ON public.rfp_saved_search_alert_log (org_id, sent_at DESC);

ALTER TABLE public.rfp_saved_search_alert_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_saved_search_alert_log_select ON public.rfp_saved_search_alert_log;
CREATE POLICY rfp_saved_search_alert_log_select ON public.rfp_saved_search_alert_log
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_id = ANY(public.rfp_my_owned_org_ids())
  );
