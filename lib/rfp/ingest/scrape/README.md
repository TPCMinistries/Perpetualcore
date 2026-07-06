# State/City RFP Scrapers — Operational Guide

**Phase 05-02 (Discovery).** Scrapers for NY State Grants Gateway and three NYC sources (DYCD, HRA, DOE). Each scraper produces `OpportunityInput[]`; the orchestrator (`lib/rfp/ingest/run-state-city.ts`) upserts to `rfp_opportunities`.

## Why scraping (and not APIs)

These four sources have no documented public REST APIs at the time of writing (2026-05-10). They render listings server-side as HTML (table or card layouts), so the lightest defensible path is regex-bounded HTML extraction over a polite `fetch`. We deliberately avoid `cheerio`/`jsdom`/`playwright` to keep the cron route fast and cold-start-friendly within Vercel's serverless function budget.

If a source migrates to a JavaScript-rendered SPA, the corresponding scraper file should be rewritten to consume the underlying XHR JSON endpoint that the SPA itself fetches. Document the chosen URL + parse approach below when this happens.

## Per-source

| Source | Key | URL | Method | Parse | Last verified | Expected baseline |
|---|---|---|---|---|---|---|
| NY State Grants Gateway | `ny_state` | `https://grantsmanagement.ny.gov/grant-opportunities` | GET, no auth | Table-row regex; falls back to `<article>`/card layout | 2026-05-10 | 30–80 active |
| NYC DYCD | `nyc_dycd` | `https://www.nyc.gov/site/dycd/funding/rfp-listings.page` | GET, no auth | Table-row regex; expects RFP # / Title / Released / Due columns | 2026-05-10 | 10–30 active |
| NYC HRA | `nyc_hra` | `https://www.nyc.gov/site/hra/about/contracting-procurement.page` | GET, no auth | Table-row + anchor fallback (HRA links many opps to PASSPort, login-walled) | 2026-05-10 | 5–15 active |
| NYC DOE | `nyc_doe` | `https://www.nyc.gov/site/doe/funding/contract-opportunities.page` | GET, no auth | Table-row + anchor fallback | 2026-05-10 | 5–25 active |

## Throttling

- 1 request per second per source (`REQUEST_DELAY_MS` in `utils.ts`). Plan §4.1 of TECH-SPEC.
- All four scrapers run in parallel via `Promise.allSettled` in the orchestrator — throttling is intra-scraper if a scraper makes follow-up requests for detail pages (none currently do).
- User-Agent: `PerpetualCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)`.

## Drift triggers

Drift events are written to `rfp_source_drift` and (subject to a 24h-per-source-per-reason throttle) emailed to the admin.

| Reason | Trigger | Action |
|---|---|---|
| `http_status` | Response status >= 400 | Insert drift row, return `[]`. |
| `fetch_error` | `fetch()` throws (network, DNS, TLS) | Insert drift row, return `[]`. |
| `zero_nodes` | HTML parsed but parser found 0 records, AND page LOOKS like a listing page (still has tables, etc.) | Insert drift row, return `[]`. |
| `shape_mismatch` | HTML parsed but no listing structure recognized at all | Insert drift row, return `[]`. |
| `count_anomaly` | Parsed count drops below 50% of the rolling 3-run baseline | Insert drift row. **Records still upserted** — drift is signal, not gate. |

### Count-anomaly threshold rationale

- **50% drop** is a deliberately blunt detector. It catches "parser broke and now we get 2 records instead of 50" without firing on normal weekly variance (a 20–30% drop on a slow filing week is common).
- **Self-healing**: the orchestrator always calls `recordBaseline(source, parsed_count)` on a successful run, so if a source legitimately shrinks (e.g. NYC DYCD ends a RFP wave), the next 3 cron ticks re-establish a new lower baseline and `count_anomaly` stops firing.
- A finer-grained per-record validity check ("partial_failure") is deferred to Phase 10 admin tooling — see `.planning/phases/05-discovery/deferred-items.md`.

## When this breaks

1. Open `rfp_source_drift` in Supabase: `SELECT * FROM rfp_source_drift WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT 20;` to see active issues.
2. Eyeball the source URL in a browser. Common modes of breakage:
   - URL changed (404 → `http_status` drift).
   - Listing moved from a static HTML page to a JS-rendered SPA (zero rows → `zero_nodes`).
   - Column order changed (records still appear but with garbage in `agency` etc. — `count_anomaly` will likely fire over the next few runs).
3. Update the corresponding `lib/rfp/ingest/scrape/{source}.ts` parser.
4. If the parser change intentionally produces a lower steady-state count: delete the rolling baseline rows so the new count establishes cleanly:
   ```sql
   DELETE FROM rfp_source_baseline WHERE source = 'ny_state';
   ```
5. Mark the drift row resolved:
   ```sql
   UPDATE rfp_source_drift SET resolved_at = now() WHERE id = '...';
   ```

## Resend domain caveat

Drift alert emails fall back to a `[DRIFT-ALERT-FALLBACK]` console log when Resend rejects the From domain (DNS verification pending — see `.planning/phases/05-discovery/deferred-items.md` RESEND-DOMAIN-VERIFICATION). The drift row is **always** persisted; only the email side-channel may fall back. When the domain is verified and `RESEND_FROM_EMAIL` (or `RFP_ALERT_FROM_EMAIL`) is set, emails resume automatically with no code change.

## Adding a new source

1. Create `lib/rfp/ingest/scrape/{new-source}.ts`. Export `fetch{NewSource}Opportunities()` returning `Promise<OpportunityInput[]>`.
2. Add to `SCRAPERS` array in `run-state-city.ts`.
3. If the new source key is not yet in the `rfp_opportunities_source_check` constraint, add a migration to extend it.
4. Update the table in this README with the URL, method, parse strategy, and baseline.
5. Smoke test with a one-off `npx tsx scripts/run-state-city-once.ts` (not committed) — confirm at least one record lands and a drift row appears for any failure mode.

## Files in this directory

- `drift.ts` — `recordDrift`, `recordBaseline`, `getRollingBaseline`. Service-role only.
- `types.ts` — local `OpportunityInput` shape (mirrors 05-01 normalize.ts).
- `utils.ts` — `fetchHtml`, `stripTags`, `toIsoDate`, `toAmount`, `fallbackSourceId`, `normalizeKeywords`.
- `ny-state.ts`, `nyc-dycd.ts`, `nyc-hra.ts`, `nyc-doe.ts` — per-source scrapers.
- `README.md` — this file.
