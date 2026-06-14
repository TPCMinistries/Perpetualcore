# Phase 18: Explainable Fit Scoring — Research

**Researched:** 2026-06-07
**Domain:** LLM-grounded fit scoring, vault retrieval, opportunity detail UI
**Confidence:** HIGH — all findings verified from actual codebase

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCORE-01 | Each opportunity shows a fit score with a plain-English explanation of why it fits | Existing `summary` column in `rfp_opp_matches` + `DetailPane.tsx` already renders it; needs vault-grounded rewrite |
| SCORE-02 | Explanation cites the org's own vault artifacts / prior wins by name with excerpt | `retrieveVaultChunks()` + `match_vault_docs` RPC exists; citation rendering is net-new |
| SCORE-03 | Score breaks down by dimension: mission fit, eligibility, track record, capacity, funder relationship | `score_breakdown` JSONB column exists but holds the OLD 5-component model (naics/keyword/geo/dollar_band/past_funder); new 5-dimension schema maps almost 1:1 but needs vault evidence attached |
| SCORE-04 | Flags disqualifiers (missing past-performance threshold, ineligible entity type) | `rfp_opportunities.set_aside_code` + `rfp_orgs.type` + `rfp_opportunities.eligibility_types` exist; disqualifier check logic is net-new |
</phase_requirements>

---

## Summary

Phase 18 is the first LLM-heavy feature in v2.0. The scoring infrastructure is more mature than the phase description implies: a deterministic 5-component scorer (`lib/rfp/scoring/score.ts`) plus a 1-2 sentence AI summary (`lib/rfp/scoring/summary.ts`) already run for every (opportunity, org) pair via `lib/rfp/scoring/recompute.ts`. All LLM calls are already wired through `guardedLLMCall` (Phase 17). The `DetailPane.tsx` already renders chips, a fit score, and a summary section.

What Phase 18 adds is the **vault-grounding layer**: instead of the current opaque "Capacity OK" chip, the scoring explanation must cite a specific vault artifact by name with an excerpt, and must break down into the five SCORE-03 dimensions with per-dimension sub-scores. The existing `score_breakdown` JSONB column in `rfp_opp_matches` is the right place to persist this — it just needs a richer schema. A separate `rfp_fit_evidence` table is the cleanest design to store cited vault chunks (avoids bloating the match row with large JSONB blobs). The disqualifier check (SCORE-04) requires comparing `rfp_orgs.type` + `rfp_entitlements.coverage_level` against `rfp_opportunities.set_aside_code` + `eligibility_types`.

**Primary recommendation:** Extend `lib/rfp/scoring/score.ts` with a vault-grounded path that calls `retrieveVaultChunks()` for semantic evidence, maps the existing 5 components onto the 5 SCORE-03 dimensions, adds disqualifier checks, and writes cited artifacts to a new `rfp_fit_evidence` table. The `summary.ts` prompt grows to cite artifacts by ID. `DetailPane.tsx` grows a new "Fit Reasoning" section below the existing chips.

---

## Standard Stack

### Core (all confirmed in codebase)

| Library / API | Version | Purpose | Notes |
|---------------|---------|---------|-------|
| `@anthropic-ai/sdk` | installed | Claude for scoring prose + citation | Used in `summary.ts`; use `claude-sonnet-4-5` (primary) / `claude-haiku-4-5` (fallback) |
| `lib/rfp/ai/guardrail.ts` | Phase 17 DONE | `guardedLLMCall` wraps every LLM call | MANDATORY — skip means budget leak |
| `lib/rfp/vault/retrieve.ts` | Phase 14 DONE | `retrieveVaultChunks(orgId, query, { k })` → `RetrievedChunk[]` | Calls `match_vault_docs` HNSW RPC; falls back to in-Node cosine |
| `lib/rfp/vault/embed.ts` | Phase 14 DONE | `embedChunks([query])` | Needed only if a query embedding isn't cached |
| `lib/rfp/scoring/score.ts` | Existing | `scoreOpportunity(opp, profile)` → `ScoreBreakdown` | Deterministic; no DB/AI; extend or wrap |
| `lib/rfp/scoring/recompute.ts` | Existing | Cron + per-org orchestrator | Calls score + summary; Phase 18 extends the cron path |
| `lib/supabase/server.ts` | Standard | `createAdminClient()` for background ops | Always for cron/server writes |
| Zod | installed | Schema validation on API routes | Follow existing route pattern |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `lib/rfp/scoring/weights.ts` | `WEIGHTS`, `TIER_THRESHOLDS`, `tierFor()` | Read existing; Phase 18 adds new dimension weights but can reuse the 30/25/20/15/10 mapping |
| `lib/rfp/scoring/summary.ts` | `generateFitSummary()` → `FitSummaryResult` | Extend prompt to include vault citations |
| `lib/rfp/enrichment/generate.ts` | `ELIGIBILITY_RULES` regex for disqualifier check | Reuse patterns |

**Installation:** No new npm packages needed. All required libraries already present.

---

## Architecture Patterns

### Existing Data Flow (understand before extending)

```
cron ingest fires
  → scoreNewOpportunitiesForAllActiveOrgs(oppIds)    [recompute.ts]
    → loadOpportunities() + loadActiveOrgIds()
    → for each (opp, org):
        scoreOpportunity(opp, profile)               [score.ts — deterministic]
        guardedLLMCall(orgId, () => generateFitSummary(...))  [summary.ts]
    → upsertMatches(rows) → rfp_opp_matches
```

### Phase 18 Extended Flow

```
same cron trigger
  → for each (opp, org):
      1. scoreOpportunity(opp, profile)               [unchanged — base scores]
      2. retrieveVaultChunks(orgId, opp.title + " " + opp.brief, { k: 5 })
         → up to 5 RetrievedChunk[] (doc_title, text, similarity_score, doc_id)
      3. checkDisqualifiers(opp, org)
         → DisqualifierFlag[]   [new pure fn — no DB/AI]
      4. buildDimensionBreakdown(baseBreakdown, vaultChunks, opp)
         → ExplainedDimensions  [new pure fn — maps 5 base scores → 5 SCORE-03 dims]
      5. guardedLLMCall(orgId, () => generateExplainedSummary(opp, profile, dims, vaultChunks, flags))
         → ExplainedSummaryResult {text, citedArtifactIds[], tokensIn, tokensOut, costUsd}
      6. upsertMatches(row with richer score_breakdown + summary)
      7. upsertFitEvidence(opp_id, org_id, vaultChunks used, dims)  → rfp_fit_evidence
```

### Recommended Project Structure (new files only)

```
lib/rfp/scoring/
├── score.ts             # unchanged
├── summary.ts           # extend prompt to include vault citation block
├── recompute.ts         # extend per-pair to call retrieveVaultChunks + disqualifier
├── weights.ts           # unchanged
├── disqualifiers.ts     # NEW: checkDisqualifiers(opp, org) → DisqualifierFlag[]
├── dimensions.ts        # NEW: mapToDimensions(breakdown, vaultChunks) → ExplainedDimensions
└── evidence-store.ts    # NEW: upsertFitEvidence(opp_id, org_id, ...) → rfp_fit_evidence

app/(dashboard)/org/[orgId]/discovery/parts/
├── DetailPane.tsx        # extend: add FitReasoningPanel section
├── FitReasoningPanel.tsx # NEW: renders 5 dims + disqualifiers + vault citations
└── VaultCitation.tsx     # NEW: cited artifact name + excerpt chip
```

### Pattern 1: Vault-Grounded Evidence Retrieval

**What:** Retrieve top-5 vault chunks most semantically similar to the opportunity, attach to scoring.

**When to use:** Every (opp, org) pair during cron scoring AND on-demand when the user opens the detail pane.

```typescript
// Source: lib/rfp/vault/retrieve.ts (existing)
const chunks = await retrieveVaultChunks(
  orgId,
  `${opp.title} ${opp.agency ?? ''} ${opp.brief?.slice(0, 300) ?? ''}`,
  { k: 5 }
);
// Returns: RetrievedChunk[] = { id, similarity_score, text, doc_title, doc_type, chunk_index, doc_id }
```

**Important:** `retrieveVaultChunks` calls `embedChunks([query])` internally — this costs ~$0.00013 per query (text-embedding-3-large at $0.13/M tokens, ~1k tokens). At 50 opps × 10 orgs = 500 queries, that's ~$0.065/run. Well within budget guardrail.

**Note on embedding cost:** The embed call inside `retrieveVaultChunks` is NOT currently routed through `guardedLLMCall` (embed-only calls have no `org_id` at query time — see Phase 17 STATE.md note about `extract.ts` deferred). For Phase 18, the vault retrieval embed should be tracked under the `scoring_v2` agent label. Route the full `retrieveVaultChunks` + `generateExplainedSummary` block together through one `guardedLLMCall` so cost is captured.

### Pattern 2: Dimension Mapping (5 SCORE-03 dims from existing 5 components)

The existing `ScoreBreakdown` from `score.ts` maps naturally onto the required SCORE-03 dimensions:

| SCORE-03 Dimension | Existing Component | Data Source |
|--------------------|-------------------|-------------|
| **Mission fit** | `keyword` (25%) + vault semantic similarity | `capacity_keywords`, `rfp_capture_profiles.profile_json`, vault chunks |
| **Eligibility** | `naics` (30%) + `set_aside_code` check | `rfp_orgs.type`, `rfp_orgs.naics`, `rfp_opportunities.set_aside_code`, `eligibility_types` |
| **Track record** | `past_funder` (10%) + vault `past_proposal` / `case_study` chunks | `rfp_orgs.past_funders` (profile_json), vault chunks of type `past_proposal` |
| **Capacity** | `dollar_band` (15%) + vault `annual_report` chunks | `rfp_capture_profiles.profile_json.typical_award_band`, vault chunks of type `annual_report` |
| **Funder relationship** | `past_funder` (10%) + geo (20%) | `profile_json.past_funders`, `rfp_opportunities.agency` |

**Note:** "Track record" and "funder relationship" both partially derive from `past_funder`. The distinction is: track record = "have we won similar grants?" (vault `past_proposal` evidence); funder relationship = "have we worked with THIS funder?" (agency name match + `past_funder` string). They can share the same base score but cite different vault evidence.

### Pattern 3: Disqualifier Check (SCORE-04, pure function, no AI/DB)

```typescript
// lib/rfp/scoring/disqualifiers.ts (NEW)
export interface DisqualifierFlag {
  dimension: 'eligibility' | 'track_record' | 'capacity';
  severity: 'hard' | 'soft';
  label: string;          // e.g. "Entity type ineligible: set-aside is small-business only"
  field: string;          // e.g. "set_aside_code"
}

export function checkDisqualifiers(
  opp: { set_aside_code: string | null; eligibility_types: string[]; naics_codes: string[] },
  org: { type: 'nonprofit' | 'forprofit' | 'dual'; naics: string[] }
): DisqualifierFlag[]
```

**Concrete checks to implement:**
1. `set_aside_code` = 'SBA' or 'SDVOSB' or '8A' and `org.type = 'nonprofit'` → hard disqualifier: "Set-aside restricts to small businesses; nonprofit orgs are not eligible"
2. `eligibility_types` includes 'Small businesses' and `org.type = 'nonprofit'` → hard disqualifier
3. `eligibility_types` includes 'Nonprofit organizations' and `org.type = 'forprofit'` → hard disqualifier
4. `naics_codes` non-empty and `org.naics` empty → soft disqualifier: "Opportunity requires NAICS codes but none on file"
5. `opp.naics_codes` populated but no overlap with `org.naics` → soft disqualifier: "No NAICS overlap — may need eligibility confirmation"

**Note on data availability:** `set_aside_code` and `eligibility_types` are Phase 14 columns that were NOT backfilled (only `naics_codes` and `cfda_numbers` were backfilled from keywords). These fields will be empty for most existing rows until Phase 15 ingest parsers populate them. The disqualifier function must handle empty arrays gracefully and only flag when data is actually present.

### Pattern 4: LLM Output Schema for Cited Summary

The scoring prompt must now return structured output (not free-form prose) so citation IDs can be reliably extracted:

```typescript
// Target JSON schema for generateExplainedSummary output
interface ExplainedSummaryResult extends LLMCallMeta {
  text: string;                    // 2-3 sentence narrative
  cited_artifact_ids: string[];    // doc_ids from RetrievedChunk
  cited_excerpts: Array<{
    artifact_id: string;           // doc_id from vault
    excerpt: string;               // ≤120 chars from chunk.text
    artifact_title: string;        // chunk.doc_title
  }>;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}
```

Use `response_format` or prompt-engineering to get structured output. The Anthropic SDK supports JSON mode via prompt instruction; no `response_format` param needed — instruct Claude to return JSON only, then `JSON.parse()` with a try/catch fallback to plain text.

### Pattern 5: rfp_fit_evidence Table (new migration)

Rather than bloating `rfp_opp_matches.score_breakdown` JSONB with full chunk text, store cited evidence in a separate table. This keeps the match row compact for feed queries.

```sql
CREATE TABLE IF NOT EXISTS rfp_fit_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  scored_version  int  NOT NULL,  -- matches rfp_opp_matches.scored_version
  dimension       text NOT NULL CHECK (dimension IN (
                    'mission_fit','eligibility','track_record','capacity','funder_relationship'
                  )),
  artifact_id     uuid NOT NULL,  -- rfp_vault_artifacts.id (NOT FK — artifact may be deleted)
  artifact_doc_id text NOT NULL,  -- source_metadata.doc_id
  artifact_title  text NOT NULL,
  artifact_type   text NOT NULL,
  excerpt         text NOT NULL,  -- ≤200 chars from chunk body
  similarity      float NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, org_id, scored_version, artifact_id, dimension)
);
ALTER TABLE rfp_fit_evidence ENABLE ROW LEVEL SECURITY;
-- RLS: org members see their own evidence
CREATE POLICY rfp_fit_evidence_select ON rfp_fit_evidence
  FOR SELECT USING (org_id = ANY(rfp_my_org_ids()));
CREATE POLICY rfp_fit_evidence_service_write ON rfp_fit_evidence
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### Pattern 6: Updated score_breakdown JSONB Schema

Phase 18 extends `rfp_opp_matches.score_breakdown` to carry the new dimension structure in addition to the existing component scores. No migration needed — JSONB is schema-flexible.

```typescript
// Extended ScoreBreakdown stored in rfp_opp_matches.score_breakdown
interface ScoreBreakdownV2 extends ScoreBreakdown {
  // original fields: naics, keyword, geo, dollar_band, past_funder, fit_score, chips, profile_pending
  dimensions: {
    mission_fit:          { sub_score: number; label: string };
    eligibility:          { sub_score: number; label: string };
    track_record:         { sub_score: number; label: string };
    capacity:             { sub_score: number; label: string };
    funder_relationship:  { sub_score: number; label: string };
  };
  disqualifiers: DisqualifierFlag[];
  vault_hit_count: number;   // how many vault chunks were retrieved
  scored_at_v2: string;      // ISO — sentinel to distinguish v2 rows
}
```

### Pattern 7: On-Demand vs Cron Scoring

There are two trigger paths:

1. **Cron path** (`scoreNewOpportunitiesForAllActiveOrgs`): runs on ingest, scores all new (opp, org) pairs. This is the background scoring path. Phase 18 extends this with vault retrieval.

2. **On-demand path**: when a user opens a detail pane, the current `GET /api/rfp/opps/[id]` returns whatever is in `rfp_opp_matches`. If the score lacks v2 dimensions, the DetailPane should trigger a re-score via a new endpoint `POST /api/rfp/opps/[id]/rescore` — or the DetailPane can show the v2 panel only when `score_breakdown.scored_at_v2` is set and degrade gracefully otherwise.

**Recommendation:** Do not block the page load on re-scoring. Show a "Score this opportunity" button if v2 data is absent; trigger asynchronously and update via polling or optimistic refresh.

### Anti-Patterns to Avoid

- **Don't call `retrieveVaultChunks` outside `guardedLLMCall`**: embedding costs tokens; budget guardrail must cover it. Wrap the entire vault-retrieve + LLM-summarize block as one guarded unit.
- **Don't store full vault chunk text in `score_breakdown`**: use `rfp_fit_evidence` table. `score_breakdown` must stay compact for feed JOIN queries.
- **Don't add a new LLM model**: stick to `claude-sonnet-4-5` / `claude-haiku-4-5` (already in `RFP_MODEL_RATES`). Adding a new model requires a rate entry or it will log `$0` cost.
- **Don't use `createClient()` in cron/background paths**: use `createAdminClient()` per CLAUDE.md.
- **Don't block on v2 scores in the feed query**: `buildFeedQuery` in `feed.ts` must stay fast; v2 dimension panel loads lazily in DetailPane.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic vault search | Custom embedding + cosine loop | `retrieveVaultChunks(orgId, query, { k })` in `vault/retrieve.ts` | HNSW RPC already live; in-Node fallback already there |
| Budget enforcement | Custom spend check | `guardedLLMCall(orgId, fn)` from `lib/rfp/ai/guardrail.ts` | BudgetExceededError, 402 helper, cost recording all built |
| Cost calculation | Custom token math | `computeCostUsd(model, tokensIn, tokensOut)` | Rate map in `RFP_MODEL_RATES` maintained here only |
| Eligibility text extraction | Custom regex | `ELIGIBILITY_RULES` in `lib/rfp/enrichment/generate.ts` | Existing patterns cover nonprofit/public/tribal/small-biz |
| Tier labeling | Custom thresholds | `tierFor(score)` from `lib/rfp/scoring/weights.ts` | `TIER_THRESHOLDS` (strong/good/marginal/weak) locked |
| Feed row structure | New type definition | `FeedRow` in `lib/rfp/feed.ts` | Full type contract already maintained |

---

## Common Pitfalls

### Pitfall 1: Empty Vault — No Artifacts to Cite
**What goes wrong:** `retrieveVaultChunks()` returns `[]` when the org has no vault documents yet. If the scoring code hard-requires at least one citation for SCORE-02, it will fail or return a null summary for new orgs.
**Why it happens:** New orgs typically have no vault artifacts for the first few days.
**How to avoid:** Handle the empty vault case explicitly. When `vaultChunks.length === 0`, generate the summary without citations (degrade to the existing summary behavior) and set `vault_hit_count = 0`. Do NOT block scoring or return an error. SCORE-02 says "cites at least one" — this is verified in the success criteria, not enforced as a hard gate.
**Warning signs:** Test org with zero vault artifacts fails to upsert `rfp_opp_matches`.

### Pitfall 2: set_aside_code / eligibility_types are Empty for Most Existing Rows
**What goes wrong:** Phase 14-01 backfilled only `naics_codes` and `cfda_numbers`. `set_aside_code`, `eligibility_types`, `psc_code`, `funder_name` are empty for all rows until Phase 15 ingest parsers populate them.
**Why it happens:** Migration comment: "psc_code, set_aside_code, eligibility_types, cost_share_required, and funder_name are NOT backfilled here."
**How to avoid:** Disqualifier checks must be conditional: only flag when the field is non-null/non-empty. A row with `set_aside_code = null` should produce zero disqualifier flags, not a false positive.
**Warning signs:** Test with a SAM.gov opportunity — `set_aside_code` may already be populated for some; grants rarely have it.

### Pitfall 3: Cron Path Token Cost Multiplication
**What goes wrong:** At 100 orgs × 1000 new opps = 100,000 pairs per ingest run. Adding a vault retrieval call (embed query) + LLM summarize per pair would blow the cost budget and Anthropic rate limits.
**Why it happens:** The vault retrieval calls `embedChunks` (OpenAI API) for every query.
**How to avoid:** Cache the opportunity query embedding. Compute `embed(opp.title + brief)` once per opp, not per (opp, org) pair. Pass the cached embedding directly to the HNSW RPC via `admin.rpc('match_vault_docs', { org_id, query_embedding: cachedVec, match_count: 5 })`. The `retrieveVaultChunks` wrapper embeds internally — Phase 18 should call the RPC directly with a cached vec to avoid per-org re-embedding.
**Warning signs:** Log shows N×M embed calls instead of N calls.

### Pitfall 4: JSON Parsing Failure from LLM Citation Response
**What goes wrong:** When instructing Claude to return JSON with citations, it occasionally returns markdown-wrapped JSON or adds a prose preamble. `JSON.parse` throws, the entire pair errors out, and no evidence is stored.
**Why it happens:** Claude is not perfectly deterministic with JSON-mode output without a schema validator.
**How to avoid:** Wrap `JSON.parse` in try/catch. On parse failure, fall back to extracting the first text content as plain-text summary with zero citations (same as current behavior). Log the failure with `console.warn` (not `console.error`) — it's non-fatal.

### Pitfall 5: `recomputeAllForOrg` Not Updated for v2
**What goes wrong:** `recomputeAllForOrg` (per-org triggered path) calls `generateFitSummary` without vault retrieval. After Phase 18, if a user edits their profile, the rescored opps get v1 summaries with no citations.
**Why it happens:** Two separate code paths for cron vs per-org recompute.
**How to avoid:** Extract a shared `scoreOnePair(opp, org, profile, opts)` helper that both orchestrators call. `opts.vaultRetrieval = true` for Phase 18; both paths call the same function.

### Pitfall 6: `rfp_fit_evidence` RLS Must Use `rfp_my_org_ids()`
**What goes wrong:** Using `USING (org_id = auth.uid())` instead of the SECURITY DEFINER helper causes the recursion bug from Phase 04-01.
**How to avoid:** Use `USING (org_id = ANY(rfp_my_org_ids()))` — same pattern as `rfp_entitlements`, `rfp_opp_matches`, and all other rfp tables.

---

## Code Examples

### Verified: guardedLLMCall call signature
```typescript
// Source: lib/rfp/ai/guardrail.ts
// fn MUST return an object that extends LLMCallMeta:
//   { agent, model, tokensIn, tokensOut, costUsd, proposalId?, sessionId? }
const result = await guardedLLMCall(orgId, async () => {
  const r = await generateExplainedSummary(opp, profile, dims, vaultChunks);
  return {
    agent: 'scoring_v2' as const,
    model: 'claude-sonnet-4-5',
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    costUsd: r.costUsd,
    _dims: r.dimensions,
    _cited: r.cited_artifacts,
  };
});
// Catch BudgetExceededError and silently skip — same pattern as recompute.ts:437
```

### Verified: match_vault_docs RPC signature
```typescript
// Source: supabase/migrations/20260606_rfp_vault_hnsw_match_rpc.sql
// Params: org_id uuid, query_embedding vector(1024), match_count int DEFAULT 8
// Returns: { id, body, title, type, source_metadata, similarity }[]
//
// Direct RPC call (bypasses retrieveVaultChunks embed, uses pre-cached vec):
const { data } = await admin.rpc('match_vault_docs', {
  org_id: orgId,
  query_embedding: cachedVec,  // number[] of length 1024
  match_count: 5,
}) as unknown as Promise<{ data: MatchVaultDocsRow[] | null; error: ... }>;
```

### Verified: retrieveVaultChunks (embed + RPC in one call)
```typescript
// Source: lib/rfp/vault/retrieve.ts
// Use when embedding cost per-opp is acceptable (on-demand path)
const chunks: RetrievedChunk[] = await retrieveVaultChunks(
  orgId,
  `${opp.title} ${opp.agency ?? ''} ${(opp.brief ?? '').slice(0, 300)}`,
  { k: 5 }
);
// RetrievedChunk: { id, similarity_score, text, doc_title, doc_type, chunk_index, doc_id, created_at }
```

### Verified: BudgetExceededError handling in cron
```typescript
// Source: lib/rfp/scoring/recompute.ts:437
try {
  const guarded = await guardedLLMCall(orgId, async () => { /* ... */ });
  summaryText = guarded._text;
} catch (err: unknown) {
  if (err instanceof BudgetExceededError) {
    console.warn(`[scoring/recompute] org over AI budget, skipping summary: ${orgId}`);
    summaryText = null;
    // Scoring chips + score_breakdown still upsert — only narrative omitted
  } else {
    throw err;  // Non-budget error: re-throw to outer catch
  }
}
```

### Verified: upsertMatches call site
```typescript
// Source: lib/rfp/scoring/recompute.ts:314 (upsertMatches)
// Conflict key: UNIQUE (opp_id, org_id)
// All rfp_opp_matches columns: opp_id, org_id, fit_score, score_breakdown, chips, summary, scored_version
await supabase
  .from('rfp_opp_matches')
  .upsert(rows, { onConflict: 'opp_id,org_id', ignoreDuplicates: false })
  .select('opp_id');
```

### Verified: DetailPane structure for new panel placement
```typescript
// Source: app/(dashboard)/org/[orgId]/discovery/parts/DetailPane.tsx:727
// AI summary section already renders at line 727:
<section className="mt-6">
  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
    AI summary
  </h3>
  <p className="max-w-3xl text-sm leading-7 text-zinc-700">
    {row.summary ?? "No summary generated."}
  </p>
</section>
// Phase 18 adds FitReasoningPanel BEFORE this section (or replaces it)
// The pane fetches full detail from GET /api/rfp/opps/[id]?org_id=...
// which returns score_breakdown + summary. Phase 18 extends that response
// with dimensions + disqualifiers + cited_artifacts from rfp_fit_evidence.
```

---

## Data Gaps: What EXISTS vs What Must Be BUILT

| Data for Dimension | Status | Notes |
|-------------------|--------|-------|
| **Mission fit — org capacity keywords** | EXISTS | `rfp_capture_profiles.profile_json.capacity_keywords[]` read by `loadLatestProfile()` |
| **Mission fit — vault semantic evidence** | EXISTS (infra) | `retrieveVaultChunks()` + HNSW RPC live; just not called from scorer |
| **Eligibility — org type (nonprofit/forprofit)** | EXISTS | `rfp_orgs.type` — always populated on org creation |
| **Eligibility — org NAICS** | EXISTS | `rfp_orgs.naics[]` |
| **Eligibility — opp set_aside_code** | PARTIAL | Column exists (Phase 14); not backfilled; SAM.gov ingest may have some values |
| **Eligibility — opp eligibility_types** | PARTIAL | Column exists (Phase 14); not backfilled; populated by enrichment rules |
| **Track record — past proposals in vault** | EXISTS (if uploaded) | Vault artifacts of type `past_proposal`; only present if org has uploaded docs |
| **Track record — past_funders** | EXISTS | `rfp_capture_profiles.profile_json.past_funders[]` |
| **Capacity — award band** | EXISTS | `rfp_capture_profiles.profile_json.typical_award_band` |
| **Capacity — annual report vault** | EXISTS (if uploaded) | Vault artifacts of type `annual_report` |
| **Funder relationship — agency match** | EXISTS | `rfp_opportunities.agency` + `profile_json.past_funders` |
| **Funder relationship — geo** | EXISTS | `rfp_opportunities.geo` + `profile_json.geo_focus` |
| **Disqualifier flags storage** | MISSING | Must add to `score_breakdown` JSONB (no migration needed — JSONB) |
| **Vault citation storage** | MISSING | Needs new `rfp_fit_evidence` table |
| **Dimension sub-scores on match row** | MISSING | Needs to extend `score_breakdown` JSONB schema |
| **On-demand rescore endpoint** | MISSING | `POST /api/rfp/opps/[id]/rescore` needed for users on pre-v2 scores |

---

## State of the Art

| Old Approach | Phase 18 Approach | Impact |
|--------------|-------------------|--------|
| `summary.ts` generates a 1-2 sentence blurb from chips/breakdown only | Summary generated from vault chunks + dimension breakdown; cites specific docs by name | SCORE-02 satisfied |
| `score_breakdown` carries 5 raw component scores (naics/keyword/geo/dollar_band/past_funder) | Score mapped to 5 labeled dimensions; each carries sub_score + vault evidence references | SCORE-03 satisfied |
| No disqualifier detection | `checkDisqualifiers()` compares org type vs opp set_aside / eligibility_types | SCORE-04 satisfied |
| Chips are opaque short strings (e.g. "Capacity OK") | FitReasoningPanel renders per-dimension sub-scores with named vault doc citations | SCORE-01 + SCORE-02 satisfied |

---

## Open Questions

1. **Cron embedding cost: embed once per opp or per (opp, org)?**
   - What we know: `retrieveVaultChunks` embeds the query each time it's called; 100 orgs × 1000 opps = 100,000 embed calls = ~$13/run at 1024-dim rates
   - What's unclear: whether the per-org embed call is acceptable at beachhead scale (2-5 orgs, not 100)
   - Recommendation: At beachhead scale (≤10 orgs), per-pair embedding is fine. Add a `TODO: cache opp embedding at N > 20 orgs` comment. Do not over-engineer for scale that doesn't exist yet.

2. **On-demand vs cron-only scoring**
   - What we know: cron only fires on ingest; if Phase 15 hasn't run yet, existing opps have v1 scores
   - What's unclear: should Phase 18 add a "Rescore now" button that triggers v2 scoring on demand?
   - Recommendation: YES. Add `POST /api/rfp/opps/[id]/rescore` that re-runs the Phase 18 scorer for a single (opp, org) pair. This is also the demo path: show a user their first vault-grounded score immediately. Cost is trivial (~$0.003/call).

3. **Disqualifier false positives on sparse data**
   - What we know: `set_aside_code` is empty for most existing rows; most flags require this field
   - What's unclear: how many real disqualifiers will trigger in practice before Phase 15 populates these fields
   - Recommendation: Implement the full disqualifier logic but only surface flags in the UI when `score_breakdown.scored_at_v2` is set. Pre-v2 rows show no flags.

4. **Should `rfp_fit_evidence` rows be deleted on rescore?**
   - Recommendation: Yes — when upserting a new `rfp_opp_matches` row (scored_version increments), delete old `rfp_fit_evidence` rows for the same (opp_id, org_id) with lower `scored_version`. Add a DB-level `ON DELETE CASCADE` through the match row if feasible, or handle in `evidence-store.ts`.

---

## Sources

### Primary (HIGH confidence — all verified from codebase)

- `lib/rfp/ai/guardrail.ts` — `guardedLLMCall`, `BudgetExceededError`, `RFP_MODEL_RATES`, `computeCostUsd`, `budgetExceededResponse`; exact function signatures
- `lib/rfp/vault/retrieve.ts` — `retrieveVaultChunks(orgId, query, opts)`, `RetrievedChunk` type, RPC call pattern
- `lib/rfp/scoring/score.ts` — `scoreOpportunity`, `ScoreBreakdown`, `CaptureProfileForScoring`, `OpportunityForScoring`
- `lib/rfp/scoring/summary.ts` — `generateFitSummary`, `FitSummaryResult`, model selection, prompt pattern
- `lib/rfp/scoring/recompute.ts` — `scoreNewOpportunitiesForAllActiveOrgs`, `recomputeAllForOrg`, `loadLatestProfile`, `upsertMatches`, `asyncPool`, BudgetExceededError handling pattern
- `lib/rfp/scoring/weights.ts` — `WEIGHTS`, `TIER_THRESHOLDS`, `tierFor`
- `supabase/migrations/20260606_rfp_vault_hnsw_match_rpc.sql` — `match_vault_docs` RPC signature (org_id, query_embedding vector(1024), match_count)
- `supabase/migrations/20260606_rfp_opportunity_typed_fields.sql` — `set_aside_code`, `eligibility_types`, `naics_codes` columns + backfill note
- `supabase/migrations/20260606_rfp_entitlements.sql` — `rfp_entitlements` schema, `rfp_my_org_ids()` RLS pattern
- `supabase/migrations/20260607_rfp_ai_budget.sql` — `monthly_ai_budget_usd` column
- `supabase/migrations/20260509_rfp_schema.sql` — `rfp_orgs` (type, naics, capacity_summary), `rfp_vault_artifacts` (type, title, body, embedding, source_metadata), `rfp_opp_matches` (score_breakdown jsonb, chips, summary, scored_version)
- `supabase/migrations/20260510_rfp_opp_matches_extensions.sql` — score_breakdown, chips, summary, scored_version added
- `lib/rfp/vault/upload.ts` — `VaultDocType` enum: `past_proposal | annual_report | founder_letter | case_study | policy | other`
- `app/(dashboard)/org/[orgId]/discovery/parts/DetailPane.tsx` — existing score rendering, AI summary section at line 727, fetch pattern from `/api/rfp/opps/[id]`
- `app/api/rfp/opps/[id]/route.ts` — existing GET handler returning `score_breakdown`, `chips`, `summary`, `enrichment`
- `lib/rfp/feed.ts` — `FeedRow` type, feed query pattern, `buildFeedQuery`
- `lib/rfp/enrichment/generate.ts` — `ELIGIBILITY_RULES` patterns (nonprofit/public/tribal/small-biz)

### Secondary (MEDIUM confidence)

- ROADMAP.md Phase 18 spec — "Vault-grounded fit scores with dimension breakdown, disqualifier flags, and cited evidence" — design intent confirmed
- STATE.md Phase 17 decisions — "generateFitSummary returns FitSummaryResult {text,tokensIn,tokensOut,costUsd}; cron scoring loop guarded per org via guardedLLMCall; over-budget orgs silently skipped with null summary"

---

## Metadata

**Confidence breakdown:**
- Vault retrieval layer: HIGH — `retrieveVaultChunks`, HNSW RPC, embed dimensions all verified
- Guardrail integration: HIGH — exact signature confirmed; cron skip pattern confirmed
- Dimension mapping: HIGH — existing 5 components map cleanly to SCORE-03 dimensions; documented
- Disqualifier data: MEDIUM — columns exist but are sparse until Phase 15; logic design is HIGH
- UI integration point: HIGH — `DetailPane.tsx` entry point and fetch URL confirmed
- New `rfp_fit_evidence` table design: HIGH — follows established RFP table conventions

**Research date:** 2026-06-07
**Valid until:** 2026-07-07 (stable codebase; fast-moving only if Phase 15 ingest lands and populates set_aside_code)
