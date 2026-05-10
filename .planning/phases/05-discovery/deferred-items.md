# Phase 05 — Deferred Items

Items captured during Phase 5 planning that are explicitly out of scope for this phase or for the engine MVP. Carry forward to follow-up phases.

---

## SBIR-ENDPOINT-UPDATE (carried from Phase 04)

**Carried:** 2026-05-10 from `.planning/phases/04-foundations-salvage-port/deferred-items.md`
**Owner:** Executor of Plan 05-01 (federal Discovery ingestion)
**Status:** **RESOLVED 2026-05-10 during Plan 05-01 execution.**

**Resolution:** The official SBIR API host is `api.www.sbir.gov`, path `/public/api/solicitations` (per the documentation page at https://www.sbir.gov/api/solicitation). The legacy host `www.sbir.gov/api/solicitations.json` from Phase 04 TECH-SPEC was a pre-Drupal-10 path and is permanently 404. The CSV bulk download (`sites/default/files/Solicitations.csv`) is also 404. The fetcher in `lib/rfp/ingest/sbir.ts` is wired to the correct endpoint. See SBIR-API-MAINTENANCE below for the current runtime state of that endpoint.

---

## SBIR-API-MAINTENANCE

**Captured:** 2026-05-10 during Plan 05-01 Task 2e execution
**Owner:** No human action required — self-healing
**Status:** Open. Transient state (SBIR.gov maintenance window).

**Summary:** The SBIR Public API at `api.www.sbir.gov/public/api/solicitations` returns HTTP 429 with body
```
{"Code":"TooManyRequestsError","Message":"The SBIR Public API is not available at this time."}
```
as of 2026-05-10. The official `/api` documentation page at www.sbir.gov/api carries an explicit maintenance banner: "Please be advised that the SBIR.gov APIs are currently undergoing maintenance. In the meantime, if you require assistance in obtaining your data, please contact our helpdesk."

The `lib/rfp/ingest/sbir.ts` fetcher treats HTTP 429 with this body as a soft SKIP (parses the message, logs `[skip] sbir: <message>`, returns `[]`). The orchestrator continues with the other federal sources unaffected. **When the API exits maintenance, the fetcher will start producing rows automatically with NO code change required** — the integration is correct.

**Action when revisiting:** Periodically check whether the fetcher starts returning rows. If maintenance persists past 30 days and SBIR coverage becomes time-critical, escalate via SBIR.gov helpdesk (contact info on the maintenance banner) or build the Playwright scrape fallback against the public solicitations search UI as originally listed in the Phase 04 deferred entry.

---

## ALERT-DIGEST-FLUSH

**Captured:** 2026-05-10 during Plan 05-07 planning
**Owner:** Phase 10 (Multi-Tenant Productization) — likely tied to user-facing notification center
**Status:** Open

**Summary:** Plan 05-07 implements the frequency-cap + batched logging side of the alert digest contract — once a user hits 5 alerts in 24h on a channel, additional alerts are persisted with `status='batched'` instead of dispatching individually. The cron job that aggregates batched rows into a single end-of-day digest email/message and dispatches it is NOT built in Phase 5.

**Action when revisiting:**
1. Add a Vercel Cron entry (e.g., daily at 9pm in user's timezone — initially UTC) that selects all distinct `(user_id, channel)` from rfp_alert_log with `status='batched' AND flushed_at IS NULL`.
2. For each, build a digest message containing the top 10 batched opps by fit_score with the same compact formatting.
3. Send via the appropriate channel adapter and update rows to `flushed_at = now()`.
4. Add a UI surface in /settings/alerts showing "X batched alerts pending digest" with timestamp.

---

## SLACK-CHANNEL-INTEGRATION

**Captured:** 2026-05-10 (CONTEXT.md decision)
**Owner:** Follow-up integration phase (post-MVP)
**Status:** Open

**Summary:** CONTEXT.md locks Slack OUT of Phase 5 alert delivery in favor of email + Telegram + Discord. `lib/slack/client.ts` exists but is not wired to RFP alerts. The decision is intentional; do not implement Slack alerts in any Phase 5 plan.

**Action when revisiting:** Add `slack_enabled` + `slack_webhook` columns to `rfp_alert_prefs` via additive migration; create `lib/rfp/alerts/channels/slack.ts` mirroring the discord.ts adapter; update settings UI to include the Slack column.

---

## QUICK-IMPORT-QUEUE-DURABILITY

**Captured:** 2026-05-10 during Plan 05-05 planning. Refined 2026-05-10 during execution.
**Owner:** Phase 10 (productization) or earlier if Quick Import volume warrants
**Status:** Open

**Summary:** Plan 05-05 stores Quick Import job state in Upstash Redis with a 1h TTL. **There is NO module-scope Map fallback** — `lib/rfp/import/job-store.ts` throws on first call when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing, and the POST route maps that to a 503. The Map fallback was explicitly removed during planning because module memory does not survive across Vercel lambda invocations — POST writes on lambda A, GET reads from lambda B, status returns 404, user has no way to know if the import succeeded (breaks Success Criterion 5 in the plan). Dispatch is fire-and-forget (`void runQuickImport(...).catch(log)`) since Next 14.2 doesn't ship the stable `after()` API; at higher volume this should move to a proper queue.

**Action when revisiting:** Persist ImportJob state in a `rfp_import_jobs` table with the same step/status fields. Cron sweep cleans up stale jobs. Optionally: migrate dispatch from fire-and-forget to BullMQ-on-Upstash or Vercel Queues so retries and at-least-once semantics are guaranteed.

---

## QUIET-HOURS-DND

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 10 (productization)
**Status:** Open. MVP delivers 24/7.

---

## IN-APP-NOTIFICATION-CENTER

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 10 (productization)
**Status:** Open. Email/Telegram/Discord cover MVP.

---

## SNOOZE-DISMISS-OPPORTUNITIES

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 10 (productization)
**Status:** Open. Feed has no per-row state model in Phase 5.

---

## USER-TUNABLE-SCORING-WEIGHTS

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 7 (Drafting) or Phase 10 (productization)
**Status:** Open. Plan 05-03 freezes 30/25/20/15/10 weights as code constants.

---

## SCORE-HISTORY-DELTAS

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 10 (productization)
**Status:** Open. Plan 05-03 stores `scored_version` int but does not retain prior versions of fit_score. A history table can be added later.

---

## BULK-PASTE-CSV-IMPORT

**Captured:** 2026-05-10 (CONTEXT.md defer-list)
**Owner:** Phase 10 (productization) — agency tier feature
**Status:** Open. Plan 05-05 supports single-URL Quick Import only.

---

## RESEND-DOMAIN-VERIFICATION

**Captured:** 2026-05-10 (planning context flag)
**Owner:** Lorenzo (manual DNS configuration)
**Status:** Open

**Summary:** `from@perpetualcore.com` is not yet verified in Resend. Plans 05-02 (drift alerts) and 05-07 (alert emails) include graceful fallback to console logging when Resend returns a domain-unverified error. This is INTENTIONAL — the engine should not be blocked on DNS work, but it does mean alert emails will not actually deliver until the domain is verified.

**Action when revisiting:**
1. Add the DNS records Resend provides for the perpetualcore.com domain.
2. Wait for verification.
3. Set `RESEND_FROM_EMAIL=alerts@perpetualcore.com` (or similar) in Vercel env. (Note: the env var is `RESEND_FROM_EMAIL`, not `RESEND_FROM` — see `lib/email/index.ts:74`.)
4. Re-run a high-fit fixture; confirm email lands instead of falling back to console.

---

## WAVE-CRITICAL-PLAN-SIZE (Plans 05-04, 05-05)

**Captured:** 2026-05-10 during Phase 5 plan revision
**Owner:** Plan executor — context-budget concern, not a follow-up build
**Status:** Acknowledged. No action required unless executor runs short of context mid-plan.

**Summary:** The checker flagged Plans 05-04 (feed UI: API + page + 5 sub-components + OrgSwitcher + helpers) and 05-05 (Quick Import: fetch + extract + Redis store + run + 2 routes + UI) as exceeding the typical 2-3 task budget. The orchestrator accepted the bloat because:
- 05-04: DISC-04 + DISC-05 + ORG-03 are tightly coupled; splitting forces premature interface contracts.
- 05-05: end-to-end flow benefits from one focused executor pass; splitting doubles handoff cost.

Both plans are flagged with `notes.wave_critical: true` in their frontmatter so the executor reserves a longer session.

**Action when revisiting:** if execution runs out of context mid-plan, split at the natural seams documented in the plan (05-04: Task 1 API alone, then Task 2+3 UI; 05-05: Task 1+2 backend, then Task 3 UI).
