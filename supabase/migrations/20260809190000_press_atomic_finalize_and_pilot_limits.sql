-- Atomic Press upload reservation/finalization for the invite-only pilot.
-- These RPCs are service-role only because the application authenticates the
-- caller and enforces organization roles before invoking them.

CREATE OR REPLACE FUNCTION public.press_reserve_asset_upload(
  p_asset_id uuid,
  p_project_id uuid,
  p_organization_id uuid,
  p_kind text,
  p_bucket text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_file_size bigint,
  p_checksum text DEFAULT NULL
)
RETURNS public.press_assets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset public.press_assets%ROWTYPE;
  v_reserved_bytes bigint;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF p_file_size NOT BETWEEN 1 AND 536870912 THEN
    RAISE EXCEPTION 'pilot file size limit exceeded' USING ERRCODE = '22023';
  END IF;
  IF p_mime_type NOT IN (
    'video/mp4','video/quicktime','video/webm',
    'audio/mpeg','audio/mp4','audio/wav','audio/x-m4a'
  ) THEN
    RAISE EXCEPTION 'unsupported media type' USING ERRCODE = '22023';
  END IF;

  -- Serialize reservations per organization so simultaneous requests cannot
  -- both pass the same storage allowance.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text, 9152026));
  PERFORM 1
  FROM public.press_projects
  WHERE id = p_project_id
    AND organization_id = p_organization_id
    AND status <> 'archived'
    AND rights_attested_at IS NOT NULL
    AND rights_attested_by IS NOT NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'eligible project not found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.press_assets
    WHERE project_id = p_project_id
      AND organization_id = p_organization_id
      AND kind IN ('source','source_video','source_audio')
  ) THEN
    RAISE EXCEPTION 'source upload already reserved' USING ERRCODE = '23505';
  END IF;

  SELECT COALESCE(sum(file_size), 0)::bigint
  INTO v_reserved_bytes
  FROM public.press_assets
  WHERE organization_id = p_organization_id;
  IF v_reserved_bytes + p_file_size > 10737418240 THEN
    RAISE EXCEPTION 'workspace storage allowance exceeded' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.press_assets (
    id, project_id, organization_id, kind, bucket, storage_path,
    original_filename, mime_type, file_size, checksum, duration_seconds,
    status, metadata
  ) VALUES (
    p_asset_id, p_project_id, p_organization_id, p_kind, p_bucket, p_storage_path,
    p_original_filename, p_mime_type, p_file_size, p_checksum, NULL,
    'awaiting_upload', '{}'::jsonb
  )
  RETURNING * INTO v_asset;

  UPDATE public.press_projects
  SET status = 'uploading', updated_at = now()
  WHERE id = p_project_id AND organization_id = p_organization_id;

  RETURN v_asset;
END;
$$;

CREATE OR REPLACE FUNCTION public.press_finalize_asset_upload(
  p_asset_id uuid,
  p_checksum text DEFAULT NULL,
  p_duration_seconds numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset public.press_assets%ROWTYPE;
  v_job public.press_jobs%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_asset
  FROM public.press_assets
  WHERE id = p_asset_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'asset not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_asset.status NOT IN ('awaiting_upload', 'uploaded') THEN
    RAISE EXCEPTION 'asset cannot be finalized from status %', v_asset.status USING ERRCODE = 'P0001';
  END IF;
  IF v_asset.checksum IS NOT NULL AND p_checksum IS NOT NULL AND v_asset.checksum <> p_checksum THEN
    RAISE EXCEPTION 'checksum does not match upload intent' USING ERRCODE = '22000';
  END IF;

  UPDATE public.press_assets
  SET status = 'uploaded',
      checksum = COALESCE(p_checksum, checksum),
      duration_seconds = COALESCE(p_duration_seconds, duration_seconds),
      updated_at = now()
  WHERE id = v_asset.id AND organization_id = v_asset.organization_id
  RETURNING * INTO v_asset;

  INSERT INTO public.press_jobs (
    organization_id, project_id, asset_id, render_id, job_type, status,
    priority, attempts, max_attempts, progress, payload, result,
    error_message, lease_owner, lease_expires_at, idempotency_key
  ) VALUES (
    v_asset.organization_id, v_asset.project_id, v_asset.id, NULL,
    'probe_media', 'pending', 50, 0, 3, 0,
    jsonb_build_object('assetId', v_asset.id), '{}'::jsonb,
    NULL, NULL, NULL, 'probe_media:' || v_asset.id::text
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET updated_at = public.press_jobs.updated_at
  RETURNING * INTO v_job;

  UPDATE public.press_projects
  SET status = 'processing', updated_at = now()
  WHERE id = v_asset.project_id
    AND organization_id = v_asset.organization_id
    AND status <> 'archived';

  RETURN jsonb_build_object('asset', to_jsonb(v_asset), 'job', to_jsonb(v_job));
END;
$$;

REVOKE ALL ON FUNCTION public.press_reserve_asset_upload(
  uuid, uuid, uuid, text, text, text, text, text, bigint, text
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.press_finalize_asset_upload(uuid, text, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_reserve_asset_upload(
  uuid, uuid, uuid, text, text, text, text, text, bigint, text
) TO service_role;
GRANT EXECUTE ON FUNCTION public.press_finalize_asset_upload(uuid, text, numeric)
  TO service_role;

-- The live bucket historically omitted the browser MIME value used by M4A.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4','video/quicktime','video/webm',
  'audio/mpeg','audio/mp4','audio/wav','audio/x-m4a',
  'image/jpeg','image/png','application/json'
]::text[],
file_size_limit = 536870912
WHERE id = 'press-assets';

COMMENT ON FUNCTION public.press_reserve_asset_upload(uuid, uuid, uuid, text, text, text, text, text, bigint, text)
  IS 'Atomically reserves one source upload while enforcing Press pilot media and storage limits.';
COMMENT ON FUNCTION public.press_finalize_asset_upload(uuid, text, numeric)
  IS 'Idempotently finalizes a source asset and queues its first media job in one transaction.';
