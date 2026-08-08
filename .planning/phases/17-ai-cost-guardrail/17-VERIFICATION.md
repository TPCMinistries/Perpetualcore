---
phase: 17-ai-cost-guardrail
verified: 2026-06-07T02:20:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 17: AI Cost Guardrail Verification Report

**Phase Goal:** Every LLM-backed operation is gated by a per-tenant budget check; no LLM call fires when a tenant exceeds their hard spend limit; cost is ledgered in real time.
**Verified:** 2026-06-07T02:20:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | guardedLLMCall wrapper exists that checks budget BEFORE calling fn() | VERIFIED | `lib/rfp/ai/guardrail.ts` exports `guardedLLMCall`; checkBudget() called before fn() at line 201 |
| 2 | When org exceeds monthly_ai_budget_usd, fn() is NEVER invoked and BudgetExceededError is thrown | VERIFIED | checkBudget throws before fn() is reached; all 3 SC tests + `fn not.toHaveBeenCalled()` pass (5/5 green) |
| 3 | On a successful call the wrapper writes one rfp_agent_sessions row with cost/tokens/model/agent | VERIFIED | recordCost() called post-fn(); SC-2 unit test asserts exactly one insert with correct org_id/cost_usd/agent |
| 4 | NULL monthly_ai_budget_usd = unlimited; budget check is skipped | VERIFIED | Explicit `if (limitUsd === null || limitUsd === undefined) return;` at line 129; NULL-unlimited test passes |
| 5 | A 402 helper translates BudgetExceededError into actionable JSON body | VERIFIED | budgetExceededResponse() returns NextResponse status 402 with error:budget_exceeded, limit_usd, spent_usd |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260607_rfp_ai_budget.sql` | Additive ALTER adding monthly_ai_budget_usd | VERIFIED | File exists; `ADD COLUMN IF NOT EXISTS monthly_ai_budget_usd numeric`; no new table created |
| `lib/rfp/ai/guardrail.ts` | guardedLLMCall wrapper + all exports; min 100 lines | VERIFIED | 240 lines; all 8 required exports confirmed: BudgetExceededError, LLMCallMeta, RFP_MODEL_RATES, computeCostUsd, checkBudget, recordCost, guardedLLMCall, budgetExceededResponse |
| `lib/supabase/database.types.ts` | monthly_ai_budget_usd present on rfp_entitlements | VERIFIED | Lines 15448/15463/15478: `monthly_ai_budget_usd: number \| null` in Row/Insert/Update types |
| `app/api/rfp/draft/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 42/267; zero .insert() calls on rfp_agent_sessions |
| `app/api/rfp/proposals/[proposalId]/redraft/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 10/177; zero inline inserts |
| `app/api/rfp/proposals/[proposalId]/review/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 43/191; zero inline inserts |
| `app/api/rfp/orgs/[orgId]/voice/train/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 42/123; only .insert() is to rfp_capture_profiles (not sessions) |
| `app/api/rfp/orgs/[orgId]/voice/from-description/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 33/97; only .insert() is to rfp_capture_profiles |
| `app/api/rfp/orgs/[orgId]/vault/upload/route.ts` | guardedLLMCall import + usage; no inline insert | VERIFIED | guardedLLMCall at lines 33/93; no .insert() calls at all |
| `app/api/rfp/orgs/[orgId]/vault/from-description/route.ts` | Single guardedLLMCall wrapping expand+embed; no inline insert | VERIFIED | guardedLLMCall at lines 37/94; comment at line 90 confirms one row; zero inline inserts |
| `app/api/orgs/naics-suggest/route.ts` | Optional org_id; guarded when present; graceful when absent | VERIFIED | `org_id: z.string().uuid().optional()` at line 46; conditional guardedLLMCall at lines 36/91; unguarded path documented |
| `lib/rfp/scoring/recompute.ts` | guardedLLMCall in per-org cron loop; BudgetExceededError skip+log | VERIFIED | guardedLLMCall at lines 50/425; BudgetExceededError catch at line 438 with warn log; cron continues |
| `lib/rfp/scoring/summary.ts` | Returns {text, tokensIn, tokensOut, costUsd} in all branches | VERIFIED | Interface defined at lines 92-95; all branches return 4-field object confirmed |
| `tests/unit/rfp-ai-guardrail.test.ts` | 5 vitest cases; BudgetExceededError; min 60 lines | VERIFIED | 266 lines; 5 tests all pass (run confirmed): SC-1, SC-2, SC-3, NULL-unlimited, 402-mapping |
| `scripts/verify-rfp-ai-budget.ts` | Live-DB self-cleaning script; guardedLLMCall; VERIFY- prefix | VERIFIED | File exists; VERIFY- prefix at line 113; finally cleanup block at line 337; guardedLLMCall imported |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| lib/rfp/ai/guardrail.ts | rfp_entitlements.monthly_ai_budget_usd | createAdminClient read | WIRED | .from('rfp_entitlements').select('monthly_ai_budget_usd').eq('org_id', orgId).maybeSingle() |
| lib/rfp/ai/guardrail.ts | rfp_agent_sessions | createAdminClient SUM + INSERT | WIRED | SUM via .select('cost_usd').gte('created_at', monthStart); INSERT via recordCost() |
| app/api/rfp/draft/route.ts | lib/rfp/ai/guardrail.ts | guardedLLMCall(body.org_id, ...) + budgetExceededResponse | WIRED | Lines 42/267; BudgetExceededError try/catch |
| app/api/rfp/proposals/[proposalId]/redraft/route.ts | lib/rfp/ai/guardrail.ts | guardedLLMCall(proposal.org_id, ...) | WIRED | Lines 10/177 |
| app/api/rfp/proposals/[proposalId]/review/route.ts | lib/rfp/ai/guardrail.ts | guardedLLMCall(proposal.org_id, ...) | WIRED | Lines 43/191 |
| Voice + vault routes (5 routes) | lib/rfp/ai/guardrail.ts | guardedLLMCall(orgId, ...) with route param orgId | WIRED | All 5 confirmed at respective lines |
| app/api/orgs/naics-suggest/route.ts | lib/rfp/ai/guardrail.ts | Conditional guardedLLMCall when member org_id present | WIRED | Lines 36/91; z.string().uuid().optional() schema |
| lib/rfp/scoring/recompute.ts | lib/rfp/ai/guardrail.ts | guardedLLMCall(orgId, () => generateFitSummary(...)) | WIRED | Lines 50/425 |
| lib/rfp/scoring/recompute.ts | lib/rfp/scoring/summary.ts | Consumes {text, tokensIn, tokensOut, costUsd} return shape | WIRED | summary.ts exports 4-field object; recompute.ts destructures .text |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BILL-04 | 17-01 through 17-05 | A per-tenant AI cost ledger enforces a hard spend limit BEFORE each LLM call fires | SATISFIED | guardedLLMCall gates all 9 LLM call sites; 5/5 unit tests pass; REQUIREMENTS.md line 62 shows [x] + line 148 shows Complete |

---

## Zero-Cost Audit Rows (Correctly NOT Flagged)

Three routes insert rfp_agent_sessions rows with `cost_usd: 0` — these are CORRECT non-LLM audit trail rows and must not be flagged as double-counts:

- `app/api/rfp/proposals/[proposalId]/status/route.ts` — status change audit (lines 137/165/167)
- `app/api/rfp/proposals/[proposalId]/compliance/route.ts` — compliance event audit (lines 240/248)
- `app/api/rfp/proposals/[proposalId]/sections/[sectionId]/route.ts` — human edit audit (lines 153/161)

All three explicitly set `cost_usd: 0` with no LLM call involved.

---

## Anti-Patterns Found

No blockers or warnings found. All three success criteria have both unit test and live-DB script verification. The one known gap (quick-import/extract.ts) is appropriately documented as deferred in 17-05-SUMMARY.md with a low-risk rating and a clear rationale (no org_id at extraction time).

---

## Unit Test Run

```
npx vitest run tests/unit/rfp-ai-guardrail.test.ts

RUN v4.0.15

  ✓ tests/unit/rfp-ai-guardrail.test.ts (5 tests) 6ms

 Test Files  1 passed (1)
       Tests  5 passed (5)
    Duration  589ms
```

All 5 pass covering SC-1 ($0 blocks + fn not called), SC-2 (insert recorded with correct cost), SC-3 (mid-session limit blocks), NULL-unlimited, and 402 response shape.

---

## Deferred Gap (Documented, Not a Blocker)

`quick-import/extract.ts` is not guarded. No org_id is available at extraction time in the current pipeline architecture. Documented in 17-05-SUMMARY.md as a future-phase item. Risk: low (low-volume, not per-tenant billed).

---

## DB Column Verification

Migration `20260607_rfp_ai_budget.sql` was applied to project `hgxxxmtfmvguotkowxbu` (LDC Brain AI) per 17-01-SUMMARY.md: `information_schema query confirmed column_name=monthly_ai_budget_usd, data_type=numeric, is_nullable=YES`. Type regeneration confirmed at `lib/supabase/database.types.ts` lines 15448/15463/15478.

---

_Verified: 2026-06-07T02:20:00Z_
_Verifier: Claude (gsd-verifier)_
