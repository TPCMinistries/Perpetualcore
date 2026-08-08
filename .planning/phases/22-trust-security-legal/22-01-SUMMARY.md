---
phase: 22-trust-security-legal
plan: 01
subsystem: testing
tags: [rls, ci, vitest, github-actions, supabase, multi-tenant, security]

# Dependency graph
requires:
  - phase: 14-canonical-data-foundation
    provides: "rfp_entitlements table with ON DELETE CASCADE FK, coverage_level CHECK constraint, rfp_my_org_ids() SECURITY DEFINER RLS SELECT policy"
provides:
  - "Cross-tenant RLS isolation suite extended to cover rfp_entitlements (Org A reads 0 rows for Org B's entitlements)"
  - "test-rls CI job in ci.yml running npx vitest run tests/rls/ with all three Supabase secrets"
  - "Branch protection on main requiring Cross-Tenant RLS Gate as required status check"
affects: [23-billing-subscriptions, 17-ai-cost-guardrails, any phase that adds new tenant-scoped tables]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS isolation test pattern: seed via admin client, assert via user-scoped client, cleanup via CASCADE FK"
    - "CI live-DB gate pattern: dedicated job (test-rls) separate from unit tests (test), scoped to tests/rls/, service-role key not shared with unit test job"

key-files:
  created: []
  modified:
    - tests/rls/rfp-tenant-isolation.test.ts
    - .github/workflows/ci.yml

key-decisions:
  - "Branch protection set via gh API (not deferred to UI): Cross-Tenant RLS Gate added as required check on main"
  - "rfp_entitlements ON DELETE CASCADE confirmed — no explicit afterAll cleanup needed; org deletes cascade"
  - "coverage_level seeded as l1 (matching Stripe webhook minimal shape from Phase 14-03 decision)"
  - "test-rls job depends on lint-and-typecheck but NOT on build — runs in parallel with build job to save CI time"
  - "SUPABASE_SERVICE_ROLE_KEY NOT added to existing test job — avoids prod-DB RLS tests on every unit test run"

patterns-established:
  - "CI live-DB isolation gate: separate job, secrets scoped only to that job, runs tests/rls/ only"
  - "RLS positive-control pattern: assert own-org read returns >= 1 row alongside the cross-tenant 0-row assertion"

requirements-completed: [TRUST-01]

# Metrics
duration: 12min
completed: 2026-06-07
---

# Phase 22 Plan 01: Trust Security Legal Summary

**Cross-tenant RLS isolation gate extended to rfp_entitlements and wired as required CI check via GitHub Actions test-rls job with branch protection on main**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-07T03:47:00Z
- **Completed:** 2026-06-07T03:59:13Z
- **Tasks:** 2 auto (Task 3 checkpoint pre-resolved by orchestrator)
- **Files modified:** 2

## Accomplishments
- Extended tests/rls/rfp-tenant-isolation.test.ts with 2 new assertions: User A reads 0 rows for Org B's rfp_entitlements (cross-tenant isolation), and User A reads >= 1 row for own Org A entitlements (positive control)
- All 8 tests in the suite pass against the live LDC Brain AI DB (hgxxxmtfmvguotkowxbu)
- Added test-rls CI job to .github/workflows/ci.yml with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY secrets; scoped to tests/rls/ only
- Branch protection on main set via gh API — Cross-Tenant RLS Gate is now a required status check (confirmed: `"contexts":["Cross-Tenant RLS Gate"]` in API response)

## Task Commits

1. **Task 1: Add rfp_entitlements cross-tenant assertions** - `d482b6f` (feat)
2. **Task 2: Add test-rls CI job** - `b70fd1e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `tests/rls/rfp-tenant-isolation.test.ts` - Added 2 entitlement assertions + entitlement seed in beforeAll; afterAll unchanged (CASCADE handles cleanup)
- `.github/workflows/ci.yml` - Added test-rls job (22 lines) after existing test job; existing jobs unchanged

## Decisions Made
- Branch protection set programmatically via `gh api -X PUT repos/TPCMinistries/Perpetualcore/branches/main/protection` — succeeded (no UI action required from operator)
- rfp_entitlements ON DELETE CASCADE FK confirmed in migration — no explicit delete in afterAll needed
- Seeded coverage_level as `l1` (valid CHECK value; matches the 3-field minimal shape the Stripe webhook upserts per Phase 14-03 decision log)
- test-rls job does NOT depend on build job — runs in parallel to save CI wall time; only needs lint-and-typecheck to pass first
- SUPABASE_SERVICE_ROLE_KEY kept out of the existing `test` job to avoid running prod-DB assertions on every unit test run

## Deviations from Plan

None - plan executed exactly as written. Branch protection was successfully set via gh API (orchestrator pre-noted it might need manual fallback — it did not).

## Issues Encountered
- GoTrueClient "multiple instances" stderr warning appears during test run — this is benign (not an error), pre-existing, and out of scope. All 8 assertions pass cleanly.

## User Setup Required

Task 3 checkpoint was pre-resolved by the orchestrator:
- NEXT_PUBLIC_SUPABASE_URL: confirmed present in repo secrets
- NEXT_PUBLIC_SUPABASE_ANON_KEY: confirmed present in repo secrets
- SUPABASE_SERVICE_ROLE_KEY: confirmed present in repo secrets
- Branch protection (Cross-Tenant RLS Gate required check on main): SET programmatically via gh API — no manual action needed

## Next Phase Readiness
- TRUST-01 satisfied: CI test authenticating as Org A returns 0 rows for Org B's proposals, vault chunks, AND entitlements; Cross-Tenant RLS Gate is a required pipeline check
- Phase 22 can proceed to remaining plans (privacy policy, ToS, data processing addendum if any)
- The isolation suite pattern (seed/assert/cascade cleanup) is established for any future tenant-scoped tables

## Self-Check: PASSED

- FOUND: tests/rls/rfp-tenant-isolation.test.ts
- FOUND: .github/workflows/ci.yml
- FOUND: commit d482b6f (Task 1 - rfp_entitlements assertions)
- FOUND: commit b70fd1e (Task 2 - test-rls CI job)

---
*Phase: 22-trust-security-legal*
*Completed: 2026-06-07*
