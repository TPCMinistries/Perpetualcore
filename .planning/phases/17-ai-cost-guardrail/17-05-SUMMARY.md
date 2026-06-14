---
phase: 17-ai-cost-guardrail
plan: 05
subsystem: testing
tags: [vitest, guardrail, budget, ai-cost, rfp_agent_sessions, rfp_entitlements, BudgetExceededError]

requires:
  - phase: 17-01
    provides: guardrail.ts with BudgetExceededError, guardedLLMCall, budgetExceededResponse
  - phase: 17-02
    provides: draft/redraft/review routes gated through guardedLLMCall
  - phase: 17-03
    provides: vault/voice/naics call-sites gated through guardedLLMCall
  - phase: 17-04
    provides: cron scoring path gated through guardedLLMCall

provides:
  - Vitest unit tests proving all 3 BILL-04 success criteria with mocked DB
  - Live-DB verification script proving criteria against real rfp_entitlements + rfp_agent_sessions
  - Documented deferred gap: quick-import/extract.ts not guarded (no org_id at extract time)

affects: [phase 18 scoring, phase 23 billing, any future LLM call-site additions]

tech-stack:
  added: []
  patterns:
    - "VERIFY- prefix + finally cleanup for all live-DB verification scripts"
    - "makeMockAdminWithBudget helper factory for chainable Supabase mock in unit tests"

key-files:
  created:
    - tests/unit/rfp-ai-guardrail.test.ts
    - scripts/verify-rfp-ai-budget.ts
  modified: []

key-decisions:
  - "NULL monthly_ai_budget_usd is explicitly guarded against in unit tests to prevent coercion-to-zero regression"
  - "Live-DB script uses orgId-scoped session row IDs list to ensure precise cleanup even when assertions fail mid-script"
  - "quick-import/extract.ts is intentionally not guarded — no org_id available at extract time; deferred to a future phase"

patterns-established:
  - "Goal-backward verification pattern: unit tests + live-DB script both prove same criteria before phase is closed"

requirements-completed: [BILL-04]

duration: 2min
completed: 2026-06-07
---

# Phase 17 Plan 05: AI Cost Guardrail Verification Summary

**5-test vitest suite + live-DB script prove all 3 BILL-04 success criteria: $0 blocks with zero token usage, successful calls write one rfp_agent_sessions row, mid-session limit crossing blocks the next call, and HTTP 402 mapping is correct.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-07T02:07:21Z
- **Completed:** 2026-06-07T02:09:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Vitest unit test suite (5 cases, all green) covering all 3 BILL-04 success criteria plus NULL-unlimited and HTTP 402 mapping
- Live-DB script against CORE DB with VERIFY- prefix + finally cleanup; zero residue confirmed after run
- Deferred gap documented: quick-import/extract.ts is not guarded (no org_id available at extract time)

## BILL-04 Success Criteria Checklist

| Criterion | Unit Test | Live-DB Script |
|-----------|-----------|----------------|
| SC-1: $0 budget blocks, fn() NEVER called (zero token usage) | PASS (SC-1 test) | PASS |
| SC-2: Successful call writes one rfp_agent_sessions row with correct cost | PASS (SC-2 test) | PASS |
| SC-3: Cumulative spend >= limit blocks next call (BudgetExceededError, fn not called) | PASS (SC-3 test) | PASS |
| NULL budget = unlimited | PASS (SC-4 test) | PASS |
| HTTP 402 mapping via budgetExceededResponse | PASS (SC-5 test) | N/A (unit only) |

## Task Commits

1. **Task 1: Vitest unit tests for the 3 success criteria** - `0e75841` (test)
2. **Task 2: Live-DB verification script (CORE-safe, VERIFY- prefix + cleanup)** - `1c846ec` (feat)

## Files Created/Modified

- `tests/unit/rfp-ai-guardrail.test.ts` — 5 vitest cases; mocks createAdminClient; proves all 3 SC + NULL + 402
- `scripts/verify-rfp-ai-budget.ts` — Live-DB tsx script; runs guardedLLMCall against real tables; VERIFY- prefix; finally cleanup; exit 0 on all pass

## Decisions Made

- NULL monthly_ai_budget_usd is explicitly tested to prevent any future regression where null coerces to 0 and incorrectly blocks unlimited orgs.
- The live-DB script captures session row IDs into a list as they are created (not by org_id + timestamp query after the fact) to ensure precise cleanup even when assertions fail mid-run.

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Gap (Documented)

**quick-import/extract.ts is NOT guarded by the AI cost guardrail.**

- **Reason:** The extract pipeline runs outside the user request lifecycle; no `org_id` is available at extraction time. Extracting a document is not a per-tenant LLM cost in the current architecture.
- **Impact:** Extraction costs are not attributed to any org's budget ledger. This is acceptable for Phase 17 scope.
- **Future phase:** When extraction becomes a per-tenant paid feature, a refactor will be needed to thread `org_id` into the extraction path and wrap the LLM call with `guardedLLMCall`.
- **Risk rating:** Low — extraction calls are currently low-volume and not billed per-call.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 17 (AI Cost Guardrail) is fully complete — all 5 plans done.
- BILL-04 requirement is proven with both automated unit tests and a live-DB script.
- Phase 18 (Scoring) can proceed; scoring cron path is already gated via guardedLLMCall.
- Phase 23 (Billing) can proceed; the rfp_agent_sessions ledger is live and accurate.

---
*Phase: 17-ai-cost-guardrail*
*Completed: 2026-06-07*
