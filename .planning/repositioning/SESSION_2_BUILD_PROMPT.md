# Session 2 — Build agent prompt (queued, fires when Session 1 commits land)

**Spawn with:** `Agent(subagent_type: general-purpose, isolation: worktree)` on the **same `feat/studio-repositioning` branch** Session 1 used. Worktree path can be reused if available.

---

You are the Session 2 build agent for Perpetual Core's studio repositioning. Session 1 landed (foundations: nav, footer, /, /studio/engagements, /engine, /about, /pricing). Your scope is studio depth + products portfolio.

## Branch + worktree setup

- Continue on `feat/studio-repositioning` branch — Session 1's commits are your base.
- Confirm with `git log --oneline -10` that Session 1's 7 commits exist (look for "feat(repositioning):" prefix).
- DO NOT touch the main checkout — second-RFP session is still active there.

## Required reading (already on disk from earlier waves — read once, keep in working memory)

All in `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/repositioning/`:

1. `BRAND_ARCHITECTURE.md` — §1 (stack), §5.5 (engine page already done in S1), §5.6 (portfolio order), §7 (route map)
2. `BRIEF_RECONCILED.md` — A4 (pages list), A5 (retire/merge), A8 (correctness checks)
3. `COPY_HOMEPAGE.md` — for the methodology teaser pattern
4. `COPY_STUDIO.md` — sections for /studio overview, /studio/methodology, /studio/process, /studio/case-studies
5. `COPY_PRODUCTS.md` — all 7 product cards + /products page intro
6. `UI_AUDIT.md` — §3 (which existing components to compose from), §7 (per-page build approach)
7. `SESSION_1_REPORT.md` — Session 1's manual QA checklist + anything they deferred to S2

## Scope — Session 2

Build, in this order, with atomic commits per major step:

### Step 1: /studio overview
- New route `app/studio/page.tsx` per `COPY_STUDIO.md` Page 1.
- Per UI audit §7: composed from existing sections. Hero text-only, "Who we serve" as 5-card grid (operators-who-carry-weight), methodology teaser, final CTA.
- COMMIT: "feat(repositioning): add /studio overview page"

### Step 2: /studio/methodology
- New route `app/studio/methodology/page.tsx` per `COPY_STUDIO.md` Page 3.
- Alternating timeline component for the 4 phases (Learn / Wire / Automate / Scale). UI audit §7 suggests adapting `HowItWorks` component shape.
- §3 "What we don't do" — 5-bullet list as a card or stat-strip. This is the antipattern callout per spec.
- COMMIT: "feat(repositioning): add /studio/methodology page"

### Step 3: /studio/process
- New route `app/studio/process/page.tsx` per `COPY_STUDIO.md` Page 4.
- Week-by-week timeline (Week 1–2, 3–6, 7–14, 15–20, 21–24, Month 7+). Adapt `ComparisonTable` shape per UI audit §7.
- COMMIT: "feat(repositioning): add /studio/process timeline page"

### Step 4: /studio/case-studies
- New route `app/studio/case-studies/page.tsx` per `COPY_STUDIO.md` Page 5.
- 3 abstracted slot cards. Use placeholder text **"Case study available under NDA. Ask in your intake call."** — DO NOT fabricate metrics.
- Each slot shows SECTOR / CONSTRAINT label only.
- COMMIT: "feat(repositioning): add /studio/case-studies with abstracted slots"

### Step 5: /products portfolio overview
- New route `app/products/page.tsx` per `COPY_PRODUCTS.md` /products page intro + the 7-card grid.
- Card grid order: **Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform** (per BRAND_ARCHITECTURE §5.6).
- Mono-violet card family per UI audit §5 sharpening lever (no per-card gradient variation).
- Card spec per `COPY_PRODUCTS.md`: headline + 2-line subhead + CTA label.
- Atlas card has NO pricing (deliberate scarcity per §5.2). Vellum + Platform cards SHOW pricing on card.
- COMMIT: "feat(repositioning): add /products portfolio overview"

### Step 6: /products/platform — the existing homepage content, repurposed
- Move existing homepage sections (BentoFeatures, InteractiveChatDemo, ComparisonTable, ExecSuiteShowcase, UseCases, "Watch It Learn" timeline, Day 1 → Month 3, "11 Models. One Price.", "Built for Every Industry" carousel) to `app/products/platform/page.tsx`.
- Per UI audit §3: KEEP all of these sections. They were the platform-product content all along; the studio repositioning just moves them off `/`.
- Hero: text-only with current platform value prop ("AI OS for individuals and small teams. 11 models, persistent memory, AI executive advisors.") — adapted from existing `HeroSection`. Pricing teaser at bottom links to /pricing.
- "Built for Everyone" personas grid: DELETE (not moved here — per BRIEF_RECONCILED A5).
- "Stop juggling tools" CTA: DELETE.
- COMMIT: "feat(repositioning): move platform content to /products/platform"

## After all 6 commits

1. `git log --oneline -10` to verify 6 new commits stacked on Session 1's 7 (13 total since main).
2. `pnpm typecheck` (or `pnpm build`). Fix failures with new commits, never amend.
3. `pnpm lint` if available.
4. No dev server, no push, no merge.

## Hard rules (same as Session 1)

- Atomic commits, specific paths, no `git add -A`
- Never amend
- Never touch `(rfp-marketing)`, `lib/rfp/`, `components/rfp/` — second-RFP territory
- Never touch files outside `app/`, `components/`, `next.config.*`, `middleware.ts` for repositioning work
- Use exact pricing strings: "Engagements start at $75,000" / "$5,000–$15,000/month, scoped to engagement"
- IHA always full name: "Institute for Human Advancement"
- All BRIEF_RECONCILED A8 correctness checks must pass before report

## Output

Write a concise report (cap 500 words) to `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/repositioning/SESSION_2_REPORT.md`:
- Commits with SHAs (1 line each)
- Typecheck/lint results
- Anything skipped or deferred to Session 3
- Manual QA checklist (5–8 items the human verifies in browser)
- Outstanding A8 correctness checks not yet verified

Then return a short summary: branch, commit count, typecheck status, blocking issues.
