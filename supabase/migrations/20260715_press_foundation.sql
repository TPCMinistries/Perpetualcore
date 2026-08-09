-- =============================================================================
-- Press — organization-scoped media pipeline foundation
-- =============================================================================
-- Additive only. DO NOT execute automatically. Before applying, verify that the
-- live organization_members role/status vocabulary is owner/admin/member/viewer
-- and active (or NULL for legacy active rows).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.press_my_org_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(om.organization_id), ARRAY[]::uuid[])
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND (om.status IS NULL OR om.status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.press_has_org_role(p_org_id uuid, p_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = p_org_id
      AND (om.status IS NULL OR om.status = 'active')
      AND (p_roles IS NULL OR om.role = ANY(p_roles))
  );
$$;

-- Storage paths are attacker-controlled text. Comparing UUIDs as text avoids a
-- malformed first path segment raising an exception during policy evaluation.
CREATE OR REPLACE FUNCTION public.press_has_org_role_text(p_org_id text, p_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = p_org_id
      AND (om.status IS NULL OR om.status = 'active')
      AND (p_roles IS NULL OR om.role = ANY(p_roles))
  );
$$;

REVOKE ALL ON FUNCTION public.press_my_org_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.press_has_org_role(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.press_has_org_role_text(text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.press_my_org_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.press_has_org_role(uuid, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.press_has_org_role_text(text, text[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.press_set_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Prevent moving an existing row between tenants or rewriting audit ownership.
CREATE OR REPLACE FUNCTION public.press_protect_row_identity()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'press organization_id is immutable' USING ERRCODE = '42501';
  END IF;
  IF (to_jsonb(NEW) ? 'created_by')
     AND (to_jsonb(NEW)->'created_by') IS DISTINCT FROM (to_jsonb(OLD)->'created_by') THEN
    RAISE EXCEPTION 'press created_by is immutable' USING ERRCODE = '42501';
  END IF;
  IF (to_jsonb(NEW) ? 'rights_attested_by')
     AND (
       (to_jsonb(NEW)->'rights_attested_by') IS DISTINCT FROM (to_jsonb(OLD)->'rights_attested_by')
       OR (to_jsonb(NEW)->'rights_attested_at') IS DISTINCT FROM (to_jsonb(OLD)->'rights_attested_at')
     ) THEN
    RAISE EXCEPTION 'press rights attestation is immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.press_brand_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  logo_object_path  text CHECK (logo_object_path IS NULL OR char_length(logo_object_path) <= 1024),
  palette           jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(palette) = 'object'),
  typography        jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(typography) = 'object'),
  caption_defaults  jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(caption_defaults) = 'object'),
  is_default        boolean NOT NULL DEFAULT false,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  version           integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS press_brand_profiles_one_default_idx
  ON public.press_brand_profiles (organization_id) WHERE is_default;

CREATE TABLE IF NOT EXISTS public.press_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  rights_attested_at timestamptz NOT NULL,
  rights_attested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  brand_id          uuid,
  title             text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft', 'uploading', 'processing', 'transcribing',
                      'review', 'rendering', 'ready', 'failed', 'archived'
                    )),
  platforms         text[] NOT NULL DEFAULT '{}',
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CHECK ((rights_attested_at IS NULL) = (rights_attested_by IS NULL)),
  CHECK (rights_attested_at <= now()),
  FOREIGN KEY (brand_id, organization_id)
    REFERENCES public.press_brand_profiles(id, organization_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS press_projects_org_updated_idx
  ON public.press_projects (organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS press_projects_org_status_idx
  ON public.press_projects (organization_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.press_assets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL,
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind               text NOT NULL CHECK (kind IN ('source','source_video','source_audio','image','logo','font','caption','proxy','poster','other')),
  bucket             text NOT NULL CHECK (bucket IN ('press-assets','press-renders')),
  storage_path       text NOT NULL CHECK (char_length(storage_path) BETWEEN 1 AND 1024),
  original_filename  text NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
  mime_type          text NOT NULL CHECK (char_length(mime_type) BETWEEN 1 AND 127),
  file_size          bigint NOT NULL CHECK (file_size BETWEEN 0 AND 2147483648),
  checksum           text CHECK (checksum IS NULL OR char_length(checksum) BETWEEN 16 AND 256),
  duration_seconds   numeric CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 86400),
  status             text NOT NULL DEFAULT 'awaiting_upload' CHECK (status IN (
                       'awaiting_upload','uploaded','processing','ready','failed'
                     )),
  metadata           jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path),
  UNIQUE (id, organization_id),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS press_assets_project_idx ON public.press_assets (project_id, created_at);
CREATE INDEX IF NOT EXISTS press_assets_org_status_idx ON public.press_assets (organization_id, status);

CREATE TABLE IF NOT EXISTS public.press_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id        uuid NOT NULL,
  asset_id          uuid,
  render_id         uuid,
  job_type          text NOT NULL CHECK (job_type IN (
                      'probe_media','transcribe_media','score_clips','render_clip',
                      'ingest','transcribe','analyze','render','publish','analytics'
                    )),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending','processing','completed','failed','dead','cancelled'
                    )),
  priority          integer NOT NULL DEFAULT 0 CHECK (priority BETWEEN -100 AND 100),
  attempts          integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts      integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 20),
  progress          integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  result            jsonb CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  error_message     text CHECK (error_message IS NULL OR char_length(error_message) <= 2000),
  lease_owner       text CHECK (lease_owner IS NULL OR char_length(lease_owner) <= 255),
  lease_expires_at  timestamptz,
  idempotency_key   text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (idempotency_key),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.press_assets(id, organization_id) ON DELETE CASCADE,
  CHECK (attempts <= max_attempts),
  CHECK ((lease_owner IS NULL) = (lease_expires_at IS NULL)),
  CHECK (status <> 'completed' OR progress = 100)
);
CREATE INDEX IF NOT EXISTS press_jobs_claim_idx
  ON public.press_jobs (priority DESC, created_at)
  WHERE status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS press_jobs_lease_idx
  ON public.press_jobs (lease_expires_at) WHERE status = 'processing';

CREATE TABLE IF NOT EXISTS public.press_transcripts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id          uuid NOT NULL,
  full_text         text NOT NULL DEFAULT '' CHECK (char_length(full_text) <= 5000000),
  language          text CHECK (language IS NULL OR char_length(language) <= 35),
  version           integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version),
  UNIQUE (id, organization_id),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id, organization_id)
    REFERENCES public.press_assets(id, organization_id) ON DELETE CASCADE,
  CHECK (status <> 'completed' OR char_length(full_text) > 0)
);
CREATE INDEX IF NOT EXISTS press_transcripts_project_version_idx
  ON public.press_transcripts (project_id, version DESC);

CREATE TABLE IF NOT EXISTS public.press_transcript_segments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id     uuid NOT NULL,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position          integer NOT NULL CHECK (position >= 0),
  start_ms          integer NOT NULL CHECK (start_ms >= 0),
  end_ms            integer NOT NULL CHECK (end_ms > start_ms),
  speaker           text CHECK (speaker IS NULL OR char_length(speaker) <= 100),
  text              text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 20000),
  confidence        numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transcript_id, position),
  FOREIGN KEY (transcript_id, organization_id)
    REFERENCES public.press_transcripts(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS press_transcript_segments_timing_idx
  ON public.press_transcript_segments (transcript_id, start_ms);

CREATE TABLE IF NOT EXISTS public.press_clips (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version           integer NOT NULL DEFAULT 1 CHECK (version > 0),
  start_ms          integer NOT NULL CHECK (start_ms >= 0),
  end_ms            integer NOT NULL CHECK (end_ms > start_ms),
  title             text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  hook              text CHECK (hook IS NULL OR char_length(hook) <= 2000),
  summary           text CHECK (summary IS NULL OR char_length(summary) <= 4000),
  score             numeric CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  scores            jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(scores) = 'object'),
  status            text NOT NULL DEFAULT 'proposed' CHECK (status IN (
                      'proposed','approved','rejected','rendering','rendered'
                    )),
  rejection_reason  text CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 2000),
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL)),
  CHECK (status NOT IN ('approved','rejected','rendering','rendered') OR reviewed_at IS NOT NULL),
  CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS press_clips_project_status_idx
  ON public.press_clips (project_id, status, score DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.press_renders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL,
  clip_id           uuid NOT NULL,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  aspect_ratio      text NOT NULL DEFAULT '9:16' CHECK (aspect_ratio IN ('9:16','1:1','16:9')),
  template          text CHECK (template IS NULL OR char_length(template) BETWEEN 1 AND 100),
  caption_style     text CHECK (caption_style IS NULL OR char_length(caption_style) BETWEEN 1 AND 100),
  status            text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','rendering','completed','failed')),
  output_bucket     text CHECK (output_bucket IS NULL OR output_bucket IN ('press-assets','press-renders')),
  output_path       text CHECK (output_path IS NULL OR char_length(output_path) <= 1024),
  settings          jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (clip_id, organization_id)
    REFERENCES public.press_clips(id, organization_id) ON DELETE CASCADE,
  CHECK ((output_bucket IS NULL) = (output_path IS NULL)),
  CHECK (status <> 'completed' OR output_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS press_renders_project_status_idx
  ON public.press_renders (project_id, status, updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'press_jobs_render_tenant_fk'
      AND conrelid = 'public.press_jobs'::regclass
  ) THEN
    ALTER TABLE public.press_jobs
      ADD CONSTRAINT press_jobs_render_tenant_fk
      FOREIGN KEY (render_id, organization_id)
      REFERENCES public.press_renders(id, organization_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.press_voice_consents (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject_name          text NOT NULL CHECK (char_length(btrim(subject_name)) BETWEEN 1 AND 200),
  consent_scope         text NOT NULL CHECK (consent_scope IN ('transcription','voice_clone','likeness','all_media')),
  purpose               text NOT NULL CHECK (char_length(btrim(purpose)) BETWEEN 1 AND 1000),
  consented_at          timestamptz NOT NULL,
  revoked_at            timestamptz,
  evidence_object_path  text NOT NULL CHECK (char_length(evidence_object_path) <= 1024),
  evidence_sha256       text NOT NULL CHECK (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  collected_by          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CHECK (revoked_at IS NULL OR revoked_at >= consented_at)
);

CREATE TABLE IF NOT EXISTS public.press_publish_targets (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider              text NOT NULL CHECK (provider IN ('youtube','linkedin','instagram','tiktok','facebook','x','other')),
  account_label         text NOT NULL CHECK (char_length(btrim(account_label)) BETWEEN 1 AND 120),
  external_account_id   text NOT NULL CHECK (char_length(external_account_id) BETWEEN 1 AND 255),
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked','error')),
  adapter_configured    boolean NOT NULL DEFAULT false,
  non_secret_config     jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(non_secret_config) = 'object'),
  created_by            uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_account_id),
  UNIQUE (id, organization_id)
);

-- Server-only credential references. No authenticated grants or policies.
CREATE TABLE IF NOT EXISTS public.press_publish_credentials (
  publish_target_id uuid PRIMARY KEY,
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  secret_id         uuid NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (publish_target_id, organization_id)
    REFERENCES public.press_publish_targets(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.press_publications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id             uuid NOT NULL,
  clip_id                uuid NOT NULL,
  render_id              uuid NOT NULL,
  publish_target_id      uuid,
  provider               text NOT NULL CHECK (provider IN ('manual','youtube','linkedin','instagram','tiktok','facebook','x','other')),
  mode                   text NOT NULL CHECK (mode IN ('manual_export','scheduled')),
  status                 text NOT NULL DEFAULT 'draft' CHECK (status IN (
                          'draft','scheduled','export_ready','publishing',
                          'published','failed','cancelled'
                        )),
  scheduled_for          timestamptz,
  approved_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at            timestamptz,
  external_content_id    text CHECK (external_content_id IS NULL OR char_length(external_content_id) <= 255),
  external_url           text CHECK (external_url IS NULL OR char_length(external_url) <= 2048),
  idempotency_key         text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  error_message           text CHECK (error_message IS NULL OR char_length(error_message) <= 4000),
  last_attempt_at         timestamptz,
  published_at            timestamptz,
  created_by              uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (id, organization_id),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (clip_id, organization_id)
    REFERENCES public.press_clips(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (render_id, organization_id)
    REFERENCES public.press_renders(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (publish_target_id, organization_id)
    REFERENCES public.press_publish_targets(id, organization_id) ON DELETE RESTRICT,
  CHECK ((approved_by IS NULL) = (approved_at IS NULL)),
  CHECK (mode <> 'scheduled' OR (publish_target_id IS NOT NULL AND scheduled_for IS NOT NULL)),
  CHECK (mode <> 'manual_export' OR publish_target_id IS NULL),
  CHECK (status NOT IN ('scheduled','publishing','published') OR approved_at IS NOT NULL),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS press_publications_schedule_idx
  ON public.press_publications (scheduled_for)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS press_publications_project_idx
  ON public.press_publications (project_id, updated_at DESC);

-- Publishing is fail-closed. Authenticated editors may prepare/cancel records,
-- but only a service-role worker can enter provider execution states, and only
-- when its target is active and explicitly marked adapter-configured.
CREATE OR REPLACE FUNCTION public.press_guard_publication_transition()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE target_ready boolean;
BEGIN
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
    IF auth.role() IS DISTINCT FROM 'service_role'
       AND NOT public.press_has_org_role(NEW.organization_id, ARRAY['owner','admin']) THEN
      RAISE EXCEPTION 'publication approval requires owner or admin' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.status IN ('publishing','published') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'provider publishing is service-role only' USING ERRCODE = '42501';
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.press_publish_targets t
      WHERE t.id = NEW.publish_target_id
        AND t.organization_id = NEW.organization_id
        AND t.status = 'active'
        AND t.adapter_configured = true
    ) INTO target_ready;
    IF NOT target_ready THEN
      RAISE EXCEPTION 'publish target is not active and adapter-configured' USING ERRCODE = '55000';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS press_publications_guard_transition ON public.press_publications;
CREATE TRIGGER press_publications_guard_transition
  BEFORE UPDATE ON public.press_publications
  FOR EACH ROW EXECUTE FUNCTION public.press_guard_publication_transition();

CREATE TABLE IF NOT EXISTS public.press_analytics_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id             uuid NOT NULL,
  clip_id                uuid,
  publish_target_id      uuid,
  provider               text NOT NULL CHECK (char_length(provider) BETWEEN 1 AND 50),
  external_content_id    text CHECK (external_content_id IS NULL OR char_length(external_content_id) <= 255),
  metric                 text NOT NULL CHECK (metric IN (
                          'impression','view','completion','like','comment','share',
                          'save','click','follower','watch_time_ms'
                        )),
  value                  numeric NOT NULL CHECK (value >= 0),
  dimensions             jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(dimensions) = 'object'),
  observed_at            timestamptz NOT NULL,
  source_event_id        text CHECK (source_event_id IS NULL OR char_length(source_event_id) <= 255),
  created_at             timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (project_id, organization_id)
    REFERENCES public.press_projects(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (clip_id, organization_id)
    REFERENCES public.press_clips(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (publish_target_id, organization_id)
    REFERENCES public.press_publish_targets(id, organization_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS press_analytics_provider_dedupe_idx
  ON public.press_analytics_events (organization_id, provider, publish_target_id, source_event_id, metric)
  WHERE source_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS press_analytics_org_observed_idx
  ON public.press_analytics_events (organization_id, observed_at DESC);

-- =============================================================================
-- Service-role queue/transcript RPCs
-- =============================================================================
-- One caller atomically claims one eligible job. Expired leases are reclaimable,
-- exhausted jobs are dead-lettered, and SKIP LOCKED permits multiple workers.
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
      error_message = NULL
  WHERE id = claimed.id AND organization_id = claimed.organization_id
  RETURNING * INTO claimed;

  RETURN NEXT claimed;
END;
$$;

-- Replace a project's transcript atomically by creating the next immutable
-- version and all of its segments. Existing versions remain available for audit.
CREATE OR REPLACE FUNCTION public.press_replace_transcript(
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

  SELECT p.organization_id INTO v_org_id
  FROM public.press_projects p
  JOIN public.press_assets a
    ON a.id = p_asset_id
   AND a.project_id = p.id
   AND a.organization_id = p.organization_id
  WHERE p.id = p_project_id
  FOR UPDATE OF p;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'project asset not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(max(t.version), 0) + 1 INTO v_version
  FROM public.press_transcripts t WHERE t.project_id = p_project_id;

  INSERT INTO public.press_transcripts (
    project_id, organization_id, asset_id, full_text, language, version, status
  ) VALUES (
    p_project_id, v_org_id, p_asset_id, p_full_text, p_language, v_version, 'completed'
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

-- Optimistic editor update: row version check, text update, and complete segment
-- replacement happen in one transaction. A version conflict returns zero rows.
CREATE OR REPLACE FUNCTION public.press_update_transcript(
  p_transcript_id uuid,
  p_expected_version integer,
  p_full_text text,
  p_segments jsonb
)
RETURNS SETOF public.press_transcripts
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_row public.press_transcripts%ROWTYPE;
  updated_row public.press_transcripts%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_segments) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_segments) > 100000 THEN
    RAISE EXCEPTION 'segments must be an array of at most 100000 rows' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO current_row FROM public.press_transcripts
  WHERE id = p_transcript_id FOR UPDATE;
  IF NOT FOUND OR current_row.version <> p_expected_version THEN RETURN; END IF;

  UPDATE public.press_transcripts
  SET full_text = p_full_text, version = version + 1
  WHERE id = current_row.id AND version = p_expected_version
  RETURNING * INTO updated_row;
  IF NOT FOUND THEN RETURN; END IF;

  DELETE FROM public.press_transcript_segments
  WHERE transcript_id = current_row.id
    AND organization_id = current_row.organization_id;

  INSERT INTO public.press_transcript_segments (
    transcript_id, organization_id, position, start_ms, end_ms, speaker, text, confidence
  )
  SELECT
    current_row.id,
    current_row.organization_id,
    (item.ordinality - 1)::integer,
    (item.segment->>'startMs')::integer,
    (item.segment->>'endMs')::integer,
    item.segment->>'speaker',
    item.segment->>'text',
    NULLIF(item.segment->>'confidence', '')::numeric
  FROM jsonb_array_elements(p_segments) WITH ORDINALITY AS item(segment, ordinality);

  RETURN NEXT updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.press_claim_next_job(text, integer, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.press_replace_transcript(uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.press_update_transcript(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_claim_next_job(text, integer, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.press_replace_transcript(uuid, uuid, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.press_update_transcript(uuid, integer, text, jsonb) TO service_role;

-- Timestamp and immutable-identity triggers.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'press_brand_profiles','press_projects','press_assets','press_jobs',
    'press_transcripts','press_transcript_segments','press_clips','press_renders',
    'press_voice_consents','press_publish_targets','press_publish_credentials',
    'press_publications'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_set_updated_at', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_protect_identity', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.press_set_updated_at()', t || '_set_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.press_protect_row_identity()', t || '_protect_identity', t);
  END LOOP;
END $$;

-- Consent evidence is append-only; administrative updates may only set or clear
-- revoked_at. The generic timestamp trigger owns updated_at.
CREATE OR REPLACE FUNCTION public.press_protect_consent_evidence()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['revoked_at','updated_at'])
     IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['revoked_at','updated_at']) THEN
    RAISE EXCEPTION 'consent evidence is immutable; revoke instead' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS press_voice_consents_protect_evidence ON public.press_voice_consents;
CREATE TRIGGER press_voice_consents_protect_evidence
  BEFORE UPDATE ON public.press_voice_consents
  FOR EACH ROW EXECUTE FUNCTION public.press_protect_consent_evidence();

-- =============================================================================
-- Row-level security
-- =============================================================================
ALTER TABLE public.press_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_voice_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_publish_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_publish_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_analytics_events ENABLE ROW LEVEL SECURITY;

-- Keep the migration safe to replay during local development by replacing only
-- policies owned by the Press namespace.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'press\_%' ESCAPE '\'
      AND schemaname IN ('public','storage')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );
  END LOOP;
END $$;

-- Members read core project data. Editors create/update; only admins delete.
CREATE POLICY press_projects_select ON public.press_projects FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_projects_insert ON public.press_projects FOR INSERT TO authenticated
  WITH CHECK (
    public.press_has_org_role(organization_id, ARRAY['owner','admin','member'])
    AND created_by = auth.uid()
    AND rights_attested_by = auth.uid()
  );
CREATE POLICY press_projects_update ON public.press_projects FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_projects_delete ON public.press_projects FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_assets_select ON public.press_assets FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_assets_insert ON public.press_assets FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_assets_update ON public.press_assets FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_assets_delete ON public.press_assets FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_jobs_select ON public.press_jobs FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
-- Job writes are service-role only.

CREATE POLICY press_transcripts_select ON public.press_transcripts FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_transcripts_update ON public.press_transcripts FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));

CREATE POLICY press_segments_select ON public.press_transcript_segments FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_segments_update ON public.press_transcript_segments FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));

CREATE POLICY press_clips_select ON public.press_clips FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_clips_insert ON public.press_clips FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_clips_update ON public.press_clips FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_clips_delete ON public.press_clips FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_renders_select ON public.press_renders FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
-- Render writes are service-role only.

CREATE POLICY press_brand_select ON public.press_brand_profiles FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_brand_insert ON public.press_brand_profiles FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']) AND created_by = auth.uid());
CREATE POLICY press_brand_update ON public.press_brand_profiles FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']));
CREATE POLICY press_brand_delete ON public.press_brand_profiles FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_consents_select ON public.press_voice_consents FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));
CREATE POLICY press_consents_insert ON public.press_voice_consents FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']) AND collected_by = auth.uid());
CREATE POLICY press_consents_update ON public.press_voice_consents FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']));
-- Consent rows cannot be deleted by authenticated users; revoke instead.

CREATE POLICY press_targets_select ON public.press_publish_targets FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));
CREATE POLICY press_targets_insert ON public.press_publish_targets FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']) AND created_by = auth.uid());
CREATE POLICY press_targets_update ON public.press_publish_targets FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin']));
CREATE POLICY press_targets_delete ON public.press_publish_targets FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_publications_select ON public.press_publications FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_publications_insert ON public.press_publications FOR INSERT TO authenticated
  WITH CHECK (
    public.press_has_org_role(organization_id, ARRAY['owner','admin','member'])
    AND created_by = auth.uid()
    AND status IN ('draft','export_ready')
    AND (approved_by IS NULL OR approved_by = auth.uid())
  );
CREATE POLICY press_publications_update ON public.press_publications FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (
    public.press_has_org_role(organization_id, ARRAY['owner','admin','member'])
    AND status NOT IN ('publishing','published')
  );
CREATE POLICY press_publications_delete ON public.press_publications FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_analytics_select ON public.press_analytics_events FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
-- Credentials and analytics writes remain service-role only.

REVOKE ALL ON public.press_brand_profiles, public.press_projects, public.press_assets,
  public.press_jobs, public.press_transcripts, public.press_transcript_segments,
  public.press_clips, public.press_renders, public.press_voice_consents,
  public.press_publish_targets, public.press_publish_credentials,
  public.press_publications, public.press_analytics_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_projects, public.press_assets, public.press_clips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_brand_profiles, public.press_publish_targets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_publications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.press_voice_consents TO authenticated;
GRANT SELECT, UPDATE ON public.press_transcripts, public.press_transcript_segments TO authenticated;
GRANT SELECT ON public.press_jobs, public.press_renders, public.press_analytics_events TO authenticated;
GRANT ALL ON public.press_brand_profiles, public.press_projects, public.press_assets,
  public.press_jobs, public.press_transcripts, public.press_transcript_segments,
  public.press_clips, public.press_renders, public.press_voice_consents,
  public.press_publish_targets, public.press_publish_credentials,
  public.press_publications, public.press_analytics_events TO service_role;

-- =============================================================================
-- Private storage. Path contract: <organization-id>/<project-id>/<random-name>.
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('press-assets', 'press-assets', false, 2147483648, ARRAY[
    'video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4',
    'audio/wav','audio/x-wav','audio/webm','image/png','image/jpeg',
    'image/webp','image/svg+xml','font/woff','font/woff2','application/pdf'
  ]),
  ('press-renders', 'press-renders', false, 2147483648, ARRAY[
    'video/mp4','video/webm','audio/mpeg','text/vtt','application/x-subrip'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY press_storage_assets_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'press-assets' AND public.press_has_org_role_text((storage.foldername(name))[1], NULL));
CREATE POLICY press_storage_assets_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'press-assets'
    AND (storage.foldername(name))[2] IS NOT NULL
    AND public.press_has_org_role_text((storage.foldername(name))[1], ARRAY['owner','admin','member'])
  );
CREATE POLICY press_storage_assets_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'press-assets'
    AND public.press_has_org_role_text((storage.foldername(name))[1], ARRAY['owner','admin'])
  );
CREATE POLICY press_storage_renders_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'press-renders' AND public.press_has_org_role_text((storage.foldername(name))[1], NULL));
-- Only service-role workers write or delete renders.

COMMENT ON TABLE public.press_jobs IS 'Service-role work queue with leases, retries, progress, and idempotency.';
COMMENT ON TABLE public.press_publish_credentials IS 'Server-only Supabase Vault secret references; never exposed to authenticated clients.';
COMMENT ON TABLE public.press_publications IS 'Fail-closed approved export/publishing ledger; provider execution is service-role only.';
COMMENT ON TABLE public.press_analytics_events IS 'Service-role append-only provider measurements.';
COMMENT ON TABLE public.press_voice_consents IS 'Retained voice/likeness consent evidence; revoke rather than delete.';
