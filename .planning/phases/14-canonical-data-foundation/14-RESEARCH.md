# Phase 14: Canonical Data Foundation - Research

**Researched:** 2026-06-06
**Domain:** PostgreSQL schema migrations, pgvector HNSW, multi-source dedup, SaaS entitlements
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FND-01 | A unified canonical opportunity model stores both government contracts (NAICS/PSC/set-aside/agency) and grants (CFDA/eligibility/cost-share/funder) in one queryable schema | NAICS/CFDA currently live only in `keywords[]` and `raw_json`. Need typed columns via ALTER TABLE ADD COLUMN IF NOT EXISTS. See Standard Stack — Schema Pattern. |
| FND-02 | Opportunities ingested from multiple sources are normalized and deduplicated so one real opportunity appears once | `rfp_opportunity_canonicals` + `rfp_opportunity_aliases` tables already exist (migration 20260604). The canonical key derivation logic is in `lib/rfp/ingest/canonicalize.ts`. Dedup is already partially built — Phase 14 wires it in and verifies it. |
| FND-03 | A pgvector HNSW index + SECURITY DEFINER match RPC enables vault retrieval at >50 docs/org without in-Node cosine | Current index is `ivfflat`, not HNSW. `retrieve.ts` does in-Node cosine explicitly because no RPC exists. Phase 14 migrates the index and creates `match_vault_docs()` RPC. |
| FND-04 | Each org has an entitlement record (coverage level + per-operation quotas) independently overridable by an operator | `rfp_entitlements` does not exist anywhere in the codebase. Needs new table. Tier model must align with existing `rfp_org_subscriptions.tier` values ('pro', 'agency') plus a free/trial level. |
</phase_requirements>

---

## Summary

This is a brownfield phase. The majority of the infrastructure exists but has four specific gaps that must be filled with targeted migrations, not rewrites. The `rfp_opportunities` table already holds 18 typed columns but is missing the type-specific contract fields (NAICS codes as text[], PSC, set-aside) and grant fields (CFDA codes, eligibility, cost-share flag, funder name) that FND-01 requires. These fields are currently stored as prefixed strings in the `keywords[]` array (e.g., `naics:541712`, `cfda:93.600`) and in `raw_json` — both exist in production and can be promoted to named columns via additive `ALTER TABLE ADD COLUMN IF NOT EXISTS` migrations.

The canonical/alias dedup layer (FND-02) is already mostly built: `rfp_opportunity_canonicals` and `rfp_opportunity_aliases` tables exist (migration 20260604), and `lib/rfp/ingest/canonicalize.ts` implements three-tier key derivation (grants.gov ID > opportunity number > title+agency hash). What is missing is integration into the main ingest run pipeline and a verifiable test. The vault vector search (FND-03) currently uses an `ivfflat` index and in-Node cosine similarity (`lib/rfp/vault/retrieve.ts` explicitly documents this as a Phase 14 target). Phase 14 must replace the index with HNSW and create the `match_vault_docs()` SECURITY DEFINER RPC. The entitlement table (FND-04) does not exist at all and must be created from scratch.

**Primary recommendation:** Four targeted migrations + one RPC function + updated `database.types.ts`. Do not restructure the existing `rfp_opportunities` table — add columns only. Do not touch existing ingest connectors — update only the run orchestrator to call the canonical layer after upsert.

---

## Actual Current Schema (confirmed from migrations + database.types.ts)

### `rfp_opportunities` current columns
```
id, source (text pattern ^[a-z0-9_]+$ 2-64), source_id, title, agency, type,
amount_min (numeric), amount_max (numeric), deadline (timestamptz),
posted_at (timestamptz), raw_json (jsonb), created_at,
brief (text), keywords (text[]), geo (text), url (text),
needs_review (boolean), last_seen_at (timestamptz)
```
UNIQUE constraint: `(source, source_id)` — the primary dedup key for ingest.
RLS: globally readable to authenticated users (`auth.uid() IS NOT NULL`).

**Missing for FND-01 (contract-type fields):**
- `naics_codes text[]` — currently encoded as `naics:XXXXXX` entries in `keywords[]`
- `psc_code text` — only in `raw_json.productOrServiceCode` for SAM.gov
- `set_aside_code text` — only in `raw_json.typeOfSetAside` for SAM.gov

**Missing for FND-01 (grant-type fields):**
- `cfda_numbers text[]` — currently encoded as `cfda:XX.XXX` entries in `keywords[]`
- `eligibility_types text[]` — only in `raw_json` for Grants.gov records
- `cost_share_required boolean` — only in `raw_json.costSharingOrMatchingRequirement`
- `funder_name text` — overlaps `agency`; for foundation sources, `agency` is null

### `rfp_vault_artifacts` current state
```
id, org_id (FK rfp_orgs), type, title, body (text), embedding (vector(1024)), 
source_metadata (jsonb), created_at
```
Current index: `rfp_vault_artifacts_embedding_idx` — **ivfflat** `(embedding vector_cosine_ops) WITH (lists=100)`.
Dimension: **1024** (confirmed in `embed.ts`: `text-embedding-3-large` with `dimensions: 1024`).

### `rfp_opportunity_canonicals` + `rfp_opportunity_aliases` (migration 20260604)
Already created. Not yet integrated into the ingest run pipeline.

### `rfp_org_subscriptions.tier` current values
`'pro' | 'agency' | null` — these are the two paid tiers. Free/trial has no entitlement row today.

### `rfp_entitlements` — does not exist
No table, no migration, no TypeScript reference.

### Migration mechanics
No `supabase/config.toml` — project uses the Supabase MCP `apply_migration` tool directly (confirmed by existing migration headers that all say "Applied via: supabase MCP apply_migration"). Migration filenames follow the pattern `YYYYMMDD_rfp_<slug>.sql`. Each migration is applied idempotently using `IF NOT EXISTS` guards.

---

## Standard Stack

### Core
| Library/Feature | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pgvector extension | >=0.5.0 (HNSW support added 0.5.0) | vector similarity search | Already installed as `vector` extension; HNSW added in 0.5.0 |
| Supabase SECURITY DEFINER RPC | Postgres native | Bypass RLS for admin-pattern vector search | Established pattern in this codebase (`rfp_my_org_ids`, etc.) |
| `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` | Postgres | Additive brownfield migration | All Phase 14 schema changes are additive — no rewrites |
| `createAdminClient()` | existing `lib/supabase/server.ts` | All server/background DB ops | CLAUDE.md rule; all existing ingest uses this |

### Supporting
| Library/Feature | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `text-embedding-3-large` dimensions=1024 | OpenAI | Embedding for vault chunks | Already in `embed.ts`; HNSW index dimension must match |
| zod | existing | Input validation in normalizer | Already used in `normalize.ts`; any new typed fields should flow through `OpportunityRow` |

---

## Architecture Patterns

### Pattern 1: Additive Column Migrations for FND-01
**What:** Add 7 typed columns to `rfp_opportunities` via `ALTER TABLE ADD COLUMN IF NOT EXISTS`. All nullable (except arrays which default to `{}`).
**When to use:** Any time an existing table needs new typed fields without breaking existing rows or upsert paths.
**Rationale for nullable columns vs. JSONB payload vs. separate extension table:**
- Nullable typed columns are the right choice here because: (a) Phase 18 scoring reads individual fields by name in `OpportunityForScoring`; (b) queries can filter `WHERE naics_codes && ARRAY['541712']` without JSON path overhead; (c) Phase 15 ingest will populate these when sources provide them; (d) `raw_json` already holds the full source payload for any field we miss. A separate extension table (like `rfp_opportunity_enrichments`) adds a JOIN to every feed query — avoid for fields that are query predicates.

**Columns to add:**
```sql
ALTER TABLE rfp_opportunities
  ADD COLUMN IF NOT EXISTS naics_codes    text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS psc_code       text,
  ADD COLUMN IF NOT EXISTS set_aside_code text,
  ADD COLUMN IF NOT EXISTS cfda_numbers   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS eligibility_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cost_share_required boolean,
  ADD COLUMN IF NOT EXISTS funder_name    text;
```

**Indexes to add (for Phase 18 scoring queries):**
```sql
CREATE INDEX IF NOT EXISTS rfp_opportunities_naics_idx
  ON rfp_opportunities USING GIN (naics_codes);
CREATE INDEX IF NOT EXISTS rfp_opportunities_cfda_idx
  ON rfp_opportunities USING GIN (cfda_numbers);
```

**Backfill pattern** (for existing rows): Parse `keywords[]` entries with prefix `naics:` → `naics_codes`, `cfda:` → `cfda_numbers`. Run as a one-time SQL UPDATE in the migration. This is safe because `raw_json` remains the source of truth for any fields that require deeper parsing.

### Pattern 2: Dedup Wiring (FND-02)
**What:** The canonical/alias layer already exists (tables + key derivation logic). The ingest orchestrator (`lib/rfp/ingest/run.ts`) calls `upsertBatch()` but does NOT call `persistCanonicalAliases()` after upsert.
**Gap:** `lib/rfp/ingest/run.ts` needs one additional call after `upsertBatch()` succeeds: `await persistCanonicalAliases(upserted_rows)`.
**Dedup key strategy (confirmed from `canonicalize.ts`):**
1. `grants_gov:<id>` — confidence 0.98 (for Grants.gov/NIH/NSF/Fed Register)
2. `opportunity_number:<cleaned_number>` — confidence 0.90 (for SAM.gov, SBIR, state)
3. `title:<agency_slug>:<title_slug>` — confidence 0.72 (fallback)
**Verifiable test:** After wiring, ingest the same opportunity twice (seed two rows with different sources but same `canonical_key`); assert `rfp_opportunity_aliases` has 2 rows pointing to 1 `rfp_opportunity_canonicals` row.

### Pattern 3: HNSW Index Migration (FND-03)
**What:** Drop the `ivfflat` index on `rfp_vault_artifacts.embedding` and replace with HNSW.
**Why HNSW over ivfflat:** ivfflat requires `SET ivfflat.probes = N` per query for accuracy tuning; HNSW has better recall at query time with no per-query tuning. At the vault sizes this product targets (<50 docs/org initially), both work, but HNSW is the pgvector recommendation for production workloads as of pgvector 0.5+.
**Index params:**
```sql
-- Drop old
DROP INDEX IF EXISTS rfp_vault_artifacts_embedding_idx;
-- Create HNSW
CREATE INDEX rfp_vault_artifacts_embedding_idx
  ON rfp_vault_artifacts USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```
`m=16, ef_construction=64` are the pgvector documented defaults. Safe for our current data volume.

**CRITICAL — index name constraint:** FND-03 success criterion says the HNSW index is confirmed via `\d rfp_opportunities_embedding_idx` or equivalent. BUT the embedding is on `rfp_vault_artifacts`, not `rfp_opportunities`. The index name in the schema is `rfp_vault_artifacts_embedding_idx`. The success criterion text has a naming error — the planner should verify against `rfp_vault_artifacts_embedding_idx` and document this discrepancy.

### Pattern 4: `match_vault_docs()` SECURITY DEFINER RPC (FND-03)
**What:** A Postgres function that accepts `(org_id uuid, query_embedding vector(1024), match_count int)` and returns top-K vault chunks for that org using the HNSW index.
**Why SECURITY DEFINER:** The vault table has tenant-scoped RLS (`org_id = ANY(rfp_my_org_ids())`). The HNSW operator cannot be used through PostgREST's `.select()` projection — this is the explicit blocker documented in `vault/retrieve.ts`. The RPC must run as the function owner (bypassing RLS) but enforce org isolation internally via an explicit `WHERE org_id = $1` filter.
**Exact signature required by FND-03 success criterion:**
```sql
SELECT match_vault_docs(org_id, query_embedding, 50)
```
So the function must match: `match_vault_docs(org_id uuid, query_embedding vector(1024), match_count int)`

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION match_vault_docs(
  org_id        uuid,
  query_embedding vector(1024),
  match_count   int DEFAULT 8
)
RETURNS TABLE (
  id              uuid,
  body            text,
  title           text,
  type            text,
  source_metadata jsonb,
  similarity      float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
```
**Tenant isolation:** The `WHERE org_id = $1` clause is the RLS enforcement inside the SECURITY DEFINER body. The caller (Node) passes `org_id` which must be verified at the API route level before calling (the existing pattern in `vault/retrieve.ts`).

**Node update:** After the RPC exists, `lib/rfp/vault/retrieve.ts` can call it via `.rpc('match_vault_docs', { org_id, query_embedding: qvec, match_count: k })` instead of fetching all chunks. The existing in-Node fallback should remain for local dev / when the RPC is unavailable.

### Pattern 5: `rfp_entitlements` Table Design (FND-04)
**What:** New table giving each org a coverage level + per-operation quotas. Must coordinate with Phase 17 (AI cost ledger) without building Phase 17's ledger here.
**Coverage levels aligned to roadmap tiers (L1/L2/L3):**
```sql
CREATE TYPE rfp_coverage_level AS ENUM ('free', 'l1', 'l2', 'l3');
```
or as a text CHECK (to avoid migration complexity of dropping/adding enum values):
```sql
CHECK (coverage_level IN ('free', 'l1', 'l2', 'l3'))
```
- `free` = trial/unsubscribed (federal only, limited)
- `l1` = Pro tier (all federal sources)
- `l2` = Agency tier (federal + national + foundations)
- `l3` = not yet live (global), reserved for future

**Table design:**
```sql
CREATE TABLE IF NOT EXISTS rfp_entitlements (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL UNIQUE REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  coverage_level      text        NOT NULL DEFAULT 'free'
                        CHECK (coverage_level IN ('free', 'l1', 'l2', 'l3')),
  -- Per-operation quotas (NULL = unlimited for tier)
  monthly_score_quota   int,        -- max fit-score computations per month
  monthly_draft_quota   int,        -- max draft generations per month
  monthly_review_quota  int,        -- max reviewer-panel runs per month
  monthly_vault_mb      int,        -- max vault storage MB
  -- Operator override metadata
  override_by         uuid        REFERENCES auth.users(id),
  override_reason     text,
  override_at         timestamptz,
  -- Timestamps
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

**RLS:** Service-role write + org-member read (same pattern as `rfp_org_subscriptions`).
```sql
ALTER TABLE rfp_entitlements ENABLE ROW LEVEL SECURITY;
-- Members can read their org's entitlement
CREATE POLICY rfp_entitlements_select ON rfp_entitlements
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));
-- Only service role writes (operator overrides use service role client)
CREATE POLICY rfp_entitlements_service_write ON rfp_entitlements
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Operator override pattern:** An operator uses `createAdminClient()` to `upsert({ org_id, coverage_level: 'l2', override_by: admin_uid, override_reason: 'partner deal', override_at: now() })`. Because of `UNIQUE (org_id)`, this is a single-row operation that cannot affect other orgs.

**Phase 17 coordination:** The AI cost ledger (BILL-04) will add a `monthly_ai_budget_usd` column or a separate `rfp_ai_cost_ledger` table. Do NOT add that column here — Phase 17 owns that shape. The `rfp_entitlements` table should have a `monthly_score_quota` etc. that Phase 17 reads for pre-flight checks, but the per-request cost accumulation belongs in Phase 17.

**Provisioning hook:** When a Stripe webhook fires `customer.subscription.updated` or `checkout.session.completed`, the webhook handler (`lib/rfp/billing.ts`) should upsert both `rfp_org_subscriptions` and `rfp_entitlements` atomically. Phase 14 wires the entitlement upsert into the existing webhook handler.

### Anti-Patterns to Avoid
- **Do not recreate rfp_opportunities from scratch.** It has 18 columns, live RLS policies, foreign keys from 8+ tables, and production data. Add columns only.
- **Do not add type-specific tables (rfp_contract_opportunities, rfp_grant_opportunities).** A JOIN for every feed query is slower, more complex, and the Phase 18 scoring code reads a flat `OpportunityForScoring` interface. Nullable columns on one table is the right call.
- **Do not use JSONB for the new typed fields.** NAICS codes and CFDA numbers are query predicates for scoring and filtering. GIN indexes on `text[]` outperform JSON path queries.
- **Do not create the HNSW index on rfp_opportunities.** The embedding is on `rfp_vault_artifacts`. The success criterion text contains a naming error.
- **Do not wire Phase 17's AI cost guard here.** Only add the quota columns on `rfp_entitlements`; Phase 17 builds the enforcement middleware.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vector similarity at scale | In-Node cosine | `match_vault_docs()` SECURITY DEFINER RPC + HNSW | Already documented in `retrieve.ts` as the Phase 14 target; in-Node fetches all rows (~2MB+ per query at 50 docs) |
| Dedup key derivation | Custom hash logic | Existing `deriveOpportunityCanonicalKey()` in `canonicalize.ts` | Already handles grants.gov ID / opportunity number / title+agency fallback with confidence scores |
| Entitlement enforcement middleware | Custom session checks | Read from `rfp_entitlements` in API routes using `createAdminClient()` | Simple table lookup; enforcement logic belongs at the route layer, not a bespoke framework |
| Migration tracking | Custom migration table | Supabase MCP `apply_migration` with timestamped filenames | Already established pattern; all 20+ existing migrations use this |

---

## Common Pitfalls

### Pitfall 1: ivfflat vs HNSW — can't add HNSW to existing ivfflat index
**What goes wrong:** Running `CREATE INDEX ... USING hnsw` on a column that already has an `ivfflat` index will create a second index (not replace it). The old `ivfflat` index stays, consuming disk and memory.
**How to avoid:** Explicitly `DROP INDEX IF EXISTS rfp_vault_artifacts_embedding_idx` before creating the HNSW index. Use `IF NOT EXISTS` on the CREATE to make it idempotent on re-run.
**Warning signs:** `\d rfp_vault_artifacts` shows two indexes on the embedding column.

### Pitfall 2: HNSW index build time on a populated table
**What goes wrong:** Building an HNSW index on a large `rfp_vault_artifacts` table holds an `ACCESS SHARE` lock during build (for `CREATE INDEX CONCURRENTLY`). Without `CONCURRENTLY`, it holds a stronger lock that blocks writes.
**How to avoid:** Use `CREATE INDEX CONCURRENTLY` if the table has significant data. For Phase 14, the table is likely small (early in the product lifecycle); regular `CREATE INDEX` is fine. Document in the migration comment.

### Pitfall 3: SECURITY DEFINER RPC and search_path injection
**What goes wrong:** If `SET search_path = public` is omitted from the SECURITY DEFINER function, a malicious user can create a table named `rfp_vault_artifacts` in their schema and redirect the function's queries.
**How to avoid:** Always include `SET search_path = public` in every SECURITY DEFINER function. All existing functions (`rfp_my_org_ids`, etc.) do this.

### Pitfall 4: rfp_entitlements vs rfp_org_subscriptions race condition
**What goes wrong:** The Stripe webhook creates an `rfp_org_subscriptions` row but doesn't create/update `rfp_entitlements`. Reading entitlements for a new org returns 0 rows, causing a null dereference or defaulting to 'free' inadvertently.
**How to avoid:** In the webhook handler, upsert both tables in the same function call. Set the default coverage level from the subscription tier mapping at upsert time, not at read time.
**Tier mapping:**
```
tier = null (trial) → coverage_level = 'free'
tier = 'pro'        → coverage_level = 'l1'
tier = 'agency'     → coverage_level = 'l2'
```

### Pitfall 5: `rfp_my_org_ids()` cost in rfp_entitlements SELECT policy
**What goes wrong:** Using `org_id = ANY(rfp_my_org_ids())` on a frequently-read table can be slow if `rfp_user_orgs` is large. This is the established pattern for all other tenant-scoped tables and is correct here.
**How to avoid:** Keep it — the `rfp_user_orgs_user_id_idx` index covers the function. Don't use inline `EXISTS (SELECT 1 FROM rfp_user_orgs ...)` which is the pattern that caused recursion in Phase 04-01.

### Pitfall 6: Backfilling naics_codes from keywords[] — data corruption risk
**What goes wrong:** A `keywords[]` entry like `"naics:541712"` gets parsed with a naive split on `":"` which could also match `"naics:541712:extra"` or non-NAICS entries.
**How to avoid:** Use a strict prefix match: `WHERE k LIKE 'naics:%' AND k ~ '^naics:[0-9]{2,6}$'`. Same for `cfda:` entries. Run the backfill in the migration with explicit regex validation.

### Pitfall 7: `match_vault_docs()` dimension mismatch
**What goes wrong:** If a vault artifact was embedded at a different dimension (some early code used 1536 before the 1024 standardization), the `<=>` operator will throw a dimension mismatch error at query time.
**How to avoid:** Add a `WHERE char_length(embedding::text) > 10` guard (already in `retrieve.ts`), and filter `WHERE embedding IS NOT NULL` (already in the proposed RPC). A separate audit query checking for dimension mismatches should be part of the verification step.

---

## Code Examples

Verified patterns from official sources and this codebase:

### HNSW Index Creation (pgvector docs pattern)
```sql
-- Source: pgvector README (https://github.com/pgvector/pgvector)
-- Drop old ivfflat, create HNSW replacement
DROP INDEX IF EXISTS rfp_vault_artifacts_embedding_idx;
CREATE INDEX rfp_vault_artifacts_embedding_idx
  ON rfp_vault_artifacts USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### match_vault_docs RPC Call from Node (Supabase JS)
```typescript
// Source: supabase-js PostgREST RPC pattern
const { data, error } = await admin.rpc('match_vault_docs', {
  org_id: orgId,
  query_embedding: qvec,  // number[] of length 1024
  match_count: k,
});
// data is RetrievedChunk[] — map similarity column to similarity_score
```

### Entitlement Read Pattern (API routes)
```typescript
// Source: lib/rfp/billing.ts getSubscriptionForOrg pattern
const admin = createAdminClient();
const { data } = await admin
  .from('rfp_entitlements')
  .select('coverage_level, monthly_score_quota, monthly_draft_quota, monthly_review_quota')
  .eq('org_id', orgId)
  .single();
const entitlement = data ?? { coverage_level: 'free', monthly_score_quota: null, ... };
```

### Backfill naics_codes from keywords
```sql
-- Source: migration pattern — run in the 14-FND-01 migration
UPDATE rfp_opportunities
SET naics_codes = ARRAY(
  SELECT substring(k FROM 7)
  FROM unnest(keywords) AS k
  WHERE k ~ '^naics:[0-9]{2,6}$'
)
WHERE array_length(keywords, 1) > 0
  AND naics_codes = '{}';

UPDATE rfp_opportunities
SET cfda_numbers = ARRAY(
  SELECT substring(k FROM 6)
  FROM unnest(keywords) AS k
  WHERE k ~ '^cfda:[0-9]{2}\.[0-9]{3}$'
)
WHERE array_length(keywords, 1) > 0
  AND cfda_numbers = '{}';
```

### Upsert rfp_entitlements in billing webhook
```typescript
// Source: lib/rfp/billing.ts upsert pattern + CLAUDE.md createAdminClient rule
const tierToLevel = { pro: 'l1', agency: 'l2' } as const;
const coverageLevel = tier ? (tierToLevel[tier] ?? 'free') : 'free';
await admin
  .from('rfp_entitlements')
  .upsert({ org_id: orgId, coverage_level: coverageLevel, updated_at: new Date().toISOString() },
           { onConflict: 'org_id' });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ivfflat index (`lists=100`) | HNSW (`m=16, ef_construction=64`) | pgvector 0.5.0 (Aug 2023) | Better recall, no per-query probes tuning |
| In-Node cosine (all rows fetched) | SECURITY DEFINER RPC + HNSW | Phase 14 target | Scales to 50+ docs without MB-scale payloads |
| Dedup via keywords[] prefix encoding | Typed columns (naics_codes[], cfda_numbers[]) | Phase 14 | GIN index enables array overlap queries; eliminates string parsing in scoring |
| Subscription as sole entitlement signal | `rfp_entitlements` table | Phase 14 | Operator can override one org without touching Stripe; enables per-operation quota enforcement |

**Deprecated/outdated:**
- `ivfflat` index on vault artifacts: replaced by HNSW in Phase 14 migration
- In-Node cosine similarity in `vault/retrieve.ts`: superseded by `match_vault_docs()` RPC call (keep fallback for local dev)

---

## Open Questions

1. **pgvector version on `hgxxxmtfmvguotkowxbu`**
   - What we know: pgvector was installed via `CREATE EXTENSION IF NOT EXISTS vector` (migration 20260509). HNSW support requires >=0.5.0 (shipped Aug 2023).
   - What's unclear: Supabase ManagedDB pgvector version — Supabase has been shipping 0.6.0+ since late 2023 on all projects. This is almost certainly satisfied, but the planner should add a verification step: `SELECT extversion FROM pg_extension WHERE extname = 'vector'` and confirm >= 0.5.0.
   - Recommendation: Add a preflight check in Plan 14-01 that aborts if version < 0.5.0.

2. **`rfp_vault_artifacts` row count in production**
   - What we know: The table exists and is indexed. The product is pre-dogfood so row count is likely small.
   - What's unclear: Whether `CREATE INDEX CONCURRENTLY` is needed for the HNSW migration.
   - Recommendation: Use regular `CREATE INDEX` (not CONCURRENTLY) for Phase 14; add a comment that production re-index should use CONCURRENTLY when table grows beyond 10K rows.

3. **`match_vault_docs` vs `match_rfp_vault_docs` naming**
   - What we know: FND-03 success criterion hardcodes the name `match_vault_docs`.
   - What's unclear: Whether this could conflict with the existing `document_chunks`-based vector search RPCs (from the older `SETUP_VECTOR_SEARCH.sql` in the `/supabase/` root — likely stale/unused).
   - Recommendation: Check for any existing `match_vault_docs` function before creating. If one exists with a different signature, the migration needs `CREATE OR REPLACE`.

4. **Entitlement quotas: absolute or rolling 30-day?**
   - What we know: FND-04 says "per-operation quotas." Phase 17 builds the enforcement ledger.
   - What's unclear: Whether Phase 14's quota columns should be absolute limits or rolling-window. Phase 17 will build the counters.
   - Recommendation: Phase 14 stores the quota limits only (`monthly_score_quota INT`). Phase 17 defines the reset/rolling logic. Keep Phase 14 to the structural definition, not the enforcement semantics.

---

## Sources

### Primary (HIGH confidence)
- Migration `20260509_rfp_schema.sql` — base table definitions, ivfflat index creation
- Migration `20260510_rfp_opportunities_extensions.sql` — columns added to rfp_opportunities
- Migration `20260604_rfp_opportunity_canonicals.sql` — canonical/alias tables
- Migration `20260606_rfp_opportunities_source_pattern.sql` — final source constraint state
- `lib/supabase/database.types.ts` — confirmed column list from Supabase introspection
- `lib/rfp/vault/embed.ts` — confirms 1024 dimensions, `text-embedding-3-large`
- `lib/rfp/vault/retrieve.ts` — explicitly documents Phase 14 RPC as the target
- `lib/rfp/ingest/canonicalize.ts` — canonical key derivation logic
- `lib/rfp/ingest/run.ts` — upsert pattern on `(source, source_id)` conflict key
- `lib/rfp/billing.ts` — tier names ('pro', 'agency'), `rfp_org_subscriptions` upsert pattern
- `20260509_rfp_rls_fix_recursion.sql` — SECURITY DEFINER RLS helper functions pattern
- pgvector README (HNSW support since 0.5.0, m/ef_construction defaults)

### Secondary (MEDIUM confidence)
- Supabase documentation on SECURITY DEFINER RPCs and PostgREST vector search limitations (referenced in retrieve.ts comment)
- Phase 18 scoring code (`score.ts`) — `OpportunityForScoring` interface shows what typed fields Phase 18 needs

### Tertiary (LOW confidence)
- Supabase pgvector version in production: assumed >=0.5.0 based on Supabase's standard managed DB offering, but not directly queried during research. VERIFY in Plan 14-01.

---

## Metadata

**Confidence breakdown:**
- Schema gap analysis (FND-01): HIGH — confirmed against migrations + database.types.ts
- Dedup layer existing state (FND-02): HIGH — read source files directly
- HNSW RPC (FND-03): HIGH — retrieve.ts documents exactly this gap
- Entitlements design (FND-04): HIGH for structure; MEDIUM for quota semantics (Phase 17 dependency)
- pgvector HNSW support: HIGH (0.5.0 was Aug 2023, Supabase cloud has been on 0.6+ since)
- Migration mechanics: HIGH — confirmed from 20+ existing migration files

**Research date:** 2026-06-06
**Valid until:** 2026-07-06 (stable domain; pgvector API won't change in 30 days)
