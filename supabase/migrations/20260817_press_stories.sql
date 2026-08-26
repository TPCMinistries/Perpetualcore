-- =============================================================================
-- Press Stories — AI-interviewed content from a batch of photos/videos + notes
-- =============================================================================
-- Additive only. Depends on 20260715_press_foundation.sql (press_has_org_role,
-- press_has_org_role_text, press_set_updated_at, press_protect_row_identity,
-- the press-assets storage bucket). DO NOT execute automatically.
-- Storage path contract: stories/<organization-id>/<story-id>/<asset-id>.<ext>
-- (note the leading `stories/` segment — org id is the SECOND path segment,
-- unlike press-assets' project paths where org id is the first).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.press_stories (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title               text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  voice_key           text NOT NULL CHECK (voice_key IN (
                        'perpetual-core', 'iha-academy', 'lorenzodc', 'uplift',
                        'tpc-ministries', 'streams-of-grace', 'default'
                      )),
  notes               text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 4000),
  status              text NOT NULL DEFAULT 'collecting' CHECK (status IN (
                        'collecting', 'interviewing', 'generating', 'ready', 'failed'
                      )),
  interview           jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(interview) = 'array'),
  interview_complete  boolean NOT NULL DEFAULT false,
  outputs             jsonb CHECK (outputs IS NULL OR jsonb_typeof(outputs) = 'object'),
  error_message       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);
CREATE INDEX IF NOT EXISTS press_stories_org_updated_idx
  ON public.press_stories (organization_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.press_story_assets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id           uuid NOT NULL,
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind               text NOT NULL CHECK (kind IN ('image', 'video')),
  storage_path       text NOT NULL CHECK (char_length(storage_path) <= 1024),
  poster_path        text CHECK (poster_path IS NULL OR char_length(poster_path) <= 1024),
  mime_type          text NOT NULL CHECK (char_length(mime_type) <= 100),
  file_size          bigint NOT NULL CHECK (file_size > 0),
  width              integer CHECK (width IS NULL OR width > 0),
  height             integer CHECK (height IS NULL OR height > 0),
  duration_ms        integer CHECK (duration_ms IS NULL OR duration_ms > 0),
  original_filename  text CHECK (original_filename IS NULL OR char_length(original_filename) <= 255),
  caption_hint       text CHECK (caption_hint IS NULL OR char_length(caption_hint) <= 2000),
  status             text NOT NULL DEFAULT 'awaiting_upload' CHECK (status IN (
                       'awaiting_upload', 'uploaded', 'failed'
                     )),
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (story_id, organization_id)
    REFERENCES public.press_stories(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS press_story_assets_story_sort_idx
  ON public.press_story_assets (story_id, sort_order);

-- Timestamp and immutable-identity triggers (reuses the foundation functions).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['press_stories', 'press_story_assets'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_set_updated_at', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_protect_identity', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.press_set_updated_at()', t || '_set_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.press_protect_row_identity()', t || '_protect_identity', t);
  END LOOP;
END $$;

-- =============================================================================
-- Row-level security
-- =============================================================================
ALTER TABLE public.press_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_story_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS press_stories_select ON public.press_stories;
DROP POLICY IF EXISTS press_stories_insert ON public.press_stories;
DROP POLICY IF EXISTS press_stories_update ON public.press_stories;
DROP POLICY IF EXISTS press_stories_delete ON public.press_stories;
DROP POLICY IF EXISTS press_story_assets_select ON public.press_story_assets;
DROP POLICY IF EXISTS press_story_assets_insert ON public.press_story_assets;
DROP POLICY IF EXISTS press_story_assets_update ON public.press_story_assets;
DROP POLICY IF EXISTS press_story_assets_delete ON public.press_story_assets;

-- Members read; editors (owner/admin/member) create and update; only admins/owners delete.
CREATE POLICY press_stories_select ON public.press_stories FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_stories_insert ON public.press_stories FOR INSERT TO authenticated
  WITH CHECK (
    public.press_has_org_role(organization_id, ARRAY['owner','admin','member'])
    AND created_by = auth.uid()
  );
CREATE POLICY press_stories_update ON public.press_stories FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_stories_delete ON public.press_stories FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY press_story_assets_select ON public.press_story_assets FOR SELECT TO authenticated
  USING (public.press_has_org_role(organization_id, NULL));
CREATE POLICY press_story_assets_insert ON public.press_story_assets FOR INSERT TO authenticated
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_story_assets_update ON public.press_story_assets FOR UPDATE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']))
  WITH CHECK (public.press_has_org_role(organization_id, ARRAY['owner','admin','member']));
CREATE POLICY press_story_assets_delete ON public.press_story_assets FOR DELETE TO authenticated
  USING (public.press_has_org_role(organization_id, ARRAY['owner','admin']));

REVOKE ALL ON public.press_stories, public.press_story_assets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_stories, public.press_story_assets TO authenticated;
GRANT ALL ON public.press_stories, public.press_story_assets TO service_role;

-- =============================================================================
-- Storage — stories live in the existing press-assets bucket under a `stories/`
-- prefix: stories/<organization-id>/<story-id>/<asset-id>.<ext>. Org id is the
-- SECOND path segment here (unlike the `<org>/<project>/...` project layout),
-- so the foundation migration's press_storage_assets_* policies (which read
-- segment [1] as org id) do not cover this prefix. Uploads are always minted
-- server-side with the service role, so authenticated access is read-only.
-- =============================================================================
DROP POLICY IF EXISTS press_storage_story_assets_select ON storage.objects;
CREATE POLICY press_storage_story_assets_select ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'press-assets'
    AND (storage.foldername(name))[1] = 'stories'
    AND public.press_has_org_role_text((storage.foldername(name))[2], NULL)
  );

COMMENT ON TABLE public.press_stories IS 'A batch of photos/videos + notes, an AI interview, and generated brand-voice content.';
COMMENT ON TABLE public.press_story_assets IS 'Photos/videos attached to a press_stories row; uploaded via server-minted signed URLs.';
