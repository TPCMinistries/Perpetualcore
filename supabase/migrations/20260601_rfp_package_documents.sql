-- =============================================================================
-- RFP Engine — Proposal Package Documents
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- SAFETY: Additive table only. Stores uploaded/imported solicitation package
-- text and deterministic extraction so workrooms can operate from actual RFP
-- package rules instead of source summaries alone.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_package_documents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid        NOT NULL REFERENCES public.rfp_proposals(id) ON DELETE CASCADE,
  org_id          uuid        NOT NULL REFERENCES public.rfp_orgs(id) ON DELETE CASCADE,
  opp_id          uuid        REFERENCES public.rfp_opportunities(id) ON DELETE SET NULL,
  title           text        NOT NULL,
  source_type     text        NOT NULL CHECK (source_type IN ('upload', 'url', 'paste')),
  source_url      text,
  file_name       text,
  mime_type       text,
  extracted_text  text        NOT NULL DEFAULT '',
  extracted_json  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  extracted_chars integer     NOT NULL DEFAULT 0,
  uploaded_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_package_documents_proposal_idx
  ON public.rfp_package_documents (proposal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS rfp_package_documents_org_idx
  ON public.rfp_package_documents (org_id, created_at DESC);

DROP TRIGGER IF EXISTS rfp_package_documents_set_updated_at ON public.rfp_package_documents;

CREATE TRIGGER rfp_package_documents_set_updated_at
  BEFORE UPDATE ON public.rfp_package_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.rfp_set_updated_at();

ALTER TABLE public.rfp_package_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rfp_package_documents_select ON public.rfp_package_documents;
DROP POLICY IF EXISTS rfp_package_documents_insert ON public.rfp_package_documents;
DROP POLICY IF EXISTS rfp_package_documents_update ON public.rfp_package_documents;
DROP POLICY IF EXISTS rfp_package_documents_delete ON public.rfp_package_documents;

CREATE POLICY rfp_package_documents_select ON public.rfp_package_documents
  FOR SELECT USING (
    org_id = ANY(public.rfp_my_org_ids())
  );

CREATE POLICY rfp_package_documents_insert ON public.rfp_package_documents
  FOR INSERT WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_package_documents_update ON public.rfp_package_documents
  FOR UPDATE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  ) WITH CHECK (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner','writer','reviewer']))
  );

CREATE POLICY rfp_package_documents_delete ON public.rfp_package_documents
  FOR DELETE USING (
    org_id = ANY(public.rfp_my_org_ids_with_role(ARRAY['owner']))
  );
