# Perpetual Core — UI / Visual Audit (Studio Repositioning)

**Status:** Draft v0.1 — 2026-05-10
**Frame:** preserve, sharpen, recompose. No new visual system.
**Verdict on the brief's "preserve" call:** **Correct, with one caveat.** The token system, type, and component library are good enough to carry a studio frame. What needs to change is *density, gradient discipline, and section choreography* — not palette or type. (Strong recommendation.)

---

## 1. Visual identity — what we actually have

**Palette (globals.css):**
- `--primary` 256 67% 55% — blue-violet (HSL ~ #6E3DD9). Dark mode shifts to a brighter 256 80% 68%.
- Background light: `40 20% 98%` — a warm off-white (slightly cream, not pure white). This is the most "studio-friendly" thing in the system; preserve aggressively.
- Background dark: `260 30% 6%` — deep violet-near-black. Reads luxe, not gamer.
- Accent gradients used everywhere: primary → purple-600 → blue-500. Often extended into pink/cyan/emerald per-section (BentoFeatures, UseCases, ExecSuiteShowcase). This is the loudest signal of "SaaS template" right now.
- Glow tokens: `--glow-primary` and `--shadow-colored` define soft violet halos. Light usage is fine; current pages over-apply them.

**Type:** Inter (next/font/google), single family. Type scale via `globals.css` utilities (`typo-page-title`, `typo-section-title`, etc.) plus heavy reliance on `font-black tracking-tighter` for marketing headlines — text-5xl through text-8xl. No serif pairing. No editorial display face. **This is the single biggest sharpening lever** (see §5).

**Logo / wordmark:** Placeholder. Current "logo" is a violet-gradient rounded square containing the text "AI" in font-black — both in `Navbar.tsx` and `Footer.tsx`. The wordmark is plain bold Inter "Perpetual Core". This is a tell that a studio brand should clean up; a logo on a studio site that says "AI" in a square is, frankly, embarrassing for the positioning. **Confidence: high** that this needs a fix; **low** that it should be done in this scope (could be deferred to a later visual pass).

**Photography:** None. Founder section has an "LDC" gradient placeholder explicitly labeled "Founder Photo." A real founder photo is non-negotiable for a studio frame.

**Iconography:** lucide-react throughout. Consistent. Keep.

**Animation:** framer-motion `whileInView` fades + y-translates on every section, plus `animate-[drift_…]` orbs in hero, marquee in SocialProofBanner, AnimatedCounter, gradient-shift on FinalCTA, animate-pulse green dots, and one `hover:scale-110` on every icon tile. Density is high. The motion language is "consumer SaaS landing page." Studio sites typically use 60-70% less motion.

**Density:** High. Most sections are 1024-1280px wide max-content with cards, gradients, badges, and CTAs stacked. Whitespace breathing room is moderate, not editorial.

---

## 2. Hero pattern — current & recommendation

**Current (`HeroSection.tsx`):** Centered, 90vh, two drifting gradient orbs (primary violet + blue) blurred 120px, a "live" green-pulse badge ("The AI Operating System"), 8xl tracking-tighter headline split into two gradient lines, supporting copy enumerating "11 models, 15 AI executives, 10 industry solutions," two CTAs (Start Free Trial / See How It Works) and a row of colored model pills (GPT-4o, Claude, Gemini, DeepSeek, o1, +6 more — each in its own brand color, "auto-routed").

**The brief is right — the model-pill pattern is product-marketing, not studio.** It frames the company as a model-routing layer. A studio sells judgment, not features. **Strong recommendation: kill the model pills on the studio homepage.** They move to `/products/platform`, where they are correct.

**Recommended hero treatment for new `/` (studio homepage):**
- **Text-led, single column, left-aligned (not centered).** Centered hero is consumer SaaS; left-aligned is editorial/studio.
- One eyebrow line (small caps or italic): "An AI-first studio."
- Headline at ~text-6xl (not 8xl) — shorter, less black, tracking-tight not tracking-tighter. Studios speak quietly.
- One paragraph of body, two CTAs: primary "See engagements", secondary "Read methodology".
- **One quiet visual element to the right** (or below on mobile) — strong preference: a static, minimal **registry diagram** showing the 8 registries as labeled nodes with thin connecting lines. Monochrome, primary-tinted, no gradients. This is the Engine in one image and it doubles as proof-of-thinking.
- Drop the orbs and the green-pulse badge. Keep maybe one very subtle background tint.

Confidence: **strong** on left-aligned + text-led + drop model pills. **Preference, lower confidence** on the registry diagram specifically — could also be a process diagram (Audit → Install → Operate → Compound), or just nothing.

---

## 3. Section components — what to do with each

| Component | File | Verdict |
|---|---|---|
| `HeroSection` | `components/landing/HeroSection.tsx` | **Move to /products/platform** + build a new quiet hero for `/` (don't try to retrofit this one). |
| `SocialProofBanner` | `components/landing/SocialProofBanner.tsx` | **Retire on /.** Counters of "11 models / 15 advisors / 72 features" are anti-studio. The marquee of industries can be **adapted** into a quiet "Who we serve" strip on `/studio` (no animation, no pills — a 2-column list). |
| `BentoFeatures` | `components/landing/BentoFeatures.tsx` | **Move to /products/platform.** The four-pillar grid (Command Center / Executives / Industry / Growth) is platform feature marketing. |
| `InteractiveChatDemo` | `components/landing/InteractiveChatDemo.tsx` | **Move to /products/platform.** Strong asset — keep as-is for that page. |
| `ComparisonTable` | `components/landing/ComparisonTable.tsx` | Misnamed — this is a Day 1 → Month 3 timeline. **Adapt for /studio/process** (rename the file, keep the structure; the alternating-side timeline is genuinely good). |
| `ExecSuiteShowcase` | `components/landing/ExecSuiteShowcase.tsx` | **Move to /products/platform.** Don't put 15 AI executives on the studio homepage. |
| `UseCases` | `components/landing/UseCases.tsx` | **Adapt for /studio "Who we serve"** — but rewrite the 6 audiences to fit studio buyers (PE Operating Partner, Mission-driven CEO, etc.). The 3-col card grid with gradient icons is fine if gradients are dialed back to mono-violet. |
| `SecuritySection` | `components/landing/SecuritySection.tsx` | **Move to /products/platform** (and keep the green CTA banner only there; it's loud for a studio). |
| `TrustBadges` | `components/landing/TrustBadges.tsx` | **Move to /products/platform.** SOC 2 Ready / SSO / 99.9% uptime are platform claims. Studio site shouldn't lean on them. |
| `HowItWorks` | `components/landing/HowItWorks.tsx` | **Adapt for /studio/process** — replace "Sign Up / Connect / Transform" with the engagement phases (Audit / Install / Operate / Compound). Same component shape. |
| `PricingTeaser` | `components/landing/PricingTeaser.tsx` | **Adapt for /pricing** as the SaaS-tier section; rebuild `/pricing` so engagements ($75K floor) come *first* and SaaS tiers come second. |
| `FounderStory` | `components/landing/FounderStory.tsx` | **Adapt for /about.** This is the strongest studio-flavored component already — the "Powered by Purpose" framing reads more studio than product. Replace the LDC placeholder with a real photo. |
| `FinalCTA` | `components/landing/FinalCTA.tsx` | **Keep on / and most pages**, but desaturate the gradient (currently primary→purple→blue at full vibrancy). Studios end pages quietly. Or build a v2 that's a left-aligned "Let's talk" block instead of a centered gradient slab. |
| `Navbar` | `components/landing/Navbar.tsx` | **Keep on /, restructure IA.** New nav: Studio / Products (dropdown) / Engagements / About / Pricing. Drop "Solutions / Features / Enterprise" structure. |
| `Footer` | `components/landing/Footer.tsx` | **Keep, restructure links** to match new IA. |

---

## 4. Reusable component inventory (what we lean on)

**shadcn primitives (`components/ui/`):** button, card, sheet, dialog, dropdown-menu, popover, tabs, table, accordion, badge, avatar, separator, skeleton, scroll-area, tooltip, alert, progress, breadcrumb, command. Plus extended pieces: `animated-card`, `animated-background`, `stat-card`, `empty-state`, `error-boundary`, `dashboard-header`, `page-wrapper`, `filter-pills`. All useful, all consistent. **No need to install anything new.**

**Landing-section building blocks (in `components/landing/`):**
- Card-grid pattern (BentoFeatures, UseCases, ExecSuiteShowcase) — copy-paste shape for `/studio` "Engagement types," `/products`, `/studio/case-studies`.
- Alternating timeline (ComparisonTable) — reuse for `/studio/process` and `/studio/methodology`.
- 3-step horizontal flow with connecting dashed line (HowItWorks) — reuse for `/studio/methodology` (Learn → Wire → Automate → Scale becomes a 4-step variant).
- Pricing card 3-column (PricingTeaser) — reuse for `/pricing` SaaS tiers.
- Dark CTA slab (ExecSuiteShowcase bottom + SecuritySection green slab) — reuse pattern for Engagement CTA on `/studio`.
- Founder card (FounderStory) — pattern for `/about` team section.

**Layout-level:** `Navbar`, `Footer`, `PublicMobileNav` (`components/layout/`).

**Forms:** `EnterpriseDemoBookingForm` (referenced in `enterprise-demo/page.tsx`). Useful for `/studio/engagements` "Book intake" CTA.

---

## 5. Studio-frame visual sharpening (3-5 specific calibrations)

1. **Cap gradient text to one per page, on the H1 only.** Currently every section header has a tri-color bg-clip-text gradient (`from-foreground via-primary to-purple-600`). On a studio site that reads as default-template. Strip gradient text from all section H2s; use plain `text-foreground` with maybe one accent word in `text-primary`. **Strong.**

2. **Halve the icon-tile gradient density.** Every card has a 12×12 rounded-xl icon tile in a unique 2-color gradient (orange→red, blue→cyan, emerald→green, etc). Six gradients on one page is theme-park. **Pick one tonal family** — primary violet at 3 saturations — and apply across all icon tiles. Keep the lucide icons. **Strong.**

3. **Drop the animated background orbs in the hero, and the marquee in SocialProofBanner.** Both are correct for a $49/mo SaaS, wrong for a $75K engagement studio. Replace with stillness. **Strong.**

4. **Add an editorial weight via type, not via new fonts.** Inter is fine. Use it differently: ditch `font-black tracking-tighter` for marketing H1/H2; use `font-semibold tracking-tight` and increase line-height. Add italics for eyebrow lines. The same fontfile reads completely different at 600 vs 900 weight. **Strong.**

5. **Increase whitespace at section boundaries.** Most sections are `py-20 sm:py-28`. Studio editorial layouts breathe at `py-32 sm:py-40` or more, with narrower content columns (max-w-3xl, not max-w-6xl) on text-led sections like methodology, about, case studies. **Preference, medium confidence** — depends on copy density.

(Skipping: changing palette, adding a serif, adding a logo. Out of scope per brief.)

---

## 6. What's broken or off-brand right now (regardless of repositioning)

- **Inconsistent navbars across pages.** `Navbar.tsx` (rich, dropdowns, sticky-blur) is on `/`. `consulting/page.tsx` and `solutions/healthcare/page.tsx` each ship their own bespoke `<header>` with different link sets, different sticky behavior, no dropdowns. Mobile uses `PublicMobileNav` on some, `Sheet` on others. **Unify on the canonical `Navbar` everywhere public-facing.** High confidence.
- **Logo is a placeholder** ("AI" in a violet square). Already noted. Either commission, or ship a wordmark-only treatment in a Cormorant or similar studio-friendly serif as a stopgap — but per brief, defer.
- **Founder photo is a placeholder.** "LDC" gradient block is a tell. Lorenzo, ship a real photo before the studio launch.
- **`viewport.userScalable: false`** in `app/layout.tsx`. This is an **accessibility violation** (WCAG 1.4.4). Remove. High confidence.
- **`enterprise-demo/page.tsx` uses raw slate colors** (`bg-slate-900`, `text-slate-300`) instead of the design tokens. It's the most off-brand page in the repo — looks like a different product. Refactor to use the token system.
- **`ExecSuiteShowcase` bottom slab also hardcodes `from-slate-900 to-slate-800`** outside the token system. Same fix.
- **Footer copyright says "© 2025"** in 2026. Update.
- **`solutions/healthcare/page.tsx`** advertises "100% HIPAA Compliant" in the hero. Per brief, no compliance claims that aren't real. Audit all `/solutions/*` pages for unverifiable badges (HIPAA / SOC 2 Type II / "certified") — confirm each is actually true; if not, soften copy.
- **Multiple CTAs on every section** (3-4 "Get Started Free" buttons per page). Studio sites have one CTA per page. Consolidate.

---

## 7. Build approach per new page

| Page | Approach | Notes |
|---|---|---|
| `/` | **Build new from primitives + reuse Navbar/Footer.** | New quiet hero. Compose 4-5 sections: hero, Studio (1-line + link), Products (3-card row, adapted from BentoFeatures shape, mono-violet), Methodology teaser (adapted HowItWorks), Engagement CTA (adapted FinalCTA, desaturated). |
| `/studio` | **Compose from existing sections.** | Hero + adapted UseCases ("Who we serve") + adapted HowItWorks (4-step Learn/Wire/Automate/Scale teaser) + Engagement CTA. |
| `/studio/engagements` | **Reuse `consulting/page.tsx` as scaffold** + restructure. | Already organized as "PART 1/2/3" cards. Rewrite copy to engagement framing, keep the card structure, add the $75K floor + range + retainer band, add intake form. Retire `/consulting` route (redirect). |
| `/studio/methodology` | **Compose from existing sections.** | Hero + alternating timeline (adapted ComparisonTable) showing the AI-First Framework + skills library section + Engine commitment block (10-15% to IHA). |
| `/studio/process` | **Compose from existing sections.** | Adapted HowItWorks (4-step) + adapted ComparisonTable (90/180-day timeline). |
| `/studio/case-studies` | **Build new from primitives.** | 3-col card grid (lift from UseCases shape) of *abstracted* case studies — no client names per brief lock. Each card is "Sector, problem, install, outcome." Maybe 6 cards. |
| `/products` | **Build new from primitives.** | Index page: 5 product cards (Platform, Sage, Atlas, Sentinel, Codex) using the BentoFeatures-shape grid but mono-violet. Each links to its detail page. |
| `/products/platform` | **Reuse current `/` page as scaffold.** | This is exactly where today's homepage content belongs. Keep HeroSection, BentoFeatures, InteractiveChatDemo, ExecSuiteShowcase, SecuritySection, TrustBadges, PricingTeaser. Drop FounderStory (moves to /about). |
| `/products/sage` | **Build new from primitives.** | Sage PRD v0.3 has its own UI direction; this site page is a marketing landing. Hero + features + pricing (15% to IHA highlight) + CTA. Lift the PricingTeaser shape. |
| `/products/atlas` | **Build new from primitives.** | Per brand architecture: "Coming soon — for funds and OPs" treatment until first install. Quiet page. Hero + 3-paragraph explainer + intake form. |
| `/products/sentinel` | **Build new, link out.** | Lives at sentinel.perpetualcore.com. The on-site `/products/sentinel` is a minimal landing card that links out. |
| `/products/codex` | **Build new, minimal.** | TBD per brief — keep it "Coming soon" until name confirmed. |
| `/about` | **Reuse FounderStory + new sections.** | FounderStory is the centerpiece. Add an "Ecosystem" section (IHA, Uplift, DeepFutures relationships) and a "Engine commitment" block. Real founder photo required. |
| `/pricing` | **Reuse current `/pricing/page.tsx` as scaffold + restructure.** | Currently leads with SaaS tiers. Restructure: lead with Engagements ($75K floor → range → retainer), then SaaS tiers below. License + Embedded = "Contact us." Keep the existing card components. |
| `/engine` | **Build new from primitives.** | The Perpetual Engine page — registries (8-node diagram from hero, expanded), AI-First Framework, skills library, IHA commitment. This is a manifesto page; should feel editorial. Minimal cards, more long-form prose, max-w-3xl, single column. |

---

## 8. Confidence summary

| Recommendation | Confidence |
|---|---|
| Preserve palette + type tokens | Strong |
| Replace homepage hero (drop model pills, drop orbs, left-align, text-led) | Strong |
| Move SaaS feature sections to /products/platform | Strong |
| Move ComparisonTable + HowItWorks shapes to /studio | Strong |
| Cap gradients (one tonal family for icons, gradient text on H1 only) | Strong |
| Unify navbars / fix viewport accessibility / replace placeholders | Strong |
| Editorial type weight shift (font-black → font-semibold) | Strong |
| Use registry-graph illustration as hero visual | Preference, medium |
| Increase whitespace to py-32+ on text-led pages | Preference, medium |
| Logo replacement | Strong on need, defer per brief |

---

*This audit operates strictly within the "preserve, sharpen, recompose" frame. No new visual systems proposed. No code written. Hand off to wave-3 for copy + IA execution.*
