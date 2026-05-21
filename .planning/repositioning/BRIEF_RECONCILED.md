# Repositioning Brief — Reconciled (Working Draft)

**Source:** `~/Downloads/perpetual_core_studio_repositioning_brief.docx`
**Locked decisions captured:** 2026-05-10
**Reconciliation owner:** Wave-2 brand strategist

---

## A. Locked from the brief — DO NOT re-derive

### A1. Strategic frame
- Perpetual Core repositions from $49/mo SaaS hero → studio site with product portfolio
- Five offerings under the studio: Engagements (lead), Framework License (hold), Embedded/White-Label (institutional), Products portfolio (evidence), Revenue-Share (off-site)
- Engagements are the money. Products are the credibility layer. Perpetual Engine becomes a closing weapon at engagement scale.

### A2. Pricing — exact strings
- Engagement floor: **"Engagements start at $75,000"** (not "from $75K", not a range)
- Retainer: **"$5,000–$15,000/month, scoped to engagement"**
- Platform tiers: **Free / $49 Starter / $99 Pro** (unchanged)
- License + Embedded: **"Contact us"** only — no published price
- Revenue-share: **off-site entirely**
- Engagement Engine line: **"10% of every engagement — $7,500 to $25,000+ per client — funds the Institute for Human Advancement"**

### A3. Top-level navigation
```
Studio | Products | Industries | Pricing | About    [Sign In]  [Start Engagement]
```
- Studio dropdown: Engagements / Methodology / Process / Case Studies (abstracted)
- Products dropdown: Platform / [+ all products from BRAND_ARCHITECTURE.md §1]
- Industries dropdown: existing solutions/* pages
- Pricing: unified
- About: founder, mission, IHA, Perpetual Engine

### A4. Pages to create (per brief)
- `/` — new homepage
- `/studio` — studio overview
- `/studio/engagements` — engagement detail
- `/studio/methodology` — AI-First Framework
- `/studio/process` — engagement arc
- `/studio/case-studies` — abstracted (3 placeholder slots)
- `/products` — portfolio overview
- `/products/platform` — current homepage content, repurposed
- `/about` — founder, mission, Perpetual Engine, IHA
- `/pricing` — unified

**Added by reconciliation (not in brief):**
- `/engine` — Perpetual Engine (substrate + methodology + impact, bundled — per locked decision)
- `/products/atlas` — Atlas product page
- `/products/sentinel` — Sentinel product page (links to live sentinel.perpetualcore.com)
- `/products/sage` — Sage relational SaaS (links to sage.perpetualcore.com)
- `/products/vellum` — Vellum (institutional memory, renamed from brief's "Sage" knowledge-synthesis tool — pending Lorenzo confirmation per BRAND_ARCHITECTURE §8 Q1)
- `/products/rfp-engine` — RFP Engine (live, repointed under /products/)
- `/products/rfp-sentry` — RFP Sentry stub (sister product, pending §5.3 clarification)
- ~~`/products/background-check`~~ — DROPPED. Folded as Sentinel Quick Vet tier per B4.

### A5. Pages to retire/merge
- Current homepage hero → becomes `/products/platform` hero
- "Watch It Learn" / Day 1 → Month 3 — DELETE from `/`
- "Built for Every Industry" carousel — MOVE to `/products/platform`
- "Built for Everyone" personas grid — DELETE entirely
- "Stop juggling tools" CTA — DELETE from `/`
- "11 Models. One Price." comparison — MOVE to `/products/platform`
- `/consulting` (Transformation Stack) — merge into `/studio/engagements`
- `/consultation` (Guided Implementation) — merge into `/studio/process`
- `/enterprise-demo` — keep, rename "Enterprise Engagements"

### A6. Pages to preserve with light refresh
- All `/solutions/*` industry pages — keep, add top banner linking to `/studio/engagements`
- `/agents`, `/features/intelligence` — keep as platform feature pages
- Legal pages — preserve as-is

### A7. Visual system
- Preserve palette, typography, logo, "AI Perpetual Core" wordmark
- Hero animation can be simplified — abstract/restrained > current "11 Models auto-routing" animation
- Industry icons reuse existing assets

### A8. Correctness checks (BLOCKING for ship)
- [ ] Every "Uplift" reference re: 10% giving corrected to "Institute for Human Advancement (IHA)"
- [ ] No published case studies name real clients (all abstracted: "a UN agency", "a community college foundation", etc.)
- [ ] Engagement floor uses exact string "Engagements start at $75,000"
- [ ] Platform positioned as a product, not the business; homepage hero leads with engagements
- [ ] License tier "Contact us" only — no published price
- [ ] Perpetual Engine line uses concrete dollar amounts ($7,500–$25,000+ per client)
- [ ] All retired sections actually deleted from `/`, not just hidden
- [ ] Mobile responsiveness preserved
- [ ] IHA name = "Institute for Human Advancement" (not "Human Development", not "Uplift")

---

## B. Wave-2 brand strategist — LOCKED decisions (2026-05-10)

All locks ratified in `BRAND_ARCHITECTURE.md` v1.0. This section retains the original framing for traceability; the calls below are final.

### B1. Sage split — LOCKED ✓
Coach Sage stays at sage.perpetualcore.com (relational coach + chief of staff, B2C, 15% to IHA per PRD v0.3). Knowledge-synthesis product is renamed **Vellum** ("Vellum by Perpetual Core"). Codex withdrawn — collides with OpenAI Codex (active product line, GPT-5.3-Codex shipped 2026). Vellum.ai exists as an LLM-ops platform but operates in a different category (engineer dev-tooling vs. mission-driven operator memory); collision is acceptable when always qualified. Lorenzo confirmation requested per BRAND_ARCHITECTURE §8 Q1.

### B2. Atlas + Sentinel placement — LOCKED ✓
Both first-class products. Sentinel: minimal `/products/sentinel` page links out to live sentinel.perpetualcore.com. Atlas: by-invitation card with "Request introduction" CTA. No `atlas.perpetualcore.com` claim until first lighthouse install. Atlas + Sentinel + Sage are the 3-card homepage portfolio strip.

### B3. RFP — LOCKED with conditional ✓
Two products under "RFP" umbrella in nav, not one product with two SKUs. RFP Engine is the response/drafting side (live). RFP Sentry is the working name for the second product. Three-scenario plan in BRAND_ARCHITECTURE §5.3 — Lorenzo confirms which. Default if no answer: ship Vellum + RFP Engine pages first; RFP Sentry page is a stub.

### B4. Background Check — LOCKED ✓
**Dropped.** No standalone product. Folded as Sentinel Quick Vet tier ($49/mo). Not on studio site as its own card. Brief language corrected.

### B5. Kenya / international development — LOCKED ✓
**No dedicated `/solutions/international-development` page in v1.** Surface Kenya/East Africa work in two places: (a) primary — one of three abstracted slots on `/studio/case-studies` (PEPFAR + IRB + offline-first as the proof-by-constraint); (b) secondary — one paragraph on `/about` ecosystem section. Existing `/solutions/non-profits` carries an abstracted line if needed. Build the dedicated vertical page in v1.1 if post-launch demand warrants.

### B6. Perpetual Engine surface — LOCKED ✓
Standalone `/engine` page. 6-section editorial manifesto, single column max-w-3xl, prose-led, built new from primitives. Sections: Hero → 8 Registries (with node-diagram visual) → AI-First Framework (4-step) → Skills library → Engine commitment (10–15% to IHA, the differentiator) → CTA. Full spec in BRAND_ARCHITECTURE §5.5.

### B7. Giving rate — LOCKED ✓
Mixed-rate intentional and surfaced, not hidden. 10% engagements + most products / 15% Sage SaaS. Documented on `/engine` and `/about`. Per-engagement dollar amounts ($7,500–$25,000+) appear on `/engine` and `/studio/engagements`.

### B8. Three positioning angles — LOCKED ✓
Distilled from COMPETITIVE.md §7. Verbatim in BRAND_ARCHITECTURE §6. Used across `/`, `/studio`, `/engine`, `/about`. Antipatterns (transformation-partner boilerplate, logo-walls, AI-everything overclaims) explicitly forbidden — see COMPETITIVE.md §6.

### B9. Studio portfolio order — LOCKED ✓
Homepage 3-card strip: **Sentinel, Atlas, Sage** (live + flagship + human). `/products` overview order: **Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform.** Three on homepage, seven on /products, never more.

---

## C. Build sequence (refined from brief Section 10)

### Session 1 — Foundations + Engine surface (3-4 hours)
- Update top-level navigation (locked from B1–B4)
- Build new `/` per wave-3 copy
- Build `/studio/engagements` per wave-3 copy
- Build `/engine` (NEW — not in brief) per wave-3 copy
- Build `/about` (basic version)
- Build unified `/pricing` page
- Update footer to add "Studio" column

### Session 2 — Studio depth + Products (3 hours)
- `/studio` overview
- `/studio/methodology` per wave-3 copy
- `/studio/process`
- `/studio/case-studies` (3 abstracted slots — Kenya may seed one)
- `/products` portfolio overview
- `/products/platform` (move current homepage content)

### Session 3 — Product pages + cleanup (2-3 hours)
- `/products/atlas` (by-invitation card per B2)
- `/products/sentinel` (minimal landing, links out to live sentinel.perpetualcore.com)
- `/products/sage` (Sage SaaS landing per SAGE_LANDING_COPY.md v0.2; links to sage.perpetualcore.com when live)
- `/products/vellum` (per locked name in B1; "Vellum by Perpetual Core" qualifier in copy)
- `/products/rfp-engine` (existing /rfp content, repointed)
- `/products/rfp-sentry` (stub until Lorenzo clarifies §5.3)
- Background Check NOT BUILT (per B4 — dropped)
- Top banners on `/solutions/*` linking to `/studio/engagements`
- Retire/delete sections per A5; redirect /consulting → /studio/engagements; redirect /consultation → /studio/process
- Meta descriptions site-wide
- Link audit (canonical Footer component to prevent year-drift; bulk fix the 17 stale "© 2024" footers per AGENT_LOG side-fix notes)
- Mobile QA

---

*Strategist agent: please replace section B with locked decisions; this becomes the live build doc going into session 1.*
