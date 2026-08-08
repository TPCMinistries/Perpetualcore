-- Generation Studio: durable, tenant-scoped production briefs.
-- Phase A activates Authentic Clip Pack. Avatar and narrated recipes remain
-- visible but fail closed until their provider adapters and consent flows are configured.

CREATE TABLE IF NOT EXISTS public.press_generation_runs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id          uuid NOT NULL,
  recipe              text NOT NULL CHECK (recipe IN (
                        'authentic_clip_pack','avatar_explainer','narrated_visual_essay'
                      )),
  provider            text NOT NULL CHECK (provider IN ('internal','heygen','elevenlabs','chatterbox')),
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN (
                        'draft','awaiting_approval','queued','processing','review','ready',
                        'partial','failed','cancelled'
                      )),
  title               text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 180),
  brief               text NOT NULL DEFAULT '' CHECK (char_length(brief) <= 2000),
  script              text CHECK (script IS NULL OR char_length(script) BETWEEN 1 AND 20000),
  script_approved_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  script_approved_at  timestamptz,
  consent_id          uuid,
  config              jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  output_count        integer NOT NULL DEFAULT 0 CHECK (output_count >= 0),
  provider_job_id     text CHECK (provider_job_id IS NULL OR char_length(provider_job_id) <= 255),
  error_message       text CHECK (error_message IS NULL OR char_length(error_message) <= 4000),
  idempotency_key     text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  created_by          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, idempotency_key),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (consent_id, organization_id)
    REFERENCES public.press_voice_consents(id, organization_id) ON DELETE RESTRICT,
  CHECK ((script_approved_by IS NULL) = (script_approved_at IS NULL)),
  CHECK (recipe <> 'authentic_clip_pack' OR provider = 'internal'),
  CHECK (recipe <> 'avatar_explainer' OR provider = 'heygen'),
  CHECK (recipe <> 'narrated_visual_essay' OR provider IN ('elevenlabs','chatterbox'))
);

CREATE INDEX IF NOT EXISTS press_generation_runs_project_idx
  ON public.press_generation_runs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS press_generation_runs_org_status_idx
  ON public.press_generation_runs (organization_id, status, updated_at DESC);

ALTER TABLE public.press_generation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY press_generation_runs_select ON public.press_generation_runs FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
REVOKE ALL ON public.press_generation_runs FROM PUBLIC, anon;
GRANT SELECT ON public.press_generation_runs TO authenticated;
GRANT ALL ON public.press_generation_runs TO service_role;

ALTER TABLE public.press_jobs
  ADD COLUMN IF NOT EXISTS generation_run_id uuid;
ALTER TABLE public.press_clips
  ADD COLUMN IF NOT EXISTS generation_run_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'press_jobs_generation_run_tenant_fk'
      AND conrelid = 'public.press_jobs'::regclass
  ) THEN
    ALTER TABLE public.press_jobs
      ADD CONSTRAINT press_jobs_generation_run_tenant_fk
      FOREIGN KEY (generation_run_id, organization_id)
      REFERENCES public.press_generation_runs(id, organization_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'press_clips_generation_run_tenant_fk'
      AND conrelid = 'public.press_clips'::regclass
  ) THEN
    ALTER TABLE public.press_clips
      ADD CONSTRAINT press_clips_generation_run_tenant_fk
      FOREIGN KEY (generation_run_id, organization_id)
      REFERENCES public.press_generation_runs(id, organization_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Preserve the existing allowlist while making provider job names explicit for later phases.
ALTER TABLE public.press_jobs DROP CONSTRAINT IF EXISTS press_jobs_job_type_check;
ALTER TABLE public.press_jobs ADD CONSTRAINT press_jobs_job_type_check CHECK (job_type IN (
  'probe_media','transcribe_media','score_clips','render_clip',
  'generate_avatar','synthesize_voice','compose_visual_essay',
  'ingest','transcribe','analyze','render','publish','analytics'
));

CREATE OR REPLACE FUNCTION public.press_queue_authentic_clip_pack(
  p_organization_id uuid,
  p_project_id uuid,
  p_created_by uuid,
  p_title text,
  p_brief text,
  p_config jsonb,
  p_idempotency_key text
)
RETURNS public.press_generation_runs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run public.press_generation_runs%ROWTYPE;
  v_transcript_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_config) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'config must be an object' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.press_projects
    WHERE id = p_project_id AND organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'project not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT id INTO v_transcript_id FROM public.press_transcripts
    WHERE project_id = p_project_id AND organization_id = p_organization_id
      AND status = 'completed'
    ORDER BY version DESC LIMIT 1;
  IF v_transcript_id IS NULL THEN
    RAISE EXCEPTION 'completed transcript required' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.press_generation_runs (
    organization_id, project_id, recipe, provider, status, title, brief,
    config, idempotency_key, created_by
  ) VALUES (
    p_organization_id, p_project_id, 'authentic_clip_pack', 'internal', 'queued',
    p_title, COALESCE(p_brief, ''), p_config, p_idempotency_key, p_created_by
  )
  ON CONFLICT (organization_id, idempotency_key) DO UPDATE
    SET updated_at = public.press_generation_runs.updated_at
  RETURNING * INTO v_run;

  INSERT INTO public.press_jobs (
    organization_id, project_id, generation_run_id, job_type, status, priority,
    attempts, max_attempts, progress, payload, result, idempotency_key
  ) VALUES (
    p_organization_id, p_project_id, v_run.id, 'score_clips', 'pending', 60,
    0, 3, 0,
    jsonb_build_object('transcriptId', v_transcript_id, 'generationRunId', v_run.id),
    '{}'::jsonb, 'generation_score:' || v_run.id::text
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.press_queue_authentic_clip_pack(uuid, uuid, uuid, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_queue_authentic_clip_pack(uuid, uuid, uuid, text, text, jsonb, text)
  TO service_role;

COMMENT ON TABLE public.press_generation_runs IS
  'Durable Generation Studio briefs, approvals, provider state, and output provenance.';
