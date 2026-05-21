-- =============================================================================
-- RFP & Proposal Engine — Schema Migration v1
-- Phase 04-01: Foundations & Salvage Port
-- Project: LDC Brain AI (hgxxxmtfmvguotkowxbu)
-- Applied via: supabase MCP apply_migration (name: rfp_schema_v1)
-- =============================================================================
-- SAFETY: All statements use CREATE TABLE IF NOT EXISTS.
--         No ALTER or DROP of any existing table.
--         Vector extension created IF NOT EXISTS (idempotent).
-- =============================================================================

-- Enable pgvector extension (needed for rfp_vault_artifacts.embedding)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 1. rfp_orgs — Tenant root
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_orgs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  type              text        NOT NULL CHECK (type IN ('nonprofit', 'forprofit', 'dual')),
  naics             text[]      NOT NULL DEFAULT '{}',
  voice_fingerprint jsonb       NOT NULL DEFAULT '{}'::jsonb,
  capacity_summary  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. rfp_users — User profile mirror (auth source is auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_users (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  role       text        NOT NULL DEFAULT 'writer' CHECK (role IN ('owner', 'writer', 'reviewer', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. rfp_user_orgs — Many-to-many membership; RLS keys off this table
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_user_orgs (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('owner', 'writer', 'reviewer', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS rfp_user_orgs_org_id_idx  ON rfp_user_orgs (org_id);
CREATE INDEX IF NOT EXISTS rfp_user_orgs_user_id_idx ON rfp_user_orgs (user_id);

-- =============================================================================
-- 4. rfp_capture_profiles — Org profile snapshots (versioned)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_capture_profiles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  version       int         NOT NULL DEFAULT 1,
  profile_json  jsonb       NOT NULL,
  voice_examples text[]     NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, version)
);

-- =============================================================================
-- 5. rfp_vault_artifacts — Past wins, partner letters, etc. + vector embeddings
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_vault_artifacts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  type            text        NOT NULL,
  title           text        NOT NULL,
  body            text,
  embedding       vector(1024),  -- BGE-M3 dimension per TECH-SPEC § 2.2
  source_metadata jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ivfflat index for approximate nearest-neighbor embedding search
CREATE INDEX IF NOT EXISTS rfp_vault_artifacts_embedding_idx
  ON rfp_vault_artifacts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- 6. rfp_opportunities — Discovered opportunities (global; no org_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_opportunities (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source     text        NOT NULL CHECK (source IN (
               'sam_gov', 'grants_gov', 'simpler_grants', 'sbir', 'ny_state', 'nyc_dycd', 'foundation_url'
             )),
  source_id  text,
  title      text        NOT NULL,
  agency     text,
  type       text,
  amount_min numeric,
  amount_max numeric,
  deadline   timestamptz,
  posted_at  timestamptz,
  raw_json   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS rfp_opportunities_deadline_idx ON rfp_opportunities (deadline);
CREATE INDEX IF NOT EXISTS rfp_opportunities_source_idx   ON rfp_opportunities (source);

-- =============================================================================
-- 7. rfp_opp_matches — Per-org fit scores for opportunities
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_opp_matches (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id         uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  org_id         uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  fit_score      numeric     NOT NULL CHECK (fit_score BETWEEN 0 AND 100),
  win_prob       numeric     CHECK (win_prob BETWEEN 0 AND 1),
  recommendation text,
  scored_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, org_id)
);

-- =============================================================================
-- 8. rfp_proposals — A proposal in progress
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_proposals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  opp_id        uuid        REFERENCES rfp_opportunities(id),
  title         text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN (
                  'draft', 'in_review', 'compliance', 'submitted', 'awarded', 'lost'
                )),
  due_date      timestamptz,
  owner_user_id uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. rfp_proposal_sections — Section drafts (versioned)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_proposal_sections (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id               uuid        NOT NULL REFERENCES rfp_proposals(id) ON DELETE CASCADE,
  section_type              text        NOT NULL,
  content                   text,
  version                   int         NOT NULL DEFAULT 1,
  last_drafted_by_agent_at  timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_proposal_sections_proposal_id_idx ON rfp_proposal_sections (proposal_id);

-- =============================================================================
-- 10. rfp_compliance_checks — Pre-submit validation results
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_compliance_checks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid        NOT NULL REFERENCES rfp_proposals(id) ON DELETE CASCADE,
  check_type   text        NOT NULL,
  status       text        NOT NULL CHECK (status IN ('pass', 'fail', 'warn')),
  details_json jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 11. rfp_agent_sessions — Agent call audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS rfp_agent_sessions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id        uuid        REFERENCES rfp_proposals(id) ON DELETE CASCADE,
  org_id             uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,  -- denormalized for RLS
  agent              text        NOT NULL CHECK (agent IN (
                       'discovery', 'capture', 'drafting', 'reviewer', 'compliance'
                     )),
  session_id         text,
  model              text,
  tokens_in          int,
  tokens_out         int,
  cost_usd           numeric,
  prompt_encrypted   bytea,
  response_encrypted bytea,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rfp_agent_sessions_proposal_id_idx ON rfp_agent_sessions (proposal_id);
CREATE INDEX IF NOT EXISTS rfp_agent_sessions_org_id_idx      ON rfp_agent_sessions (org_id);

-- =============================================================================
-- updated_at triggers for rfp_orgs and rfp_proposals
-- =============================================================================
CREATE OR REPLACE FUNCTION rfp_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rfp_orgs_set_updated_at'
  ) THEN
    CREATE TRIGGER rfp_orgs_set_updated_at
      BEFORE UPDATE ON rfp_orgs
      FOR EACH ROW EXECUTE FUNCTION rfp_set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rfp_proposals_set_updated_at'
  ) THEN
    CREATE TRIGGER rfp_proposals_set_updated_at
      BEFORE UPDATE ON rfp_proposals
      FOR EACH ROW EXECUTE FUNCTION rfp_set_updated_at();
  END IF;
END;
$$;
