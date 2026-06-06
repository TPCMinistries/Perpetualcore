# 13-02 Drift Triage Register

**Produced by:** Phase 13 Plan 02 (pre-work-stabilization)
**Triaged on:** 2026-06-06
**Database:** LDC Brain AI (hgxxxmtfmvguotkowxbu)
**Table:** `rfp_source_drift`

## Summary

| Metric | Count |
|--------|-------|
| Total drift events (all time) | 18 |
| Open at plan start | 0 (all 18 already resolved at 2026-06-01 05:45:16 UTC) |
| Open at plan end | 0 |
| Retrospectively classified + annotated | 18 |
| Triage annotation written to DB (`details` jsonb) | 18 |

**Before/after open-drift count:** 0 → 0 (events were resolved prior to this plan executing; this plan classified them retrospectively and annotated the `details` jsonb with `triaged_by`, `triage`, `note`, `owner`, `eta` fields).

---

## Read-Only Query Output (pre-triage)

```sql
SELECT id, source, reason, details, created_at, resolved_at
FROM rfp_source_drift
WHERE resolved_at IS NULL
ORDER BY source, created_at DESC;
-- Result: 0 rows (all 18 already resolved at 2026-06-01 05:45:16+00)
```

Full scan (all rows including resolved):
```sql
SELECT COUNT(*) as total,
       COUNT(*) FILTER (WHERE resolved_at IS NULL) as open_count,
       COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_count
FROM rfp_source_drift;
-- Result: total=18, open_count=0, resolved_count=18
```

---

## Triage Register — All 18 Events

Classification legend:
- **stale-URL**: Source endpoint returned HTTP 404/410 — URL moved or removed
- **parser-break**: shape_mismatch / zero_nodes on a source that should return data — scraper code change needed
- **upstream-empty**: zero_nodes where source legitimately had no new postings
- **transient**: fetch_error / 5xx, self-recovered

| # | ID (short) | Source | Reason | Classification | Likely Cause | Disposition | Owner | ETA |
|---|-----------|--------|--------|----------------|-------------|-------------|-------|-----|
| 1 | `c95fd6e2` | ny_state | http_status 404 | stale-URL | `grantsmanagement.ny.gov/grant-opportunities` is a dead URL; scraper already uses correct GrantsGateway portal URL | Resolved (pre-existing) | N/A | Done |
| 2 | `aad6dbb1` | ny_state | shape_mismatch | parser-break | GrantsGateway portal returned auth wall / empty page (html_bytes=2608); `dgdGOBrowseResults` data grid not present — session timeout in scraper | Resolved (self-recovered); Phase 15 fix needed | Phase-15-ingest | Phase 15 state scraper hardening |
| 3 | `27e1fd28` | ny_state | shape_mismatch | parser-break | Same as #2 — recurring every 6h for 3 days (2026-05-29 to 2026-06-01) | Resolved (self-recovered); Phase 15 fix needed | Phase-15-ingest | Phase 15 state scraper hardening |
| 4 | `6329c10f` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 5 | `e5faddd7` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 6 | `687b287f` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 7 | `2dfff310` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 8 | `07bc166b` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 9 | `20590ea7` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 10 | `12bab056` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 11 | `ad18b514` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 12 | `715c5094` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 13 | `391a70c1` | ny_state | shape_mismatch | parser-break | Same as #2 | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 14 | `9e0aa4af` | ny_state | shape_mismatch | parser-break | Same as #2 — earliest instance (2026-05-29 00:30) | Resolved (self-recovered) | Phase-15-ingest | Phase 15 |
| 15 | `7751d312` | nyc_doe | http_status 404 | stale-URL | `nyc.gov/site/doe/funding/contract-opportunities.page` returned 404; DOE contract opps page moved | Resolved (pre-existing); Phase 15 must verify correct DOE URL before re-enabling | Phase-15-ingest | Phase 15 NYC source URL audit |
| 16 | `67ce2f00` | nyc_dycd | http_status 404 | stale-URL | `nyc.gov/site/dycd/funding/rfp-listings.page` returned 404; DYCD RFP listings URL moved | Resolved — scraper recovered (37 successful baseline runs, 1 record/run max) | N/A | Done |
| 17 | `6f349a01` | nyc_hra | shape_mismatch | parser-break | `ON CONFLICT DO UPDATE command cannot affect row a second time` — scraper returned 4 records with duplicate natural keys, no pre-upsert dedup | Resolved (self-recovered); Phase 15 fix: add dedup by source_id before HRA upsert | Phase-15-ingest | Phase 15 NYC HRA scraper dedup |
| 18 | `a4e8a2c3` | nyc_hra | http_status 404 | stale-URL | `nyc.gov/site/hra/about/contracting-procurement.page` returned 404; HRA contracting page moved | Resolved — scraper recovered (40 successful baseline runs since 2026-05-14) | N/A | Done |

---

## Classification Breakdown

| Classification | Count | Sources |
|----------------|-------|---------|
| stale-URL | 4 | ny_state (1), nyc_doe (1), nyc_dycd (1), nyc_hra (1) |
| parser-break | 14 | ny_state (13 shape_mismatch — portal auth timeout burst), nyc_hra (1 shape_mismatch — upsert dedup) |
| upstream-empty | 0 | — |
| transient | 0 | — |

---

## Disposition Summary

| Disposition | Count | Notes |
|-------------|-------|-------|
| Resolved — no further action | 5 | Stale URLs where scraper already self-corrected (nyc_dycd, nyc_hra http_status, ny_state http_status) + recovered successfully |
| Resolved — Phase 15 work needed | 13 | ny_state portal session hardening (13 events share same root cause) + nyc_hra dedup fix + nyc_doe URL verification |

---

## Phase 15 Action Items Captured

These are NOT fixes for Phase 13 — they are triaged deferrals with clear owners and ETAs:

1. **ny_state portal session refresh** (owner: Phase-15-ingest)
   - Root cause: NY GrantsGateway portal scraper loses session after ~6h; page returns auth wall instead of data grid
   - Fix: Add session refresh / browser-context reset to `ny_state` scraper in `lib/rfp` or the cron route
   - Evidence: 13 consecutive shape_mismatch events (2026-05-29 → 2026-06-01), 6h interval confirms cron timing

2. **nyc_hra upsert dedup** (owner: Phase-15-ingest)
   - Root cause: Scraper emits duplicate records by source_id in the same batch; PostgreSQL's `ON CONFLICT DO UPDATE` cannot touch the same row twice
   - Fix: Deduplicate scraped records by source natural key before batch upsert in `nyc_hra` parser

3. **nyc_doe URL audit** (owner: Phase-15-ingest)
   - Root cause: `nyc.gov/site/doe/funding/contract-opportunities.page` is 404; no baseline recovery confirmed (unlike DYCD/HRA)
   - Fix: Locate current NYC DOE procurement URL (likely PASSPort or NYC Comptroller) before re-enabling source

---

## rfp_source_baseline State (post-triage)

| Source | Successful Runs | Max Parsed/Run | First Run | Last Run |
|--------|----------------|----------------|-----------|----------|
| ny_state | 27 | 9 | 2026-05-14 | 2026-06-06 |
| nyc_dycd | 37 | 1 | 2026-05-29 | 2026-06-06 |
| nyc_hra | 40 | 4 | 2026-05-14 | 2026-06-06 |
| ca_grants | 21 | 1,924 | 2026-06-01 | 2026-06-06 |

*Note: nyc_doe has NO baseline rows — confirms the scraper is still broken/disabled for that source.*

---

## DB Annotation Written

All 18 events had triage metadata appended to their `details` jsonb:

```sql
-- Fields appended per event:
{
  "triage": "<stale-URL|parser-break>",
  "triaged_by": "phase-13-stabilization",
  "note": "<root cause and fix description>",
  "owner": "<Phase-15-ingest|N/A>",   -- only for parser-break/stale-URL needing Phase 15 work
  "eta": "<Phase 15 milestone>"        -- only when owner set
}
```

Verification query:
```sql
SELECT COUNT(*) FILTER (WHERE resolved_at IS NULL) as open_count,
       COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_count,
       COUNT(*) FILTER (WHERE details @> '{"triaged_by": "phase-13-stabilization"}') as triaged_count
FROM rfp_source_drift;
-- Result: open_count=0, resolved_count=18, triaged_count=18
```
