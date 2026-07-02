-- =============================================================================
-- RFP Engine — Funder Profiles
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Phase 26 — IRS 990/BMF foundation intelligence
-- =============================================================================
-- SAFETY: Additive table only. This stores global funder intelligence separate
-- from rfp_opportunities so non-active funders are not misrepresented as open
-- RFPs. Writes are service-role only; authenticated users get read-only access.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rfp_funder_profiles (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source              text        NOT NULL,
  source_id           text        NOT NULL,
  name                text        NOT NULL,
  ein                 text,
  city                text,
  state               text,
  zip                 text,
  subsection_code     text,
  foundation_code     text,
  deductibility_code  text,
  ruling_month        text,
  ntee_code           text,
  asset_amount        numeric,
  income_amount       numeric,
  revenue_amount      numeric,
  grant_focus         text[]      NOT NULL DEFAULT '{}'::text[],
  typical_amount_min  numeric,
  typical_amount_max  numeric,
  geo_focus           text[]      NOT NULL DEFAULT '{}'::text[],
  active_rfp_ids      uuid[]      NOT NULL DEFAULT '{}'::uuid[],
  source_url          text,
  raw_json            jsonb       NOT NULL DEFAULT '{}'::jsonb,
  last_enriched_at    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS rfp_funder_profiles_source_idx
  ON public.rfp_funder_profiles (source);

CREATE INDEX IF NOT EXISTS rfp_funder_profiles_ein_idx
  ON public.rfp_funder_profiles (ein);

CREATE INDEX IF NOT EXISTS rfp_funder_profiles_state_idx
  ON public.rfp_funder_profiles (state);

CREATE INDEX IF NOT EXISTS rfp_funder_profiles_ntee_idx
  ON public.rfp_funder_profiles (ntee_code);

CREATE INDEX IF NOT EXISTS rfp_funder_profiles_assets_idx
  ON public.rfp_funder_profiles (asset_amount DESC NULLS LAST);

ALTER TABLE public.rfp_funder_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_funder_profiles'
      AND policyname = 'rfp_funder_profiles_select_auth'
  ) THEN
    CREATE POLICY rfp_funder_profiles_select_auth
      ON public.rfp_funder_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_funder_profiles'
      AND policyname = 'rfp_funder_profiles_insert_service_only'
  ) THEN
    CREATE POLICY rfp_funder_profiles_insert_service_only
      ON public.rfp_funder_profiles
      FOR INSERT
      WITH CHECK (false);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_funder_profiles'
      AND policyname = 'rfp_funder_profiles_update_service_only'
  ) THEN
    CREATE POLICY rfp_funder_profiles_update_service_only
      ON public.rfp_funder_profiles
      FOR UPDATE
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rfp_funder_profiles'
      AND policyname = 'rfp_funder_profiles_delete_service_only'
  ) THEN
    CREATE POLICY rfp_funder_profiles_delete_service_only
      ON public.rfp_funder_profiles
      FOR DELETE
      USING (false);
  END IF;
END;
$$;
