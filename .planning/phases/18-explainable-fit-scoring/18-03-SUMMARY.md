---
phase: 18-explainable-fit-scoring
plan: "03"
subsystem: scoring
tags: [scoring, vault-grounding, guardrail, llm, rescore-endpoint, SCORE-01, SCORE-02, SCORE-03]
dependency_graph:
  requires: [18-01, 18-02]
  provides: [SCORE-01, SCORE-02, SCORE-03]
  affects:
    - lib/rfp/scoring/summary.ts
    - lib/rfp/scoring/recompute.ts
    - app/api/rfp/opps/[id]/rescore/route.ts
    - lib/supabase/database.types.ts
tech_stack:
  added: []
  patterns: [guarded-llm-call, vault-grounded-scoring, structured-citation-json, graceful-degrade, shared-score-path]
key_files:
  created:
    - app/api/rfp/opps/[id]/rescore/route.ts
  modified:
    - lib/rfp/scoring/summary.ts
    - lib/rfp/scoring/recompute.ts
    - lib/rfp/scoring/evidence-store.ts
    - lib/supabase/database.types.ts
decisions:
  - "scoreOnePairV2 is the single shared scoring path — BOTH the cron (scoreNewOpportunitiesForAllActiveOrgs) and per-org (recomputeAllForOrg) routes call it; the old ungated generateFitSummary call was removed so no second ungated LLM path survives"
  - "The vault-retrieve (embed) + generateExplainedSummary (LLM) block is wrapped in ONE guardedLLMCall per (opp,org) pair — a single budget unit, consistent with Phase 17's vault-from-description pattern"
  - "Model id stays claude-sonnet-4-5 (RFP engine's existing standard from Phase 05-03; matches an RFP_MODEL_RATES key in the guardrail so cost accounting is correct) — NOT changed to 4-6, which would need new rate entries and is out of scope"
  - "On BudgetExceededError: skippedBudget=true, deterministic v1 fallback score still computed and the match row still upserts (chips/scores render); over-budget orgs are NOT failed"
  - "On LLM JSON-parse failure: citation arrays degrade to empty, plain summary text preserved (Pitfall 4) — scoring never hard-fails on a malformed model response"
  - "Disqualifier data wiring: both rfp_opportunities select sites extended with set_aside_code, eligibility_types, naics_codes and rfp_orgs select extended with type, threaded into scoreOnePairV2 — without this checkDisqualifiers receives nulls and SCORE-04 silently never fires"
  - "Types regenerated to lib/supabase/database.types.ts (canonical path per package.json types:supabase), done before the rescore route so the route is written against typed rfp_fit_evidence columns"
  - "rescore endpoint: createClient/getUser auth gate + rfp_user_orgs membership check returning 404 (not 403) on non-member to prevent (opp,org) enumeration; createAdminClient used only for writes AFTER auth; BudgetExceededError -> 402"
metrics:
  duration: "~20 min (executor hit an API socket error after committing all 3 tasks; SUMMARY + state wrap-up completed by orchestrator after independent verification)"
  completed: "2026-06-07"
  tasks: "3/3"
  commits: [4ae81d4, e0bf2ce, b2ad259]
requirements: [SCORE-01, SCORE-02, SCORE-03]
verification:
  tsc: "clean (no error TS lines across runs)"
  tests: "17/17 scoring unit tests pass (dimensions + disqualifiers)"
  migration: "rfp_fit_evidence applied + verified live (RLS enabled, 2 policies) in Wave 1"
  guardrail: "function-scoped greps confirm scoreOnePairV2 in both cron + recomputeAllForOrg; generateFitSummary only present in a 'has been removed' comment"
---

# 18-03: Vault-Grounded Scoring Pipeline + Rescore Endpoint

## What shipped

The scoring engine became vault-grounded and explainable, and the entire heavy-LLM
path is now budget-guarded.

**`lib/rfp/scoring/summary.ts`** — added `generateExplainedSummary(opp, profile, dimensions, chunks)`
returning `{ text, cited_artifact_ids, cited_excerpts, ...cost meta }`. Primary model
(`claude-sonnet-4-5`) with Haiku fallback; prompt instructs the model to return strict JSON
with cited artifact ids/excerpts. On empty/parse failure it degrades gracefully to plain text
with empty citation arrays (never hard-fails).

**`lib/rfp/scoring/recompute.ts`** — added the shared `scoreOnePairV2(opp, org, scoredVersion)`:
1. deterministic base score (existing 5-component `score.ts`)
2. `checkDisqualifiers(opp, org.type)` (Wave 1)
3. `retrieveVaultChunks(orgId, query, {k:5})` (Phase 14 HNSW) + `generateExplainedSummary`,
   the whole embed+LLM block wrapped in ONE `guardedLLMCall`
4. `mapToDimensions(base, vaultHitCount, disqualifiers)` (Wave 1)
5. builds `ScoreBreakdownV2` = v1 fields + `dimensions` + `disqualifiers` + `vault_hit_count` + `scored_at_v2` sentinel
6. emits `rfp_fit_evidence` rows for the cited chunks via `upsertFitEvidence`

Both `scoreNewOpportunitiesForAllActiveOrgs` (cron) and `recomputeAllForOrg` (per-org) now call
`scoreOnePairV2`; the old ungated `generateFitSummary` call + its comment were deleted. Both opp
select sites gained `set_aside_code, eligibility_types, naics_codes`; the org select gained `type`.

**`app/api/rfp/opps/[id]/rescore/route.ts`** (new) — on-demand single-pair v2 rescore (the demo
path). Auth via `createClient`/`getUser`; membership via RLS-scoped `rfp_user_orgs` read returning
404 on non-member; `createAdminClient` for writes after auth; `BudgetExceededError -> 402`. Returns
fresh `fit_score`, `dimensions`, `disqualifiers`, `vault_hit_count`, `cited_artifact_ids`, `summary`.

**`lib/supabase/database.types.ts`** — regenerated (`npm run types:supabase`); `rfp_fit_evidence`
now typed, temporary casts in `evidence-store.ts` removed.

## Requirements

- **SCORE-01** — every (opp,org) pair gets a fit score + plain-English summary
- **SCORE-02** — summary cites vault artifacts; cited chunks persisted to `rfp_fit_evidence`
- **SCORE-03** — `score_breakdown.dimensions` carries the 5 labeled dimensions with sub-scores

(SCORE-04 disqualifier flags are produced here too, but the requirement is owned/verified by 18-02 + 18-04.)

## Notable

- Executor hit an API socket error after committing all three tasks. SUMMARY + STATE/ROADMAP
  wrap-up were completed by the orchestrator after independent verification (tsc clean, 17/17 tests,
  function-scoped guardrail greps, live migration check) — no code was re-generated.

## Next

Wave 3 / 18-04 consumes the v2 `score_breakdown` shape: GET route surfaces `fit_reasoning`,
`FitReasoningPanel` + `VaultCitation` render it in `DetailPane`, and a human-verify checkpoint
tests the live UI (including the required SCORE-04 ineligible-opp seed/rescore/rollback).
