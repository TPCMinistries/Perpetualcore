# Phase 20-03 Summary — Amendment Snapshots and Diffing

**Status:** Complete
**Requirements:** SUBMIT-03, SUBMIT-04
**Date:** 2026-06-11

## Completed

- Added `rfp_solicitation_snapshots` for per-org/per-opportunity solicitation baselines.
- Added `rfp_solicitation_amendments` for durable diff events with materiality, reasons, status, and diff JSON.
- Added deterministic snapshot hashing and field/text diffing in `lib/rfp/amendments/diff.ts`.
- Added `runAmendmentMonitor()` service for active proposal-backed pursuits.
- Added `/api/cron/rfp-amendment-monitor`, protected by `CRON_SECRET`.
- Added `/api/rfp/opps/[id]/amendments?org_id=...` for tenant-scoped amendment readback.
- Added recent amendment summaries to `/api/rfp/opps/[id]`.
- Rendered a compact Solicitation Amendments panel in the Discovery detail pane.
- For material amendments, the monitor creates:
  - a critical submission task: "Review material solicitation amendment"
  - a pursuit decision-log risk entry: "Material amendment detected"

## Live DB Change

Applied to LDC Brain AI / project `hgxxxmtfmvguotkowxbu` via Supabase MCP `apply_migration`.

Verified live:

- `rfp_solicitation_snapshots` exists with RLS enabled.
- `rfp_solicitation_amendments` exists with RLS enabled.
- Both tables have SELECT/INSERT/UPDATE/DELETE policies.

## Verification

Passed:

- `git diff --check`
- `npm run test:run -- tests/unit/rfp-amendment-diff.test.ts`
- `npm run test:run -- tests/unit/rfp-submit-readiness-gate.test.ts tests/unit/rfp-submission-api-smoke.test.ts`
- `npx eslint lib/rfp/amendments app/api/cron/rfp-amendment-monitor 'app/api/rfp/opps/[id]/amendments/route.ts' 'app/api/rfp/opps/[id]/route.ts' 'app/(dashboard)/org/[orgId]/discovery/parts/DetailPane.tsx' tests/unit/rfp-amendment-diff.test.ts --ext .ts,.tsx`
- Runtime import check for amendment modules/routes.

Not run:

- Production amendment monitor execution against real pursuits, to avoid creating baseline rows outside a seeded verification scenario.
- Full repo `npm run type-check`; prior Phase 20-01 run was stopped after 5+ minutes with no diagnostics.

## Next

Finish 20-02: run a coherent submission packet review/export verification pass and polish any remaining packet UX gaps.
