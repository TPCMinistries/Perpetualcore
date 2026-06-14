---
phase: 17-ai-cost-guardrail
plan: "02"
subsystem: rfp-billing
tags: [guardrail, ai-cost, budget, route-integration, draft, review]

# Dependency graph
requires:
  - phase: 17-ai-cost-guardrail
    provides: guardedLLMCall wrapper, BudgetExceededError, budgetExceededResponse, RFP_MODEL_RATES
provides:
  - draft route gated by guardedLLMCall — over-budget org gets 402, model never fires
  - redraft route gated by guardedLLMCall — proposal_id included in session meta
  - review route gated by guardedLLMCall — response shape unchanged (pure ReviewerResult)
  - all three routes: exactly one rfp_agent_sessions row per call (no double-count)
affects: [Phase 17 plans 03-05, rfp_agent_sessions ledger correctness, billing accuracy]

# Tech tracking
tech-stack:
  added: []
  patterns: [guardedLLMCall call-site pattern, capture-then-assign for response-shape preservation]

key-files:
  created: []
  modified:
    - app/api/rfp/draft/route.ts
    - app/api/rfp/proposals/[proposalId]/redraft/route.ts
    - app/api/rfp/proposals/[proposalId]/review/route.ts

key-decisions:
  - "Draft route: proposal_id omitted from session meta (unknown pre-insert); org_id is sufficient for budget ledgering — minor tradeoff noted"
  - "Review route: capturedReview pattern used to preserve exact ReviewerResult response shape — no extra camelCase meta fields leaked into JSON output"
  - "Draft/redraft: spread + LLMCallMeta fields returned from fn() — extra fields are never serialized (explicit field destructuring in return JSON)"

patterns-established:
  - "guardedLLMCall call-site pattern: wrap model call in fn(), return { ...result, agent, model, tokensIn, tokensOut, costUsd, sessionId, proposalId? }"
  - "capture-then-assign: when response shape must be preserved, capture result to outer var before returning LLMCallMeta from fn()"

requirements-completed: [BILL-04]

# Metrics
duration: 58min
completed: 2026-06-07
---

# Phase 17 Plan 02: Call-Site Integration (Draft, Redraft, Review) Summary

**Three highest-cost RFP routes wired through `guardedLLMCall` — over-budget orgs get HTTP 402 before the model fires, and each call records exactly one `rfp_agent_sessions` ledger row (inline inserts removed, wrapper owns the single write).**

## Performance

- **Duration:** 58 min
- **Started:** 2026-06-07T05:05:20Z
- **Completed:** 2026-06-07T06:03:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Draft route (`POST /api/rfp/draft`): `generateDraft()` wrapped in `guardedLLMCall(body.org_id, fn)` — budget check fires before model; inline `rfp_agent_sessions` insert removed; `BudgetExceededError` → HTTP 402 via `budgetExceededResponse`
- Redraft route (`POST /api/rfp/proposals/:id/redraft`): same pattern with `proposal.org_id` as the tenant key; `proposal_id` included in session meta since it's known from route params
- Review route (`POST /api/rfp/proposals/:id/review`): `generateReview()` wrapped using a `capturedReview` pattern to preserve the unchanged `ReviewerResult` response shape; inline insert removed; 402 on budget exceed

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate draft + redraft routes through guardedLLMCall** - `298f23a` (feat)
2. **Task 2: Gate review route through guardedLLMCall** - `cf22eba` (feat)

## Files Created/Modified

- `app/api/rfp/draft/route.ts` — Added guardrail imports, wrapped generateDraft in guardedLLMCall, removed inline session insert, 402 on BudgetExceededError
- `app/api/rfp/proposals/[proposalId]/redraft/route.ts` — Same guardrail pattern; proposal_id included in meta; inline insert removed
- `app/api/rfp/proposals/[proposalId]/review/route.ts` — guardedLLMCall with capturedReview pattern to preserve response shape; inline insert removed

## Decisions Made

**1. Draft route: proposal_id omitted from session meta**
- The proposal insert happens AFTER `generateDraft` returns (it needs the draft to build section rows), so `proposal_id` is unknown at the time the fn() must return LLMCallMeta.
- Moving the proposal insert before the model call would require restructuring the entire route — out of scope (Rule 4 boundary).
- Decision: omit `proposalId` from draft session meta (wrapper inserts `proposal_id=null`). `org_id` is sufficient for budget ledgering; the `session_id` suffix encodes voice/vault flags for downstream attribution.

**2. Redraft route: proposal_id included**
- `proposal.id` is available before the model call (loaded from params during auth), so the ledger row gets full `proposal_id` linkage.

**3. Review route: capturedReview pattern to preserve response shape**
- The original route returns `NextResponse.json(review)` — serializes the entire `ReviewerResult`.
- Spreading `result` into the meta object and assigning back to `review: ReviewerResult` would leak camelCase meta fields (`tokensIn`, `costUsd`, etc.) into the API response alongside the snake_case originals.
- Fix: use a closure (`capturedReview`) to hold the pure `ReviewerResult`, return only LLMCallMeta scalars from fn(), then assign `review = capturedReview`. Response shape unchanged.

## Deviations from Plan

None — plan executed exactly as written. The `capturedReview` pattern for the review route was described as an option in the plan's action block ("Two clean options — pick the cleaner for each file"), and was the cleaner choice given the requirement to preserve response shape.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three proposal-writing LLM call sites are now budget-gated
- Phase 17-03 (voice/vault routes) and 17-04 (scoring route) can proceed independently (disjoint files)
- Phase 17-05 (budget dashboard) depends on accurate ledger rows — these routes now write exactly one row per call via the wrapper

---
*Phase: 17-ai-cost-guardrail*
*Completed: 2026-06-07*
