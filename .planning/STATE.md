# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-05)

**Core value:** Move an org from discovery → qualified pursuit → draft → compliance → review → submission-ready → post-submission, better than any competitor.
**Current focus:** v2.0 re-sequenced BEACHHEAD-FIRST (2026-06-06) — see `VISION.md` + ROADMAP "Execution Sequence". Active path: 13(stabilize) → 14 → 22(security) → 17 → 18(scoring) → 19(review/compliance) → 20 → 24-FTUE → dogfood Uplift/IHA. Deferred w/ triggers: 16(all-50/global), 21, 23, 25. Real bottleneck: foundation/tooling (broken worktree node_modules; PR#4 unpushed).

## Current Position

Phase: 22 of 25 (Trust, Security & Legal)
Plan: 4 of 4 complete (22-01 TRUST-01 RLS CI gate; 22-02 TRUST-02 service-role audit; 22-03 TRUST-03 legal pages; 22-04 TRUST-04 data-source compliance)
Status: Phase 22 COMPLETE — all 4 plans done; SECURITY-AUDIT.md, legal pages, DATA-SOURCE-COMPLIANCE.md all in repo
Last activity: 2026-06-07 — 22-02 complete (9b48ad4), SECURITY-AUDIT.md produced; 41 routes audited, zero violations, enrichments question resolved

Progress: [██░░░░░░░░] ~20% (v2.0 phases — Phase 22 of 25 active)

## Performance Metrics

**Velocity (v1.0 baseline):**
- Total plans completed: 3
- Average duration: 23 min
- Total execution time: 69 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-social-proof | 1 | 7 min | 7 min |
| 02-onboarding-optimization | 2 | 62 min | 31 min |

**Recent Trend:**
- Last 3 plans: 7 min, 9 min, 53 min
- Trend: Variable (build-heavy plans take longer)

*Updated after each plan completion*
| Phase 13-pre-work-stabilization P01 | 15 | 2 tasks | 1 files |
| Phase 13 P02 | 4 | 2 tasks | 1 files |
| Phase 14-canonical-data-foundation P01 | 12 | 1 tasks | 1 files |
| Phase 14-canonical-data-foundation P03 | 10 | 2 tasks | 2 files |
| Phase 14-canonical-data-foundation P02 | 15 | 2 tasks | 2 files |
| Phase 22-trust-security-legal P04 | 2 | 2 tasks | 1 files |
| Phase 22-trust-security-legal P01 | 525723 | 2 tasks | 2 files |
| Phase 22-trust-security-legal P02 | 4 | 2 tasks | 1 files |
| Phase 22-trust-security-legal P03 | 14 | 3 tasks | 4 files |
| Phase 17-ai-cost-guardrail P01 | 11 | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.0 scope locked: unified gov+grant discovery, vault-grounded scoring, adversarial rubric review, closed-loop submission, win/loss learning, transparent billing
- BILL-04 (AI cost guardrail) is Phase 17, before first LLM-heavy feature (scoring) — hard constraint
- TRUST/Security (Phase 22) is a hard gate before billing goes live (Phase 23) — per research SUMMARY
- Phase 13 is mandatory pre-work: merge PR #4, purge inflated counts, SAM.gov re-registration (10-day wait)
- Candid/Foundation Directory excluded (license prohibits AI/LLM use) — ProPublica + IRS 990 is the clean path
- Discovery is tiered (L1=federal, L2=national+foundations, L3=global) gated by entitlement, not hardcoded
- [Phase 13-pre-work-stabilization]: Indexed tile tone and operator action driven by indexedCoveragePercent (relative), not hardcoded 80000 raw count — LAUNCH-04
- [Phase 13]: All 18 rfp_source_drift events retrospectively classified: 4 stale-URL, 14 parser-break; ny_state portal session timeout confirmed structural gap (not transient)
- [Phase 13]: nyc_doe has zero baseline recovery rows — source effectively offline until Phase 15 URL audit
- [Phase 13-pre-work-stabilization]: Alert de-dup: 7-day window on last_alerted_at prevents daily re-spam; 21-day threshold gives 6-day buffer over SAM.gov's 15-day renewal window
- [Phase 13-04]: Two-way merge strategy chosen (no squash): 253 feat commits + 114 main commits preserved; next.config.mjs hand-merged with union CSP + main's redirects + feat's PWA register:true
- [Phase 13-04]: Merge commit d5e9164 on local main — verified build exit 0, all 4 key RFP routes present, middleware host-rewrite intact, getUser() before /api/* confirmed
- [Phase 14-canonical-data-foundation]: Strict regex prefix parse (^naics:[0-9]{2,6}$) prevents naive colon-split corruption; only naics/cfda backfilled, other typed fields deferred to Phase 15 ingest parsers
- [Phase 14-canonical-data-foundation]: database.types.ts regen deferred to Plan 14-04 (single owner) to avoid parallel-wave write collision with other Wave-1 plans
- [Phase 14-canonical-data-foundation]: Coverage level stored as text CHECK constraint (not Postgres enum) to avoid enum-value migration complexity when l3 is added
- [Phase 14-canonical-data-foundation]: Webhook rfp_entitlements upsert provides only 3 fields (org_id, coverage_level, updated_at) so operator override fields survive subsequent webhook events
- [Phase 14-canonical-data-foundation]: Phase 17 boundary maintained: quota columns nullable, no enforcement middleware or AI-cost ledger in Phase 14
- [Phase 14-canonical-data-foundation]: ROADMAP index name correction: rfp_vault_artifacts_embedding_idx (not rfp_opportunities_embedding_idx) — index is on rfp_vault_artifacts table
- [Phase 14-canonical-data-foundation]: match_vault_docs RPC uses as-unknown-as cast until plan 14-04 regenerates database.types.ts
- [Phase 14-canonical-data-foundation]: In-Node cosine fallback retained in retrieve.ts for local dev safety and graceful RPC degradation
- [Phase 14-04]: database.types.ts regenerated via CLI (not hand-edited) — supabase CLI authenticated; all Phase 14 schema present (rfp_entitlements, 7 opp columns, match_vault_docs RPC)
- [Phase 14-04]: persistCanonicalAliases call-site confirmed at run.ts:191 — no new wiring required; plan was verification-only for FND-02
- [Phase 14-04]: Live-DB verify scripts use VERIFY- prefix + finally cleanup as standard pattern for CORE DB safety
- [Phase 14-04]: Phase 14 COMPLETE — all 4 plans done (FND-01, FND-02, FND-03 requirements met)
- [Phase 22-trust-security-legal 22-01]: Cross-tenant RLS gate wired — test-rls CI job + branch protection required check set via gh API; rfp_entitlements ON DELETE CASCADE confirmed so afterAll org deletes handle cleanup
- [Phase 22-trust-security-legal 22-01]: SUPABASE_SERVICE_ROLE_KEY scoped only to test-rls job, NOT added to existing test job — avoids prod-DB assertions on every unit test run
- [Phase 22-trust-security-legal]: Candid exclusion confirmed by code grep — zero API calls; HowItWorksContent.tsx marketing copy is aspirational, not a compliance violation
- [Phase 22-trust-security-legal]: ProPublica/IRS 990 flagged as pre-Phase-16 gate: commercial-use clause must be reviewed at propublica.org/nonprofits/api before Phase 16 integration
- [Phase 22-trust-security-legal 22-02]: Service-role audit CLEAN — 41 routes, 0 violations; dual-client pattern (createClient auth gate → createAdminClient write/read) confirmed consistent across all user-facing RFP routes
- [Phase 22-trust-security-legal 22-02]: rfp_opportunity_enrichments policy correction: actual migration uses rfp_my_org_ids() via rfp_opp_matches join, NOT auth.uid() IS NOT NULL — more conservative than research stated; no org_id column confirms per-opp metadata only
- [Phase 22-trust-security-legal]: Draft banner inline on each legal page (not shared component) to keep changes surgical
- [Phase 22-trust-security-legal]: /ai-disclosure added to isRfpAppPath middleware allowlist alongside /privacy and /terms
- [Phase 22-trust-security-legal]: Live-domain production confirmation deferred to next vercel --prod deploy; local build confirmed (exit 0)
- [Phase 17-ai-cost-guardrail]: rfp_agent_sessions reused as ledger — additive column on rfp_entitlements only; NULL monthly_ai_budget_usd = unlimited; fail-CLOSED on DB read error
- [Phase 17-ai-cost-guardrail]: database.types.ts regenerated via CLI as single owner for Phase 17; all Phase 14 types preserved

### Pending Todos

- Replace FounderStory photo placeholder with Lorenzo's real headshot (from v1.0)
- Swap industry logo placeholders in SocialProofBanner with real partner logos (from v1.0)
- Submit SAM.gov system account re-registration (Day-1 action, unblocks L1 federal ingest)
- Set up 90-day calendar alert for SAM.gov key expiry before Phase 13 closes

### Blockers/Concerns

- [Phase 13] SAM.gov system account registration has a ~10-day wait; kick off immediately so it doesn't block Phase 15 federal ingest. Grants.gov/SBIR can proceed in parallel.
- [Phase 13 - RESOLVED LOCALLY] PR #4 merge complete on local main (d5e9164, build PASS) — push to origin/main awaiting human approval. Run `git push origin main` from the perpetual-core worktree after reviewing the checkpoint.

## Session Continuity

Last session: 2026-06-07
Stopped at: Completed 17-ai-cost-guardrail/17-01-PLAN.md — guardrail foundation (migration + guardrail.ts + database.types.ts regen)
Resume file: None — continue with 17-02 (call-site integration Wave 2)
