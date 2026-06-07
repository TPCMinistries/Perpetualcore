---
phase: 17-ai-cost-guardrail
plan: "03"
subsystem: rfp-billing
tags: [guardrail, ai-cost, voice, vault, naics, budget-gate, typescript]
dependency_graph:
  requires:
    - phase: 17-01
      provides: [guardedLLMCall wrapper, BudgetExceededError, budgetExceededResponse, rfp_agent_sessions ledger]
  provides:
    - voice/train gated through guardedLLMCall (voice_fingerprint_extractor_v1, gpt-4o)
    - voice/from-description gated through guardedLLMCall (voice_fingerprint_extractor_v1, gpt-4o)
    - vault/upload gated through guardedLLMCall (vault_indexer_v1, text-embedding-3-large)
    - vault/from-description expand+embed wrapped in single guardedLLMCall (vault_indexer_v1, one row)
    - naics-suggest conditional guard when org_id present + member confirmed
  affects: [BILL-04 coverage, all user-facing RFP LLM call sites]
tech-stack:
  added: []
  patterns:
    - Pass extra payload fields through guardedLLMCall return value using _result/_expansion keys
    - Two-call sequences (expand + embed) wrapped as ONE guardedLLMCall — budget checked before first, cost summed for both
    - Conditional guard pattern: check membership first, guard if confirmed member, skip silently if not
    - model label for multi-model calls = dominant (most expensive) model name
key-files:
  created: []
  modified:
    - app/api/rfp/orgs/[orgId]/voice/train/route.ts
    - app/api/rfp/orgs/[orgId]/voice/from-description/route.ts
    - app/api/rfp/orgs/[orgId]/vault/upload/route.ts
    - app/api/rfp/orgs/[orgId]/vault/from-description/route.ts
    - app/api/orgs/naics-suggest/route.ts
    - lib/supabase/database.types.ts
key-decisions:
  - "vault/from-description: model label = 'gpt-4o' (dominant, most expensive half) for the combined expand+embed session row"
  - "naics-suggest unguarded path: 0 token counts, actual cost_usd from suggestNaicsCodes — cost attributed correctly even without token breakdown"
  - "naics-suggest membership non-member treated as absent (not 403) — silent downgrade protects which org UUIDs exist"
  - "database.types.ts: stripped CLI version banner appended at EOF during 17-01 regen (Rule 3 blocking fix)"
requirements-completed: [BILL-04]
duration: 43min
completed: 2026-06-07
---

# Phase 17 Plan 03: User-Facing Call-Site Guardrail Integration Summary

Five user-facing LLM routes (voice/train, voice/from-description, vault/upload, vault/from-description, naics-suggest) routed through `guardedLLMCall`; inline `rfp_agent_sessions` inserts removed; vault/from-description wraps expand+embed as one guarded op; naics-suggest accepts optional `org_id` with graceful-absent behavior.

## Performance

- **Duration:** ~43 min
- **Started:** 2026-06-07T01:25:30Z
- **Completed:** 2026-06-07T02:08:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- All five user-facing RFP LLM call sites budget-gated: over-budget orgs receive 402, model never fires
- vault/from-description wraps BOTH expand (gpt-4o) + embed (text-embedding-3-large) inside ONE `guardedLLMCall` — one budget preflight, one session row, summed cost — no double-counting
- naics-suggest accepts optional `org_id`; when present + membership confirmed, call is guarded and attributed; when absent or membership not found, call proceeds ungated gracefully (no 403 leak, no session row)
- Zero inline `rfp_agent_sessions` inserts remain across all five routes (grep-confirmed)

## Task Commits

1. **Task 1: Gate voice/train + voice/from-description** - `ff15d1f` (feat)
2. **Task 2: Gate vault/upload + vault/from-description** - `5f0eea5` (feat)
3. **Task 3: Optional org_id + conditional guard for naics-suggest** - `c44b561` (feat)

## Files Created/Modified

- `app/api/rfp/orgs/[orgId]/voice/train/route.ts` — inline insert replaced with guardedLLMCall; 402 on budget exceed
- `app/api/rfp/orgs/[orgId]/voice/from-description/route.ts` — same pattern as voice/train
- `app/api/rfp/orgs/[orgId]/vault/upload/route.ts` — try/catch audit block replaced with guardedLLMCall; tokensOut=0 (embeddings only)
- `app/api/rfp/orgs/[orgId]/vault/from-description/route.ts` — expand+embed wrapped in single guardedLLMCall; model="gpt-4o" (dominant)
- `app/api/orgs/naics-suggest/route.ts` — optional org_id added to RequestSchema; conditional guard; unguarded fallback preserved
- `lib/supabase/database.types.ts` — stripped CLI version banner appended at EOF during 17-01 regen (blocking fix)

## Decisions Made

**vault/from-description model label:** Used `"gpt-4o"` (the dominant, more expensive half of the expand+embed pair) as the model field in the combined session row. This is consistent, clearly identifies the driver of cost, and avoids inventing a composite identifier. Documented in route file comment.

**naics-suggest token counts:** `suggestNaicsCodes` does not expose token counts in its return type (`NaicsSuggestResult = { programs, cost_usd }`). Passed `tokensIn: 0, tokensOut: 0` with actual `costUsd` from the function. The session row has correct cost attribution even without token breakdown — cost is the primary billing metric.

**naics-suggest membership silent downgrade:** Non-member org_id is treated as absent (not 403). A bad org_id on an onboarding form doesn't fail the suggestion call — it silently skips the guard. This avoids leaking which org UUIDs exist (privacy) while keeping suggestions usable during onboarding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stripped CLI version banner from database.types.ts EOF**
- **Found during:** Task 1 (running typecheck after voice route changes)
- **Issue:** `npx tsc` reported 10 parse errors from lines 24843-24844 of database.types.ts — the text "A new version of Supabase CLI is available..." was accidentally appended to the file during the 17-01 regen run (CLI prints to stdout, which was captured into the file)
- **Fix:** Removed the two spurious lines after the final `} as const` closing of the Constants export
- **Files modified:** lib/supabase/database.types.ts
- **Verification:** tsc run post-fix produced empty output (0 errors)
- **Committed in:** ff15d1f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking)
**Impact on plan:** Fix was necessary to restore typecheck. No scope creep — only the appended banner text was removed, no schema changes.

## Issues Encountered

None beyond the database.types.ts banner issue documented above.

## Next Phase Readiness

- BILL-04 user-facing call-site coverage complete (Wave 2 of 3)
- 17-04 (scoring path, background calls) is parallel/disjoint — already committed per git log
- All five user-facing routes now produce exactly one session row per call via guardedLLMCall
- Proposal routes (17-02) and scoring lib (17-04) not touched per plan boundary

---
*Phase: 17-ai-cost-guardrail*
*Completed: 2026-06-07*

## Self-Check: PASSED

All 5 route files exist. All 3 task commits verified (ff15d1f, 5f0eea5, c44b561).
