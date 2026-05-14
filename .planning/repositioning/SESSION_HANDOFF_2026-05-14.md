# Session Handoff — Perpetual Core v2 (Operating Company)

**Session window:** 2026-05-13 → 2026-05-14
**Last update:** 2026-05-14 (post safety + cascade pass)
**Branch:** `feat/studio-repositioning`
**Latest commit:** `8f6f16f` — fix(repositioning): consolidate mailtos + soften retainer-credit + cascade /solutions/healthcare
**Status:** v2 ship-ready locally. Not pushed. Safety pass shipped. 2 flagship verticals cascaded. Awaiting Lorenzo's in-browser verdict + 4 unconfirmed details.

### Session commits (chronological)
1. `5cee5b1` — v2 operating-company frame, Engine-as-standard, 3-band spectrum
2. `635d31e` — cascade /solutions/non-profits to v6 + add session handoff
3. `8f6f16f` — consolidate mailtos + soften retainer-credit + cascade /solutions/healthcare
4. *(pending)* — cascade education + churches + law-firms (in-progress)

---

## Read this first (3-min orientation)

This session executed three sequential strategic shifts on top of the prior v1 Editorial-gravity redesign that Lorenzo rejected. By end of session:

1. **Engine = open structural standard** (not Perpetual Core's moat). Reference implementation framing. Published at `/engine/spec` as v1.0, CC BY 4.0.
2. **5-arm operating company** (Studio · Products · Fund · Institute · Engine), not a consultancy. Architecture SVG on homepage. New routes for Fund, Institute, Engine spec.
3. **3-band Studio spectrum** (Products · Retainers · Engagements) — Retainers tier is new, fills the $5K–$15K/mo middle. Engagements de-scarcified.

Visual register: Instrument Serif display H1s, JetBrains Mono labels, near-black ink on pure white, hairline grids, §-numbered rails, architectural SVG, dramatic black-bg Frontier manifesto, scroll-reveal animations, status pulses, grain texture.

All locked. Don't re-derive.

---

## Current branch state

```
main (local):        diverged via filter-repo from prior session (don't push)
origin/main:         clean, RFP session's territory
feat/studio-repositioning (origin): 30 commits behind local
feat/studio-repositioning (local):  8 commits ahead of origin
  - 5cee5b1   v2 operating-company frame (this session's main commit)
  - 8654312   docs(handoff): session handoff 2026-05-12
  - d8cde07 + 5 redesign-v2 commits (from prior Editorial-gravity session — superseded)

feat/rfp-orgs-invites-cont:  Other Claude session's territory. DO NOT TOUCH.
  app/(rfp-marketing)/ · lib/rfp/ · components/rfp/ · app/api/cron/
```

**Live state:**
- Dev server on `:3001` (PID earlier this session) + parallel clean server on `:3002` (PID via `nohup ... PORT=3002`)
- Browser tested on `:3002` (clean origin — original `:3001` had stale Service Worker from a prior `next build && next start` session)
- Vercel preview URL (last public deploy): `https://ai-os-platform-git-feat-studio-repositioning-gdi-727dc440.vercel.app/` — shows OLD redesign-v2 work, NOT this session's v2 work. Push needed to update.

---

## 23 routes shipping at v6 visual register

All return 200 on localhost:3002. Dev log clean.

| Route | Status |
|---|---|
| `/` | ✅ v6 — architecture SVG, 5-arm IA, 3-band spectrum, Frontier manifesto, Open Invitation |
| `/studio` | ✅ v6 — three-band spectrum hero |
| `/studio/retainers` | ✅ NEW — 5 productized programs |
| `/studio/engagements` | ✅ v6 — abundance frame, scarcity removed |
| `/studio/methodology` | ✅ v6 |
| `/studio/process` | ✅ v6 |
| `/studio/case-studies` | ✅ v6 — Uplift credibility line in hero |
| `/products` | ✅ v6 — full 7-product grid |
| `/products/atlas` | ✅ v6 — form preserved |
| `/products/atlas-discovery` | ✅ v6 — form preserved |
| `/products/sentinel` | ✅ v6 — pay-per-vet + retainer cross-link |
| `/products/sage` | ✅ v6 |
| `/products/vellum` | ✅ v6 — EarlyAccessForm preserved |
| `/products/platform` | ✅ v6 — pricing teaser links to /pricing |
| `/products/rfp-sentry` | ✅ v6 — early-list form preserved |
| `/engine` | ✅ v6 — manifesto + open invitation section |
| `/engine/spec` | ✅ NEW — v1.0 formal spec, citable |
| `/fund` | ✅ NEW — DeepFutures thesis + structural pitch |
| `/institute` | ✅ NEW — IHA programs + Uplift operating arm callout |
| `/about` | ✅ v6 — founder, ecosystem, 5 operating principles |
| `/pricing` | ✅ v6 — full 3-band spectrum, Stripe checkout preserved |
| `/solutions/non-profits` | ✅ **NEW** — v6 cascade (1094 → 399 lines), 6 use cases, 5 FAQs, Platform Pro $99/staff/mo |
| `/solutions/healthcare` | ✅ **NEW** — v6 cascade (1408 → 382 lines), $899/provider/mo, BAA + EHR integration list, HIPAA-aware framing |

---

## Still on older design (deferred)

10 `/solutions/*` industry pages — render with new tokens but use older layouts:

| Route | Lines | Ecosystem fit |
|---|---|---|
| `/solutions/education` | 1152 | High — IHA Academy + Uplift Workforce |
| `/solutions/churches` | 1277 | High — TPC Ministries adjacency |
| `/solutions/real-estate` | 1218 | Medium |
| `/solutions/sales` | 1227 | Medium |
| `/solutions/consulting` | 1356 | Medium-high |
| `/solutions/financial-advisors` | 1348 | Medium |
| `/solutions/it-services` | 1344 | Medium |
| `/solutions/agencies` | 1559 | Medium |
| `/solutions/accountants` | 1698 | Medium |
| `/solutions/law-firms` | 1817 | High — revenue density |

`/rfp` (RFP Engine — other session's territory, do not touch)

---

## Unconfirmed details awaiting Lorenzo's input

1. **Five retainer offers** in `/studio/retainers` — names, prices, SLAs are my draft:
   - Sentinel on Retainer ($5K/mo unlimited vets)
   - Capture Pipeline ($7.5K/mo)
   - Operator Concierge ($10K/mo, 10hrs)
   - Skills Subscription ($5K/mo, one skill/mo)
   - Vellum Institutional ($15K+/mo)
2. ~~Mailto routes~~ ✅ Resolved 8f6f16f — all consolidated to `lorenzo@perpetualcore.com` with descriptive subject prefixes. Filters can be set later if dedicated boxes are provisioned.
3. ~~"Retainer fees credit toward engagement" promise~~ ✅ Resolved 8f6f16f — softened to "we discuss credit toward engagement scope case-by-case, depending on work already shipped."
4. **Uplift Communities + DeepFutures legal status** — copy is legal-status-agnostic; sharpen once confirmed.
5. ~~`/public/images/lorenzo-headshot.jpg`~~ ✅ Confirmed exists (399KB, May 10).

---

## Outstanding from prior session (older handoff, still relevant)

- Supabase token rotation (was pending end of 2026-05-12 session — likely still pending)
- 6 Vellum signup tests on `/products/vellum` (Plan 12-05 Task 4 verification)
- Mobile QA at 375/768/1024 across pages (Plan 12-06 Task 3)
- iha-website cross-brand commit `0194213` not yet pushed to its origin

---

## How to resume (next session)

1. **Read this file** (you're in it)
2. Cd to `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core`
3. Verify dev server on `:3002` is up: `curl -I http://localhost:3002` — if down, restart fresh:
   ```bash
   lsof -ti :3002 | xargs -r kill -9
   cd ~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core
   nohup env PORT=3002 npm run dev </dev/null >/tmp/perpetual-core-dev-3002.log 2>&1 & disown
   ```
4. `git log --oneline -5` — confirm `5cee5b1` is HEAD
5. Ask Lorenzo:
   - Verdict on v2 ship-ready state
   - Sign-off on 5 retainer offers
   - Confirm mailto routes
   - Push to Vercel preview? (`git push origin feat/studio-repositioning`)
6. Continue with `/solutions/non-profits` cascade (next on the list, deferred this session for commit-first verdict)

---

## Files of record

`~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/repositioning/`:

| File | Purpose |
|---|---|
| `BRAND_ARCHITECTURE.md` | **v2.0 addendum at top** — 3 strategic shifts override old language below |
| `SESSION_HANDOFF_2026-05-14.md` | **This file** |
| `SESSION_HANDOFF_2026-05-12.md` | Prior session handoff (now superseded) |
| `REDESIGN_SUMMARY.md` | Editorial-gravity attempt (rejected, history only) |
| `VISUAL_SYSTEM.md` | Editorial-gravity spec (rejected) |
| `COPY_*.md` (5 docs) | Original locked copy — most still valid, but verify against current shipped pages before re-using |

---

## Memory references

- `~/.claude/projects/-Users-lorenzodaughtry-chambers/memory/perpetual-engine-as-standard.md` — strategic frame to apply ecosystem-wide
- `~/.claude/projects/-Users-lorenzodaughtry-chambers/memory/perpetual-core-repositioning.md` — needs update with v2 details next session
- Global `~/CLAUDE.md` — Perpetual Core listed under MAIN tier; project at `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/`

---

## One-line summary

v2 strategic + design overhaul shipped locally through `8f6f16f`: 4 new pages, **23 cascaded routes** (added non-profits + healthcare flagships), Engine reframed as open standard, 5-arm operating company IA, 3-band Studio offer spectrum, mailto consolidation + retainer-credit softening shipped. Awaiting Lorenzo's verdict + 2 remaining confirmation items (retainer offer slate, Uplift+DeepFutures legal status) before push to Vercel preview.
