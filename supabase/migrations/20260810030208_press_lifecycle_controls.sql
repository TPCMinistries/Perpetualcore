-- Press media deletion is coordinated by the server so database cascades can
-- never leave customer objects behind in Storage. Authenticated users retain
-- read/update access through RLS but may not bypass that lifecycle boundary.
DROP POLICY IF EXISTS press_projects_delete ON public.press_projects;
DROP POLICY IF EXISTS press_assets_delete ON public.press_assets;
DROP POLICY IF EXISTS press_clips_delete ON public.press_clips;
DROP POLICY IF EXISTS press_publications_delete ON public.press_publications;
DROP POLICY IF EXISTS press_storage_assets_delete ON storage.objects;

REVOKE DELETE ON public.press_projects, public.press_assets, public.press_clips,
  public.press_publications FROM authenticated;

-- Result provenance must not block a reviewed project cascade after Storage
-- cleanup has succeeded.
ALTER TABLE public.press_transcripts
  DROP CONSTRAINT IF EXISTS press_transcripts_source_job_tenant_fk;
ALTER TABLE public.press_transcripts
  ADD CONSTRAINT press_transcripts_source_job_tenant_fk
  FOREIGN KEY (source_job_id, organization_id)
  REFERENCES public.press_jobs(id, organization_id) ON DELETE CASCADE;

ALTER TABLE public.press_clips
  DROP CONSTRAINT IF EXISTS press_clips_source_job_tenant_fk;
ALTER TABLE public.press_clips
  ADD CONSTRAINT press_clips_source_job_tenant_fk
  FOREIGN KEY (source_job_id, organization_id)
  REFERENCES public.press_jobs(id, organization_id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.press_archive_project(
  p_project_id uuid,
  p_organization_id uuid
)
RETURNS public.press_projects
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  archived_project public.press_projects%ROWTYPE;
BEGIN
  SELECT * INTO archived_project
  FROM public.press_projects
  WHERE id = p_project_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Press project not found' USING ERRCODE = 'P0002';
  END IF;
  IF archived_project.status = 'archived' THEN
    RETURN archived_project;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.press_jobs
    WHERE project_id = p_project_id
      AND organization_id = p_organization_id
      AND status = 'processing'
      AND lease_expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Press project has active processing' USING ERRCODE = '55006';
  END IF;

  UPDATE public.press_jobs
  SET status = 'cancelled',
      lease_owner = NULL,
      lease_expires_at = NULL,
      lease_token = NULL,
      error_message = NULL,
      updated_at = now()
  WHERE project_id = p_project_id
    AND organization_id = p_organization_id
    AND (
      status IN ('pending', 'failed')
      OR (status = 'processing' AND lease_expires_at <= now())
    );

  UPDATE public.press_generation_runs
  SET status = 'cancelled', updated_at = now()
  WHERE project_id = p_project_id
    AND organization_id = p_organization_id
    AND status IN ('queued', 'processing');

  UPDATE public.press_projects
  SET status = 'archived', updated_at = now()
  WHERE id = p_project_id AND organization_id = p_organization_id
  RETURNING * INTO archived_project;

  RETURN archived_project;
END;
$$;

REVOKE ALL ON FUNCTION public.press_archive_project(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_archive_project(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.press_retry_job(
  p_job_id uuid,
  p_organization_id uuid,
  p_requested_by uuid
)
RETURNS public.press_jobs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  retried_job public.press_jobs%ROWTYPE;
  project_status text;
BEGIN
  SELECT j.* INTO retried_job
  FROM public.press_jobs j
  JOIN public.press_projects p
    ON p.id = j.project_id AND p.organization_id = j.organization_id
  WHERE j.id = p_job_id AND j.organization_id = p_organization_id
  FOR UPDATE OF j, p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Press job not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT status INTO project_status
  FROM public.press_projects
  WHERE id = retried_job.project_id AND organization_id = p_organization_id;
  IF project_status = 'archived' THEN
    RAISE EXCEPTION 'Archived projects cannot be retried' USING ERRCODE = '55006';
  END IF;
  IF retried_job.status NOT IN ('failed', 'dead') THEN
    RAISE EXCEPTION 'Press job is not retryable' USING ERRCODE = '55000';
  END IF;

  UPDATE public.press_jobs
  SET status = 'pending',
      attempts = 0,
      progress = 0,
      error_message = NULL,
      lease_owner = NULL,
      lease_expires_at = NULL,
      lease_token = NULL,
      payload = payload || jsonb_build_object(
        'manualRetry', jsonb_build_object('requestedBy', p_requested_by, 'requestedAt', now())
      ),
      updated_at = now()
  WHERE id = p_job_id AND organization_id = p_organization_id
  RETURNING * INTO retried_job;

  IF retried_job.render_id IS NOT NULL THEN
    UPDATE public.press_renders
    SET status = 'queued', updated_at = now()
    WHERE id = retried_job.render_id AND organization_id = p_organization_id;
  END IF;
  IF retried_job.generation_run_id IS NOT NULL THEN
    UPDATE public.press_generation_runs
    SET status = 'queued', error_message = NULL, updated_at = now()
    WHERE id = retried_job.generation_run_id AND organization_id = p_organization_id;
  END IF;
  UPDATE public.press_projects
  SET status = CASE WHEN retried_job.job_type = 'render_clip' THEN 'rendering' ELSE 'processing' END,
      updated_at = now()
  WHERE id = retried_job.project_id AND organization_id = p_organization_id;

  RETURN retried_job;
END;
$$;

REVOKE ALL ON FUNCTION public.press_retry_job(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_retry_job(uuid, uuid, uuid) TO service_role;

-- Keep the existing fenced claim contract, but archived projects are now a
-- terminal boundary and can never be reclaimed by a recovery sweep.
CREATE OR REPLACE FUNCTION public.press_claim_next_job(
  p_worker_id text,
  p_lease_seconds integer DEFAULT 300,
  p_job_types text[] DEFAULT NULL
)
RETURNS SETOF public.press_jobs
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
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

  SELECT j.* INTO claimed
  FROM public.press_jobs j
  JOIN public.press_projects p
    ON p.id = j.project_id AND p.organization_id = j.organization_id
  WHERE p.status <> 'archived'
    AND j.attempts < j.max_attempts
    AND (p_job_types IS NULL OR j.job_type = ANY(p_job_types))
    AND (
      j.status IN ('pending','failed')
      OR (j.status = 'processing' AND j.lease_expires_at < now())
    )
  ORDER BY j.priority DESC, j.created_at ASC
  FOR UPDATE OF j SKIP LOCKED
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

REVOKE ALL ON FUNCTION public.press_claim_next_job(text, integer, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_claim_next_job(text, integer, text[]) TO service_role;
