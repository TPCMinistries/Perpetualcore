-- Applied via: supabase MCP apply_migration
-- Plan: 14-02 (FND-03) — HNSW index swap + match_vault_docs SECURITY DEFINER RPC
--
-- Preflight: pgvector 0.8.0 confirmed (>= 0.5.0 required for HNSW).
-- Corrects the roadmap reference to rfp_opportunities_embedding_idx — the
-- embedding index actually lives on rfp_vault_artifacts, not rfp_opportunities.
--
-- SAFETY: Only modifies index objects and creates a function.
-- No DROP TABLE. No DROP COLUMN. No data loss.

-- ─── 1. Swap ivfflat → HNSW ─────────────────────────────────────────────────
-- Must DROP the old index first to avoid two indexes on the same column (pitfall).
-- Regular CREATE INDEX (not CONCURRENTLY) — table is small pre-dogfood.
-- TODO: Use CREATE INDEX CONCURRENTLY when rfp_vault_artifacts exceeds ~10K rows
-- to avoid exclusive lock during index build.

DROP INDEX IF EXISTS rfp_vault_artifacts_embedding_idx;

CREATE INDEX rfp_vault_artifacts_embedding_idx
  ON rfp_vault_artifacts USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── 2. match_vault_docs SECURITY DEFINER RPC ───────────────────────────────
-- Signature locked by FND-03: (org_id uuid, query_embedding vector(1024), match_count int)
-- SECURITY DEFINER: executes as function owner (bypasses caller RLS) but
-- enforces tenant isolation internally via WHERE rfp_vault_artifacts.org_id = match_vault_docs.org_id.
-- SET search_path = public: prevents search_path injection attacks (pitfall #3).
-- Embedding dimension: 1024 — matches text-embedding-3-large with dimensions:1024
-- (confirmed in lib/rfp/vault/embed.ts EMBED_DIMENSIONS = 1024).

CREATE OR REPLACE FUNCTION match_vault_docs(
  org_id          uuid,
  query_embedding vector(1024),
  match_count     int DEFAULT 8
)
RETURNS TABLE (
  id              uuid,
  body            text,
  title           text,
  type            text,
  source_metadata jsonb,
  similarity      float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    id,
    body,
    title,
    type,
    source_metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM rfp_vault_artifacts
  WHERE rfp_vault_artifacts.org_id = match_vault_docs.org_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
