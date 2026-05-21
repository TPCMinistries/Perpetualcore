# IHA ↔ Perpetual Core Link Audit (STUDIO-LK-01)

## Direction A: Perpetual Core → IHA (this plan's scope)

Source page → target URL → expected anchor text → rel attribute check.

| Source | Target | Anchor text | rel attrs |
|---|---|---|---|
| /about hero paragraph | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /about ecosystem section IHA card h3 | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /about ecosystem section CTA | https://theiha.org | "Visit the Institute" | noopener noreferrer + target=_blank |
| /about field-research card body | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /about how-we-work item 5 | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /engine §1 hero paragraph | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /engine §5 commitment H2 | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /engine §5 commitment body §1 | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /engine §5 CTA primary | https://theiha.org | "About the Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /products/sage §15% H2 | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |
| /products/vellum 10% callout (added in Plan 12-05) | https://theiha.org | "Institute for Human Advancement" | noopener noreferrer + target=_blank |

Destination liveness check (run 2026-05-10):

```bash
curl -sI https://theiha.org | head -3
# Result: HTTP/2 200 — destination is live
```

## Direction B: IHA → Perpetual Core (cross-repo, phase-2 follow-up — NOT in this plan's scope)

These edits live in `~/ORGANIZED/01_PROJECTS/ACTIVE/iha-website` and require a separate commit on that repo. Lorenzo (or a follow-up cross-repo plan) applies these. Direction B does NOT block STUDIO-LK-01 closure on the Perpetual Core side.

| File | Line | Edit |
|---|---|---|
| `iha-website/src/lib/constants.ts` | ~236 | SUSTAIN pillar's "Perpetual Core" reference becomes `<a href="https://perpetualcore.com/engine" target="_blank" rel="noopener noreferrer">Perpetual Core</a>` (or equivalent in JSX consumer if constants.ts holds plain strings — wrap in the consuming component). |
| `iha-website/src/lib/case-studies.ts` | ~110 | "Perpetual Core (AI Infrastructure)" reference becomes a hyperlink to perpetualcore.com/engine in the consumer markup. |

For each, after Lorenzo edits and deploys iha-website:

```bash
curl -s https://theiha.org/ | grep -c "perpetualcore.com/engine"
# Expected: at least 2 (SUSTAIN block + case studies block)
```

## Pre-deploy verification (dev server)

Run from the perpetual-core dev server (`npm run dev`):

```bash
curl -s http://localhost:3000/about | grep -E '<a [^>]*theiha\.org[^>]*noopener'
curl -s http://localhost:3000/engine | grep -E '<a [^>]*theiha\.org[^>]*noopener'
curl -s http://localhost:3000/products/sage | grep -E '<a [^>]*theiha\.org[^>]*noopener'
```

Each command must return at least one match.

### Static grep verification (pre-server — run 2026-05-10)

These grep commands run against the source files directly and confirm the anchor patterns are present:

```
$ grep -E 'theiha\.org.*noopener|noopener.*theiha\.org' app/about/page.tsx
# 5 matches — all IHA references on /about are proper hyperlinks

$ grep -E 'theiha\.org.*noopener|noopener.*theiha\.org' app/engine/page.tsx
# 4 matches — all IHA references on /engine are proper hyperlinks (note: spread across adjacent lines in JSX, confirmed by inspect below)

$ grep -n 'theiha.org' app/products/sage/page.tsx
# 1 match in 15% H2 — confirms IHA link present on /products/sage
```

Static source verification results (run 2026-05-10):
- `grep -c "theiha.org" app/about/page.tsx` → **7** (meets ≥2 threshold)
- `grep -c "noopener noreferrer" app/about/page.tsx` → **5** (meets ≥2 threshold)
- `grep -c "theiha.org" app/engine/page.tsx` → **4** (meets ≥2 threshold)
- `grep -c "noopener noreferrer" app/engine/page.tsx` → **4** (meets ≥2 threshold)
- `grep -c "theiha.org" app/products/sage/page.tsx` → **1** (meets ≥1 threshold)
- `grep -c "noopener noreferrer" app/products/sage/page.tsx` → **3** (meets ≥1 threshold; 2 are sage.perpetualcore.com external links, 1 is IHA)

## Post-deploy verification (production)

After `feat/studio-repositioning` (with this plan applied) merges to main and deploys:

```bash
curl -s https://perpetualcore.com/about | grep -E '<a [^>]*theiha\.org[^>]*noopener'
curl -s https://perpetualcore.com/engine | grep -E '<a [^>]*theiha\.org[^>]*noopener'
curl -s https://perpetualcore.com/products/sage | grep -E '<a [^>]*theiha\.org[^>]*noopener'
```

Each must return at least one match.

## Status tracker

- [x] Direction A pre-deploy verification (static source grep — 2026-05-10)
- [ ] Direction A post-deploy verification (production — run after merge + deploy)
- [ ] Direction B iha-website edits applied (Lorenzo, cross-repo) — phase-2 follow-up; "deferred" is a valid resolution
- [ ] Direction B post-deploy verification (theiha.org) — phase-2 follow-up

## Notes

The cross-repo Direction B is gated on Lorenzo running edits in the iha-website worktree. Per AGENT_LOG.md `0194213` on iha-website unified the SUSTAIN pillar definition and case-studies.ts:110 framing — but those edits did NOT add anchor tags. The hyperlink edits are pending and tracked under this plan's `phase_2_followup` frontmatter. Direction B does NOT block STUDIO-LK-01 closure on the Perpetual Core side.

Note on Next.js static rendering: Next.js pages are server-rendered; the `curl -s http://localhost:3000/...` dev-server commands will return rendered HTML including the anchor tags added in Task 1. Post-merge production curls confirm the same on perpetualcore.com. Static grep verification above is run against source and confirms all anchor patterns are present in the committed code.
