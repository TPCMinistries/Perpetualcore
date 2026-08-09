-- Fence every Press worker lease with a unique token and make retryable
-- transcript/clip completion side effects idempotent by source job.

ALTER TABLE public.press_jobs
  ADD COLUMN IF NOT EXISTS lease_token uuid;

ALTER TABLE public.press_transcripts
  ADD COLUMN IF NOT EXISTS source_job_id uuid;
ALTER TABLE public.press_clips
  ADD COLUMN IF NOT EXISTS source_job_id uuid,
  ADD COLUMN IF NOT EXISTS source_position integer;

CREATE UNIQUE INDEX IF NOT EXISTS press_transcripts_source_job_uidx
  ON public.press_transcripts (source_job_id)
  WHERE source_job_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS press_clips_source_job_position_uidx
  ON public.press_clips (source_job_id, source_position)
  WHERE source_job_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'press_transcripts_source_job_tenant_fk'
      AND conrelid = 'public.press_transcripts'::regclass
  ) THEN
    ALTER TABLE public.press_transcripts
      ADD CONSTRAINT press_transcripts_source_job_tenant_fk
      FOREIGN KEY (source_job_id, organization_id)
      REFERENCES public.press_jobs(id, organization_id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'press_clips_source_job_tenant_fk'
      AND conrelid = 'public.press_clips'::regclass
  ) THEN
    ALTER TABLE public.press_clips
      ADD CONSTRAINT press_clips_source_job_tenant_fk
      FOREIGN KEY (source_job_id, organization_id)
      REFERENCES public.press_jobs(id, organization_id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.press_claim_next_job(
  p_worker_id text,
  p_lease_seconds integer DEFAULT 300,
  p_job_types text[] DEFAULT NULL
)
RETURNS SETOF public.press_jobs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE claimed public.press_jobs%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF char_length(p_worker_id) NOT BETWEEN 1 AND 255
     OR p_lease_seconds NOT BETWEEN 30 AND 3600 THEN
    RAISE EXCEPTION 'invalid worker lease parameters' USING ERRCODE = '22023';
  END IF;

  UPDATE public.press_jobs
  SET status = 'dead', lease_owner = NULL, lease_expires_at = NULL,
      lease_token = NULL,
      error_message = COALESCE(error_message, 'retry budget exhausted')
  WHERE attempts >= max_attempts
    AND (status IN ('pending','failed') OR (status = 'processing' AND lease_expires_at < now()));

  SELECT * INTO claimed
  FROM public.press_jobs
  WHERE attempts < max_attempts
    AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
    AND (
      status IN ('pending','failed')
      OR (status = 'processing' AND lease_expires_at < now())
    )
  ORDER BY priority DESC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.press_jobs
  SET status = 'processing',
      attempts = attempts + 1,
      lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      lease_token = gen_random_uuid(),
      error_message = NULL
  WHERE id = claimed.id AND organization_id = claimed.organization_id
  RETURNING * INTO claimed;

  RETURN NEXT claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.press_replace_transcript_for_job(
  p_job_id uuid,
  p_project_id uuid,
  p_asset_id uuid,
  p_full_text text,
  p_language text,
  p_segments jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_id uuid;
  v_transcript_id uuid;
  v_version integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_segments) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_segments) > 100000 THEN
    RAISE EXCEPTION 'segments must be an array of at most 100000 rows' USING ERRCODE = '22023';
  END IF;

  SELECT j.organization_id INTO v_org_id
  FROM public.press_jobs j
  WHERE j.id = p_job_id
    AND j.project_id = p_project_id
    AND j.asset_id = p_asset_id
    AND j.job_type = 'transcribe_media'
  FOR UPDATE;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'transcription job not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT id INTO v_transcript_id
  FROM public.press_transcripts
  WHERE source_job_id = p_job_id;
  IF v_transcript_id IS NOT NULL THEN
    RETURN v_transcript_id;
  END IF;

  PERFORM 1 FROM public.press_projects p
  JOIN public.press_assets a
    ON a.id = p_asset_id
   AND a.project_id = p.id
   AND a.organization_id = p.organization_id
  WHERE p.id = p_project_id
    AND p.organization_id = v_org_id
  FOR UPDATE OF p;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'project asset not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(max(t.version), 0) + 1 INTO v_version
  FROM public.press_transcripts t WHERE t.project_id = p_project_id;

  INSERT INTO public.press_transcripts (
    project_id, organization_id, asset_id, source_job_id,
    full_text, language, version, status
  ) VALUES (
    p_project_id, v_org_id, p_asset_id, p_job_id,
    p_full_text, p_language, v_version, 'completed'
  ) RETURNING id INTO v_transcript_id;

  INSERT INTO public.press_transcript_segments (
    transcript_id, organization_id, position, start_ms, end_ms, speaker, text, confidence
  )
  SELECT
    v_transcript_id,
    v_org_id,
    (item.ordinality - 1)::integer,
    (item.segment->>'startMs')::integer,
    (item.segment->>'endMs')::integer,
    item.segment->>'speaker',
    item.segment->>'text',
    NULLIF(item.segment->>'confidence', '')::numeric
  FROM jsonb_array_elements(p_segments) WITH ORDINALITY AS item(segment, ordinality);

  RETURN v_transcript_id;
END;
$$;

REVOKE ALL ON FUNCTION public.press_replace_transcript_for_job(uuid, uuid, uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_replace_transcript_for_job(uuid, uuid, uuid, text, text, jsonb)
  TO service_role;

COMMENT ON COLUMN public.press_jobs.lease_token IS
  'Unique claim token required on every worker report; prevents stale workers sharing an ID from completing a reclaimed job.';
COMMENT ON FUNCTION public.press_replace_transcript_for_job(uuid, uuid, uuid, text, text, jsonb) IS
  'Creates a transcription result once per source job and returns the existing transcript on safe retry.';
