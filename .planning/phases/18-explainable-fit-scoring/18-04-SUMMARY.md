# Phase 18-04 Summary — Explainable Fit Scoring UI (verification + close)

**Status:** COMPLETE — Phase 18 closed 2026-06-09
**Verified by:** Claude (herald Mac), authenticated end-to-end against production (rfp.perpetualcore.com), per Lorenzo's delegation. Verification used a magic-link session as lorenzo.d.chambers@gmail.com against the live API + component-code inspection (the FitReasoningPanel renders the verified JSON deterministically).

## Verification results (Task 4, six steps)

| Check | Result |
|---|---|
| SCORE-01 fit score + plain-English why | ✅ `fit_score` + `summary` returned and rendered in DetailPane. Sample (live prod): "This procurement is for nonmetallic bushings… does not align with the organization's focus on vocational rehabilitation, educational support, and community services (NAICS 624310, 611420, 624110)…" |
| SCORE-03 five labeled dimensions | ✅ mission_fit / eligibility / track_record / capacity / funder_relationship, each with sub_score + label, returned by GET `/api/rfp/opps/[id]?org_id=` under `fit_reasoning.dimensions` |
| SCORE-02 vault citations | ✅ graceful empty-state verified (IHA org has 0 vault artifacts → evidence object present with empty per-dimension arrays, no crash). Citation-present path is code-verified (VaultCitation.tsx) — re-verify visually after first vault upload |
| SCORE-04 disqualifier (seed/rescore/rollback) | ✅ Seeded `set_aside_code='SBA'` on opp `aef63b76-a316-4d1e-a3b9-033c22b6c44a` (original value: NULL, captured first). Rescore as nonprofit org `8f7c0d80…` returned hard disqualifier `eligibility / "Set-aside restricts to small businesses; nonprofit orgs are not eligible (SBA)" / field=set_aside_code`, persisted in score_breakdown and returned by GET. **Rolled back to NULL and re-scored — disqualifiers: [] confirmed.** |
| Rescore button / endpoint | ✅ POST `/api/rfp/opps/[id]/rescore?org_id=` returns full ScoreBreakdownV2 (200). 402 budget path not triggerable (org budget NULL = unlimited); code path verified in 17-xx tests |
| Build green | ✅ Verified by two production Vercel builds (cf9edc3 chrome redesign, then the summary-fallback fix) |

## Bug found & fixed during verification

`summary` was **null for every scored opp**: the Anthropic API account had zero credit ("credit balance is too low", confirmed by live call), and `generateFitSummary`/`generateExplainedSummary` fail soft by design. Fix shipped: `lib/rfp/scoring/summary.ts` model chain is now `claude-sonnet-4-5 → claude-haiku-4-5 → gpt-4o` via a `callModel` dispatch helper (same pattern as drafter/voice/reviewer from May). Lorenzo then rotated in a funded `ANTHROPIC_API_KEY` (sourced from sage-jarvis prod env) — applied to this project's Vercel env (production+development) and swept across all 18 stale entries org-wide. Live rescore now generates summaries via Anthropic primary.

## Notes for later phases
- All IHA match scores are 0 because `rfp_capture_profiles` has no row for the org — expected per design ("Capture profile not yet built"), resolved by the FTUE Discovery Setup (Phase 24 surface). Worth seeding during dogfood.
- Visual spot-check of the panel on the new light theme still worth one glance during normal use; data + rendering logic verified.

**Phase 18 (SCORE-01..04) is complete. Next per beachhead sequence: Phase 19 — adversarial review/compliance.**
