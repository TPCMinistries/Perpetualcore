---
phase: 17-ai-cost-guardrail
plan: "01"
subsystem: rfp-billing
tags: [guardrail, ai-cost, entitlements, schema, typescript]
dependency_graph:
  requires: [phase-14-canonical-data-foundation]
  provides: [guardedLLMCall wrapper, monthly_ai_budget_usd column, BudgetExceededError, RFP_MODEL_RATES]
  affects: [all RFP LLM call sites, rfp_agent_sessions ledger, rfp_entitlements schema]
tech_stack:
  added: []
  patterns: [admin-client-for-ledger-writes, fail-closed-on-db-error, calendar-month-utc-boundary, null-equals-unlimited]
key_files:
  created:
    - supabase/migrations/20260607_rfp_ai_budget.sql
    - lib/rfp/ai/guardrail.ts
  modified:
    - lib/supabase/database.types.ts
decisions:
  - "rfp_agent_sessions reused as ledger (no new table) — additive column on rfp_entitlements only"
  - "NULL monthly_ai_budget_usd = unlimited; explicit null guard prevents coercion to 0"
  - "Fail-CLOSED on DB read error — re-throw as normal Error (→ 500) never fail-open"
  - "recordCost failure is non-fatal — swallowed with console.error so user still gets their draft"
  - "Calendar-month UTC boundary for spend sum (not rolling 30 days)"
  - "computeCostUsd warns + returns 0 for unknown models so they never block a call"
  - "database.types.ts regenerated via CLI (not hand-edited) as single owner for Phase 17"
metrics:
  duration: 11 min
  completed: 2026-06-07
  tasks_completed: 3
  files_changed: 3
---

# Phase 17 Plan 01: AI Cost Guardrail Foundation Summary

One-liner: Per-tenant AI cost guardrail with `guardedLLMCall` wrapper, `BudgetExceededError`, `RFP_MODEL_RATES` map, `budgetExceededResponse` 402 helper, and one additive migration (`monthly_ai_budget_usd`) backed by the existing `rfp_agent_sessions` ledger.

## What Was Built

### Task 1 — Migration: `supabase/migrations/20260607_rfp_ai_budget.sql`
- Applied `ALTER TABLE rfp_entitlements ADD COLUMN IF NOT EXISTS monthly_ai_budget_usd numeric` to project `hgxxxmtfmvguotkowxbu` (LDC Brain AI)
- Verified via information_schema: `column_name=monthly_ai_budget_usd`, `data_type=numeric`, `is_nullable=YES`
- No new tables created; `rfp_agent_sessions` reused as the per-call cost ledger
- All existing `rfp_entitlements` rows have `NULL` (unlimited) for the new column

### Task 2 — `lib/rfp/ai/guardrail.ts` Exports

| Export | Type | Purpose |
|--------|------|---------|
| `BudgetExceededError` | class | `code="BUDGET_EXCEEDED"`, `orgId`, `spentUsd`, `limitUsd`; message: "AI budget exceeded: $X.XXXX spent of $X.XX limit" |
| `LLMCallMeta` | interface | `{ agent, proposalId?, sessionId?, model, tokensIn, tokensOut, costUsd }` — returned by all wrapped fn() |
| `RFP_MODEL_RATES` | const | Rate map: gpt-4o {2.50, 10.00}, text-embedding-3-large {0.13, 0}, claude-sonnet-4-5 {3.00, 15.00}, claude-haiku-4-5 {0.25, 1.25} |
| `computeCostUsd` | function | Looks up rate; warns + returns 0 for unknown models (never blocks) |
| `checkBudget` | async function | Reads `monthly_ai_budget_usd`, sums month-to-date spend; throws `BudgetExceededError` if over; re-throws DB errors (fail-CLOSED) |
| `recordCost` | async function | Inserts `rfp_agent_sessions` row via `createAdminClient()` |
| `guardedLLMCall<T>` | async function | `checkBudget → fn() → recordCost` (recordCost failure non-fatal) |
| `budgetExceededResponse` | function | Returns `NextResponse` status 402 with `{ error, message, spent_usd, limit_usd }` |

### Task 3 — `lib/supabase/database.types.ts` Regeneration
- Regenerated via `supabase gen types typescript --project-id hgxxxmtfmvguotkowxbu` (not hand-edited)
- `rfp_entitlements` Row/Insert/Update now include `monthly_ai_budget_usd: number | null`
- All Phase 14 types preserved: `monthly_draft_quota`, `monthly_review_quota`, `monthly_score_quota`, `monthly_vault_mb`, `match_vault_docs` RPC

## Behavior Rules Confirmed
- NULL limit = unlimited (explicit `if (limitUsd === null || limitUsd === undefined) return;`)
- Fail-CLOSED on DB read error (re-throws as `new Error(...)` → 500, never fail-open)
- Budget period = UTC calendar month start (`Date.UTC(year, month, 1, 0, 0, 0, 0)`)
- `BudgetExceededError` thrown WITHOUT calling `fn()` when over limit
- `recordCost` errors swallowed with `console.error` (non-fatal)

## Model Rate Map Seeded

| Model | Input $/M | Output $/M |
|-------|-----------|------------|
| gpt-4o | $2.50 | $10.00 |
| text-embedding-3-large | $0.13 | $0 |
| claude-sonnet-4-5 | $3.00 | $15.00 |
| claude-haiku-4-5 | $0.25 | $1.25 |

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 — Migration | 11e8a3e | chore(17-01): add monthly_ai_budget_usd migration to rfp_entitlements |
| 2 — guardrail.ts | 71b6379 | feat(17-01): build lib/rfp/ai/guardrail.ts — per-tenant AI cost guardrail |
| 3 — database.types.ts | c06c51e | chore(17-01): regenerate database.types.ts — add monthly_ai_budget_usd to rfp_entitlements |

## Deviations from Plan

None — plan executed exactly as written.

The `as unknown as` cast for `monthly_ai_budget_usd` (mentioned as Phase 14 precedent) was used as written, and remains valid post-regen since the cast target type `{ monthly_ai_budget_usd: number | null } | null` matches the regenerated schema exactly.

## Self-Check: PASSED
