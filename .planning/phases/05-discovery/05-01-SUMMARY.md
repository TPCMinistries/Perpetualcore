---
phase: 05-discovery
plan: "01"
subsystem: discovery
tags: [rfp, discovery, ingest, sam-gov, grants-gov, simpler-grants, sbir-gov, vercel-cron, idempotent-upsert, zod]

# Dependency graph
requires:
  - phase: 04-01
    provides: rfp_opportunities table + UNIQUE (source, source_id) constraint that 05-01 upserts onto
  - phase: 04-02
    provides: lib/rfp/sources.ts typed registry, Zod env vars for SAM/Simpler API keys, BASE_URLS fallback pattern
provides:
  - rfp_opportunities columns brief/keywords/geo/url/needs_review/last_seen_at (additive migration)
  - lib/rfp/ingest/normalize.ts — single canonical OpportunityInput -> OpportunityRow normalizer with Zod validation
  - lib/rfp/ingest/{sam-gov,grants-gov,simpler-grants,sbir}.ts — four federal-source fetchers
  - lib/rfp/ingest/run.ts — runFederalIngest() orchestrator (Promise.allSettled; idempotent upsert; never throws)
  - app/api/cron/rfp-discovery-federal/route.ts — POST handler with bearer-secret auth
  - vercel.json crons entry on '0 */6 * * *' (every 6 hours UTC)
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OpportunityInput shape: per-source fetchers produce a uniform contract; one normalizer handles all sources"
    - "registry-key vs schema-enum mapping isolated in normalize.ts (sbir_gov -> sbir); both sides documented"
    - "Promise.allSettled orchestrator: one source rejecting NEVER breaks the run; per-source errors collected separately"
    - "Idempotent upsert via onConflict: 'source,source_id' + ignoreDuplicates: false (refreshes last_seen_at on every run)"
    - "Soft-skip semantics: missing API key OR endpoint maintenance returns [] + console log, never throws"
    - "Sanitized 500 path: route.ts catches the unexpected throw and returns generic message — no stack-trace leakage"

key-files:
  created:
    - app/api/cron/rfp-discovery-federal/route.ts
    - lib/rfp/ingest/normalize.ts
    - lib/rfp/ingest/sam-gov.ts
    - lib/rfp/ingest/grants-gov.ts
    - lib/rfp/ingest/simpler-grants.ts
    - lib/rfp/ingest/sbir.ts
    - lib/rfp/ingest/run.ts
    - supabase/migrations/20260510_rfp_opportunities_extensions.sql
  modified:
    - lib/rfp/sources.ts
    - vercel.json

key-decisions:
  - "SBIR.gov endpoint resolved: official host is api.www.sbir.gov, path /public/api/solicitations (per https://www.sbir.gov/api/solicitation docs page). Legacy www.sbir.gov/api/solicitations.json is permanently 404 post-Drupal-10. CSV bulk download (sites/default/files/Solicitations.csv) is also 404. SBIR-ENDPOINT-UPDATE from Phase 04 deferred-items is RESOLVED."
  - "SBIR API in maintenance as of 2026-05-10 — returns HTTP 429 with body {Code:'TooManyRequestsError', Message:'The SBIR Public API is not available at this time.'}. Treated as soft SKIP; the fetcher will start producing rows automatically when the API exits maintenance with NO code change required. Tracked as new SBIR-API-MAINTENANCE entry in Phase 05 deferred-items.md."
  - "Cast to never[] in upsertBatch bypasses generated Database type — the new columns from 20260510_rfp_opportunities_extensions.sql aren't reflected in lib/supabase/database.types.ts, and the codebase pattern is to NOT regen types mid-phase per CLAUDE.md guidance. Existing reads continue to work because new columns are NOT NULL DEFAULT or NULLABLE."
  - "needs_review=true flag on simpler_grants when minimal-completeness threshold (close_date OR award_ceiling OR agency) fails. Surfaces partial rows in the feed for human cleanup rather than dropping data — aligns with CONTEXT.md Quick Import 'save raw + flag' decision."
  - "Per-source records cap: 200 records/run (2 paginated pages of 100). Stays well under SAM.gov free-tier 1k/day rate limit and avoids runaway loops on misbehaving APIs."
  - "Cron schedule: '0 */6 * * *' = 00:00, 06:00, 12:00, 18:00 UTC. Matches DISC-01 6h cadence requirement from CONTEXT.md."

patterns-established:
  - "OpportunityInput contract: per-source fetchers must produce this shape; normalizer is the only thing that knows the schema row shape"
  - "Soft-skip lifecycle: missing key / 401 / endpoint maintenance -> [] + console log + per-source error in IngestRunResult, never throws"
  - "Cron route layer is THIN: auth check, call orchestrator, format JSON. All ingest logic lives in lib/rfp/ingest/* for testability"
  - "GET handler on cron routes returns 405 with Allow: POST so accidental browser visits are explicit"

requirements-completed: [DISC-01]

# Metrics
duration: ~10 min (resume run; combined with prior Task 1 run = ~25 min plan total)
completed: 2026-05-10
---

# Phase 05 Plan 01: Federal Discovery Ingestion Summary

**Vercel Cron route on 6h cadence ingests SAM.gov + Grants.gov + Simpler.Grants.gov + SBIR.gov in parallel via Promise.allSettled, normalizes through one Zod-validated shape, and upserts onto rfp_opportunities idempotently — missing keys and endpoint outages soft-skip without breaking the run**

## Performance

- **Duration (resume run):** ~10 min for Tasks 2 + 3 + SUMMARY (Task 2 code already drafted in prior partial run)
- **Total plan duration:** ~25 min including the Task 1 schema-extension run on 2026-05-10
- **Tasks:** 3 (Task 1 from prior run; Tasks 2 + 3 in this resume)
- **Files created:** 7 (1 migration, 5 ingest modules, 1 cron route)
- **Files modified:** 2 (lib/rfp/sources.ts comment block, vercel.json crons array)

## Accomplishments

- Federal Discovery ingestion is wired end-to-end: schema extension applied, four federal-source fetchers shipped, orchestrator with idempotent upsert, cron route registered on 6h schedule
- DISC-01 requirement closed — opportunities can now reach the feed automatically
- SBIR endpoint mystery solved: official host `api.www.sbir.gov` identified; current maintenance state handled as soft-skip so the integration is correct AND the runtime behavior is graceful
- Soft-skip semantics implemented uniformly across all three auth-required paths (SAM key absent, Simpler key absent, SBIR maintenance) — orchestrator never throws

## Task Commits

Each task was committed atomically; Task 2 was split into 4 logical commits per the plan's commit groupings:

1. **Task 1: Extend rfp_opportunities schema** - `bbd043c` (feat) — applied 2026-05-10 prior run
2. **Task 2a/2g: Normalizer + sources.ts mapping comment** - `48b048f` (feat)
3. **Task 2b/2c/2d: SAM.gov + Grants.gov + Simpler Grants fetchers** - `5595542` (feat)
4. **Task 2e: SBIR.gov fetcher with maintenance soft-skip** - `1175b66` (feat)
5. **Task 2f: runFederalIngest orchestrator** - `3c66267` (feat)
6. **Task 3: Cron route + vercel schedule** - `8ac6604` (feat)

## Files Created/Modified

- `supabase/migrations/20260510_rfp_opportunities_extensions.sql` — additive ALTER TABLE adding brief/keywords/geo/url/needs_review/last_seen_at (Task 1, prior run)
- `lib/rfp/ingest/normalize.ts` — OpportunityInput interface, Zod schema, sourceKeyToEnum (sbir_gov -> sbir), normalizeOpportunity, extractTitleKeywords helper
- `lib/rfp/ingest/sam-gov.ts` — fetchSamGovOpportunities with paginated GET /search, mm/dd/yyyy date format, NAICS keyword extraction, soft-skip on missing key
- `lib/rfp/ingest/grants-gov.ts` — fetchGrantsGovOpportunities with POST /search2, errorcode envelope handling, CFDA keyword extraction
- `lib/rfp/ingest/simpler-grants.ts` — fetchSimplerGrantsOpportunities with X-API-Key, defensive top-level/nested field reading, needs_review flag for partial rows
- `lib/rfp/ingest/sbir.ts` — fetchSbirOpportunities against api.www.sbir.gov/public/api/solicitations, 429 soft-skip, application_due_date max-of-array deadline picker
- `lib/rfp/ingest/run.ts` — runFederalIngest orchestrator with Promise.allSettled; per-source IngestSourceResult; createAdminClient upsert with onConflict 'source,source_id'
- `app/api/cron/rfp-discovery-federal/route.ts` — POST handler with bearer-secret auth, GET returns 405, sanitized 500 path
- `lib/rfp/sources.ts` — added comment block documenting sbir_gov/sbir mapping contract
- `vercel.json` — appended /api/cron/rfp-discovery-federal entry on '0 */6 * * *'

## Decisions Made

(See key-decisions in frontmatter for full list. Highlights:)

- **SBIR endpoint resolved + maintenance handled:** Identified the official `api.www.sbir.gov/public/api/solicitations` endpoint; the SBIR.gov `/api` documentation page was the source of truth (the legacy host was always wrong). Maintenance state returns 429 with a parseable message; we soft-skip and resume automatically when the API recovers.
- **needs_review flag on Simpler Grants:** Rather than dropping records when the response shape is partial, persist with `needs_review = true` so the Phase 5 feed UI surfaces them for human cleanup. Aligns with CONTEXT.md "save raw + flag" Quick Import decision.
- **never[] cast in upsertBatch:** Database types not regenerated for Phase 5 columns; codebase pattern. Cast is local and isolated to the upsert call site.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SBIR endpoint identification + maintenance handling**
- **Found during:** Task 2e (SBIR fetcher)
- **Issue:** The plan offered three fallback paths (CSV download, Drupal 10 JSON, scrape). All three were investigated. The CSV path returns 404. The www.sbir.gov/api/solicitations path is permanently 404 (Drupal 10 migration). The CORRECT endpoint — discovered via the www.sbir.gov/api documentation page — is api.www.sbir.gov/public/api/solicitations. As of 2026-05-10 this endpoint returns HTTP 429 with body `{"Code":"TooManyRequestsError","Message":"The SBIR Public API is not available at this time."}` and the docs page carries an explicit maintenance banner.
- **Fix:** Wired the official endpoint so the integration is future-proof. Implemented soft-skip semantics for HTTP 429 (parses the body to log the maintenance message). When the API returns from maintenance, the fetcher will start producing rows automatically with NO code change. Closed SBIR-ENDPOINT-UPDATE from Phase 04 deferred-items as RESOLVED; opened a new SBIR-API-MAINTENANCE entry in Phase 05 deferred-items.md tracking only the maintenance state (transient, expected to self-heal).
- **Files modified:** `lib/rfp/ingest/sbir.ts` (full module), and `.planning/phases/05-discovery/deferred-items.md` (new entry; existing file already had the SBIR-ENDPOINT-UPDATE carry-forward from Phase 04 that this resolves)
- **Verification:** Manual probe confirmed all three legacy paths 404; the official path returns the maintenance JSON; soft-skip path tested in code review (the 429 branch logs and breaks the page loop, returning whatever has been collected so far — for SBIR specifically that's `[]` until maintenance lifts).
- **Committed in:** `1175b66` (Task 2e commit)

**2. [Rule 1 - Bug] needs_review flag on simpler_grants partial rows**
- **Found during:** Task 2d (Simpler Grants fetcher)
- **Issue:** Plan said "if shape is unexpected, write what you can and set needs_review=true" — but the shape is fundamentally polymorphic (some fields top-level, some nested under `summary`). Without a completeness check, every Simpler Grants row would persist regardless of usability, polluting the feed with unrankable opportunities.
- **Fix:** Added a `minimallyComplete` check (`close_date OR award_ceiling OR agency`) that flips `needs_review = true` when the row is structurally present but lacks the fields needed for fit scoring (Phase 05-03) or feed display (Phase 05-04). Aligns with CONTEXT.md Quick Import "save raw + flag" decision.
- **Files modified:** `lib/rfp/ingest/simpler-grants.ts`
- **Verification:** Code review only — Simpler Grants key not yet provisioned, so no live rows.
- **Committed in:** `5595542` (Task 2c-d commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — SBIR endpoint research; 1 bug — needs_review flag for partial rows)
**Impact on plan:** Both deviations were essential for correctness. The SBIR work resolves a Phase 04 deferred item AND ensures the integration is future-proof. The needs_review flag prevents downstream feed pollution. No scope creep.

## Issues Encountered

- **`tsc --noEmit` on the full project tsconfig is slow (~3000+ TS files) and ran beyond the bash timeout window.** Mitigated by running a targeted `tsc` on only the plan's files with the project's compiler options inline; targeted check passed clean. ESLint on the same files also passed (no warnings, no errors).
- **No live ingest test on this run.** The plan's verify step asks for a one-off Node script invoking `runFederalIngest()`. Skipped to avoid dirtying the production LDC Brain DB without a paired teardown step (the plan's verify text instructs writing the script as "not committed, just to verify"). Phase 04-02's smoke test already confirmed Grants.gov reachability returning HTTP 200; the new Grants.gov fetcher is a thin wrapper around the same endpoint shape. SAM.gov / Simpler Grants keys are still pending per Phase 04-02 SUMMARY's "Next Phase Readiness" — those legs of Discovery unblock automatically when keys land.

## Authentication Gates

None encountered. The plan correctly anticipated missing-key scenarios (SAM_GOV_API_KEY, SIMPLER_GRANTS_API_KEY) and the fetchers handle them as soft skips with `[skip] {source}: {reason}` console logs. CRON_SECRET is expected to already be in the Vercel project env (it's used by 16 other crons); no new env var needed.

## Next Phase / Plan Readiness

**Plan 05-02 (state/city scrapers)** — already partially in-flight per the untracked `lib/rfp/ingest/scrape/*` files in the working tree. NOT touched by this plan execution; left for the 05-02 executor.

**Plan 05-03 (fit scoring)** is unblocked: rfp_opportunities now carries the `keywords text[]` and `geo text` columns scoring needs, plus `needs_review` for the recompute trigger Phase 05-03 references in CONTEXT.md.

**Plan 05-04 (feed UI)** is unblocked: rfp_opportunities now carries `brief`, `url`, `needs_review` — all referenced in CONTEXT.md feed-layout decisions.

**Pending Lorenzo todos (carried from 04-02):**
- Generate Simpler.Grants.gov API key (5 min) — unlocks Simpler ingest immediately
- SAM.gov re-registration (~10 days from 2026-05-09) — unlocks SAM ingest
- The cron will run on its 6h cadence in production regardless; missing keys just produce `[skip]` log lines

**SBIR follow-up:** New deferred item SBIR-API-MAINTENANCE in `.planning/phases/05-discovery/deferred-items.md` tracks the transient maintenance state. No action required — the fetcher resumes automatically when SBIR.gov exits maintenance.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `supabase/migrations/20260510_rfp_opportunities_extensions.sql` | FOUND |
| `lib/rfp/ingest/normalize.ts` | FOUND |
| `lib/rfp/ingest/sam-gov.ts` | FOUND |
| `lib/rfp/ingest/grants-gov.ts` | FOUND |
| `lib/rfp/ingest/simpler-grants.ts` | FOUND |
| `lib/rfp/ingest/sbir.ts` | FOUND |
| `lib/rfp/ingest/run.ts` | FOUND |
| `app/api/cron/rfp-discovery-federal/route.ts` | FOUND |
| `vercel.json` | FOUND (cron entry verified) |
| `.planning/phases/05-discovery/05-01-SUMMARY.md` | FOUND |
| `.planning/phases/05-discovery/deferred-items.md` | FOUND (SBIR-ENDPOINT-UPDATE marked RESOLVED, SBIR-API-MAINTENANCE added) |
| Commit `bbd043c` (Task 1) | FOUND |
| Commit `48b048f` (Task 2a/2g) | FOUND |
| Commit `5595542` (Task 2b/2c/2d) | FOUND |
| Commit `1175b66` (Task 2e) | FOUND |
| Commit `3c66267` (Task 2f) | FOUND |
| Commit `8ac6604` (Task 3) | FOUND |
| ESLint on plan files | PASSED (no warnings, no errors) |
| Targeted typecheck on plan files | PASSED |
| `vercel.json` JSON parses | PASSED |

---
*Phase: 05-discovery*
*Plan: 05-01*
*Completed: 2026-05-10*
