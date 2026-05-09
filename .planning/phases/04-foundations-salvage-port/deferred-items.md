# Phase 04 — Deferred Items

Items discovered during execution that are out of scope for the current plan but need attention before Phase 5 Discovery.

---

## SBIR-ENDPOINT-UPDATE

**Discovered:** 2026-05-09 during Plan 04-02 smoke test
**Severity:** Medium — blocks SBIR leg of Phase 5 Discovery, not Phase 4
**Summary:** The `www.sbir.gov/api/solicitations.json` endpoint documented in TECH-SPEC §4.1 is no longer valid. SBIR.gov migrated from Drupal 7 to Drupal 10 and all old REST paths now return 404.

**Current smoke-test workaround:** SBIR source ping hits `www.sbir.gov/robots.txt` (200 OK) to verify domain reachability. This is sufficient for Phase 4 infrastructure validation.

**Action required before Phase 5:** Research and update `lib/rfp/sources.ts` `sbir_gov.pingRequest()` with the correct Phase 5 solicitations endpoint. Options:
1. Check `https://www.sbir.gov` for a "Data Downloads" or "Developer API" section
2. Evaluate SBIR/STTR Innovation Portal (innovations.sbir.gov) public API
3. Consider web scraping open solicitation listings via Playwright (similar to NY State Grants Gateway strategy in TECH-SPEC)
4. Check if SBIR.gov now requires authentication for API access

**Owner:** Executor of Phase 5 Plan 01 (Discovery cron setup)
