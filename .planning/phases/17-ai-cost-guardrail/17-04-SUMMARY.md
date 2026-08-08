---
phase: 17-ai-cost-guardrail
plan: "04"
subsystem: rfp-scoring
tags: [guardrail, ai-cost, scoring, cron, budget-skip, typescript]
dependency_graph:
  requires: [17-01-guardrail-foundation]
  provides: [FitSummaryResult return type, per-org guarded cron scoring, over-budget silent skip]
  affects: [lib/rfp/scoring/summary.ts, lib/rfp/scoring/recompute.ts, cron scoring path]
tech_stack:
  added: []
  patterns: [guardedLLMCall-in-cron, budget-exceed-silent-skip, llm-call-meta-with-extra-field]
key_files:
  created: []
  modified:
    - lib/rfp/scoring/summary.ts
    - lib/rfp/scoring/recompute.ts
decisions:
  - "generateFitSummary returns FitSummaryResult in ALL branches — zero-cost sentinel for profile-pending, no-key, and both-models-failed; live cost for successful calls"
  - "Model tracking: the model variable from the for-loop is in scope when returning the result, so the model that actually answered is used for computeCostUsd"
  - "Profile-pending branch does NOT bypass guardedLLMCall in the cron — it goes through the wrapper with cost=0; this is acceptable (cheap budget read, no AI call)"
  - "recomputeAllForOrg (per-org triggered path) does NOT use guardedLLMCall — it is opt-in, less frequent, and not the financial hot path per plan note"
  - "Over-budget org: BudgetExceededError caught in inner try/catch; summaryText=null; outer row still returns with chips/score; no cron abort"
  - "Non-budget errors re-throw from inner catch to outer catch — real failures skip the pair with error log (existing behavior preserved)"
  - "No rfp_agent_sessions inserts in scoring path — guardedLLMCall handles the single insert; no double-count"
  - "guardedLLMCall fn() returns LLMCallMeta plus _text field; TypeScript allows extra fields on object literals that extend the interface"
metrics:
  duration: 7 min
  completed: 2026-06-07
  tasks_completed: 2
  files_changed: 2
---

# Phase 17 Plan 04: Scoring Path Cost Guardrail Summary

One-liner: `generateFitSummary` refactored to return `{ text, tokensIn, tokensOut, costUsd }` in every branch; cron scoring loop wrapped in `guardedLLMCall(orgId)` so over-budget orgs are silently skipped while all other orgs continue uninterrupted.

## What Was Built

### Task 1 — `lib/rfp/scoring/summary.ts`: New FitSummaryResult return type

Changed `generateFitSummary` from `Promise<string | null>` to `Promise<FitSummaryResult>`:

| Branch | text | tokensIn | tokensOut | costUsd |
|--------|------|----------|-----------|---------|
| profile_pending or profile=null | PROFILE_PENDING_SUMMARY sentinel | 0 | 0 | 0 |
| No ANTHROPIC_API_KEY | null | 0 | 0 | 0 |
| Successful model call | prose text | resp.usage.input_tokens | resp.usage.output_tokens | computeCostUsd(model, ...) |
| Both models failed | null | 0 | 0 | 0 |

- Imported `computeCostUsd` from `@/lib/rfp/ai/guardrail` (canonical rate map)
- `resp.usage` typed as `{ input_tokens: number; output_tokens: number }` (Anthropic SDK shape)
- Model variable (`MODEL_PRIMARY` or `MODEL_FALLBACK`) captured at loop iteration for correct rate lookup
- Never throws — error contract preserved
- Exported `FitSummaryResult` interface for callers

### Task 2 — `lib/rfp/scoring/recompute.ts`: Per-org guarded cron loop

**Cron path (`scoreNewOpportunitiesForAllActiveOrgs`):**

- Imported `{ guardedLLMCall, BudgetExceededError }` from `@/lib/rfp/ai/guardrail`
- Per-pair worker wraps the summary call:
  ```
  guardedLLMCall(orgId, async () => {
    const r = await generateFitSummary(opp, profile, breakdown);
    return { agent: 'scoring_summary_v1', model: 'claude-sonnet-4-5',
             tokensIn: r.tokensIn, tokensOut: r.tokensOut, costUsd: r.costUsd, _text: r.text };
  })
  ```
- Inner try/catch: `BudgetExceededError` → `console.warn` + `summaryText = null` → pair continues to upsert with `summary=null` (chips/score still land)
- Non-budget errors re-throw to outer catch (logged, pair returns null, cron continues)
- `guardedLLMCall` records one `rfp_agent_sessions` row with `agent=scoring_summary_v1` for within-budget calls

**Per-org triggered path (`recomputeAllForOrg`):**

- Updated to consume `FitSummaryResult.text` (was treating return as `string | null`)
- No `guardedLLMCall` — this path is opt-in (`aiSummaries: true` flag), less frequent, and not the financial hot path

**Double-count check:** No `rfp_agent_sessions` inserts in `summary.ts` or `recompute.ts`. The single insert is in `guardedLLMCall → recordCost` inside `guardrail.ts`. Zero double-counting.

## Behavior Trace (Over-Budget Org)

1. Cron ingest: new opp found, pairs built for 3 orgs (A: within-budget, B: over-budget, C: within-budget)
2. asyncPool worker for B's pair: `guardedLLMCall(B)` → `checkBudget(B)` → `BudgetExceededError` thrown
3. Inner catch: `console.warn "[scoring/recompute] org over AI budget, skipping summary: B"` → `summaryText = null`
4. Pair B returns `{ summary: null, fit_score: ..., chips: ..., ... }` — upserted normally
5. Pairs A and C complete normally with guarded summary calls + `rfp_agent_sessions` rows recorded
6. Cron returns `{ scored: 3, orgs: N }` — B's summary omission is non-blocking

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 — summary.ts | dcbc91b | feat(17-04): change generateFitSummary to return cost metadata |
| 2 — recompute.ts | 882dbad | feat(17-04): guard cron scoring loop per org with budget-exceed skip |

## Deviations from Plan

None — plan executed exactly as written.

The `_text` field approach (extra field on the `LLMCallMeta`-compatible return object) was chosen as specified in the plan: "return an object that satisfies LLMCallMeta PLUS a `text` field." TypeScript allows extra properties on object literals passed to generic parameters.

## Self-Check: PASSED
