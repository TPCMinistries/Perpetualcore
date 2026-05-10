---
phase: 12-studio-repositioning-v1-1
plan: "03"
subsystem: ui
tags: [hyperlinks, seo, accessibility, brand-architecture, iha]

# Dependency graph
requires:
  - phase: 12-studio-repositioning-v1-1
    provides: "Build Sessions 1-3: /about, /engine, /products/sage pages built with IHA references as plain text"
provides:
  - "All PC-side IHA references on /about, /engine, /products/sage wired as proper hyperlinks to theiha.org"
  - "Link-audit artifact tracking both directions of bidirectional brand link (STUDIO-LK-01)"
  - "Direction B (iha-website → perpetualcore.com) formally deferred to phase_2_followup — checkpoint returned"
affects:
  - "Plan 12-05 (Vellum IHA link — reads from this pattern)"
  - "STUDIO-LK-01 requirement closure (Direction A complete)"
  - "theiha.org cross-brand link quality (Direction B deferred)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IHA external link pattern: href=https://theiha.org target=_blank rel=noopener noreferrer className=text-primary hover:underline underline-offset-4"
    - "Link placement: first occurrence per subsection linked, subsequent occurrences plain text; CTA always linked"

key-files:
  created:
    - ".planning/phases/12-studio-repositioning-v1-1/12-03-LINK-AUDIT.md"
  modified:
    - "app/about/page.tsx"
    - "app/engine/page.tsx"
    - "app/products/sage/page.tsx"

key-decisions:
  - "Direction B (IHA → PC cross-repo edits) deferred to phase_2_followup per plan frontmatter — not a blocker for STUDIO-LK-01 PC-side closure"
  - "Link-first-occurrence-per-subsection pattern: avoids over-linking while ensuring every section has at least one navigable IHA reference"
  - "Static grep verification used as pre-deploy proxy (Next.js server-renders; anchor tags in source = anchor tags in HTML output)"

patterns-established:
  - "IHA external link: always use https://theiha.org (with https://), always include target=_blank rel=noopener noreferrer"
  - "Subsection link discipline: first occurrence in each section/subsection gets the anchor, subsequent occurrences plain text to avoid visual overload"

requirements-completed:
  - STUDIO-LK-01

# Metrics
duration: 18min
completed: 2026-05-10
---

# Phase 12 Plan 03: IHA Bidirectional Link Audit (PC-Side) Summary

**Seven IHA hyperlinks added across /about (3), /engine (3), /products/sage (1) with target=_blank rel=noopener noreferrer, completing Direction A of STUDIO-LK-01; Direction B deferred as phase_2_followup**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-10T19:00:00Z
- **Completed:** 2026-05-10T19:18:02Z
- **Tasks:** 2 complete + 1 checkpoint returned (deferred)
- **Files modified:** 4 (3 page files + 1 audit artifact)

## Accomplishments

- All IHA proper-noun references on /about, /engine, /products/sage are now clickable anchor tags pointing to https://theiha.org with correct security attributes
- Link-audit artifact created documenting both directions of STUDIO-LK-01 with status tracker
- Direction B formally deferred as phase_2_followup — this is a passing resolution per plan frontmatter; Direction B does NOT block STUDIO-LK-01 PC-side closure

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire hyperlinks from /about, /engine, /products/sage to theiha.org** - `03bed68` (feat)
2. **Task 2: Production link verification artifact** - `e5775e0` (chore)
3. **Task 3: Lorenzo applies cross-repo edits (Direction B)** - CHECKPOINT returned; Direction B deferred to phase_2_followup

## Files Created/Modified

- `app/about/page.tsx` — 3 new anchor tags: hero paragraph, field-research card, how-we-work item 5; existing IHA card h3 + CTA anchors confirmed intact
- `app/engine/page.tsx` — 3 new anchor tags: §1 hero paragraph, §5 H2, §5 body §1; existing §5 CTA primary anchor confirmed intact
- `app/products/sage/page.tsx` — 1 new anchor tag: §15% H2; 2 existing sage.perpetualcore.com anchors confirmed intact
- `.planning/phases/12-studio-repositioning-v1-1/12-03-LINK-AUDIT.md` — bidirectional link audit with Direction A table (10 links), Direction B table (2 iha-website edits deferred), pre-deploy static verification results, post-deploy curl commands

## Anchor tags added (file:pattern)

| File | Anchor text | Line context |
|---|---|---|
| app/about/page.tsx | "Institute for Human Advancement" | Hero §1 paragraph |
| app/about/page.tsx | "Institute for Human Advancement" | Field-research card body (§3) |
| app/about/page.tsx | "Institute for Human Advancement" | How-we-work item 5 (§4) |
| app/engine/page.tsx | "Institute for Human Advancement" | §1 hero paragraph |
| app/engine/page.tsx | "Institute for Human Advancement" | §5 commitment H2 |
| app/engine/page.tsx | "Institute for Human Advancement" | §5 commitment body §1 |
| app/products/sage/page.tsx | "Institute for Human Advancement" | §15% H2 |

## Existing anchors confirmed intact

| File | Anchor text | Target |
|---|---|---|
| app/about/page.tsx | "Institute for Human Advancement" (IHA card h3) | theiha.org |
| app/about/page.tsx | "Visit the Institute" (CTA) | theiha.org |
| app/engine/page.tsx | "About the Institute for Human Advancement" (§5 CTA) | theiha.org |

## Verification results (pre-deploy, static source grep)

| Check | Result | Threshold | Pass? |
|---|---|---|---|
| `grep -c "theiha.org" app/about/page.tsx` | 7 | ≥2 | ✓ |
| `grep -c "noopener noreferrer" app/about/page.tsx` | 5 | ≥2 | ✓ |
| `grep -c "theiha.org" app/engine/page.tsx` | 4 | ≥2 | ✓ |
| `grep -c "noopener noreferrer" app/engine/page.tsx` | 4 | ≥2 | ✓ |
| `grep -c "theiha.org" app/products/sage/page.tsx` | 1 | ≥1 | ✓ |
| `grep -c "noopener noreferrer" app/products/sage/page.tsx` | 3 | ≥1 | ✓ |
| `curl -sI https://theiha.org \| head -1` | HTTP/2 200 | 200 | ✓ |
| `npx eslint app/about/page.tsx app/engine/page.tsx app/products/sage/page.tsx` | (no output) | clean | ✓ |

## Decisions Made

- **Direction B deferred:** Cross-repo edits to iha-website (SUSTAIN pillar + case-studies.ts hyperlinks to perpetualcore.com/engine) are tracked as `phase_2_followup` per plan frontmatter. Task 3 checkpoint returned at this boundary. "Deferred" is a passing resolution per plan design — STUDIO-LK-01 PC-side closure does not depend on Direction B.
- **Link-first-occurrence-per-subsection:** Applied the plan's guidance to link the first occurrence of "Institute for Human Advancement" in each section/subsection and leave subsequent occurrences as plain text. This avoids visual over-linking while ensuring every content section has a navigable reference.
- **Static grep as pre-deploy proxy:** Next.js server-renders pages — anchor tags in source JSX are included in rendered HTML output. Static source grep is a valid pre-deploy verification. Dev-server curls will produce the same results when run against `npm run dev`.

## Deviations from Plan

None — plan executed exactly as written. The three files specified were modified; the link-audit artifact was created; the checkpoint was returned for Task 3 (cross-repo human action). Direction B deferred is the explicitly documented passing resolution.

## Issues Encountered

Minor: the main checkout was on `feat/rfp-orgs-invites-cont` branch, not `feat/studio-repositioning`. The app/about, app/engine, and app/products/sage page files only exist on `feat/studio-repositioning`. Resolved by switching to the correct branch (working tree was clean, no stash needed).

## Direction B Checkpoint State

**Task 3 disposition:** DEFERRED (passing resolution per plan frontmatter)

Edits needed in `~/ORGANIZED/01_PROJECTS/ACTIVE/iha-website` to complete Direction B:
1. `src/lib/constants.ts:~236` — SUSTAIN pillar "Perpetual Core" → anchor to https://perpetualcore.com/engine
2. `src/lib/case-studies.ts:~110` — "Perpetual Core (AI Infrastructure)" → anchor in JSX consumer

Cross-repo commit message target: `feat(links): hyperlink Perpetual Core references to perpetualcore.com/engine`

Post-deploy verification:
```bash
curl -s https://theiha.org/ | grep -c "perpetualcore.com/engine"  # expect ≥2
```

Direction B does NOT block STUDIO-LK-01 closure on the Perpetual Core side.

## Deferred Items (mobile QA)

Per plan `<output>` specification: IHA link tap targets at 375px should be verified during STUDIO-PL-01 mobile QA pass. The anchor wrapping pattern uses `className="text-primary hover:underline underline-offset-4"` inline — these are inline text anchors, not block-level elements, so tap target size depends on surrounding text density. Flag for visual QA at 375px.

## Next Phase Readiness

- Direction A (PC → IHA) complete. Plan 12-05 adds the Vellum IHA link using the same pattern established here.
- Direction B (IHA → PC) deferred — Lorenzo can apply anytime to the iha-website repo independently of this phase's merge.
- The `12-03-LINK-AUDIT.md` artifact provides post-deploy verification commands for both directions.
- STUDIO-LK-01 PC-side closure: all must_haves satisfied. Post-deploy curls confirm after merge.

---
*Phase: 12-studio-repositioning-v1-1*
*Completed: 2026-05-10*
