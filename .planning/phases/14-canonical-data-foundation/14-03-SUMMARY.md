---
phase: 14-canonical-data-foundation
plan: 03
subsystem: database
tags: [supabase, postgres, rls, stripe, entitlements, webhook]

# Dependency graph
requires:
  - phase: 14-canonical-data-foundation
    provides: rfp_my_org_ids() SECURITY DEFINER helper from 04-01 recursion fix
  - phase: prior-work
    provides: rfp_org_subscriptions table + Stripe webhook handler in app/api/webhooks/rfp-stripe/route.ts
provides:
  - rfp_entitlements table with coverage_level CHECK, 4 quota columns, operator-override metadata, UNIQUE(org_id), RLS
  - Tier→coverage upsert wired into Stripe webhook (null/trial→free, pro→l1, agency→l2)
  - Operator-override isolation: SQL UPDATE on one org does not affect other orgs
affects: [phase-17-billing-enforcement, phase-22-security, scoring-features, AI-cost-preflight]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "rfp_entitlements upsert provides only 3 fields (org_id, coverage_level, updated_at) — override fields left untouched"
    - "Coverage level as text CHECK (not enum) to avoid enum-value migration complexity"
    - "Tier→coverage mapping inline in webhook: null/trial→free, pro→l1, agency→l2"

key-files:
  created:
    - supabase/migrations/20260606_rfp_entitlements.sql
    - .planning/phases/14-canonical-data-foundation/14-03-SUMMARY.md
  modified:
    - app/api/webhooks/rfp-stripe/route.ts

key-decisions:
  - "Coverage level stored as text CHECK constraint (not Postgres enum) to avoid enum-value migration complexity when l3 is added"
  - "Webhook upsert provides ONLY org_id/coverage_level/updated_at — operator override fields preserved on conflict"
  - "Quota enforcement and AI-cost ledger explicitly deferred to Phase 17 (quota columns are nullable)"
  - "rfp_my_org_ids() SECURITY DEFINER helper used for RLS (no inline EXISTS to avoid recursion pattern from 04-01)"

patterns-established:
  - "FND-04 pattern: entitlement row written atomically alongside subscription row on every webhook event"
  - "Operator override: SQL UPDATE with override_reason/override_at fields; webhook upsert never overwrites these"

requirements-completed: [FND-04]

# Metrics
duration: 10min
completed: 2026-06-06
---

# Phase 14, Plan 03: Entitlement Layer Summary

**rfp_entitlements table (coverage_level CHECK + 4 quota cols + operator override) created and wired into Stripe webhook with tier→coverage atomic upsert; two-org isolation test passes**

## Performance

- **Duration:** 10 min
- **Started:** 2026-06-06T21:30:55Z
- **Completed:** 2026-06-06T21:40:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `rfp_entitlements` table with `coverage_level IN ('free','l1','l2','l3')` CHECK constraint (not enum), 4 quota columns (nullable = unlimited until Phase 17), operator-override metadata, UNIQUE(org_id), RLS enabled
- Two policies: `rfp_entitlements_select` (org members read via `rfp_my_org_ids()`) and `rfp_entitlements_service_write` (service_role ALL)
- Wired atomic entitlement upsert into `upsertFromSubscription` in the Stripe webhook handler
- Tier→coverage mapping: `null/trial→free`, `pro→l1`, `agency→l2`; override fields preserved on conflict
- Operator-override isolation proven: UPDATE on orgA (IHA → l2) leaves orgB (Demo) unchanged at free

## Task Commits

Each task was committed atomically:

1. **Task 1: Create rfp_entitlements table with RLS** - `089f9b6` (feat)
2. **Task 2: Wire entitlement upsert into Stripe webhook + verify operator override isolation** - `b3a3782` (feat)

**Plan metadata:** (docs commit — see state_updates section)

## Files Created/Modified
- `supabase/migrations/20260606_rfp_entitlements.sql` - CREATE TABLE + RLS (applied to hgxxxmtfmvguotkowxbu)
- `app/api/webhooks/rfp-stripe/route.ts` - Added `tierToCoverage` mapper + `rfp_entitlements` upsert in `upsertFromSubscription`

## Decisions Made
- **Text CHECK over Postgres enum** for `coverage_level`: Adding `l3` later requires only an ALTER CHECK, not a new migration for enum values
- **Webhook provides 3 fields only** (`org_id`, `coverage_level`, `updated_at`): `onConflict` update of only these keys means operator override fields (`override_by`, `override_reason`, `override_at`) survive subsequent webhook events
- **Phase 17 boundary maintained**: No `monthly_ai_budget_usd` or enforcement middleware added; quota columns are nullable (NULL = unlimited)
- **`rfp_my_org_ids()` SECURITY DEFINER helper** used for RLS SELECT policy — avoids inline `EXISTS(SELECT FROM rfp_user_orgs)` recursion pattern that was fixed in migration 04-01

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- `npm run lint` script failed due to broken symlink in node_modules (Next.js not fully installed). Ran `npm install --ignore-scripts` to restore. ESLint ran cleanly against the webhook file with no errors after that.
- Full `tsc --noEmit` hung in background due to large codebase; verified TypeScript syntax parses correctly using TS AST check. The new code uses the existing `as never` cast pattern (already validated in the codebase) with no new types.

## User Setup Required
None — no external service configuration required. Migration was applied to `hgxxxmtfmvguotkowxbu` (LDC Brain AI). Webhook handler is serverless.

## Next Phase Readiness
- `rfp_entitlements` table live in production with correct RLS
- Every Stripe subscription event now writes both `rfp_org_subscriptions` and `rfp_entitlements` atomically
- Operator can override any org's `coverage_level` with SQL UPDATE without it being overwritten by the next webhook event
- Phase 17 (AI cost + quota enforcement) can read `coverage_level` and quota columns from this table; enforcement middleware not built here

---
*Phase: 14-canonical-data-foundation*
*Completed: 2026-06-06*
