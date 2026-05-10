# Perpetual Core — Repositioning Inventory

**Compiled:** 2026-05-10 by Inventory agent (read-only sweep).
**Purpose:** Ground-truth product map for the wave-2 brand strategist. No decisions made here beyond the recommendations section.

---

## 1. Executive Summary

1. **Sentinel is the only Perpetual Core product currently LIVE in code with marketing site, app shell, pricing, and four audience pages.** Everything else is either planning-stage (Atlas), older platform copy (current perpetualcore.com), or PRD/copy locked but unbuilt (Sage SaaS).
2. **Atlas is fully GSD-planned** (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, 8 phases, 109 v1 reqs) but **NOT BUILT** — no `app/`, no marketing surface, only `atlas_master_spec.docx` + `.txt` and a `.planning/` tree.
3. **Sage has TWO conflicting definitions in this repo:**
   - `docs/SAGE_SAAS_PRD.md` v0.3 + `docs/SAGE_LANDING_COPY.md` v0.2 → **relational coach + chief of staff** (B2C, persona-first, voice/Telegram, 15% to IHA).
   - The repositioning brief that triggered this work apparently treats Sage as a knowledge-synthesis tool. **The codebase reality is the relational coach.** The brand strategist's BRAND_ARCHITECTURE v0.1 already resolved this by splitting them: keep "Sage" for relational coach and propose "Codex" for the synthesis tool.
4. **There is one RFP product, not two.** Exhaustive search (`find ~ -maxdepth 4 -type d -iname '*rfp*'`) returns only the `(rfp-marketing)` route group inside `perpetual-core`. No standalone RFP repo exists. Lorenzo's mental model of "another RFP app" likely refers to the marketing site vs. the actual app routes (`/orgs/new?product=rfp-engine`) inside the same codebase — they are the **same product** ("RFP Engine") with marketing + app under one roof.
5. **No "Background Check" project exists anywhere on disk.** It is brief-side language only. Functionally, the closest live thing is **Sentinel's Quick Vet tier** ($49/mo, 5 reports, "Vet anyone in 90 seconds").
6. **The current perpetualcore.com homepage positions as a SaaS product** ("The AI Operating System For How You Actually Work") — directly conflicting with the studio repositioning. 35+ app routes exist, including consulting, executive-suite, agents (with named "AI CEO/CFO/COO/CMO" personas), industries (10 verticals), partners, marketplace, lead-magnet, ROI calculator. This is a *full SaaS product site*, not a studio site.
7. **Herald is real but lives at a non-perpetualcore subdomain.** `~/sage-command-center` is Lorenzo's personal command center, deployed at `sageai.lorenzodc.com` — NOT `sage.perpetualcore.com`. The brand architecture says Herald *should* migrate to `herald.perpetualcore.com`. Currently the `sage.perpetualcore.com` subdomain is unclaimed in code.
8. **theiha.org is a separate Next.js project** with first-class linking to Perpetual Core. Its `/impact` page already names Perpetual Core as an entity; case-studies prose already says "Perpetual Core (AI Infrastructure) — The AI-powered operating infrastructure that runs IHA Advance — licensed as SaaS to institutional partners." The IHA→Perpetual Core relationship is already on the public web in IHA's voice.
9. **The four "agents in production" Lorenzo has internally (Sentinel/Support/Content/Ops)** are *not visible* as four discrete products in any repo. Only Sentinel has a customer-facing surface. The other three are internal Hermes/Herald deployments behind login.
10. **Naming overlap risk:** the Atlas plan refers to "Herald" both as agent infrastructure (formerly Sage) and as Lorenzo's personal command center. The Sage PRD calls the runtime "Hermes Agent runtime." The brand architecture v0.1 already starts disentangling this, but the strategist needs to lock terminology.

---

## 2. Per-Product Inventory

### 2.1 perpetual-core repo
**Path:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/`
**Domain:** `perpetualcore.com` (production homepage)
**Status:** LIVE — full SaaS product site, not a studio site.

**Homepage (`app/page.tsx`):**
- Hero: badge "The AI Operating System" / H1 "The AI Operating System For How You Actually Work."
- Section stack: HeroSection → SocialProofBanner → BentoFeatures → InteractiveChatDemo → ComparisonTable → ExecSuiteShowcase → UseCases → SecuritySection → TrustBadges → HowItWorks → FounderStory → PricingTeaser → FinalCTA → Footer.
- Model pills: GPT-4o, Claude, Gemini, DeepSeek, o1, +6 more.

**Top-level routes (`app/`):**
`(auth)`, `(dashboard)`, `(rfp-marketing)`, `admin`, `agents`, `ai-readiness-quiz`, `api`, `api-pricing`, `auth`, `consultation`, `consulting`, `contact-sales`, `cookies`, `dashboard`, `developers`, `enterprise-demo`, `executive-suite`, `features`, `industries`, `invite`, `lead-magnet`, `login`, `marketplace`, `orgs`, `partners`, `presentation`, `pricing`, `privacy`, `productivity-guide`, `professional-services`, `roi-calculator`, `signup`, `solutions`, `status`, `terms`, `test-documents`, `test-upload`.

**Pricing (`app/pricing/page.tsx`):** Free / Starter $49 / Pro $99 / (additional tiers below in file). This matches the brief's "Free / $49 / $99" platform pricing.

**Industries (`app/solutions/`):** accountants, agencies, churches, consulting, education, financial-advisors, healthcare, it-services, law-firms, non-profits, real-estate, sales (12 vertical pages).

**Agents (`app/agents/page.tsx`):** Names AI CEO, AI CFO, AI COO, AI CMO, AI HR Director, AI Operations Manager, AI Sales Manager, AI Grant Writer, AI Pastor/Ministry Assistant, AI Youth Coordinator, AI Community Programs Manager, AI Donor Relations, AI Case Manager, AI Workforce Coordinator, AI Education Coordinator, AI Program Director, AI Email Assistant, AI Calendar Manager (and more). These are *positioning surfaces inside the SaaS*, not separate products.

**Sage docs in this repo:**
- `docs/SAGE_LANDING_COPY.md` v0.2 (May 9 2026) — landing copy locked: "The coach and chief of staff who never forgets." Trust line: "14-day Pro trial. No card to start. 15% of every dollar funds the Institute for Human Advancement (theiha.org)."
- `docs/SAGE_SAAS_PRD.md` v0.3 (May 10 2026) — confirms relational positioning, pilot personas (Portfolio Founder / Coaching Client / Mission Leader), built on Hermes runtime, owned-perpetual-asset (no exit/VC), 15% to IHA.

### 2.2 Sentinel
**Path:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/sentinel/`
**Domain:** `sentinel.perpetualcore.com` (per BRIEF.md)
**Status:** LIVE — marketing site + app shell built, full BRIEF.md v2 (2026-05-09) with Phase 1+2 spec.

**Hero (`components/marketing/Hero.tsx`):**
- Eyebrow: "Due Diligence · 90 Seconds · From $49 · A Perpetual Core product"
- H1: "Vet anyone. *In ninety seconds.*"
- Sub: "The same primary-record checks Kroll and K2 deliver in two weeks — done by an AI analyst in real time, for the price of a software subscription. Built for solo operators, small teams, family offices, and the funders who back SMEs and nonprofits."
- CTAs: "Run a free Quick Vet" → `/run`; "See a real sample" → `#example`.

**Pricing tiers (`components/marketing/Tiers.tsx`):**
| # | Name | Output | Price | Reports |
|---|---|---|---|---|
| 01 | Quick Vet — The One-Pager | 1 page | $49/mo | 5 |
| 02 | Standard DD — The Working Brief | 4–8 pages | $399/mo | 25 |
| 03 | Full Institutional — The Dossier | 20–60 pages | $1,499/mo | 100 |

**Audience subpages (`app/for/[audience]/`):** dynamic — `/for/solos`, `/for/small-teams`, `/for/funds`, `/for/nonprofits` (per BRIEF intent, generated from `[audience]` route).

**App shell (`app/(app)/`):** `dashboard`, `engagements`, `settings`. Auth wired. Engagement runs are spec'd to Inngest with Supabase realtime streaming via `report_chunks`.

**Stack:** Next.js 16, Tailwind, shadcn/ui, Supabase (pgvector), Stripe, Anthropic API + MCP servers, Inngest, Resend, Sentry, Upstash. Single repo, single Vercel project, single Supabase project per BRIEF §2.

### 2.3 Atlas
**Path:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/atlas/`
**Status:** PLANNING ONLY — no `app/`, no `package.json`, no built site. Master spec docx + txt at root; `.planning/` tree fully populated.

**Top-level files:** `atlas_master_spec.docx`, `atlas_master_spec.txt`, `.planning/{PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json, phases/, research/}`.

**Positioning (from PROJECT.md):**
- "Atlas is the AI-native COO for fund-backed companies — a flagship product in the Perpetual Core portfolio (sister to Sentinel for vetting/DD; running on Herald-class agent infrastructure)."
- Buyer: PE Operating Partner (not portco CEO).
- Install timeframe: 6–10 weeks.
- Lead-gen offer: Atlas Discovery audit, $5–15K (DISC-02).
- Engagement frame: matches the studio's $75K floor logic — Atlas is the productized version of the install motion.

**Phases (8):** GTM → Discovery audit → Substrate (8 registries + connectors) → Sales/Finance/Marketing-CS departments → Evals & observability → Fund-level reporting → Skills library → (closeout/handoff).

**Five-tier buyer matrix:** PE / growth equity / late-stage VC / family office / search-public.

**Sister-product references in plan:** explicit links to Sentinel and "Perpetual Core brand expression" (GTM-04).

### 2.4 IHA Website
**Path:** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/iha-website/`
**Domain:** `theiha.org` (confirmed across `layout.tsx`, `sitemap.ts`, `robots.ts`, `og-image.tsx`).
**Status:** LIVE Next.js 14+ site, src/ structure, full marketing + admin + impact pages.

**Top-level routes (`src/app/`):** `about`, `accessibility`, `admin`, `advance`, `api`, `auth`, `case-studies`, `contact`, `donate`, `health`, `impact`, `kenya`, `kenya-summit`, `nairobi-conference`, `partnership`, `privacy`, `research`, `work`.

**Work areas (`src/app/work/`):** ai-education, education, enterprise, healthcare, healthcare-innovation, leadership-community, leadership-development, sustainable-communities, venture-studios, workforce-development.

**Homepage (`src/app/page.tsx`):** Multi-section — Hero (3-layer gradient + Unsplash), Problem statement, MODEL_PILLARS (Lightbulb/Hammer/TrendingUp/RefreshCw — Learn → Wire → Automate → Scale, the AI-First Framework), Areas of Focus, Stats, Credibility, Partnership types, Blog posts, Leadership credentials, Case studies, Founding story.

**Perpetual Core link in IHA copy:**
- `src/app/impact/page.tsx`: `entity: 'Perpetual Core'`.
- `src/lib/case-studies.ts`: "Perpetual Core (AI Infrastructure) — The AI-powered operating infrastructure that runs IHA Advance — licensed as SaaS to institutional partners."
- Admin allowlist includes `lorenzo@theiha.org`.

### 2.5 RFP App(s)
**Path (only one found):** `/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/app/(rfp-marketing)/rfp/`
**Status:** LIVE marketing inside perpetual-core repo.

**Files:** `rfp/layout.tsx`, `rfp/page.tsx`, `rfp/pricing/page.tsx`.

**Product name in code:** "RFP Engine."

**Positioning (`app/(rfp-marketing)/rfp/page.tsx`):**
- Hero/intro: "Find the right RFP. Draft it in your voice. Ship it clean. Grant databases stop at discovery. Generic AI hallucinates partners and outcomes. Capture consultants bill $300/hour and still miss deadlines. RFP Engine does all three jobs end-to-end — for federal contracts, foundation grants, state solicitations, and everything in between."
- "The first commercial product from [Perpetual Core]."
- Six features: Discovery every 6h (SAM.gov, Grants.gov, NYC DYCD, foundation, SBIR), Voice fingerprint, Vault-grounded drafting, Compliance gate, Reviewer agent, Audit-grade activity log.
- Competitor frame: Instrumentl, GovWin/Bloomberg, Submittable, ChatGPT/Claude, capture consultants.

**Pricing (`app/(rfp-marketing)/rfp/pricing/page.tsx`):**
| Plan | Price | Drafts | Audience |
|---|---|---|---|
| Starter | $299/mo | 5/mo | Solo founders, EDs, one-writer shops |
| Pro | $799/mo | 25/mo | Active monthly submitters |
| Agency | $2,499/mo | unlimited | Consultants, fiscal sponsors, capture firms |
| Enterprise | Custom | unlimited | Hospital systems, workforce boards, federal contractors |

CTAs flow into `/signup?next=/orgs/new&product=rfp-engine&plan=...` — same auth/orgs as the platform.

**Search results for second RFP app:** `find ~ -maxdepth 4 -type d -iname '*rfp*'` returned ZERO additional matches outside this directory. `find ~/ORGANIZED -type d \( -iname '*proposal*' -o -iname '*grant*' -o -iname '*capture*' -o -iname '*bid*' \)` returned only `~/ORGANIZED/02_DOCUMENTS/GRANTS_AND_PROPOSALS` and `~/ORGANIZED/02_DOCUMENTS/CONTRACTS_AND_BIDS` — both **document folders, not codebases**.

**Conclusion:** There is one RFP product (RFP Engine), with both marketing and signup integrated into perpetual-core. The "two RFP apps" mental model does not match disk reality.

### 2.6 Background Check
**Path:** none.
**Status:** Does not exist as a separate project on disk.

**Search results:**
- `find ~/ORGANIZED -type d -iname '*background*'` → only Library system folders, no project.
- `find ~/ORGANIZED -type d -iname '*credential*'` → only `.openclaw/credentials` and Apple system credential providers.

**Closest live equivalent:** Sentinel's Quick Vet tier ($49/mo, 5 reports, 1-page output) is functionally what a "Background Check App" would deliver. Sentinel BRIEF §0 explicitly excludes FCRA-regulated background-check use cases (refusal policy, §14), so it is *not legally* a background check service — it is a vetting/intelligence service.

### 2.7 Other Perpetual Core ecosystem
- **`~/sage-command-center` (Sage Command Center / Herald):** LIVE personal dashboard at `sageai.lorenzodc.com`. Connects 3 Supabase DBs (Brain/TPC/Workforce). Single-user password auth. Lorenzo's personal command center — *uses lorenzodc.com design, not Perpetual Core's design*. Routes: `app/(dashboard)/sage`, `app/api/sage`, `components/jarvis`. CLAUDE.md describes it as "Lorenzo's personal command center" — this is what the brand architecture calls Herald.
- **No `~/ORGANIZED/01_PROJECTS/ACTIVE/herald` directory exists.** Herald lives at `~/sage-command-center` despite the name mismatch.
- **No `~/ORGANIZED/01_PROJECTS/ACTIVE/sage-jarvis` directory exists.** "Jarvis" appears as a component folder inside `sage-command-center/components/jarvis`.
- **`~/ORGANIZED/01_PROJECTS/ACTIVE/sage-saas`:** has `PRODUCT_SPEC.md`, `PROJECT_CONTEXT.md`, `CLAUDE.md`, `package.json`, `src/`, `supabase/` — a scaffolded but unbuilt repo for the Sage SaaS product. Separate from sage-command-center.
- **Other related ACTIVE projects (out-of-scope but adjacent):** dbna-dashboard, intern-docs, kenya-site-redesign-brief.md, lorenzodc-personal-site, media-studio, richardsons-anguilla, the-ai-media-empire-ldc-aaa.

---

## 3. Ground-Truth Product List

Every shippable thing Lorenzo has on disk, ranked by build status:

| # | Product | Path | Domain | Status | Audience |
|---|---|---|---|---|---|
| 1 | **Sentinel** | `ACTIVE/sentinel/` | sentinel.perpetualcore.com | LIVE (marketing + app + BRIEF v2) | Solos, small teams, funds, nonprofits |
| 2 | **Perpetual Core Platform** | `ACTIVE/perpetual-core/` (root routes) | perpetualcore.com | LIVE (full SaaS site) | Individuals, small teams, ministry/nonprofit, verticals |
| 3 | **RFP Engine** | `ACTIVE/perpetual-core/app/(rfp-marketing)/` | perpetualcore.com/rfp | LIVE (marketing + pricing, signup wired into platform) | Nonprofits, consultants, federal contractors |
| 4 | **IHA Website** | `ACTIVE/iha-website/` | theiha.org | LIVE | Public/donors/partners |
| 5 | **Sage Command Center (Herald)** | `~/sage-command-center/` | sageai.lorenzodc.com | LIVE personal use | Lorenzo only |
| 6 | **Sage SaaS** | `ACTIVE/sage-saas/` + `perpetual-core/docs/SAGE_*` | sage.perpetualcore.com (planned) | PRD v0.3 + landing copy v0.2 LOCKED, not built | Portfolio founders, coaching clients, mission leaders |
| 7 | **Atlas** | `ACTIVE/atlas/` | atlas.perpetualcore.com (TBD) | GSD-planned (8 phases, 109 reqs), not built | PE Operating Partners |
| 8 | Background Check App | — | — | DOES NOT EXIST | (brief language only) |

Internal/non-customer-facing agents Lorenzo references ("Sentinel/Support/Content/Ops"): only **Sentinel** has a customer-facing surface. Support/Content/Ops are internal Hermes deployments without dedicated marketing.

---

## 4. Conflicts / Gaps vs the Repositioning Brief

| # | Brief says | Code/disk says | Severity |
|---|---|---|---|
| C1 | Brief lists products as Platform / RFP App / Background Check App / Sage | Reality is Platform + RFP Engine + Sentinel + Sage SaaS (planned) + Atlas (planned). **Sentinel is missing from the brief; Atlas is missing from the brief; Background Check has no repo.** | HIGH |
| C2 | Brief implies Sage = knowledge synthesis | Code/PRD have Sage = relational coach + chief of staff (`SAGE_SAAS_PRD.md` v0.3, `SAGE_LANDING_COPY.md` v0.2) | HIGH (already partially resolved by BRAND_ARCHITECTURE v0.1 splitting into Sage + Codex) |
| C3 | Lorenzo says "another RFP app exists" | Only one RFP product exists on disk (RFP Engine inside perpetual-core repo) | HIGH (factual disagreement to resolve with Lorenzo) |
| C4 | Brief implies Background Check is a real product | No code, no PRD, no landing copy, no Stripe product. Sentinel Quick Vet covers the *vetting* job, but not the FCRA-regulated background-check job (Sentinel explicitly refuses that). | HIGH |
| C5 | Brief frames perpetualcore.com as becoming a studio site | Current homepage is full SaaS product site with 35+ routes, "AI Operating System" hero, 12 industry pages, Free/$49/$99 pricing. Repositioning requires either: (a) demoting current perpetualcore.com content to /platform; (b) keeping it as the Platform product page within a studio shell. | HIGH |
| C6 | Brief silent on Atlas placement | Atlas is the most strategically significant unbuilt product (PE OPs, $75K+ engagement frame, sister-product link explicit in plan). It should be on the studio site somehow. | MEDIUM |
| C7 | Brief silent on Sentinel placement | Sentinel is LIVE, has its own subdomain and brand expression. Studio site needs to link to it as a portfolio product without absorbing it. | MEDIUM |
| C8 | Subdomain `sage.perpetualcore.com` referenced as Sage SaaS landing | Currently *not claimed in code*. Herald (Lorenzo's personal command center) lives at `sageai.lorenzodc.com`, not at any perpetualcore.com subdomain. Brand architecture v0.1 recommends migrating Herald to `herald.perpetualcore.com`. | MEDIUM |
| C9 | "Four agents in production (Sentinel/Support/Content/Ops)" | Only Sentinel has a marketing surface. Support/Content/Ops have no public landing pages and no separate repos. | MEDIUM |
| C10 | IHA / Perpetual Core relationship not framed in current perpetualcore.com | Already framed *in IHA's voice* on theiha.org: "Perpetual Core (AI Infrastructure) — runs IHA Advance — licensed as SaaS to institutional partners." Studio site needs to mirror this. | LOW (one-sided link already exists) |

---

## 5. Recommendations (in scope: the three asked questions)

### (a) The two RFP apps
**Finding:** there is one RFP product (RFP Engine), not two.
**Recommendation:** Treat as a single product on the studio site. Before the strategist writes copy, **ask Lorenzo directly** what the second RFP app is — possibilities: (1) something on a non-Lorenzo machine; (2) a different vertical inside RFP Engine he mentally treats as separate (e.g., federal contracts vs nonprofit grants); (3) a planned-but-unscaffolded product. If (2), the existing code already supports `product=rfp-engine&plan=...` URL params and could fork into two SKUs without a new repo. **Do not build a unification roadmap for two apps that don't both exist.**

### (b) Background Check vs Sentinel
**Finding:** no Background Check repo exists; Sentinel covers the vetting job and explicitly refuses FCRA-regulated background-check use cases.
**Recommendation:** **Drop "Background Check App" from the studio site entirely.** It is brief-side aspirational language, not a product. If the Studio wants the *job* covered, point to Sentinel's Quick Vet tier ($49/mo) on the Sentinel product card. If a true FCRA background-check product is on the roadmap, it requires a separate compliance posture (registered CRA, dispute process, adverse action notices) that Sentinel deliberately avoids — meaning it would need to be its own product, not a Sentinel feature. Punt that decision to a future quarter; do not put it on the studio site today.

### (c) Atlas placement on studio site
**Finding:** Atlas is fully GSD-planned (109 v1 reqs, 8 phases, $5–15K Discovery audit lead-gen, $75K+ engagement floor) but NOT BUILT — no marketing site, no app, no Stripe. Buyer is PE Operating Partner, a sophisticated audience that will rapidly detect vapor.
**Recommendation:** Two viable patterns; strategist picks one:
- **Pattern A (conservative): "By invitation" card.** Atlas appears on the studio site as a portfolio product card with a "Currently in pilot with select funds — request introduction" CTA pointing to a gated Calendly. No `atlas.perpetualcore.com` claim until a lighthouse customer signs. This protects credibility with PE OPs.
- **Pattern B (assertive): "Discovery audit available" card.** Atlas appears as a portfolio product card with the Atlas Discovery $5–15K audit as the entry point CTA. Requires shipping the Atlas Discovery intake form (Atlas REQUIREMENTS DISC-01 through DISC-09) before studio site goes live. Buys time on the install product because the audit *is* the lead-gen offer in the spec.

**Default if forced to pick:** Pattern A. Pattern B requires real surface area (intake form, Stripe checkout, branded PDF deliverable) that adds meaningful build scope; the studio repositioning shouldn't block on it.

**Either way:** Atlas card should explicitly call out "for PE-backed portcos / fund Operating Partners" so wrong-buyer traffic self-deselects, matching Sentinel's own audience-segmentation pattern (`/for/funds`, `/for/solos`, etc.).

---

*Inventory complete. Hand-off to wave-2 brand strategist.*
