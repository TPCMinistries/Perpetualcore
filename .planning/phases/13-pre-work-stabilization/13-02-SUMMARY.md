---
phase: 13-pre-work-stabilization
plan: "02"
subsystem: drift-triage
tags: [drift, triage, rfp_source_drift, db-audit, phase-13]
dependency_graph:
  requires: []
  provides: [drift-triage-register, db-drift-annotated]
  affects: [/api/health/rfp open_drift_events count, Phase-15-ingest backlog]
tech_stack:
  added: []
  patterns: [supabase-management-api-pattern, db-safe-read-first]
key_files:
  created:
    - .planning/phases/13-pre-work-stabilization/13-02-DRIFT-TRIAGE.md
  modified: []
decisions:
  - "All 18 rfp_source_drift events were already resolved (2026-06-01 05:45:16 UTC) before this plan executed; triage was applied retrospectively"
  - "ny_state portal session timeout classified as parser-break (not transient) — 13 consecutive 6h-interval events confirm structural scraper gap, not one-off"
  - "nyc_doe has zero baseline rows — cannot confirm self-recovery, Phase 15 must verify URL before re-enabling"
  - "nyc_hra upsert conflict is a code-level dedup gap in the scraper, not a schema issue — triaged to Phase 15"
metrics:
  duration: "4 min"
  completed_date: "2026-06-06"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
  db_reads: 4
  db_writes: 6
---

# Phase 13 Plan 02: Drift Triage Summary

**One-liner:** All 18 rfp_source_drift events classified (4 stale-URL, 14 parser-break) and annotated with triage metadata; 3 Phase 15 action items captured with owners.

## What Was Built

Retrospective triage of all 18 `rfp_source_drift` events in the LDC Brain AI project. Events were already resolved (`resolved_at` set) by a prior process on 2026-06-01; this plan classified each event, identified root causes, and appended structured triage metadata to each row's `details` jsonb for auditability.

**Before/after open-drift count:**
- Before (plan start): 0 open (all 18 already resolved at 2026-06-01 05:45:16 UTC)
- After (plan end): 0 open
- Triage annotated: 18 / 18

## Triage Register

See: `.planning/phases/13-pre-work-stabilization/13-02-DRIFT-TRIAGE.md`

### Classification Breakdown

| Classification | Count | Sources |
|----------------|-------|---------|
| stale-URL | 4 | ny_state (1 dead URL), nyc_doe (1), nyc_dycd (1), nyc_hra (1) |
| parser-break | 14 | ny_state (13 portal auth timeout), nyc_hra (1 upsert dedup gap) |
| upstream-empty | 0 | — |
| transient | 0 | — |

### Notable Findings

1. **ny_state portal session burst** — 13 shape_mismatch events fired every 6 hours from 2026-05-29 to 2026-06-01. The GrantsGateway scraper loses its session; the portal returns an auth wall (html_bytes=2608) instead of the data grid. Cron self-recovered when session was refreshed manually. Baseline confirms 27 successful runs since (up to 9 records/run). Root cause: no session refresh in scraper. Phase 15 fix required.

2. **nyc_hra upsert conflict** — Single event; scraper returned 4 records sharing a natural key in the same batch, causing PostgreSQL `ON CONFLICT DO UPDATE` to target the same row twice. Phase 15 fix: pre-upsert dedup.

3. **nyc_doe dead** — Only source with zero baseline recovery rows. Stale URL + no confirmed working replacement means this source is effectively offline until Phase 15 audits the correct DOE procurement URL.

## Phase 15 Backlog Items Captured

| Item | Root Cause | Owner | ETA |
|------|-----------|-------|-----|
| ny_state session refresh | Scraper loses GrantsGateway auth after ~6h | Phase-15-ingest | Phase 15 |
| nyc_hra upsert dedup | No source_id dedup before batch insert | Phase-15-ingest | Phase 15 |
| nyc_doe URL audit | Current URL 404, no recovery confirmed | Phase-15-ingest | Phase 15 |

## DB Operations Performed

All per /db-safe protocol: read-only SELECT queries first, then targeted per-row UPDATEs with details jsonb append (never blanket updates, never destructive).

```sql
-- Read-only verification (4 queries)
SELECT COUNT(*) from rfp_source_drift WHERE resolved_at IS NULL;  -- → 0
SELECT * from rfp_source_drift ORDER BY source, created_at DESC;  -- → 18 rows
SELECT * from rfp_source_baseline GROUP BY source;                -- → 4 sources
SELECT COUNT(*) FILTER (WHERE details @> ...) from rfp_source_drift;  -- → 18 annotated

-- Writes (6 targeted UPDATEs, one per event group)
UPDATE rfp_source_drift SET details = details || jsonb_build_object(...) WHERE <specific predicate>
-- Groups: ny_state/shape_mismatch (13), ny_state/http_status (1), nyc_doe (1),
--         nyc_dycd (1), nyc_hra/shape_mismatch (1), nyc_hra/http_status (1)
```

## Health Endpoint Impact

`/api/health/rfp` → `open_drift_events: 0` (unchanged from pre-plan state, but now every event has a documented classification).

## Deviations from Plan

**1. [Rule 1 — Bug] Found during inspection: events already resolved at plan start**
- Plan assumed 18 open events; actual state was 0 open (all resolved 2026-06-01).
- Fix: Applied triage retrospectively to all 18 resolved rows rather than resolving-then-triaging.
- No plan intent was compromised — classification + annotation + register were all completed.
- Files modified: 13-02-DRIFT-TRIAGE.md

## Tasks

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Query + classify all open drift events | Complete | 325b320 |
| 2 | Resolve confirmed-stale, record owner+ETA for rest | Complete (all annotation written, no new resolves needed) | — (DB writes in Task 1) |

## Self-Check

- [x] 13-02-DRIFT-TRIAGE.md created with 18 event rows
- [x] All 18 events classified (stale-URL or parser-break)
- [x] All 18 events have `triage` + `triaged_by` in details jsonb (DB verified)
- [x] 0 open drift events remaining (verified via COUNT query)
- [x] Phase 15 action items documented with owners
- [x] Task 1 committed at 325b320
