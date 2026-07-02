# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-05)

**Core value:** Move an org from discovery → qualified pursuit → draft → compliance → review → submission-ready → post-submission, better than any competitor.
**Current focus:** Phase 26 Best-in-Market Readiness (2026-06-16) — bring RFP Engine from private-beta viable to category-leading product across functionality, look, and UX. See `.planning/phases/26-best-in-market-readiness/26-00-PLAN.md`.

## Current Position

Phase: 26 of 26 ACTIVE — best-in-market readiness
Plan: 26-00 created; 26-01 release-gate stabilization started
Status: Private-beta viable, moving into best-in-market UX/workflow pass. 2026-06-16 audit found live site reachable and RFP ops green after deployment verification. High/critical production audit now passes after dependency cleanup and Next 16 upgrade; remaining issues are moderate transitive advisories plus full monorepo type-check strategy. Full federal discovery can still 504 as one synchronous batch, but source-scoped federal cron works for SAM.gov.
Last activity: 2026-06-16 — Created Phase 26 plan; fixed lint blocker; removed stale SAM.gov key-pending copy; added RFP metadata pass-through and RFP-only sitemap behavior; verified Vercel Production has SAM_GOV_API_KEY + CRON_SECRET; full federal cron 504'd after partial ingest, then score/enrichment repair restored production `/api/health/rfp` to `status=ok`; added source-scoped federal cron support; added scoped RFP type-check gates and fixed surfaced RFP typing issues; added missing `check_ip_whitelist` RPC migration/types; removed service-role admin helper import from Edge request boundary; restored missing Stripe packages; replaced vulnerable `xlsx`, upgraded `jspdf`, removed PWA/Workbox package, upgraded to Next 16.2.9, refreshed Browserslist data, and reached `npm audit --audit-level=high --omit=dev` clean; migrated deprecated `middleware.ts` to Next 16 `proxy.ts`; added active-route `OrgWorkspaceNav` and fixed proposal action-button contrast/focus states; capped Next build heap to avoid Vercel 8 GB OOM; fixed mobile org-shell nav wrapping and suppressed the marketing cookie banner on `/org/*`; replaced root `npm run type-check` with the finite RFP release type gate, preserved the historical all-repo check as `type-check:legacy`, added `verify:rfp-release`, and documented moderate audit exceptions in `docs/RFP_RELEASE_GATES.md`; promoted `tsconfig.rfp-launch.json` to the default RFP release type-check after fixing surfaced API/UI typed gaps; expanded authenticated production E2E to cover owner billing settings and Stripe Checkout; created/reused live Stripe RFP Pro/Agency monthly prices and set `RFP_STRIPE_PRICE_PRO` / `RFP_STRIPE_PRICE_AGENCY` in Vercel Production; ran authenticated mobile/tablet/desktop visual QA on proposal, pursuits, and billing; fixed cramped proposal export-bundle tiles; converted visual QA into `tests/e2e/rfp-visual.spec.ts`, added `test:e2e:rfp-visual`, and wired it into the GitHub `rfp-launch-gate`; removed the E2B critical-dependency build warning via lazy executor import and a narrow webpack ignore rule; removed the redundant custom `/_next/static` cache-control header; removed all explicit Edge runtime overrides so local production builds no longer print Edge static-generation, Vercel static-asset cache, or E2B warning markers; added RFP subdomain proxy pass-throughs for `/icon` and `/apple-icon`; local lint, root RFP launch type-check, high-severity audit, production build, `verify:rfp-release`, authenticated production E2E 3/3, and visual E2E 4/4 pass; applied `add_check_ip_whitelist_rpc` to production Supabase and verified no-rules behavior returns true; normal remote Vercel build `perpetual-core-n796aq9zt-the-gdi.vercel.app` hung at page-data collection and did not receive the RFP alias, so built locally with `vercel build --prod` and deployed the prebuilt artifact to Vercel Production (`perpetual-core-l9doamdat-the-gdi.vercel.app`); verified live robots/sitemap 200, RFP-only sitemap, `/icon`/`/apple-icon`/`/opengraph-image` PNG 200, health `ok`, 6,111 opportunities, 48,888/48,888 matches, 100% scoring/canonical/enrichment, 52/52 RFP cron successes in 24h, SAM.gov source-scoped cron success, stale key-pending copy removed, mobile cookie banner absent, no mobile horizontal overflow, no proposal bundle text overflow, and billing checkout handoff working.

Progress: [████████░░] beachhead path complete enough for private beta; Phase 26 upgrades to best-in-market/public-launch standard

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
| Phase 17-ai-cost-guardrail P04 | 7 | 2 tasks | 2 files |
| Phase 17-ai-cost-guardrail P03 | 43 | 3 tasks | 6 files |
| Phase 17-ai-cost-guardrail P02 | 58 | 2 tasks | 3 files |
| Phase 17-ai-cost-guardrail P05 | 2 | 2 tasks | 2 files |
| Phase 18-explainable-fit-scoring P02 | 5 | 5 tasks | 5 files |
| Phase 19-rubric-review-compliance-gate-upload P01 | 7 | 3 tasks | 3 files |
| Phase 19-rubric-review-compliance-gate-upload P03 | 8 | 3 tasks | 7 files |
| Phase 19-rubric-review-compliance-gate-upload P02 | 5 | 3 tasks | 5 files |
| Phase 19-rubric-review-compliance-gate-upload P04 | 18 | 3 tasks | 4 files |

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
- [Phase 17-ai-cost-guardrail]: generateFitSummary returns FitSummaryResult {text,tokensIn,tokensOut,costUsd} in all branches; cron scoring loop guarded per org via guardedLLMCall; over-budget orgs silently skipped with null summary (scoring chips/scores still upsert)
- [Phase 17-ai-cost-guardrail]: vault/from-description: model label = 'gpt-4o' (dominant) for combined expand+embed session row; naics-suggest membership non-member treated as absent (silent downgrade, no 403 leak)
- [Phase 17-ai-cost-guardrail]: Draft route: proposal_id omitted from session meta (unknown pre-insert) — org_id sufficient for budget; null proposal_id acceptable for cost ledgering
- [Phase 17-ai-cost-guardrail]: Review route: capturedReview pattern preserves exact ReviewerResult response shape — extra camelCase meta fields never leak into JSON output
- [Phase 17-ai-cost-guardrail]: Phase 17 Plan 05: NULL budget guard prevents coercion-to-zero regression in unit tests; live-DB script uses captured session IDs for precise cleanup; quick-import/extract.ts NOT guarded (no org_id at extract time) — deferred to future phase
- [Phase 18-explainable-fit-scoring]: checkDisqualifiers guards every check behind null/empty presence test — zero false positives on sparse pre-Phase-15 data
- [Phase 18-explainable-fit-scoring]: dual org type not auto-disqualified by SBA set-aside — only nonprofit is explicitly excluded
- [Phase 18-explainable-fit-scoring]: mapToDimensions: funder_relationship combines past_funder (1/3) + geo (2/3) proportional to their 10%/20% component weights
- [Phase 18-01]: rfp_fit_evidence artifact_id is NOT a FK to rfp_vault_artifacts — citations must outlive the source artifact
- [Phase 18-01]: Stale-row prune in evidence-store.ts (application code) not DB cascade — prune failure is non-fatal; stale rows filtered by scored_version at read time
- [Phase 18-01]: database.types.ts regen deferred to later plan (established single-owner pattern from Phase 14-04); as-unknown-as cast used in evidence-store.ts
- [Phase 19-rubric-review-compliance-gate-upload]: Synchronous rubric extraction inline with package upload (not async); maxDuration=90 covers LLM call time; budget-gated via guardedLLMCall
- [Phase 19-rubric-review-compliance-gate-upload]: rfp_rubric_criteria queries use as-unknown-as cast until database.types.ts regen in 19-04 (single-owner pattern)
- [Phase 19-03]: ai-disclosure checklist item status driven ONLY by ai_disclosure_acknowledged boolean — no content scanning, never auto-advances
- [Phase 19-03]: deadline-timezone null + due_date = status 'missing' (fail blocker); no deadline = 'needs_review'
- [Phase 19-03]: compliance-ack PATCH endpoint: BodySchema accepts only literal true; un-ack not supported in v1
- [Phase Phase 19-02]: Anthropic-first model chain (sonnet-4-5 → haiku-4-5 → gpt-4o) replaces hard-coded GPT-4o in reviewer; preserves throw-on-full-chain-failure contract
- [Phase Phase 19-02]: criterion_id: z.string().nullable().optional() in Zod schema — no UUID enforcement; unknown echoed IDs sanitized to null post-parse, finding retained
- [Phase Phase 19-02]: RubricCriteriaPanel returns null when criteria empty; ReviewerFindingsPanel criteria prop defaults to [] for backward compat; section-level criterion chips not threaded to avoid prop drilling
- [Phase 19-04]: Package route closeout fix — solicitation_mode and force_re_extract must be included in FieldsSchema.safeParse input, not only in FieldsSchema, or the rubric branch never runs.
- [Phase 19-04]: Reviewer fix text field remains `suggestion` per existing ReviewerFinding schema; verification maps that to the REVIEW-03 "suggested fix" requirement.
- [Phase 19-04]: Cached solicitation re-upload creates a new package document but returns existing criteria rows by opp_id; DB count must remain 4 for the test fixture, not duplicate to 8.
- [Phase 24-01]: `/api/health/rfp` now exposes explicit `scraper_last_success` and `cron_24h` error-rate fields; endpoint remains public aggregate-only for uptime/status monitors.
- [Phase 24-02]: New-org setup is five fields stored into `capacity_summary`; onboarding checklist now tracks profile → voice → vault → match/draft → review/export, with visible CTAs.
- [Phase 24-03]: `/admin/rfp` Source scale readiness has source-scoped Rerun buttons for supported automated sources; reruns log `rfp-manual-source-rerun:{source}` rows in cron history.
- [Phase 24-04]: `/admin/rfp` now exposes active RFP MRR, AI spend, gross margin, and per-org entitlement override controls using existing `rfp_entitlements` nullable quota semantics.
- [Phase 24-05]: Coverage repair and manual source reruns use deterministic no-AI scoring; health recovery no longer depends on external LLM credits.
- [Phase 24-05]: Large match and state/city opportunity upserts are chunked to prevent PostgREST fetch failures and CA grants statement timeouts.
- [Phase 25-01]: Authenticated production E2E now validates the proposal workroom, submission export endpoints, readiness JSON, and safe proposal status transitions.

### Pending Todos

- Replace FounderStory photo placeholder with Lorenzo's real headshot (from v1.0)
- Swap industry logo placeholders in SocialProofBanner with real partner logos (from v1.0)
- Submit SAM.gov system account re-registration (Day-1 action, unblocks L1 federal ingest)
- Set up 90-day calendar alert for SAM.gov key expiry before Phase 13 closes

### Blockers/Concerns

- [Phase 13] SAM.gov system account registration has a ~10-day wait; kick off immediately so it doesn't block Phase 15 federal ingest. Grants.gov/SBIR can proceed in parallel.
- [Phase 13 - RESOLVED LOCALLY] PR #4 merge complete on local main (d5e9164, build PASS) — push to origin/main awaiting human approval. Run `git push origin main` from the perpetual-core worktree after reviewing the checkpoint.

## Session Continuity

Last session: 2026-06-13
Stopped at: Phase 26 active. Best-in-market readiness plan created; lint, root RFP launch type gate, production build/deploy, authenticated production E2E, repeatable mobile/tablet/desktop visual E2E, high-severity production audit, and `verify:rfp-release` pass; production health green; SEO files and source-scoped SAM.gov cron verified live; IP whitelist RPC applied to production; deprecated middleware convention migrated to `proxy.ts`; vulnerable `xlsx`, old `jspdf`, and PWA/Workbox audit paths removed; authenticated org shell/action-button UX pass deployed; mobile nav and authenticated cookie-overlay regressions fixed and verified; billing checkout smoke fixed and covered; proposal export-bundle tile overflow fixed; E2B, custom static cache-control, and Edge runtime build warnings removed; metadata image routes pass on RFP subdomain; moderate audit exceptions documented. Remaining work is opportunity detail/proposal workroom depth and owned type-check slices for non-RFP legacy surfaces.
Resume file: `.planning/phases/26-best-in-market-readiness/26-00-PLAN.md` — next action is Track C/D opportunity detail polish and proposal workroom depth, while separately tracking broader legacy type-check project slicing.
