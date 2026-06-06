# Repositioning Agent Log

Running record of every agent spawned, what it consumed, what it produced.

## Wave 1 — parallel reads (2026-05-10)

| Agent | Type | Input | Output | Status |
|---|---|---|---|---|
| Inventory | general-purpose | perpetual-core repo, theiha.org, sentinel/, sage docs, atlas .planning, RFP apps | `INVENTORY.md` | ✓ complete |
| Competitive | general-purpose | WebSearch for boutique AI studios 2026, JV landscape | `COMPETITIVE.md` | ✓ complete |
| UI Audit | general-purpose | perpetual-core/app + components | `UI_AUDIT.md` | ✓ complete |

### Wave 1 key findings (for downstream agents)

- **Only one RFP app on disk** ("RFP Engine"). Lorenzo's "two RFP apps" claim does not match. Pending Lorenzo confirmation.
- **No Background Check project** — brief-side language only. Recommended: drop from studio site, point to Sentinel Quick Vet.
- **Sage split confirmed correct** — codebase locks relational coach. Brief's "knowledge synthesis Sage" gets renamed (Codex withdrawn due to OpenAI Codex collision; strategist proposes 3–5 alternatives).
- **Sentinel + Atlas missing from brief** but both are real Perpetual Core products. Atlas: by-invitation card recommended on studio site (not Discovery audit) to avoid blocking launch.
- **`sage.perpetualcore.com` unclaimed** — Sage SaaS launch is easier than PRD assumed (no Herald rename needed).
- **UI: preserve + sharpen** — density/gradient discipline must change or studio copy reads consumer SaaS regardless. 5 levers identified in UI_AUDIT.md §5.
- **Off-brand items to ride along**: placeholder logo, placeholder founder photo, a11y violation in layout.tsx, 3 navbar implementations, hardcoded slate colors, "© 2025" footer, unverified HIPAA/SOC 2 claims.
- **Whitespace confirmed (competitive)**: Anthropic-Blackstone JV explicitly excludes mission-driven orgs (foundations, faith, community colleges, UN). Lorenzo's Kenya + TPC + Uplift + IHA stack is uncopyable in faith-adjacent / values-aligned implementation. AE Studio is the closest layout comp; Distyl AI second.
- **Locked decisions from Lorenzo (2026-05-10)**: (a) Background Check folds as Sentinel feature/tier, no standalone product; (b) Second RFP app exists in active dev (other Claude session) — strategist plans for two; (c) Side-fixes ride along in parallel agent.

## Wave 2 — synthesis (after wave 1)

| Agent | Type | Input | Output | Status |
|---|---|---|---|---|
| Brand strategist | general-purpose | INVENTORY + COMPETITIVE + BRAND_ARCHITECTURE.md v0.1 | `BRAND_ARCHITECTURE.md` v1.0 | pending wave 1 |

## Wave 3 — copy (after wave 2)

| Agent | Type | Input | Output | Status |
|---|---|---|---|---|
| Copywriter | general-purpose | BRAND_ARCHITECTURE.md v1.0 | `COPY_HOMEPAGE.md`, `COPY_STUDIO.md`, `COPY_ENGINE.md`, `COPY_ABOUT.md` | pending wave 2 |

## Lead (Claude main thread) — parallel safe work

- Stage retire/relocate paths from current homepage (no deletions yet)
- Maintain BRIEF_RECONCILED.md as decisions land

## Build Session 1 (2026-05-10) — ✓ complete

**Worktree:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.claude/worktrees/agent-aca1286e51baa739e`
**Branch:** `feat/studio-repositioning`
**Commits:** 8 (7 features + 1 small fix for invalid Tailwind classes / unused imports)
**Lint:** PASS on all 8 repositioning files
**Typecheck:** OOM on full repo (pre-existing, documented; production builds use `ignoreBuildErrors: true`)

**Built:** consolidated Navbar + Footer + PublicMobileNav with new IA, new homepage, /studio/engagements, /engine manifesto with inline 8-node SVG, /about with placeholder photo TODO, rewritten /pricing leading with engagements, 301 redirects from /consulting and /consultation.

**Blocking for prod (not staging):** Nav/footer link to /products/* and /studio/* sub-routes that Session 2/3 will build — 404s until those land.

**Report:** `SESSION_1_REPORT.md`

## Cap-table argument validation (2026-05-10, lead)

The /engine page's load-bearing claim ("No VC-backed competitor can give away 10 to 15% of top-line revenue. Their cap table won't allow it.") survives a quick check.

**B-Corps with VC backing exist** — but their commitments are at the **profit level** (e.g., Classy raised $118M Series D as a B-Corp; Patagonia is the famous one but restructured to founder-trust ownership, not VC-funded).

**The closest top-line precedent is 1% for the Planet** — ~5,000 member companies committing 1% of revenue. None at 10%. VC-backed members are rare; most are owner-operated or B-Corps.

**10–15% of top-line is structurally outside VC cap-table tolerance.** The math: at 10% top-line, that's 10% of every dollar cut before COGS — VC growth/return models break.

**Recommendation:** Keep the absolute phrasing. Lorenzo's voice register supports it. If a counterexample surfaces post-launch, hedge to "Few VC-backed competitors..." — easy edit.

Sources:
- [B-Corp investor sentiment](https://bthechange.com/how-investors-really-feel-about-b-corps-7dcf7988a6e3)
- [VC-backed B-Corp examples](https://www.bcorporation.net/en-us/find-a-b-corp/)
- [Classy Series D as B-Corp](https://www.prnewswire.com/news-releases/certified-b-corp-classy-raises-118m-in-series-d-funding-to-help-nonprofits-increase-their-impact-301272515.html)

## Build Session 2 (2026-05-10) — ✓ complete

**Branch:** `feat/studio-repositioning` (same worktree as Session 1)
**Commits:** 6 added (14 total since main)
- c21c500 — /studio overview
- 75fad90 — /studio/methodology
- 3fc3f58 — /studio/process timeline + retargets /consultation redirect
- 95bd194 — /studio/case-studies abstracted slots
- d79e594 — /products portfolio overview
- 2d27e95 — /products/platform

**Lint:** PASS, **A8 correctness:** all grep-checkable rules pass.

**Notable:** /products/platform composed from primitives because UI_AUDIT-referenced landing components (HeroSection, BentoFeatures, InteractiveChatDemo, ExecSuiteShowcase, UseCases, HowItWorks, PricingTeaser, FinalCTA) weren't at HEAD where the audit assumed — they exist only in main's uncommitted state. Recompose carries the same content (4-pillar grid, 6-advisor panel, Day 1 → Month 3 timeline, industry list, pricing teaser).

**Report:** `SESSION_2_REPORT.md`

## Build Session 3 (2026-05-10) — ✓ complete (after retry)

**Branch:** `feat/studio-repositioning` (same worktree as S1+S2)
**Commits:** 10 added by S3 + 1 founder-photo commit interleaved (lead) = **25 total since main**
- 7a87ff5 — /products/atlas (by-invitation)
- 230e9a6 — /products/sentinel (minimal landing → live)
- 6df1c99 — /products/sage entry-point
- 7151142 — /products/vellum full detail with 4-tier pricing
- 44fd4e0 — /products/rfp-engine 308 redirect → /rfp
- 05c6e2d — /products/rfp-sentry stub + /api/early-access endpoint
- e4bff69 — EngagementBanner injected into all 13 /solutions/* surfaces
- 0fa9d34 — bulk year bump © 2024 → © 2026 across 17 footers
- da72b59 — compliance claims hedged across healthcare/law-firms/agencies/enterprise-demo + 9 footer-only files
- 08b986d — link audit fix: /contact 308 → /contact-sales for /products/vellum CTAs

**Lead-interleaved:** f2e6dee — wire real founder photo (`public/images/lorenzo-headshot.jpg`, sourced from iha-website for cross-brand consistency)

**Lint/build:** Couldn't run pnpm install in worktree env (pre-existing block: `three-bmfont-text via aframe@1.7.1`). Lorenzo runs `pnpm lint` from main checkout to confirm baseline. Static review clean.

**Two pre-merge gates:**
1. Counsel review of compliance hedging (HIPAA Compliant → HIPAA-aware etc.) — biggest gate
2. `pnpm lint` from main checkout

**Top 3 browser QA items:**
1. Vellum pricing grid responsive at 375/768/1024 — four tiers stack cleanly, 30% 501(c)(3) discount + 10% IHA callout render
2. Compliance hedging copy reads acceptably to legal on /solutions/healthcare + /solutions/law-firms
3. EngagementBanner on /solutions/* stacks cleanly at 375px, link routes to /studio/engagements

**Report:** `SESSION_3_REPORT.md`

## IHA cross-brand unification (2026-05-10, lead)

Committed on `iha-website` main: `0194213 content: unify Perpetual Engine definition across IHA + Perpetual Core`

Two surgical edits (4 lines total):
- `src/lib/constants.ts:236` — SUSTAIN pillar canonical definition expanded to "Perpetual Core installs the operating systems; 10% of every revenue dollar funds community programs."
- `src/app/about/page.tsx:330` — ecosystem-section Engine note expanded to "the unifying model: Perpetual Core's commercial AI infrastructure dedicates 10% of every revenue dollar to community programs."

`case-studies.ts` already expressed this framing pre-edit. `constants.ts:316` (blog post excerpt) deliberately not touched — it's about the financial-independence argument specifically, expansion would change focus.

Both sites now consistent: one Engine, two surfaces (substrate + impact).

## Side-fix agent run (2026-05-10)

Narrow-scope conflict-free fixes from UI_AUDIT.md, run in parallel with active second-RFP-app session.

**Fixed (3 files, 2 commits):**
- `1225699` fix(a11y): allow user scaling in viewport meta — `app/layout.tsx`. Removed `userScalable: false` and `maximumScale: 1`; set `maximumScale: 5`. WCAG 1.4.4.
- `5284c88` fix(footer): bump copyright year to 2026 — `app/features/page.tsx`, `app/executive-suite/page.tsx`. Replaced "© 2025" with "© 2026".

**Verified no-op:**
- `metadataBase` already present in `app/layout.tsx:23` (uses `NEXT_PUBLIC_APP_URL` with `https://perpetualcore.ai` fallback). No action needed.

**Skipped (off-limits — modified or untracked in active session):**
- `components/landing/Footer.tsx` (untracked, repositioning work) — contains "© 2025" line; will be handled in build pass.
- All 14 `app/solutions/*/page.tsx` files (modified) — contain "© 2024" footers + unverified HIPAA/SOC 2 compliance claims. Build pass.
- `app/page.tsx`, `app/pricing/page.tsx`, `app/consulting/page.tsx`, `app/dashboard/*` (modified). Build pass.

**Noticed but not touched (one-liners for build pass):**
- 17 stale "© 2024" footers across `app/solutions/*`, `app/industries/[industry]`, `app/features/intelligence`, `app/agents`, `app/consulting` — bulk year bump candidate.
- `app/features/intelligence/page.tsx` says "© 2024 Perpetual Core" while sibling `app/features/page.tsx` now says 2026 — consider canonicalizing to a shared `<Footer/>` to prevent drift.
- Compliance claims ("HIPAA Compliant", "SOC 2 Type II Certified", "FERPA Compliant", "ABA Compliant", "SEC Compliant") in solutions/* footers — flagged in UI_AUDIT, needs legal review before next deploy.
