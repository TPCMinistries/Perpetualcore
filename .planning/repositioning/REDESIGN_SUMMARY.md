# Redesign v2 — Session Summary

**Date:** 2026-05-12
**Branch:** feat/studio-repositioning
**Status:** LOCAL ONLY — do not push until Lorenzo approves on localhost:3001

---

## Visual System Shipped

See: `.planning/repositioning/VISUAL_SYSTEM.md`

**Direction:** Editorial Gravity
**Thesis:** Stillness costs money. The absence of SaaS chrome is the positioning signal for a $75K studio.

---

## What Was Built

### Typography
- Added **Newsreader** (Google Fonts serif) via `next/font/google` — weights 300/400/500, normal + italic
- Wired as CSS variable `--font-newsreader`, accessible via Tailwind `font-serif` class
- All homepage H1/H2s now Newsreader `font-light` — no font-black, no tracking-tighter
- Eyebrows changed from italic Inter to uppercase tracking-widest Inter (`.eyebrow` utility)

### Palette
- Background shifted to parchment (`40 20% 97%`, ~#F9F7F4) — not pure white
- Primary violet desaturated from 67% to 46% (`#5B3FA8`) — authority, not brightness
- Muted-foreground shifted to warm gray (`30 8% 40%`, ~#6B6560)
- Border warmed (`30 14% 88%`, ~#E5E0DA)
- New semantic tokens: `--ink`, `--surface-dark` (for engine dark block), `--parchment`
- Border-radius tightened to 0.375rem (editorial crispness, not consumer SaaS pill)

### Logo / Wordmark
- Removed gradient "PC" circle from Navbar, Footer, PublicMobileNav
- Replaced with "Perpetual Core" in Newsreader `font-normal tracking-tight` at nav scale
- No icon, no mark — the serif wordmark IS the brand identity

### Homepage Sections
1. **Hero** — Newsreader light at text-5xl→7xl, body in max-w-2xl column at leading-[1.75]. CTA: filled primary + text-link secondary (no outline button). No gradient on H1.
2. **Trusted-by strip** — Newsreader italic sentence, centered, border-y. No logos, no marquee.
3. **Studio section** — Newsreader h2, max-w-2xl column, generous leading.
4. **Product cards** — Architectural grid (`gap-px bg-border` container, white cards on parchment). Index numbers (01/02/03) + status (Live/Pilot/Coming). Newsreader headline per card. Text-link CTAs — no buttons, no colored icon tiles. Hover: `surface-hover` background.
5. **Methodology** — Horizontal table layout with border-b separators. Mono index, Newsreader step label, Inter body. No icon tiles.
6. **Engine commitment** — Only dark section: `surface-dark` (#1A1714 equivalent). White Newsreader headline, white/60 body, hairline divider. Outline button white-on-dark.
7. **Final CTA** — Pure editorial — no gradient slab, no dark background. Newsreader h2, py-28 sm:py-40.

---

## Files Modified

| File | Change |
|------|--------|
| `app/layout.tsx` | Added Newsreader font, CSS variables on html, metadata updated |
| `app/globals.css` | New parchment palette, desaturated violet, semantic tokens, .eyebrow utility |
| `tailwind.config.ts` | fontFamily.serif → Newsreader, ink/surface/parchment color tokens |
| `app/page.tsx` | Full homepage rewrite — all 7 sections redesigned |
| `components/landing/Navbar.tsx` | Wordmark, quiet nav links, editorial dropdown, tighter spacing |
| `components/landing/Footer.tsx` | Wordmark, token system, consistent border |
| `components/layout/PublicMobileNav.tsx` | Wordmark, all slate-* → design tokens, editorial mobile sheet |
| `.planning/repositioning/VISUAL_SYSTEM.md` | Created — full direction doc |
| `.planning/repositioning/REDESIGN_SUMMARY.md` | This document |

---

## Commits (all local)

1. `1a99c47` — editorial gravity visual system — tokens, fonts, palette
2. `3eb40aa` — navbar + footer — wordmark, quiet type, editorial spacing
3. `cd65671` — homepage full redesign — editorial gravity execution
4. `14571f0` — metadata — studio positioning, perpetualcore.com domain
5. `1568438` — mobile nav polish — wordmark, token system

---

## Lint / TypeScript Status

- **Lint:** Zero errors in modified files. Pre-existing 43 errors in app are unrelated (auth, dashboard, whatsapp, compliance pages — all pre-redesign).
- **TypeScript:** Zero errors in modified files (tsc --noEmit check run, no hits on our files).

---

## What Would Get Iterated Next (if another hour)

1. **Real Newsreader rendering check** — the font is wired correctly (CSS variable, tailwind fontFamily, next/font) but visual confirmation at localhost:3001 is the real test. Verify Newsreader is loading at correct weights (300 = light, 400 = normal) and not falling back to Georgia.

2. **Product card min-height** — the three cards in the editorial grid may have unequal heights on mobile because they're in a CSS grid. Add `sm:grid-cols-1` and a `grid-rows-3` constraint, or use `equal-height` flex approach.

3. **Engine block — stat row** — the current engine section just has prose. A three-stat row (`$7.5K min / $25K+ max / 10% guaranteed`) set in Newsreader large with Inter labels would add editorial punch to the dark block.

4. **Methodology step — wider breakpoint** — the `sm:grid-cols-[200px_1fr]` split only kicks in at sm (640px). At 640-768px, 200px for the step label is tight. Consider `md:grid-cols-[160px_1fr]` + adjusting the 200px column.

5. **Footer section headers** — still in Inter font-semibold. Could shift to font-medium with tracking-wide for quieter editorial feel.

6. **Trusted-by strip** — currently a single Newsreader italic sentence. For maximum effect, could be separated into 5 short sector labels in uppercase tracking-widest with thin dividers between them (healthcare | education | faith | development | workforce) — less "about us" prose, more typographic architecture.

7. **Dark mode verification** — dark mode tokens were updated but not visually verified. The parchment tokens invert correctly to the existing deep violet-near-black, but verify the new muted-foreground warm gray reads correctly against dark backgrounds.

---

## DO NOT PUSH

Control returns to Lorenzo. Review on http://localhost:3001, then push if approved.
