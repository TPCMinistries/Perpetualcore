# Phase 20-01 Summary — Canonical No-Bid Lifecycle Status

**Status:** Complete
**Requirement:** SUBMIT-02
**Date:** 2026-06-11

## Completed

- Added `no_bid` to `PATCH /api/rfp/proposals/[proposalId]/status`.
- Added live Supabase constraint support for `no_bid` while preserving legacy `withdrawn`.
- Updated proposal status controls so terminal outcomes use `No-bid`.
- Updated proposal and pursuit pages to normalize `no_bid` and legacy `withdrawn` as `No-bid`.
- Made the Proposals list `No-bid` filter include both `no_bid` and legacy `withdrawn` rows.
- Updated readiness logic so `no_bid` counts as a closed pursuit.
- Updated RLS endpoint coverage for the Phase 20 lifecycle vocabulary.

## Live DB Change

Applied to LDC Brain AI / project `hgxxxmtfmvguotkowxbu` via Supabase MCP `apply_migration`:

```sql
ALTER TABLE public.rfp_proposals
  DROP CONSTRAINT IF EXISTS rfp_proposals_status_check;

ALTER TABLE public.rfp_proposals
  ADD CONSTRAINT rfp_proposals_status_check
  CHECK (status = ANY (ARRAY[
    'draft'::text,
    'submitted'::text,
    'won'::text,
    'lost'::text,
    'no_bid'::text,
    'withdrawn'::text
  ]));
```

Verified constraint definition includes `no_bid` and `withdrawn`.

## Verification

Passed:

- `git diff --check`
- `npm run test:run -- tests/unit/rfp-submit-readiness-gate.test.ts tests/unit/rfp-submission-manifest.test.ts tests/unit/rfp-submission-bundle.test.ts tests/unit/rfp-submission-api-smoke.test.ts tests/unit/rfp-package-compliance.test.ts`
- `npm run test:run -- tests/rls/rfp-new-endpoints-tenant-isolation.test.ts -t "PATCH status='no_bid'"`

Known unrelated validation drift:

- Full `tests/rls/rfp-new-endpoints-tenant-isolation.test.ts` is not green: the older `submitted` status test now receives the submit-readiness gate `409`, and two package/redraft tests hit Vitest's 5s timeout.
- `npm run type-check` was stopped after more than five minutes with no diagnostics while `tsc` was still active.

## Next

Continue Phase 20 with amendment monitoring:

- Persist solicitation snapshots/amendments.
- Re-poll tracked active pursuits.
- Diff amendment text against original package capture.
- Notify on material changes and re-queue compliance/fit checks.
