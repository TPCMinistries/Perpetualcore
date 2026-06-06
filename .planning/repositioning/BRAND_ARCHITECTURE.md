# Perpetual Core — Brand Architecture

**Status: v1.0 LOCKED — 2026-05-10. Do not re-derive.**
Wave-3 copywriter and build agents operate on this document. Anything ambiguous here costs the copywriter tokens later — if you're a downstream agent and you find a gap, raise it in §8 and ask Lorenzo, do not invent.

---

## 1. Canonical brand stack

```
PERPETUAL CORE  (the studio — brand-facing parent)
│
├── PERPETUAL ENGINE  (substrate + methodology + impact, bundled)
│   ├── 8 registries (entities, people, projects, work items, knowledge, agents, workflows, events)
│   ├── AI-First Framework (Learn → Wire → Automate → Scale)
│   ├── Skills library (Anthropic SKILL.md format, per-portco JSON)
│   └── 10–15% of every revenue dollar → Institute for Human Advancement
│
├── ENGAGEMENTS  (flagship offer — install the Engine in your org)
│   └── Floor: $75K. Range: $75K / $150K / $250K+. Retainer $5–15K/mo.
│
└── PRODUCTS  (built in engagements, available standalone — proof of capability)
    ├── Atlas      — AI-native COO for fund-backed portcos (PE/funds vertical, by-invitation pilot)
    ├── Sentinel   — DD/intel agent (LIVE at sentinel.perpetualcore.com)
    ├── Sage       — Relational coach + chief of staff (B2C SaaS, 15% to IHA)
    ├── Vellum     — Institutional memory: synthesizes calls, docs, voice notes, channels
    ├── Platform   — AI OS for individuals + small teams (the perpetualcore.com platform tier)
    ├── RFP Engine — Federal/state contracts, foundation grants, capture-grade drafting (LIVE)
    └── RFP Sentry — Bid intelligence + compliance gate (sister product, in build — see §5.3)
```

Notes:
- **Background Check is not a product.** Folded as a Sentinel tier; never appears as a standalone product card.
- **Herald** (Lorenzo's personal command center, currently at sageai.lorenzodc.com) is **not** in the public studio portfolio. Internal tool. If/when it migrates to herald.perpetualcore.com, that subdomain is reserved.
- **The four "internal agents" Lorenzo references** (Sentinel/Support/Content/Ops) are not separate products — only Sentinel has a public surface.

## 2. Locked positioning sentences

**Perpetual Core (studio):**
> The AI-first studio that installs operating systems for mission-driven organizations.

**Perpetual Engine (substrate + impact):**
> The substrate behind every Perpetual Core install — 8 registries, the AI-First Framework, a compounding skills library, and the commitment that 10–15% of every revenue dollar funds workforce development through the Institute for Human Advancement.

**Engagements (offer):**
> A 90–180 day engagement that audits your operations, installs the Perpetual Engine across your departments, and hands you a system your team owns. Engagements start at $75,000.

**Atlas:** AI-native COO for fund-backed portfolio companies. PE Operating Partner is the buyer.
**Sentinel:** Due diligence and intel agent — DD for the people Kroll won't take calls from.
**Sage:** The coach and chief of staff who never forgets you, never burns out, and shows up wherever you do.
**Vellum:** Institutional memory for organizations — calls, docs, voice notes, channels, synthesized into one queryable mind.
**Platform:** AI OS for individuals and small teams. 11 models, persistent memory, AI executive advisors.
**RFP Engine:** Find the right RFP. Draft it in your voice. Ship it clean.
**RFP Sentry:** Find the RFPs that fit. Score them before you write. Bid intelligence + compliance gate.

## 3. Subdomain map

| Surface | Domain | Status |
|---|---|---|
| Studio site | perpetualcore.com | Active — repositioning in progress |
| Engine page | perpetualcore.com/engine | New (build) |
| Atlas | atlas.perpetualcore.com | Reserved — gated until first install |
| Sentinel | sentinel.perpetualcore.com | LIVE |
| Sage (B2C) | sage.perpetualcore.com | Reserved — Sage SaaS lands here |
| Vellum | vellum.perpetualcore.com | Reserved — pending naming confirmation (§5.1) |
| Platform | perpetualcore.com/products/platform + auth at app.perpetualcore.com | Active |
| RFP Engine | perpetualcore.com/rfp | LIVE |
| RFP Sentry | TBD per §5.3 | TBD |
| Herald | herald.perpetualcore.com | Reserved (internal — not in studio nav) |
| IHA | theiha.org | Separate — bidirectional links |

## 4. Giving structure (Perpetual Engine — impact arm)

| Surface | % to IHA |
|---|---|
| Engagements | 10% ($7,500–$25,000+ per client) |
| Sage SaaS | 15% (per PRD v0.3) |
| All other products / Platform | 10% default |

**Why mixed:** Sage is positioned as an owned-perpetual-asset and the higher giving rate is part of its differentiation. Engagements stay at 10% to keep the math defensible at scale. This is intentional and gets surfaced on /engine and /about — not hidden.

## 5. Decisions made (wave 2 — locked)

### 5.1 Knowledge-synthesis product name → **Vellum**

Recommended: **Vellum**.

Candidate field, with collision/SEO/tone analysis (May 2026):

| Candidate | Verdict | Notes |
|---|---|---|
| **Vellum** | **PICK** | vellum.ai exists (Y Combinator LLM-ops platform) — direct collision in name only, but their category is dev-tooling for engineers; ours is institutional memory for operators. Different buyers, different shelves. Workable with `vellum.perpetualcore.com` and qualified copy ("Vellum by Perpetual Core"). The word itself — calf-skin manuscript material — carries the right weight: durable, archival, hand-written. Sibling fit with Atlas/Sentinel/Sage is excellent (all classical/material proper nouns). |
| Mnemo | Reject | mnemo-ai.com is an AI-memory product. Direct same-category collision. |
| Memoria | Reject | Memoria AI exists (LinkedIn). Generic in category. |
| Lexicon | Reject | lexiconai.ai exists (AI consultancy). Plus "lexicon" is a commodity NLP term. |
| Praxis | Reject | praxis-ai.com is an enterprise knowledge-management platform — direct same-category collision, well-funded. |
| Anthos | Reject | Google Cloud Anthos owns the term in enterprise. Anthos Systems also exists in causal-reasoning AI. |
| Codex | Reject (already locked out) | OpenAI Codex active product line, GPT-5.3-Codex shipped 2026. |
| Almanac | Reject | Almanac Health raised $10M April 2026; Almanac.so wiki tool also exists. Heavy traffic. |
| Folio / Ledger / Quill / Athena / Recall / Loom / Cipher / Scribe | Reject | All occupied by AI products in adjacent categories. |
| Marginalia | Reject | marginalia.nu (search engine) owns the term in tech. |
| Compendium / Curator | Reject | Generic; Compendium.AI exists; Curator AI emerging as a job category. |

**Why Vellum despite vellum.ai:** The category test is "what shelf does the buyer find this on?" Vellum.ai's shelf is "LLM-ops platforms for engineers" — they sell to AI engineering teams. Our Vellum's shelf is "institutional memory tool for mission-driven operators" — we sell to founders, EDs, and program directors who never visit vellum.ai. Naming collisions in different categories happen constantly (cf. Atlas Obscura / Atlas the gym software / Atlas Copco / our Atlas). Sibling tonal fit (Atlas, Sentinel, Sage, Vellum) is the strongest of any candidate — all four are tactile, classical, single-word, and read as proper nouns rather than features. SEO is ownable on "Vellum institutional memory" and "Vellum by Perpetual Core" long-tails. Trademark feasibility is plausible in IC 9/42 for our category given vellum.ai's narrower category — but USPTO clearance is a separate step and not the strategist's call.

**Lorenzo's decision required:** confirm Vellum, or pick from the candidate field. Default ship-side: Vellum. If Lorenzo wants a clean miss on vellum.ai, his fallback is to take the only candidate above with no direct AI-category occupant: there isn't one in this list — every short classical noun is taken. A truly-clean alternative requires a coined word (e.g., "Vellix," "Vellumar") which loses the sibling tone. Recommend ship Vellum, qualify always as "Vellum by Perpetual Core" in copy.

### 5.2 Atlas placement on studio site → **Pattern A: by-invitation card**

Confirmed. Atlas appears in `/products` portfolio and on `/` homepage portfolio strip as a card with deliberate scarcity framing. No `atlas.perpetualcore.com` claim until first lighthouse install.

**Card spec for copywriter (this is architecture, not final copy — copywriter rewrites in voice):**
- Headline intent: "Atlas — AI-native COO for fund-backed portcos."
- Subhead intent (2 lines): one line that names the buyer (PE Operating Partner / fund OPs) and frames it as 6–10 week installs; one line that signals scarcity ("In pilot with select funds — by introduction only" or similar).
- CTA label: "Request introduction" → gated Calendly form. Not "Start free trial," not "Get started," not "Schedule a demo." The CTA itself is the qualifier.

The card visually signals it is a different motion than the SaaS products — softer treatment, no pricing, no feature bullets. UI audit §5 mono-violet card grid handles this naturally.

### 5.3 RFP unification → **Two products under one umbrella, both first-class**

Recommendation: **two distinct products with a shared umbrella label "RFP" in nav**, not one product with two SKUs. Rationale: SKU-tiering inside one product compresses marketing surface and confuses buyers about which one they need; two products with explicit job-to-be-done framing per buyer lets each have its own page, hero, and Stripe flow.

**Conditional plan based on what RFP-2 actually is** (Lorenzo answers this — see §8):

- **IF RFP-2 is the "find/discover RFPs" side** (intel, scoring, fit-matching) → name it **RFP Sentry**. Positioning: "Bid intelligence + compliance gate." Sister to RFP Engine which then becomes purely the response/drafting product.
- **IF RFP-2 is a vertical fork** (e.g., federal-only, or healthcare-only response side) → fold under RFP Engine as a vertical edition (not a separate product card). Studio site shows one RFP Engine card; the vertical is a /rfp/healthcare landing.
- **IF RFP-2 is a different motion entirely** (e.g., a capture consultant marketplace, a grant-readiness diagnostic) → separate product, separate name, separate page. Strategist will name it once Lorenzo describes it.

Default if Lorenzo hasn't answered before wave-3 ships: assume the first case (RFP Sentry as the intel side), since the existing RFP Engine copy already names "Discovery every 6h" as a feature — splitting that out into a discovery-first sister product is the cleanest reading. Wave-3 copywriter writes Vellum + RFP Engine pages first; RFP Sentry page is a stub until clarified.

### 5.4 Industries vertical for Kenya / international development → **Primary: abstracted case-study slot. Secondary: ecosystem mention on /about.**

Decision: **do not build `/solutions/international-development` as a dedicated vertical page in the first ship.** Surface Kenya/East Africa work in two places only:

1. **Primary:** one of the three abstracted slots on `/studio/case-studies` ("a UN-aligned humanitarian agency operating across East Africa, under PEPFAR data-sovereignty constraints" — copywriter handles voice).
2. **Secondary:** one paragraph on `/about` in the ecosystem section, naming IHA's Kenya work as the field-research arm that informs Perpetual Core methodology.

**Why not a dedicated /solutions page:** mid-market international-development buyers (UN agencies, multilateral foundations) come in through introductions and case studies, not through /solutions vertical pages. A standalone page would be thin, would require client names we don't have permission to use, and would dilute the studio-frame focus. The existing `/solutions/non-profits` page already exists and can carry an abstracted "Includes international development partners" line if needed. **If demand warrants it post-launch, build /solutions/international-development as a dedicated page in a v1.1.** Not before.

The competitive whitespace (Anthropic-Blackstone JV explicitly excludes mission-driven orgs) is real and gets used as **angle #1 in §6** — it doesn't need its own URL to be a positioning weapon.

### 5.5 /engine page structure → **6-section editorial manifesto**

Single column, max-w-3xl, light card density, prose-led. Per UI audit §7 this is built new from primitives, not composed from existing landing sections. Sections in order:

1. **Hero (text-only).** Eyebrow: "The Perpetual Engine." Headline: one sentence stating the engine is methodology + substrate + impact bundled. No visual. UI: same hero shape as studio homepage hero per UI audit §2.
2. **The 8 registries.** Static minimal node-diagram (the same one referenced in UI audit §2 hero recommendation — promote it here as the canonical visual asset). Below diagram: one short paragraph per registry (8 paragraphs, 1–2 sentences each).
3. **AI-First Framework (Learn → Wire → Automate → Scale).** Adapted HowItWorks 4-step component per UI audit §7. Each step gets 2–3 sentences. This is the methodology surface — links to /studio/methodology for the engagement-arc version.
4. **Skills library.** One-paragraph explainer of Anthropic SKILL.md format + per-portco JSON config. Visual: a small code-block or file-tree mock showing skill structure. Signals technical seriousness without becoming a docs page.
5. **The Engine commitment.** The 10–15% giving structure (table from §4 above). Concrete dollar examples ($7,500–$25,000+ per engagement). Names IHA, links to theiha.org. **This is the most important section on the page** — it is the differentiator the JVs cannot copy.
6. **CTA block.** Adapted FinalCTA component, desaturated per UI audit §5. Two CTAs: "See engagements" / "Read methodology." No pricing on this page.

**What this page is not:** a feature list, a comparison table, a pricing teaser, or a registry-feature dashboard mock. The buyer reads it like an essay, not like a product page. Confidence: high that single-column manifesto outperforms a card-grid here, given the mission-driven buyer profile from competitive intel §4.

### 5.6 Studio site product portfolio order → **Sentinel, Atlas, Sage, RFP Engine, Vellum, Platform** (homepage strip, 3 max visible). **Atlas, Sentinel, Sage, Vellum, RFP Engine, RFP Sentry, Platform** (`/products` overview, all 7).

Homepage strip shows **3 products max** to avoid the AE Studio "we built six things" pattern and to enforce focus. Pick: **Sentinel (live = proof), Atlas (flagship = aspiration), Sage (relational = humanity).** This trio answers the only question a $75K buyer asks — "have you actually shipped, can you do the hard thing, and do you understand humans" — in three cards. Vellum, RFP Engine, RFP Sentry, Platform live on `/products` overview behind a "See full portfolio" link.

`/products` overview order: **Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform.** Rationale: lead with the flagship (Atlas) even though it's by-invitation — this signals studio confidence. Sentinel second because it's live and the cleanest demo. Sage third because it carries the human/coach register. Vellum fourth because it's the most quietly differentiated (institutional memory is a niche but high-value job). RFP pair fifth/sixth as a coherent block. Platform last because it's the catch-all SaaS — Mosaic Data Science pattern, where the platform is the one-size-fits-most fallback at the end of the portfolio.

**Do not show all 7 on the homepage.** Three-card strip is the lock.

### 5.7 Three sharpest positioning angles (use across `/`, `/studio`, `/engine`)

Distilled from COMPETITIVE.md §7. Phrased as one-sentence claims. Copywriter rewrites in voice — these are the architectural beats.

1. **The implementation layer the JVs aren't reaching.** *"We install AI operating systems for the mission-driven organizations the Anthropic-Blackstone and OpenAI-TPG ventures won't serve — engagements start at $75,000, not $300,000."* (Counter-positions against the JV tier without picking a fight; uses the JVs' own scope-exclusion as proof of the underserved gap.)

2. **Constraints as the credential.** *"Production AI under PEPFAR rules, IRB review, GDPR-equivalent consent, and offline-first connectivity — built across Nairobi parishes, CUNY workforce programs, and faith institutions, not in PowerPoint."* (Unfakeable. Names the regulatory regime, not the client. Borrows AE Studio's "scientists who ship" register but loads the constraint as the proof.)

3. **The systems we built keep running.** *"Sentinel, Atlas, Sage, RFP Engine — every product on this site is a working installation we shipped in an engagement and kept running. The portfolio is the proof; the engagement is the work."* (Mirrors the Anthropic playbook: products are public demonstrations of capability, engagements are how you stay paid. Each product is a live answer to "have you shipped this kind of system before.")

These three angles get used **everywhere** — homepage hero, `/studio` opening, `/engine` framing, `/about` positioning. Wave-3 copywriter never writes "transformation partner," "reimagine," "AI-everything," "end-to-end agentic," or any phrase that could appear unchanged on a Slalom or Publicis.Sapient page. See COMPETITIVE.md §6 antipatterns.

---

## 6. Three positioning angles (verbatim — copy operates on these)

> 1. **The implementation layer the JVs aren't reaching.** "We install AI operating systems for the mission-driven organizations the Anthropic-Blackstone and OpenAI-TPG ventures won't serve. Engagements start at $75,000."
> 2. **Constraints as the credential.** "Production AI under PEPFAR rules, IRB review, GDPR-equivalent consent, and offline-first connectivity — built across Nairobi parishes, CUNY workforce programs, and faith institutions, not in PowerPoint."
> 3. **The systems we built keep running.** "Every product on this site is a working installation we shipped in an engagement and kept running. The portfolio is the proof; the engagement is the work."

---

## 7. Site IA — final route map

```
/                                    Studio homepage. Hero → Studio → 3-product strip → Methodology teaser → Engine commitment → CTA.
/studio                              Studio overview. Who we serve + 4-step framework teaser + engagement CTA.
  /studio/engagements                Engagement detail. $75K floor, range, retainer, intake form. (Reuses /consulting scaffold.)
  /studio/methodology                AI-First Framework — alternating timeline. Links to /engine for the substrate.
  /studio/process                    Engagement arc — 90/180-day timeline. Reuses ComparisonTable shape.
  /studio/case-studies               3 abstracted slots. Sector + constraint + outcome. Kenya seeds slot 1.

/engine                              Perpetual Engine manifesto. 6 sections per §5.5. Editorial single-column.

/products                            Portfolio overview. 7 product cards, mono-violet, ordered per §5.6.
  /products/platform                 Current homepage content, repurposed. Hero → Bento → Demo → Exec Suite → Security → Trust → Pricing teaser.
  /products/atlas                    By-invitation page. Hero + 3-paragraph explainer + intake form. No pricing.
  /products/sentinel                 Minimal landing. Links to sentinel.perpetualcore.com.
  /products/sage                     Sage SaaS landing per SAGE_LANDING_COPY.md v0.2. Links to sage.perpetualcore.com when live.
  /products/vellum                   Vellum landing. Hero + features + pricing (TBD) + CTA. "Vellum by Perpetual Core" qualifier.
  /products/rfp-engine               Existing /rfp/page.tsx repointed under /products/. Pricing at /products/rfp-engine/pricing or kept at /rfp/pricing.
  /products/rfp-sentry               Stub until §5.3 clarified.

/about                               Founder, mission, ecosystem (IHA / Uplift / DeepFutures), Engine commitment block. Real photo required.

/pricing                             Unified. Engagements first ($75K floor), Platform tiers below ($0/$49/$99), License + Embedded "Contact us." Revenue-share off-page.

/solutions/*                         Preserve all 12 vertical pages with light refresh + top banner linking to /studio/engagements. Audit unverified compliance claims.

/agents, /features/*                 Preserved as platform feature pages. Linked from /products/platform.

LEGAL: /privacy, /terms, /cookies, /accessibility — preserve as-is.
```

**Routes to retire/redirect:**
- `/consulting` → 301 to `/studio/engagements`
- `/consultation` → 301 to `/studio/process`
- `/enterprise-demo` → keep, rename "Enterprise Engagements"
- "Watch It Learn" / Day 1 → Month 3 hero animation: delete from `/`, keep timeline component for `/studio/process` per UI audit §3.
- "Built for Everyone" personas grid: delete entirely.
- Footer "Studio" column added per BRIEF_RECONCILED A4.

---

## 8. Lorenzo's locks (2026-05-10) — all questions resolved

1. **Vellum naming — CONFIRMED ✓.** Ship as "Vellum by Perpetual Core", always qualified.
2. **RFP-2 scope — LOCKED ✓.** RFP-2 is the bid intelligence / find-RFPs side. Final name: **RFP Sentry**. Tagline: "Bid intelligence + compliance gate." RFP Engine = response/drafting; RFP Sentry = discovery/intel/scoring.
3. **No client names — ENFORCED ✓.** Positioning angle #2 abstracts CUNY → "community college workforce programs in New York"; Nairobi parishes → "parish networks in East Africa." All client/partner specifics abstracted unless explicit permission later.
4. **Vellum pricing — LOCKED ✓** (lead-decided 2026-05-10 from market research):
   | Tier | Price | What |
   |---|---|---|
   | Free | $0 | 1 user, 100 sources, basic synthesis |
   | Operator | $49/mo | 1 user, unlimited sources, voice + channels, 30-day retention |
   | Team | $249/mo | 5 users, all channels + integrations, 1-year retention |
   | Institution | Contact us | 25+ users, SSO, custom retention, on-prem option |

   **Mission-driven discount: 30% off Operator/Team for verified 501(c)(3)s; negotiated on Institution.** Surface this on `/products/vellum` pricing block and `/engine` commitment section.

   Rationale: $49 Operator anchors to Platform Starter + Sentinel Quick Vet (price-psychology consistency). $249 Team undercuts Glean ($40+/user × 5 = $200, 100-seat min) for the small-team band Glean can't sell into. Institution Contact-us preserves pricing flex.

---

## 9. Decisions still locked from the brief (don't re-derive)

- $75K engagement floor — exact string "Engagements start at $75,000"
- Retainer $5,000–$15,000/month
- Platform pricing: Free / $49 Starter / $99 Pro
- License + Embedded = "Contact us" only
- Revenue-share = off-site, sold in conversation
- No client names anywhere — all proof abstracted
- IHA = **Institute for Human Advancement**, not Institute for Human Development, not Uplift
- Visual system preserved (palette, type, logo, wordmark) with UI audit §5 sharpening levers applied
- Top-level nav: Studio | Products | Industries | Pricing | About    [Sign In] [Start Engagement]
- All BRIEF_RECONCILED A8 correctness checks BLOCK ship

---

*Wave-3 copywriter operates on this lock. Build agents reference §7 IA for routing. Strategist hand-off complete.*
