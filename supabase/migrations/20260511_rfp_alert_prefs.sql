-- =============================================================================
-- RFP Alert Prefs + Audit Log — Plan 05-07 (DISC-06)
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- =============================================================================
-- Semantics:
--   • Org-default row:    user_id IS NULL, one per org_id.
--   • Per-user override:  user_id IS NOT NULL, one per (org_id, user_id).
--   • At lookup, user-override wins over org-default; if neither exists, system
--     defaults apply at runtime (see lib/rfp/alerts/prefs.ts).
--
-- Channels supported at MVP:
--   email, telegram, discord. Slack deferred per 05-CONTEXT.md.
--
-- Frequency cap is enforced in app code by counting `rfp_alert_log` rows.
-- A 6th alert in a 24h window per (user, channel) is logged with
-- status='batched' instead of dispatching; the once-per-day digest flush is
-- explicitly deferred (see .planning/phases/05-discovery/deferred-items.md →
-- ALERT-DIGEST-FLUSH).
--
-- RLS uses the SECURITY DEFINER helpers from
-- supabase/migrations/20260509_rfp_rls_fix_recursion.sql:
--   rfp_my_org_ids()         → uuid[]  (orgs current user belongs to)
--   rfp_my_owned_org_ids()   → uuid[]  (orgs where current user is 'owner')
-- =============================================================================

-- ── rfp_alert_prefs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfp_alert_prefs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = org default
  threshold         numeric     NOT NULL DEFAULT 80 CHECK (threshold BETWEEN 60 AND 100),
  email_enabled     boolean     NOT NULL DEFAULT true,
  email_address     text,                                                    -- runtime falls back to auth.users.email when null
  telegram_enabled  boolean     NOT NULL DEFAULT false,
  telegram_chat_id  text,
  discord_enabled   boolean     NOT NULL DEFAULT false,
  discord_webhook   text,
  digest_mode       boolean     NOT NULL DEFAULT false,                      -- true → batch ALL alerts (frequency-cap path)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Partial-unique indexes implement the (org_id, NULL) and (org_id, user_id)
-- composite identity. Postgres treats NULL as distinct in ordinary UNIQUE
-- constraints, so we use predicate-style partial indexes.
CREATE UNIQUE INDEX IF NOT EXISTS rfp_alert_prefs_org_default_uniq
  ON rfp_alert_prefs (org_id) WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rfp_alert_prefs_user_override_uniq
  ON rfp_alert_prefs (org_id, user_id) WHERE user_id IS NOT NULL;

-- Reuse the rfp_set_updated_at function from 20260509_rfp_schema.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rfp_alert_prefs_set_updated_at'
  ) THEN
    CREATE TRIGGER rfp_alert_prefs_set_updated_at
      BEFORE UPDATE ON rfp_alert_prefs
      FOR EACH ROW EXECUTE FUNCTION rfp_set_updated_at();
  END IF;
END;
$$;

ALTER TABLE rfp_alert_prefs ENABLE ROW LEVEL SECURITY;

-- SELECT: any org member can see all prefs for their org (default + every override).
-- This lets a member discover that an override row already exists for them and
-- read its current values. It also lets owners audit user overrides.
DROP POLICY IF EXISTS rfp_alert_prefs_select ON rfp_alert_prefs;
CREATE POLICY rfp_alert_prefs_select ON rfp_alert_prefs
  FOR SELECT
  USING (org_id = ANY(rfp_my_org_ids()));

-- Org default INSERT/UPDATE/DELETE: only owners of the org. user_id MUST be NULL.
DROP POLICY IF EXISTS rfp_alert_prefs_org_default_owner ON rfp_alert_prefs;
CREATE POLICY rfp_alert_prefs_org_default_owner ON rfp_alert_prefs
  FOR ALL
  USING (user_id IS NULL AND org_id = ANY(rfp_my_owned_org_ids()))
  WITH CHECK (user_id IS NULL AND org_id = ANY(rfp_my_owned_org_ids()));

-- Per-user override INSERT/UPDATE/DELETE: any member writing their OWN row in
-- an org they belong to. user_id MUST equal auth.uid().
DROP POLICY IF EXISTS rfp_alert_prefs_user_override_self ON rfp_alert_prefs;
CREATE POLICY rfp_alert_prefs_user_override_self ON rfp_alert_prefs
  FOR ALL
  USING (user_id = auth.uid() AND org_id = ANY(rfp_my_org_ids()))
  WITH CHECK (user_id = auth.uid() AND org_id = ANY(rfp_my_org_ids()));

-- ── rfp_alert_log (audit + frequency-cap source) ────────────────────────────
CREATE TABLE IF NOT EXISTS rfp_alert_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  opp_id      uuid        REFERENCES rfp_opportunities(id) ON DELETE SET NULL,
  channel     text        NOT NULL CHECK (channel IN ('email','telegram','discord')),
  status      text        NOT NULL CHECK (status IN ('sent','batched','failed','skipped_cap','skipped_unverified')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Frequency-cap reads always filter on (user_id, channel, created_at desc).
CREATE INDEX IF NOT EXISTS rfp_alert_log_user_channel_idx
  ON rfp_alert_log (user_id, channel, created_at DESC);

-- Org-scoped reads (e.g., "all sends for this org last 24h") — useful for
-- the settings UI showing "3 alerts batched today".
CREATE INDEX IF NOT EXISTS rfp_alert_log_org_idx
  ON rfp_alert_log (org_id, created_at DESC);

ALTER TABLE rfp_alert_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own log rows. Inserts come from the dispatch path which
-- uses createAdminClient() and therefore bypasses RLS.
DROP POLICY IF EXISTS rfp_alert_log_self ON rfp_alert_log;
CREATE POLICY rfp_alert_log_self ON rfp_alert_log
  FOR SELECT
  USING (user_id = auth.uid());
