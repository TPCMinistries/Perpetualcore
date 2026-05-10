# Session 2 Build Report

**Date:** 2026-05-10
**Worktree:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.claude/worktrees/agent-aca1286e51baa739e`
**Branch:** `feat/studio-repositioning`
**Base:** Session 1's last commit `08ee644`
**Status:** All 6 planned commits landed. Branch clean. NOT pushed, NOT merged. 14 commits total since `main`.

---

## Commits (chronological)

| SHA | Title |
|---|---|
| `c21c500` | feat(repositioning): add /studio overview page |
| `75fad90` | feat(repositioning): add /studio/methodology page |
| `3fc3f58` | feat(repositioning): add /studio/process timeline page |
| `95bd194` | feat(repositioning): add /studio/case-studies with abstracted slots |
| `d79e594` | feat(repositioning): add /products portfolio overview |
| `2d27e95` | feat(repositioning): move platform content to /products/platform |

6 commits, none amended, none pushed. Step 3 commit `3fc3f58` also retargets the `/consultation` 301 to `/studio/process` (Session 1 had it temp-routed to `/studio/engagements`).

---

## Files added/changed

**New pages:**
- `app/studio/page.tsx` — studio overview (Hero, 5-card "Who we serve", 4-phase teaser, CTA)
- `app/studio/methodology/page.tsx` — alternating-side timeline of Learn/Wire/Automate/Scale + "What we don't do" antipattern callout
- `app/studio/process/page.tsx` — Week 1–2 / 3–6 / 7–14 / 15–20 / 21–24 / Month 7+ alternating timeline
- `app/studio/case-studies/page.tsx` — 3 abstracted slot cards (sector + constraint), placeholder NDA copy
- `app/products/page.tsx` — 7-card portfolio grid, mono-violet, order Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform
- `app/products/platform/page.tsx` — text-only hero, 4-pillar grid, advisor panel, Day 1 → Month 3 timeline, industry list, pricing teaser

**Config:**
- `next.config.mjs` — `/consultation` redirect retargeted from `/studio/engagements` to `/studio/process`

No files deleted, no Session 1 work modified. RFP routes (`(rfp-marketing)`, `lib/rfp/`, `components/rfp/`) untouched per hard rules.

---

## Typecheck / Lint

**`npm run lint` — PASS for repositioning files.** Repo-wide: 1556 problems (43 errors, 1513 warnings) — same as Session 1 baseline, all pre-existing in unrelated files. Grepped explicitly for the 6 new Session 2 files: ZERO warnings or errors.

**`npm run type-check` (tsc --noEmit) — INCONCLUSIVE on full repo, same condition Session 1 documented.** The project's own `next.config.mjs` documents this: "codebase is too large for Vercel's memory limits" — `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` are set; the build pipeline does not gate on tsc. tsc was started, ran for several minutes without producing output, and was left to OOM on its own. Repo build pipeline is the actual gate.

Targeted standalone tsc on the 6 new files (without project config) was attempted; it surfaced no type errors in the files themselves but is not a substitute for the project tsc run.

**Invalid Tailwind classes (Session 1's hot-fix lesson):** verified `h-4.5 / w-4.5` do not appear anywhere in Session 2 files. One `h-4.5 w-4.5` slipped into the platform page during initial draft and was corrected pre-commit.

---

## Deferred to Session 3

1. **`/products/atlas` detail page** — `/products` portfolio links to it; route currently 404s. Per Session 3 scope (BRIEF_RECONCILED §C). Atlas card has CTA "Request introduction → /products/atlas" — needs the gated intake page.
2. **`/products/sentinel` detail page** — minimal landing that links out to live `sentinel.perpetualcore.com`. Currently the card links direct to the external subdomain; the `/products/sentinel` route 404s. Keep that direct link or build a stub on /products/sentinel — Session 3 call.
3. **`/products/sage` detail page** — Sage SaaS landing per `SAGE_LANDING_COPY.md v0.2`. Card currently links direct to `sage.perpetualcore.com`. Same call as Sentinel.
4. **`/products/vellum` detail page** — Vellum landing with hero + features + pricing block + CTA. Card has CTA → `/products/vellum`, currently 404s.
5. **`/products/rfp-engine` detail page** — repoint existing `/rfp/` content. Card has CTA → `/products/rfp-engine`, currently 404s.
6. **`/products/rfp-sentry` stub** — early-list capture page. Card has CTA → `/products/rfp-sentry`, currently 404s.
7. **Top banners on `/solutions/*`** — link banner to `/studio/engagements`, refresh light copy. 12 pages.
8. **Navbar consolidation across `/solutions/*`** — Session 1 deferred this. Replace inline `<header>` blocks with the canonical `<Navbar />`.
9. **Cleanup of dead `app/consulting/page.tsx`** — route is 301'd; file is dead code. Session 1 deferred.
10. **Real founder photo on /about** — placeholder block still present per Session 1 TODO.
11. **Logo replacement** — "PC" gradient placeholder in Navbar/Footer/PublicMobileNav. Per brief, deferred.
12. **Move retired homepage components to `/products/platform`** — UI_AUDIT §3 directs moving HeroSection/BentoFeatures/InteractiveChatDemo/ComparisonTable/ExecSuiteShowcase/UseCases/HowItWorks/PricingTeaser/FinalCTA — but those component files do not exist in this checkout (they were never present at HEAD; UI_AUDIT was based on a different snapshot). The platform page in this session was instead composed from primitives carrying the same content (4-pillar, advisor panel, Day 1 → Month 3 timeline, industry list, pricing teaser). No content lost; the recompositions match the spec in studio-frame visual register. **Session 3 reviewer: confirm this approach is acceptable, or pull the prior components from main history if the originals are wanted as-is.**
13. **Site-wide meta descriptions, link audit, mobile QA** — Session 3 cleanup scope.

---

## Manual QA checklist (browser, before merge)

1. `/studio` renders text-only hero, 5 buyer cards (Mission-driven CEOs / Foundation officers / PE OPs / Health system COOs / Mission-aligned founders), 4-phase teaser block, final CTA. Engagement floor and retainer strings present in final CTA.
2. `/studio/methodology` renders gradient-text H1 "AI-First Framework", four alternating-side rows (01 Learn / 02 Wire / 03 Automate / 04 Scale) with durations and bodies, then a card with the 5-bullet "things we will not sell you" list, then final CTA.
3. `/studio/process` renders text-only hero, six alternating-side rows (Week 1–2 / 3–6 / 7–14 / 15–20 / 21–24 / Month 7+), final CTA. The retainer band shows "$5,000–$15,000/month".
4. `/studio/case-studies` renders three slot cards. Each card has SECTOR / CONSTRAINT labels and the line "Case study available under NDA. Ask in your intake call." No fabricated metrics. Slots cover East Africa humanitarian / NY community college / multi-state faith institution.
5. `/products` renders 7 product cards in the order Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform. Mono-violet icon family (no per-card colored gradients). Atlas card has NO pricing. Vellum card shows "Free / $49 Operator / $249 Team / Institution Contact us". Platform card shows "Free / $49 Starter / $99 Pro".
6. `/products/platform` renders text-only hero ("AI OS for individuals and small teams"), 4-pillar grid (11 models / persistent memory / advisors / RAG+voice), 6-advisor card grid, Day 1 → Month 3 alternating timeline, 12-industry pill grid, 3-tier pricing block, "see engagements" final CTA. Pricing block links to `/pricing`.
7. Navbar Studio dropdown — all 4 links now resolve to real pages (overview / engagements / methodology / process / case-studies).
8. Navbar Products dropdown — Platform link resolves to `/products/platform`. Other product links 404 until Session 3.
9. `/consulting` and `/consultation` 301-redirect — `/consultation` should now land on `/studio/process` (was previously `/studio/engagements`).
10. Mobile responsiveness — all 6 new pages collapse the alternating timelines and grids appropriately on `<md` breakpoints.

---

## Outstanding A8 correctness checks

Verified by grep on Session 2 files:

- [x] `Engagements start at $75,000` — present 7 times across the 6 new pages plus Session 1 pages, exact string preserved.
- [x] Retainer string `$5,000–$15,000/month, scoped to engagement` — verified in `/studio` final CTA and `/studio/process` Month 7+ row.
- [x] No "Uplift" / "Human Development" misuse — grep returns zero matches across the 6 new files.
- [x] `Institute for Human Advancement` — appears in `/products` Sage card; other Session 2 pages defer to /engine for the giving structure (pages link to /engine for the commitment detail, which Session 1 verified).
- [x] No fabricated case study metrics — `/studio/case-studies` placeholder copy is "Case study available under NDA. Ask in your intake call.", no percentages or invented outcomes.
- [x] No real client names — case-studies copy is abstracted to "A UN-aligned humanitarian agency operating across East Africa" / "A community-college workforce program in New York" / "A faith institution with a multi-state network."
- [x] License & Embedded "Contact us" only — Session 2 pages do not surface License/Embedded; that lives on /pricing (Session 1).
- [x] Atlas no pricing on `/products` — verified Atlas card has no `pricing` field (deliberate scarcity per §5.2).
- [ ] **Mobile responsiveness** — needs human browser pass.
- [ ] **Real founder photo** — placeholder still on /about (Session 1 TODO, blocks launch).

---

*Session 2 complete. Branch `feat/studio-repositioning` ready for Session 3 build (product detail pages + cleanup).*
