-- RFP Engine — Pursuit command state
--
-- Adds lightweight ownership/stage fields to org-specific opportunity matches
-- and a persistent decision log table for pursuit command files.
--
-- SAFETY: additive only. Existing match RLS remains in place; the new decision
-- log table has tenant-scoped RLS through org_id.

ALTER TABLE public.rfp_opp_matches
  ADD COLUMN IF NOT EXISTS pursuit_owner_label text NOT NULL DEFAULT 'Unassigned',
  ADD COLUMN IF NOT EXISTS pursuit_stage text NOT NULL DEFAULT 'evaluating',
  ADD COLUMN IF NOT EXISTS pursuit_priority text NOT NULL DEFAULT 'medium';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rfp_opp_matches_pursuit_stage_check'
      AND conrelid = 'public.rfp_opp_matches'::regclass
  ) THEN
    ALTER TABLE public.rfp_opp_matches
      ADD CONSTRAINT rfp_opp_matches_pursuit_stage_check
      CHECK (pursuit_stage IN (
        'evaluating',
        'drafting',
        'reviewing',
        'ready',
        'submitted',
        'closed'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rfp_opp_matches_pursuit_priority_check'
      AND conrelid = 'public.rfp_opp_matches'::regclass
  ) THEN
    ALTER TABLE public.rfp_opp_matches
      ADD CONSTRAINT rfp_opp_matches_pursuit_priority_check
      CHECK (pursuit_priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS rfp_opp_matches_org_pursuit_stage_idx
  ON public.rfp_opp_matches (org_id, pursuit_stage, pursuit_priority);

CREATE TABLE IF NOT EXISTS public.rfp_pursuit_decision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  opp_id uuid NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'note' CHECK (
    event_type IN (
      'note',
      'bid_decision',
      'risk',
      'owner_change',
      'stage_change',
      'submission_update'
    )
  ),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_pursuit_decision_logs_org_opp_idx
  ON public.rfp_pursuit_decision_logs (org_id, opp_id, created_at DESC);

ALTER TABLE public.rfp_pursuit_decision_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_pursuit_decision_logs_select
  ON public.rfp_pursuit_decision_logs;
DROP POLICY IF EXISTS rfp_pursuit_decision_logs_insert
  ON public.rfp_pursuit_decision_logs;
DROP POLICY IF EXISTS rfp_pursuit_decision_logs_update
  ON public.rfp_pursuit_decision_logs;
DROP POLICY IF EXISTS rfp_pursuit_decision_logs_delete
  ON public.rfp_pursuit_decision_logs;

CREATE POLICY rfp_pursuit_decision_logs_select
  ON public.rfp_pursuit_decision_logs
  FOR SELECT USING (
    org_id = ANY(public.rfp_my_org_ids())
  );

CREATE POLICY rfp_pursuit_decision_logs_insert
  ON public.rfp_pursuit_decision_logs
  FOR INSERT WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_pursuit_decision_logs_update
  ON public.rfp_pursuit_decision_logs
  FOR UPDATE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer']))
  ) WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer']))
  );

CREATE POLICY rfp_pursuit_decision_logs_delete
  ON public.rfp_pursuit_decision_logs
  FOR DELETE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner']))
  );
