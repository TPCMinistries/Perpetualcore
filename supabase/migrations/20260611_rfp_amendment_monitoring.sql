-- =============================================================================
-- RFP Engine — Solicitation amendment monitoring
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Phase 20 — SUBMIT-03 / SUBMIT-04
-- =============================================================================
-- SAFETY: Additive org-scoped tables only. No existing data is rewritten.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_solicitation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  opp_id uuid NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.rfp_proposals(id) ON DELETE CASCADE,
  package_doc_id uuid REFERENCES public.rfp_package_documents(id) ON DELETE SET NULL,
  source_url text,
  content_hash text NOT NULL,
  title text NOT NULL,
  deadline timestamptz,
  amount_min numeric,
  amount_max numeric,
  snapshot_text text NOT NULL DEFAULT '',
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_solicitation_snapshots_org_opp_idx
  ON public.rfp_solicitation_snapshots (org_id, opp_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS rfp_solicitation_snapshots_org_opp_hash_idx
  ON public.rfp_solicitation_snapshots (org_id, opp_id, content_hash);

CREATE TABLE IF NOT EXISTS public.rfp_solicitation_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  opp_id uuid NOT NULL REFERENCES public.rfp_opportunities(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.rfp_proposals(id) ON DELETE CASCADE,
  previous_snapshot_id uuid REFERENCES public.rfp_solicitation_snapshots(id) ON DELETE SET NULL,
  current_snapshot_id uuid REFERENCES public.rfp_solicitation_snapshots(id) ON DELETE SET NULL,
  material boolean NOT NULL DEFAULT false,
  material_reasons text[] NOT NULL DEFAULT '{}'::text[],
  diff_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz
);

CREATE INDEX IF NOT EXISTS rfp_solicitation_amendments_org_opp_idx
  ON public.rfp_solicitation_amendments (org_id, opp_id, created_at DESC);

CREATE INDEX IF NOT EXISTS rfp_solicitation_amendments_material_idx
  ON public.rfp_solicitation_amendments (org_id, material, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS rfp_solicitation_amendments_pair_idx
  ON public.rfp_solicitation_amendments (
    org_id,
    opp_id,
    previous_snapshot_id,
    current_snapshot_id
  );

ALTER TABLE public.rfp_solicitation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_solicitation_amendments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_solicitation_snapshots_select ON public.rfp_solicitation_snapshots;
DROP POLICY IF EXISTS rfp_solicitation_snapshots_insert ON public.rfp_solicitation_snapshots;
DROP POLICY IF EXISTS rfp_solicitation_snapshots_update ON public.rfp_solicitation_snapshots;
DROP POLICY IF EXISTS rfp_solicitation_snapshots_delete ON public.rfp_solicitation_snapshots;

CREATE POLICY rfp_solicitation_snapshots_select
  ON public.rfp_solicitation_snapshots
  FOR SELECT USING (org_id = ANY(public.rfp_my_org_ids()));

CREATE POLICY rfp_solicitation_snapshots_insert
  ON public.rfp_solicitation_snapshots
  FOR INSERT WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_solicitation_snapshots_update
  ON public.rfp_solicitation_snapshots
  FOR UPDATE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer']))
  ) WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer']))
  );

CREATE POLICY rfp_solicitation_snapshots_delete
  ON public.rfp_solicitation_snapshots
  FOR DELETE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner']))
  );

DROP POLICY IF EXISTS rfp_solicitation_amendments_select ON public.rfp_solicitation_amendments;
DROP POLICY IF EXISTS rfp_solicitation_amendments_insert ON public.rfp_solicitation_amendments;
DROP POLICY IF EXISTS rfp_solicitation_amendments_update ON public.rfp_solicitation_amendments;
DROP POLICY IF EXISTS rfp_solicitation_amendments_delete ON public.rfp_solicitation_amendments;

CREATE POLICY rfp_solicitation_amendments_select
  ON public.rfp_solicitation_amendments
  FOR SELECT USING (org_id = ANY(public.rfp_my_org_ids()));

CREATE POLICY rfp_solicitation_amendments_insert
  ON public.rfp_solicitation_amendments
  FOR INSERT WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_solicitation_amendments_update
  ON public.rfp_solicitation_amendments
  FOR UPDATE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  ) WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_solicitation_amendments_delete
  ON public.rfp_solicitation_amendments
  FOR DELETE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner']))
  );
