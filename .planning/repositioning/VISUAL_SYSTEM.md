# Perpetual Core — Visual System v2.0

**Status:** Locked for redesign-v2 implementation (2026-05-12)
**Direction:** Editorial Gravity

---

## Direction Name

**Editorial Gravity**

---

## One-Paragraph Thesis

A $75,000 engagement is sold in a room — and the site's job is to make the room feel right before Lorenzo enters it. Editorial Gravity means: no decorative motion, no gradient theater, no "AI product" visual clichés. Instead, the site operates through the same register as a well-edited annual report or a Stripe marketing page: extreme whitespace, one serif display font doing the heavy lifting at the headline level, body text that breathes at 1.7 line-height, and a palette where the warmth comes from a paper-like off-white and the authority comes from near-black ink. The accent (a single, desaturated violet) appears exactly once per section — as a thin rule, a CTA fill, or a hover underline — never as a gradient slab. Mission-driven buyers (foundation program officers, fund Operating Partners, health system COOs) have read enough VC pitch decks; the absence of SaaS chrome is itself a positioning statement. Stillness costs money. That's the signal.

---

## Typography Pair

**Display (headlines, H1, H2):** `Newsreader` — a Google Fonts serif with genuine editorial gravitas, optical range, and italic cuts that read beautifully large. Unlike Fraunces (too decorative) or Source Serif Pro (too academic), Newsreader sits at the intersection of broadsheet and law review — exactly right for a studio selling to executives. Load via `next/font/google`.

**Body (all prose, navigation, labels, CTAs):** `Inter` — keep the existing Inter instance. No reason to change a clean variable-weight sans-serif that's already performing well. The serif/sans pairing creates the editorial contrast we need without introducing a third family.

**Weight discipline:**
- H1: `font-light` or `font-normal` in Newsreader at text-5xl/6xl — do NOT use bold in display serif. The lightness is the luxury.
- H2: `font-normal` Newsreader, text-3xl/4xl
- Eyebrow lines: Inter, text-xs uppercase tracking-widest, text-muted-foreground — replace current italic treatment with all-caps small
- Body: Inter `font-normal`, text-base/lg, leading-relaxed (1.75)
- CTAs: Inter `font-medium`, text-sm

---

## Palette

Moving away from the current violet-on-warm-white into a warmer, more grounded palette where the background is parchment, ink is near-black (not pure black), and the accent violet is muted and used with extreme restraint.

| Role | Hex | HSL Token | Description |
|------|-----|-----------|-------------|
| **Background** | `#F9F7F4` | `40 20% 97%` | Parchment — warmer than current, not cream |
| **Surface** | `#FFFFFF` | `0 0% 100%` | Cards and elevated panels (pure white against parchment) |
| **Foreground (ink)** | `#1A1714` | `30 10% 9%` | Near-black with warmth — not pure #000 |
| **Muted text** | `#6B6560` | `30 8% 40%` | Warm mid-gray for body copy, secondary text |
| **Accent (violet)** | `#5B3FA8` | `256 46% 45%` | Desaturated from current 256/67% — quieter authority |
| **Border** | `#E5E0DA` | `30 14% 88%` | Warm light border |
| **Surface hover** | `#F2EFE9` | `40 16% 93%` | Card hover state, muted bg tint |

**Dark mode:** Keep existing deep violet-near-black background (`260 30% 6%`) but shift accent to `256 60% 62%` — slightly less saturated than current 80%.

**What this is NOT:** No pure `#FFFFFF` background (replaced by parchment `#F9F7F4`). No `#7C3AED` full-saturation violet blasts. No multi-stop gradients on text. No colored section backgrounds except the engine commitment block (which gets a single near-black `#1A1714` surface for visual weight).

---

## Spacing Rhythm

**Section padding:** `py-28 sm:py-36` as the standard rhythm. `py-40 sm:py-52` for hero and final CTA.

**Content max-widths:**
- Prose (hero body, studio copy, engine text): `max-w-2xl` (tight — forces editing, creates editorial column feel)
- Hero H1: `max-w-3xl`
- Cards grid: `max-w-5xl`
- Full-width sections (trusted-by strip): `max-w-6xl`

**Container:** Keep `container mx-auto px-6 sm:px-8` — slightly more padding than current `px-4`.

**Line-height:**
- Display type: `leading-[1.15]`
- Body: `leading-[1.75]`
- Compact body: `leading-relaxed` (1.625)

---

## Hero Pattern

**Text-led with typographic anchor — no illustration, no diagram in hero.**

The hero is pure editorial weight: large Newsreader light headline ("We install operating systems for mission-driven organizations.") anchored by a hairline rule (`border-t border-border/60`) above the eyebrow, the eyebrow in Inter uppercase tracking-widest, the H1 in Newsreader light at 60–72px, the subhead in Inter normal at text-xl leading-relaxed, then the two body paragraphs at text-base/lg with genuine `leading-[1.75]` breathing room.

Trust signals (PEPFAR / IRB / GDPR / offline-first) appear inline in the subhead as written prose — not as chip badges or icon rows. The phrasing already does the work.

CTA pair: one filled button (primary, desaturated violet, text-sm Inter medium) + one text-link-style secondary ("Read the methodology →"). No outline button — outline buttons add visual noise.

**What is NOT in the hero:** no animated orbs, no model pills, no gradient slab backgrounds, no floating cards, no SVG diagram, no photography.

---

## Trust Signal Treatment

Trust signals (PEPFAR rules / IRB review / GDPR-equivalent consent / offline-first connectivity) stay exactly where they are — in the subhead prose sentence. They are NOT rendered as:
- Chip/pill badges
- Icon rows with checkmarks
- A separate "compliance" section

Rationale: a buyer who needs to know what PEPFAR means already knows. Rendering it as a badge reduces it. In-sentence prose treats the reader as a peer. This is the Anthropic/Stripe register.

The "Trusted by leaders in..." strip becomes a single-line italic sentence set in Newsreader, centered, against a warm border-y treatment — no logos, no animated marquee.

---

## Logo Treatment

**Wordmark only — "Perpetual Core" in Newsreader regular.**

Remove the "PC" gradient circle entirely. Replace with the text "Perpetual Core" set in Newsreader at `text-lg font-normal tracking-tight`. The display serif doing nav-level work is itself a brand statement — it says "we have taste." No icon, no monogram, no geometric mark.

Rationale: geometric "PC" circles read as logo-placeholder (which it is). A wordmark in Newsreader at small size is immediately distinctive among competitors because every other AI studio is using geometric marks or letter-stacks in sans-serif. The serif wordmark is the mark. Clean, repeatable, looks correct at 16px or 200px.

In footer: same treatment, same font, slightly smaller. No gradient fill, no shadow.

---

## Card Design (Product Strip)

Cards are NOT standard shadcn `<Card>` defaults. They use:
- `bg-white border border-border/60` on parchment background
- No rounded-xl — use `rounded-sm` (4px) for editorial crispness
- No colored icon tile backgrounds — replace with a simple `text-muted-foreground` number or small typographic initial
- Product name as `text-sm uppercase tracking-widest font-medium` Inter
- Headline in Newsreader `text-xl font-normal leading-snug`
- Body in Inter `text-sm leading-relaxed text-muted-foreground`
- Hover: `border-foreground/20 shadow-sm` — no color change, no scale transform
- CTA: plain text link `text-sm font-medium text-foreground hover:text-primary` with arrow, no button

---

## Engine Commitment Block

The only section with a dark background: near-black `#1A1714` (mapped to CSS variable `--surface-dark`). White Newsreader headline. White/warm-gray body. The darkness signals irreversibility — this isn't marketing, it's the structural commitment. The dollar amounts ($7,500 to $25,000+) appear in a light separator row, possibly a horizontal stat trio.

---

## What We Are Explicitly NOT Doing

- No animated gradient orbs or blobs
- No gradient text on any H2 or body (only allowed: H1 can remain plain, no gradient even there in this system — the H1 in Newsreader light is already beautiful without it)
- No floating decorative SVG illustrations
- No hero photography
- No multi-color icon tile system (the current orange→red / blue→cyan / emerald tiles are retired)
- No `font-black` or `font-extrabold` anywhere — 700 is the ceiling
- No animated counters or live badges ("11 models," "15 advisors")
- No carousel or marquee animations
- No `hover:scale-110` micro-interactions — hover states are color/border changes only
- No section gradient slabs (the current purple→blue CTA slabs go away)
- No `backdrop-blur-2xl` hero overlays — navbar blur is fine at `backdrop-blur-md`
- No outline buttons on dark backgrounds

---

*This document governs all visual decisions in redesign-v2. Conflicts → defer to this document over UI_AUDIT.md.*
