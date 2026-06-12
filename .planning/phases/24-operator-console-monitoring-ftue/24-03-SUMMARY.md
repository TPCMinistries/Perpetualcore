# Phase 24-03 Summary — Source Health Manual Rerun

## Completed

- Added source-scoped options to federal and state/city ingest orchestrators.
- Added `lib/rfp/admin-source-rerun.ts`.
- Added admin source support detection:
  - federal API sources
  - state/city scraper sources
  - `sbir` → `sbir_gov` fetcher mapping
- Added server action `rerunSource` to `/admin/rfp`.
- Added a Rerun column to the Source scale readiness table.
- Reruns log to `cron_executions` as `rfp-manual-source-rerun:{source}` so the result appears in Recent RFP cron runs after the page revalidates.
- Unsupported sources render `No runner`.

## Verification

- `npm run test:run -- tests/unit/rfp-admin-source-rerun.test.ts` — passed, 3 tests.
- Focused ESLint passed for admin rerun files.
- Runtime import check passed with local env loaded.

## Notes

- I did not run a live source rerun during implementation. A live rerun can create new baseline/drift rows and should be triggered deliberately from `/admin/rfp` for the specific source being investigated.
- Current production health still needs drift triage/parser fixes for the open source-drift events.
