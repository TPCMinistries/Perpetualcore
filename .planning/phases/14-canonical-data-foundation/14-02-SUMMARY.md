---
phase: 14-canonical-data-foundation
plan: "02"
subsystem: database
tags: [pgvector, hnsw, supabase, vault, retrieval, rpc, security-definer]

# Dependency graph
requires:
  - phase: 13-pre-work-stabilization
    provides: stable codebase with vault artifacts table and ivfflat embedding index

provides:
  - HNSW index on rfp_vault_artifacts.embedding (replaces ivfflat, m=16, ef_construction=64)
  - match_vault_docs(org_id uuid, query_embedding vector(1024), match_count int) SECURITY DEFINER RPC
  - RPC-first retrieval path in lib/rfp/vault/retrieve.ts with in-Node cosine fallback

affects:
  - phase-18-scoring (depends on match_vault_docs for vault-grounded scoring)
  - phase-14-04 (will regen database.types.ts to type the match_vault_docs RPC)
  - any future vault retrieval consumers

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER RPC with SET search_path = public for safe tenant-isolated vector search
    - Primary RPC path with graceful in-Node cosine fallback on RPC error
    - as-unknown-as cast for untyped RPC (with comment pointing to 14-04 regen)

key-files:
  created:
    - supabase/migrations/20260606_rfp_vault_hnsw_match_rpc.sql
  modified:
    - lib/rfp/vault/retrieve.ts

key-decisions:
  - "HNSW index name is rfp_vault_artifacts_embedding_idx (not rfp_opportunities_embedding_idx as incorrectly listed in ROADMAP success criterion — corrected here)"
  - "Used as unknown as cast for untyped RPC call — plan 14-04 regen will resolve when database.types.ts is regenerated"
  - "In-Node cosine fallback retained (not deleted) to preserve local dev safety and graceful degradation"

patterns-established:
  - "Pattern: SECURITY DEFINER + SET search_path = public for all tenant-isolation RPCs"
  - "Pattern: RPC-first with console.error fallback for vault retrieval"

requirements-completed: [FND-03]

# Metrics
duration: 15min
completed: 2026-06-06
---

# Phase 14 Plan 02: HNSW Index + match_vault_docs RPC Summary

**pgvector HNSW index swap (ivfflat → m=16/ef_construction=64) + SECURITY DEFINER match_vault_docs(org_id, vector(1024), int) RPC; retrieve.ts wired RPC-first with in-Node cosine fallback retained**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-06T21:30:33Z
- **Completed:** 2026-06-06T21:45:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Confirmed pgvector 0.8.0 (> 0.5.0 minimum) before building HNSW index
- Dropped ivfflat `rfp_vault_artifacts_embedding_idx` and created HNSW replacement (m=16, ef_construction=64)
- Created `match_vault_docs` SECURITY DEFINER RPC with exact FND-03 signature, tenant isolation via `WHERE org_id = $1` inside SECURITY DEFINER, and `SET search_path = public` pinned
- Updated `retrieve.ts` to call the RPC as primary path, map `MatchVaultDocsRow` (typed, no `any`) to `RetrievedChunk`, and fall back to in-Node cosine on RPC error

## Task Commits

Each task was committed atomically:

1. **Task 1: Preflight pgvector version, swap ivfflat→HNSW, create match_vault_docs RPC** - `0740638` (feat)
2. **Task 2: Wire retrieve.ts to call match_vault_docs with in-Node cosine fallback** - `1ad7ff6` (feat)

**Plan metadata:** (docs commit — created below)

## Files Created/Modified
- `supabase/migrations/20260606_rfp_vault_hnsw_match_rpc.sql` — Migration: drops ivfflat, creates HNSW index, defines match_vault_docs SECURITY DEFINER RPC
- `lib/rfp/vault/retrieve.ts` — Updated retrieval helper: RPC-first primary path + in-Node cosine fallback

## Decisions Made

**1. ROADMAP index name correction: `rfp_vault_artifacts_embedding_idx` (not `rfp_opportunities_embedding_idx`)**
The ROADMAP.md success criterion for FND-03 references `rfp_opportunities_embedding_idx`, which is a naming error. The embedding index has always lived on `rfp_vault_artifacts`, not `rfp_opportunities`. The correct name is `rfp_vault_artifacts_embedding_idx` — confirmed via `pg_indexes` introspection before and after migration. All code and migrations use the correct name. The ROADMAP reference is the only place with the wrong name.

**2. `as unknown as` cast for untyped RPC call**
`database.types.ts` does not yet include `match_vault_docs` (plan 14-04 will regenerate types). The call is cast via `as unknown as Promise<{ data: MatchVaultDocsRow[] | null; error: ... }>` with a comment indicating 14-04 will remove the cast. No `any` types used.

**3. In-Node cosine fallback retained**
The existing `cosineSimilarity` and `parseVectorLiteral` helpers were kept intact as the fallback path. This supports local dev environments that haven't applied the migration and provides safe degradation if the RPC is unavailable.

## Deviations from Plan

None - plan executed exactly as written. The `as unknown as` cast approach was explicitly specified in the plan for handling the pre-14-04 state.

## Issues Encountered

None. The `supabase db query --linked --file` flag worked correctly for applying the migration. pgvector version (0.8.0) and zero pre-existing `match_vault_docs` function confirmed cleanly in preflight.

## User Setup Required

None - no external service configuration required. Migration was applied directly to `hgxxxmtfmvguotkowxbu` via the Supabase CLI linked mode.

## Next Phase Readiness
- Phase 14 plan 03 (entitlements table) and plan 04 (database.types.ts regen) can proceed — they do not depend on this plan
- Phase 18 scoring can rely on `match_vault_docs` being the vault retrieval foundation
- When plan 14-04 regenerates `database.types.ts`, the `as unknown as` cast in `retrieve.ts` should be removed

---
*Phase: 14-canonical-data-foundation*
*Completed: 2026-06-06*
