# Phase 25-01 Summary — Authenticated Launch-Gate E2E

**Date:** 2026-06-13
**Status:** Complete

## Scope

Add production-authenticated E2E coverage for the RFP proposal workroom and submission packet path.

## Changes

- Expanded `tests/e2e/rfp-authenticated.spec.ts`.
- Added a reusable sign-in helper.
- Added optional `RFP_E2E_PROPOSAL_ID` support for direct proposal workroom testing.
- Added authenticated checks for:
  - proposal workroom rendering
  - reviewer/readiness/bundle surfaces
  - readiness JSON export
  - manifest CSV export
  - audit-trail CSV export
  - bundle ZIP export
  - proposal status transition to `no_bid`
  - proposal status reset to `draft`

## Production Verification

- Seeded a demo RFP auth user and org for E2E.
- Ran authenticated Playwright against `https://rfp.perpetualcore.com`.
- Result: 2 passed / 0 failed.
- Cleaned duplicate demo orgs created during repeat seed attempts; retained the E2E demo org.
- Repaired deterministic scoring coverage after demo seeding.
- Final production health:
  - status: `ok`
  - matches: 32,814 / 32,814 expected
  - scoring coverage: 100%
  - open drift events: 0
  - active orgs: 6

## Remaining Phase 25 Work

- Add CI wiring so authenticated launch-gate E2E can block merge to main.
- Decide whether the production demo E2E user should remain as a stable test fixture or be replaced by a staging-only fixture before public launch.
- Confirm production deployment should run from stable `main` for launch closeout.
