# Sage SaaS — Product Requirements Document
**sage.perpetualcore.com**

Version 0.4 · May 10, 2026 · Lorenzo Daughtry-Chambers, The Perpetual Core LLC

> **v0.4 drops the Hermes Agent runtime dependency.** Sage SaaS implements four interfaces (PersonaAdapter, MemoryAdapter, ChannelAdapter, SignalExtractor) directly on Vercel AI SDK 6 + Supabase + grammY. Sage is a relational coach, not a tool-using agent — she doesn't need an agent loop. Eliminates the #4 BUSINESS-CRITICAL risk (Sage runtime churn). Alternative runtime can be plugged in later via the same interfaces. v0.3 positioning + v0.2 architecture/GTM/pricing carry forward unchanged. Summary at bottom.

---

## 0. Positioning (the canonical sentence)

**Sage is the coach and chief of staff who never forgets you, never burns out, and shows up wherever you do.**

Not a productivity tool. Not a chatbot. Not an "AI assistant." A *relational partner* — embedded in the customer's life in a way that compounds over years, not a utility that gets replaced when GPT-6 ships.

This positioning has hard implications for every downstream decision:

- **Persona is the product.** Features are secondary to *who Sage is*. A coach with weak personality is useless; a tool with weak features is replaceable.
- **Memory is relational, not transactional.** Sage doesn't remember your tasks — she remembers that you crash at 3pm, get reflective on Sundays, and make commitments on Wednesdays you don't keep. The schema reflects this.
- **Voice is foundational, not optional.** A coach you only text isn't a coach. Voice in/out is table stakes everywhere, not a Pro-tier upsell.
- **Channels are about presence, not convenience.** Telegram isn't "for quick captures" — it's "Sage is there when you need her at 11pm."
- **Customer success is care, not onboarding.** First 30 days are make-or-break for relational products. Sage needs an onboarding *ritual*, not a configuration wizard.
- **Competitors aren't OpenAI/Anthropic/Google.** They're Replika, Pi, Character, Personal AI, and the increasingly-AI-augmented executive coaching market. None of them serve the executive/portfolio-founder niche specifically. That's the wedge.

---

## 1. Executive Summary

Sage is a persistent coach and chief of staff — multi-channel, memory-rich, voice-first — for founders, executives, operators, and ministry leaders who want a relationship with their AI, not just a tool.

Where ChatGPT and Claude.ai are conversational utilities, Sage is a *partner*: she lives on Telegram, voice, and web; remembers every conversation; carries a defined personality that doesn't reset; and shows up in the channels her customers actually use. Each customer gets logical isolation of memory, persona, and channels on shared infrastructure — with a dedicated-pod option at Sovereign tier.

Sage is built on a thin own-code runtime — four interfaces (PersonaAdapter, MemoryAdapter, ChannelAdapter, SignalExtractor) implemented directly on Vercel AI SDK 6 + Supabase + grammY, no external agent framework. Lorenzo's personal Herald deployment uses the same interfaces. The persona, voice, and architecture are dogfooded daily before any customer sees them. An external runtime (Hermes, etc.) can be plugged in later via the same four interfaces if a future need emerges.

**Sage is an owned perpetual asset, not a startup.** No exit, no VC. Optimized for cash flow + data + customer loyalty over 10 years, not for acquisition or growth-at-all-costs. **15% of all revenue flows to the Institute for Human Advancement** via the Perpetual Engine model — increased from 10% in v0.2 to reflect that funding IHA is the central point of the business, not a marketing line.

**Two-track go-to-market:** Sage launches first as a $99/mo addon to Lorenzo's coaching practice (Months 1–2) to validate willingness-to-pay through an existing trust channel. Standalone SaaS opens Month 3 once 10 paying coaching-addon customers are using Sage daily.

---

## 2. Vision & Strategic Fit

### Why this exists

Three observations created the gap Sage fills:

1. **Generic AI assistants forget you.** Every conversation starts from zero. Every persona is a system prompt that resets. There is no continuity, no relationship, no compounding context.
2. **Power users live across channels.** The most valuable use case for AI is voice memos in transit, Telegram threads at midnight, and WhatsApp messages with collaborators — not a tab in a browser.
3. **Executives need a partner, not a tool.** Founders running portfolios of entities (the Lorenzo profile) need an AI that holds the whole picture, sees patterns across ventures, and can speak to any of them with continuity.

Sage is built for the third category and works because she solves the first two.

### Strategic fit within the Perpetual Core ecosystem

- **Perpetual Core platform** already has the bones: AI integration (GPT-4, Claude, Gemini), infinite memory positioning, document RAG, multi-tenant auth, Stripe billing. Sage SaaS is the killer feature it has been waiting for.
- **Perpetual Engine model:** 15% of Sage revenue → the Institute for Human Advancement. Built into the billing flow, visible to the customer, audited annually. This is the moat no VC-funded competitor can copy.
- **IHA credibility halo:** the same team building UN-partnered workforce development infrastructure is building your AI partner. Trust is pre-loaded.
- **Lorenzo dogfooding:** every product feature is tested first on Herald (Lorenzo's personal Sage). If it doesn't work for him, it doesn't ship.
- **Coaching practice as validation channel:** Lorenzo's existing coaching clients are the natural first market — they already pay for his thinking; Sage is leverage on what they're already buying.

---

## 3. Target Users

### Pilot personas (in priority order)

All three pilot segments exist in Lorenzo's existing network. No cold acquisition required for the first 10 customers.

**Persona 1 — The Portfolio Founder.** Runs 2+ entities, has a calendar that breaks normal task managers, lives in voice memos. Examples in network: Lorenzo, Achumboro, board members. Pain: context-switching tax. What Sage delivers: one persistent partner who knows all the ventures.

**Persona 2 — The Executive Coaching Client.** *(Promoted from Persona 3.)* Already paying for Lorenzo's coaching practice. Wants Lorenzo's thinking accessible between sessions. Pain: insights from coaching sessions don't compound; no continuity between months. What Sage delivers: a Lorenzo-flavored partner that retains coaching context and surfaces patterns. **This is the validation persona — they prove willingness-to-pay before standalone SaaS launches.**

**Persona 3 — The Mission/Ministry Leader.** Runs a faith-based or movement-based organization. Operates in spiritual and operational modes simultaneously. Examples in network: TPC ministry leaders, NAN-adjacent leaders, Bishop-Elect Joshua Jordan tier. Pain: secular tools don't hold both modes. What Sage delivers: a partner who can hold strategy and discernment.

### Anti-personas (do NOT design for)

- Casual chatbot users — Sage is overkill, ChatGPT is fine for them.
- Engineering teams looking for a coding assistant — Cursor and Claude Code already serve this.
- Enterprises looking for a customer-facing AI — Sage is operator-side, not customer-side.

---

## 4. Architecture

### System diagram

```
┌─────────────────────────────────────────────────────────┐
│  sage.perpetualcore.com  (Next.js on Vercel)            │
│  - Tenant signup, billing (Stripe), channel config      │
│  - Conversation UI, memory browser, skills marketplace  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴───────────────┐
        │                            │
┌───────▼────────┐         ┌─────────▼────────────────┐
│  Supabase      │         │  Sage runtime          │
│  - Auth        │         │  (shared pod, multi-     │
│  - pgvector    │         │   tenant by namespace)   │
│  - Tenant DB   │◄────────┤  - PersonaAdapter        │
│  - RLS by      │         │  - MemoryAdapter         │
│    tenant_id   │         │  - ChannelAdapter        │
└────────────────┘         │  - Own thin runtime    │
                           └──────────────────────────┘
                                       │
                           ┌───────────┴───────────┐
                           │  Sovereign tier only: │
                           │  dedicated Sage pod │
                           │  per tenant (Fly.io)  │
                           └───────────────────────┘
```

### Key design decisions

1. **Shared pod with namespace isolation by default. Dedicated pods are a Sovereign-tier feature, not the platform default.** Solo and Pro tenants run on a shared Sage runtime with strict logical isolation: per-tenant memory namespaces, RLS-enforced data boundaries, separate channel credential vaults. Dedicated pods cost ~$15–40/mo in baseline infra each — at Solo $29 with a 10% IHA carve, dedicated pods would put gross margin underwater. Shared infra serves the 95% of customers who don't need physical isolation, while preserving the security story (logical isolation is what matters legally; physical isolation is what enterprises check the box for).

2. **Own thin runtime behind four interfaces — no external agent framework.** Sage is a relational coach, not a tool-using agent; she doesn't need an agent loop. Vercel AI SDK 6 + AI Gateway covers provider routing + cost observability. grammY covers Telegram. Supabase + pgvector covers memory. Implementing `PersonaAdapter`, `MemoryAdapter`, `ChannelAdapter`, `SignalExtractor` ourselves on top of these — instead of wrapping a Hermes-style agent runtime — eliminates the BUSINESS-CRITICAL "OSS framework churn" risk (LangChain, CrewAI, AutoGen pattern). The interface shape leaves the door open: a future engineer could implement `HermesPersonaAdapter` (or any other runtime) against the same interfaces and swap implementations without rewriting the product.

3. **Supabase for tenant data, pgvector for memory.** Continues the existing Perpetual Core stack. No new database layer to learn. Per-tenant memory lives in `memories` table with `tenant_id` RLS; vector embeddings in pgvector with the same RLS column.

4. **Next.js on Vercel for the web app.** Already the deployment pattern for perpetualcore.com. sage.perpetualcore.com is a subdomain route, not a separate codebase.

5. **Provider tiering at the routing layer.** Local triage (Gemma via Ollama on shared infra) → mid synthesis (Kimi K2.5) → high stakes (Claude Opus 4.7). Customer pays one price; Sage routes to control margin.

6. **Persona-drift eval harness from Phase 1, not Phase 6.** Persona consistency across providers is the moat AND the hardest problem. Build golden-conversation regression tests in Phase 1 so every model swap, prompt change, or routing tweak runs through the harness before deploy. Without this, Sage will sound like Daniel one week and a Gemma cosplay the next.

### Data isolation

- Every tenant has its own Supabase row-level-security boundary by `tenant_id`.
- Memory namespaces in the shared Sage pod use per-tenant prefixes; cross-tenant reads are impossible at the storage layer.
- API keys (Anthropic, Kimi, ElevenLabs) are platform-level, not tenant-exposed. Customer never handles raw keys.
- Channel credentials (their Telegram bot token, their Twilio number) are encrypted at rest in Supabase using a per-tenant KMS key, decrypted only at request time.
- Sovereign tier additionally gets a dedicated Fly.io machine with its own filesystem volume, eliminating even theoretical co-tenancy risk.

---

## 5. Pricing

Four tiers. Designed so the marginal cost of an upgrade always increases the customer's leverage by more than the price increase.

| Tier | Price | Channels | Voice | Messages | Memory | Models | Infra |
|------|-------|----------|-------|----------|--------|--------|-------|
| **Solo** | $29/mo | Telegram **or** Web | ✓ in & out | 5,000/mo | 6 months retention | Gemma + Kimi | Shared pod |
| **Pro** | $149/mo | All available channels | ✓ + dedicated number | Unlimited | Unlimited retention | Adds Claude Sonnet | Shared pod |
| **Team** | $499/mo | All channels, 5 users | ✓ + 5 numbers | Unlimited | Shared org memory | Adds Claude Opus | Shared pod, isolated namespace |
| **Sovereign** | $2,000/mo | All + custom integrations | ✓ + custom voice clone | Unlimited | Unlimited + audit log | Full routing + on-prem option | **Dedicated Fly.io pod** |

### Pricing rationale

- **Sage Solo at $29 with voice included** captures coaching clients and individual operators. Voice was previously gated to Pro — but voice is the most viral feature of the product (people show their friends "look, my AI talks to me on the way to the airport"). Putting it in Solo accelerates word-of-mouth growth at the cost of ~$2/mo per Solo tenant in TTS spend, which is more than recovered by upsell.
- **Sage Pro at $149** is the target tier. The differentiator vs Solo is multi-channel (all four), unlimited messages, Claude Sonnet routing, and a dedicated voice number. This is where Sage becomes irreplaceable for the portfolio founder.
- **Sage Team at $499** for organizations that already pay for Slack, Notion, and Gusto. Adds Claude Opus routing + shared organizational memory across 5 users. First Team customer is likely IHA itself.
- **Sage Sovereign at $2,000** is white-glove. Concrete features that justify the gap from Pro:
  - Dedicated Fly.io pod (no co-tenancy)
  - Custom voice clone (ElevenLabs Professional Voice Cloning)
  - SSO + audit logging exportable to SIEM
  - Custom integrations (one new MCP/tool integration per quarter included)
  - 4-hour SLA + dedicated Slack channel with founder
  - On-prem deployment option (Q4 2026)
  - Quarterly strategy review with Lorenzo (1 hour)

**15% of all revenue flows to IHA via Perpetual Engine.** Billed gross, audited annually, line-itemed on every invoice. Increased from 10% to reflect that funding IHA is the actual purpose of the business, not a marketing line — and to make competitive replication structurally impossible.

### Coaching-addon pre-launch pricing (Months 1–2)

Before standalone SaaS opens, Sage is sold as a $99/mo addon to active coaching clients. They get Pro-tier features at a discount in exchange for being the validation cohort. At month 3, they convert to standard Pro pricing OR continue at $99 grandfathered — whichever they prefer. This is the "validation step" between dogfooding and SaaS launch.

---

## 6. Build Order

Five phases plus a coaching-addon validation track. Each phase ships independently; standalone SaaS v1 is fully usable after Phase 5.

| Phase | Duration | Deliverable | Critical for v1? |
|-------|----------|-------------|------------------|
| **0. Interface layer + persona harness** | Week 1 | `PersonaAdapter`, `MemoryAdapter`, `ChannelAdapter`, `SignalExtractor` interfaces with own thin default implementations on Vercel AI SDK + Supabase + grammY. Golden-conversation eval harness with 50+ test cases. RLS schema, signal extraction, deletion-by-design. | YES — foundation |
| **1. Tenant + billing** | Week 1–2 | Tenant signup on sage.perpetualcore.com, Stripe checkout, RLS on Supabase, Sage instance provisioning into shared pod. | YES |
| **2. Telegram + Web channels** | Week 2–3 | Telegram bot per tenant (their token, encrypted at rest). Web chat with persistent memory. | YES |
| **3. Voice (web only)** | Week 3–4 | ElevenLabs TTS in shared pod. Voice in via Web Speech API for v1 (no dedicated phone numbers yet). | YES |
| **4. Memory browser + admin** | Week 4 | Customer-facing memory inspector ("what does Sage remember about me?"), data export, deletion controls. | YES |
| **5. Coaching addon + first 10 customers** | Week 5 | Sell to coaching practice at $99/mo. Onboard 10 tenants. Run them for 30 days. | YES |
| **6. WhatsApp + dedicated voice numbers** | Post-v1 (Month 3) | Twilio integration. WhatsApp Business via Twilio. Dedicated voice numbers for Pro tier. | NO — v1.5 |
| **7. Skills marketplace** | Month 4 | MCP server marketplace, per-tenant integrations (Notion, Linear, Calendar, etc.). | NO — v2 |
| **8. Sovereign tier** | Month 5 | Dedicated Fly.io pod provisioning, SSO, audit log export, custom voice cloning. | NO — v2 |

**v1 launch criteria:** Telegram + Web + Voice (web) + Memory + 10 coaching-addon customers paying. WhatsApp and dedicated phone numbers explicitly NOT in v1 — Twilio business-line provisioning takes 2–3 weeks per tenant and would block launch.

---

## 7. Go-To-Market

### Track A: Coaching addon (Months 1–2, pre-SaaS)

The first 10 customers come from Lorenzo's existing coaching practice. Sage is positioned as "your between-sessions Lorenzo" at $99/mo addon.

- **5 from active coaching clients** — already paying for Lorenzo's time, Sage is leverage between sessions.
- **3 from IHA inner circle** — Achumboro, Dr. Griffith, key board members. Friends-and-family pricing.
- **2 from TPC ministry leaders** — Ministry pricing.

**Goal:** validate "people will pay for Lorenzo-flavored AI continuity" before validating "people will pay for Sage as standalone SaaS." If the first 10 don't renew at month 2, the SaaS launch is wrong and we restructure before building more.

### Track B: Standalone SaaS (Month 3, post-validation)

If coaching-addon validation passes (≥7 of 10 actively using Sage at day 30), open standalone SaaS:

- **Public launch via Boardroom x Prayer Room podcast** — Lorenzo demos his own Sage on episode.
- **LinkedIn campaign** targeting portfolio founders and executive coaches in Lorenzo's network.
- **Affiliate program for executive coaches:** 30% recurring for first year per referred client. Targets the "I'm a coach who wants to give my clients what Lorenzo gives his" market.
- **Co-marketing with IHA Academy:** certified Sage operators get a credential.

### Pricing test framework

- Beta customers (coaching-addon cohort) lock at $99/mo for 12 months. No exceptions.
- Public pricing tested A/B at launch: $29 vs $39 for Solo, $149 vs $179 for Pro.
- Annual plans launched at month 4 with 2 months free (16% discount).

---

## 8. Risks & Mitigations

**Risk: Coaching-addon validation fails.** Mitigation: this is the WHOLE POINT of Track A. If it fails, we learn before sinking 5 weeks of engineering into the public SaaS. Failure mode: pivot Sage to a different positioning (e.g., team-only, or executive-coaching-platform, or vertical-specific) based on what the cohort tells us.

**Risk: external agent runtime dependency churn.** Mitigation: SOLVED in v0.4 by dropping the external runtime entirely. Sage runs on own thin code over Vercel AI SDK + Supabase + grammY (all of which Lorenzo's ecosystem already depends on). The four interfaces (PersonaAdapter / MemoryAdapter / ChannelAdapter / SignalExtractor) leave the door open to plugging in an agent runtime later if a future need emerges.

**Risk: Per-tenant infrastructure cost exceeds margin at low tiers.** Mitigation: SOLVED in v0.2 by killing dedicated pods until Sovereign. Solo at $29 with shared inference and shared pod has ~$8 in marginal cost (TTS + Gemma/Kimi inference + Supabase storage). Margin is healthy.

**Risk: Persona drifts across provider routing.** Mitigation: persona-eval harness in Phase 0. Every model swap, prompt change, or routing rule runs against 50+ golden conversations. Ship-blocker if the harness regresses.

**Risk: Memory privacy concerns from enterprise customers.** Mitigation: per-tenant RLS isolation, encryption at rest, audit log per customer, right-to-delete fully implemented. Sovereign tier offers physical isolation (dedicated pod) for the customers who require it. SOC 2 path begins at 50 paying customers.

**Risk: Lorenzo bandwidth — building this while running IHA, Kenya follow-up, RFPs.** Mitigation: Achumboro and the Seton Hall practicum group can own the GTM/pilot recruitment side while Lorenzo + Claude Code own the build. The coaching-addon track is a low-bandwidth way to validate before full SaaS commitment. **First-hire trigger:** at $5K MRR (≈25 paying tenants), hire a part-time Sage Operator to handle onboarding + persona QA reviews.

**Risk: Competitive entrants (OpenAI Operator, Anthropic Computer Use, etc.).** Mitigation: Sage's differentiation is not the AI — it is the persona, the multi-channel persistence, the Perpetual Engine model, and the Lorenzo-network distribution. None of those are features competitors will replicate.

**Risk: Twilio/WhatsApp provisioning blocks v1.** Mitigation: SOLVED in v0.2 by deferring WhatsApp + dedicated voice numbers to v1.5. Telegram + Web + browser-voice ships in v1.

---

## 9. Success Metrics

### Coaching-addon validation criteria (Day 30 of cohort)

- 10 paying coaching-addon tenants
- ≥7 of 10 actively messaging Sage at day 30
- 0 data isolation incidents
- 0 persona-drift complaints
- ≥3 unsolicited "this is changing how I work" testimonials

**If validation passes:** open standalone SaaS at Month 3.
**If validation fails:** pause SaaS build, retool positioning, re-validate.

### v1 launch criteria (30 days post first standalone paid customer)

- 15 paying tenants total (10 coaching-addon + 5 standalone)
- MRR ≥ $2,000
- D7 retention ≥ 80%
- D30 retention ≥ 70%
- NPS ≥ 50 from cohort
- Persona-eval harness passing on every deploy

### v2 targets (90 days post standalone launch)

- 50 paying tenants
- MRR ≥ $10,000
- First Sovereign tier customer signed
- $1,000 minimum quarterly Perpetual Engine flow to IHA (audited)
- First customer testimonial recorded for Boardroom x Prayer Room
- WhatsApp and dedicated phone numbers shipped (v1.5)
- First Sage Operator hired

---

## 10. Resolved Decisions (was: Open Questions)

- **Voice provider:** ElevenLabs for v1 — already integrated, quality matters more than cost when persona IS the product. Cartesia revisited at 100 tenants for cost optimization.
- **Mobile:** PWA for v1. Native iOS via Capacitor at v2. Native Android deferred indefinitely (Telegram + WhatsApp cover the Android use case).
- **Sage persona customization depth:** Tenants can override name (call her "Atlas" if they want), tone modifier (more formal / more casual), and focus areas (e.g., "spiritual mode," "investor mode"). Cannot override core voice traits or values. Pro+ only.
- **White-label tier (Sovereign):** Full custom domain (sage.yourbrand.com) routed via Cloudflare Worker. Sovereign-tier only.
- **Free tier:** No. 14-day Pro trial without credit card. Card required at day 14 to continue. Resolves the previous contradiction between PRD ("CC required") and landing copy ("no card to start").
- **Hero CTA:** "Meet Sage" (not "Start your 14-day Pro trial"). The trial detail moves to the trust line.

---

## 11. Decision Log

- **May 9, 2026** — Decision to build on Hermes Agent runtime instead of OpenClaw. Rationale: Hermes is MIT-licensed, MCP-native, has 142 contributors, and includes learning loop + persistent skills + multi-channel out of the box. OpenClaw was unable to reach operational status on Herald after seven weeks of setup attempts. *(Reversed in v0.4 — see below.)*
- **May 9, 2026** — Decision to deploy Sage SaaS as sage.perpetualcore.com subdomain rather than separate domain. Rationale: leverages existing perpetualcore.com infrastructure, AI Executive Suite branding, and trust signal.
- **May 9, 2026** — Decision to run Track A (Herald personal deploy) and Track B (SaaS spec) in parallel. Rationale: Herald deployment unlocks daily personal leverage immediately; SaaS spec is a writing exercise that does not compete for hands-on build time.
- **May 9, 2026 (v0.2)** — Decision to kill dedicated-pod-per-tenant default. Shared pod with namespace isolation by default; dedicated pods are a Sovereign-tier feature only. Rationale: dedicated pods make Solo unprofitable at $29 and add 6 weeks of ops infra without commensurate customer value at the low tiers.
- **May 9, 2026 (v0.2)** — Decision to defer WhatsApp and dedicated phone numbers from v1 to v1.5. Rationale: Twilio business-line provisioning takes 2–3 weeks per tenant and would block v1 launch.
- **May 9, 2026 (v0.2)** — Decision to introduce coaching-addon validation track (Months 1–2) before standalone SaaS launch (Month 3). Rationale: validates willingness-to-pay through existing trust channel before sinking 5 weeks into public-facing infrastructure.
- **May 9, 2026 (v0.2)** — Decision to wrap Hermes behind `PersonaAdapter`, `MemoryAdapter`, `ChannelAdapter` interfaces from day one. Rationale: agent-runtime OSS has historically had brutal churn; cost of the abstraction is ~2 weeks, cost of being locked in is multi-month rewrite. *(Carried into v0.4 — interfaces stayed; the wrapped runtime got dropped.)*

- **May 10, 2026 (v0.4)** — Decision to drop Hermes Agent runtime entirely. Sage SaaS implements the four interfaces (`PersonaAdapter`, `MemoryAdapter`, `ChannelAdapter`, `SignalExtractor`) directly on Vercel AI SDK 6 + Supabase + grammY. Rationale: Sage is a relational coach, not a tool-using agent; she doesn't need an agent loop. Vercel AI SDK + AI Gateway provides provider routing + observability; Supabase covers memory; grammY covers Telegram. Implementing the interfaces ourselves on top of these eliminates the BUSINESS-CRITICAL "runtime churn" risk while preserving optionality (Hermes or any other runtime can be plugged in later via the same interfaces).

- **May 10, 2026 (v0.4)** — Decision: new GitHub repo `TPCMinistries/sage-saas` (not co-located with perpetualcore.com). Rationale: clean ownership, separate CI, easier to scope future engineer access.

- **May 10, 2026 (v0.4)** — Decision: new Supabase project `sage-saas` (not shared with LDC Brain AI). Rationale: tenant data should never theoretically touch Lorenzo's personal brain DB; clean RLS story for the "we don't co-mingle" privacy promise.

- **May 10, 2026 (v0.4)** — Decision: Vercel AI Gateway adopted in Phase 0 for cost tracking + provider observability needed for IHA carve auditing. Drizzle ORM adopted for type-safe queries against RLS-critical schema. Hire trigger moved from $5K MRR to $4K MRR (8-week lead time).
- **May 9, 2026 (v0.2)** — Decision to move persona-drift eval harness from Phase 6 to Phase 0. Rationale: persona consistency is the moat AND the hardest engineering problem; without the harness from day one, every model swap and prompt tweak is a regression risk.
- **May 9, 2026 (v0.2)** — Decision to bundle voice (in & out) into Solo tier instead of gating to Pro. Rationale: voice is the most viral feature; the ~$2/mo TTS cost per Solo tenant is recovered by accelerated word-of-mouth and Pro upsell.
- **May 9, 2026 (v0.2)** — Decision to define Sovereign tier with concrete features (dedicated pod, custom voice clone, SSO, on-prem option, quarterly Lorenzo session) instead of "white-glove." Rationale: $2,000/mo requires a clear value gap from $149/mo Pro.

---

## 12. Year 5 Vision

By 2031, Sage is the coach + chief of staff for ~500 founders, executives, ministry leaders, and operators in Lorenzo's extended trust network. Customers stay 5+ years on average because Sage isn't a tool they outgrow — she's a relationship that compounds. Average customer is on Pro tier ($199/mo by then). MRR ~$100K, ARR ~$1.2M, with 15% ($180K/year) flowing to the Institute for Human Advancement — meaningfully funding IHA programming.

The data flywheel by Year 5: 5 years of relational interaction patterns from 500 high-trust customers, anonymized and structured, becomes the proprietary training corpus for Sage's next-generation persona model. No competitor has this data because no competitor serves this specific niche this deeply.

Lorenzo doesn't run Sage day-to-day by Year 3 — a small team (Sage Operator hired at $5K MRR, Customer Success at $20K MRR, Engineer at $50K MRR) operates the product. Lorenzo's role: persona steward, quarterly Sovereign-tier customer reviews, and the public face on Boardroom x Prayer Room.

The product never sells. It's a perpetual cash machine + data engine + IHA funding mechanism. The brand never expands beyond "coach + chief of staff for serious operators." Every annual decision passes one filter: *does this make Sage a better partner for the customer, or just bigger?*

---

## 13. Data Flywheel Architecture (Phase 0)

Sage generates strategic data only if the architecture is designed to extract it. "We'll get data" is not a plan. The Phase 0 deliverable includes:

- **Embedding-only signal layer.** Every conversation produces structured embeddings of (topic, emotional tone, time-of-day, channel, response satisfaction signal). Raw conversation content stays encrypted and tenant-isolated; only the abstracted signals flow to the platform-level analytics layer.
- **Privacy-by-design extraction.** No platform-level access to customer raw content, ever. Internal product analytics derive from aggregate patterns across customers — never from any individual customer's content. This is contract language, not just policy.
- **Persona regression corpus.** Every "this is changing how I work" testimonial, every long retention case, every churn case feeds the persona-eval harness as a regression test. The harness becomes the training signal for future persona refinement.
- **Customer-controlled export.** Customers can export their full conversation history + Sage's memory of them anytime. This is both ethical and a moat: customers who can leave easily stay because they want to, not because they're locked in.

Architectural implication: Phase 0 includes a `signals` table with row-level isolation but platform-level aggregation, designed before any customer conversation is captured. Retrofitting this in Year 2 is impossible without re-prompting every customer for consent.

---

## 14. Summary of Changes

### v0.3 → v0.4 (May 10, 2026)

| # | Change | Why |
|---|--------|-----|
| α | **Hermes Agent runtime DROPPED.** Sage SaaS implements four interfaces (PersonaAdapter, MemoryAdapter, ChannelAdapter, SignalExtractor) directly on Vercel AI SDK 6 + Supabase + grammY. | Sage is a relational coach, not a tool-using agent — no agent loop needed. Eliminates #4 BUSINESS-CRITICAL risk (runtime churn). Interfaces preserve optionality: Hermes (or any other runtime) pluggable later via same interfaces. |
| β | Vercel AI Gateway adopted in Phase 0 (FOUND-10) | Cost tracking + provider observability needed for IHA carve auditing. |
| γ | Drizzle ORM adopted in Phase 0 (FOUND-11) | Type-safe queries against RLS-critical schema; TS-first matches stack. |
| δ | New repo: `TPCMinistries/sage-saas` (not co-located with perpetualcore.com) | Clean ownership, separate CI, scoped engineer access. |
| ε | New Supabase project `sage-saas` (separate from LDC Brain AI) | Tenant data must never theoretically touch personal brain DB; clean RLS story. |
| ζ | Hire trigger moved from $5K → $4K MRR | PITFALLS-recommended 8-week lead time means starting search at $4K so hire lands at ~$5K. |

### v0.2 → v0.3 (May 10, 2026)

| # | Change | Why |
|---|--------|-----|
| A | **Locked positioning: coach + chief of staff (relational), not productivity tool (operational).** | Defensible against OpenAI/Anthropic feature competition. Higher pricing power. Longer customer LTV. Sage is replaced by a deeper relationship, not a better tool. |
| B | Reframed business as **owned perpetual asset**, not startup. No exit, no VC, optimize for cash flow + data + loyalty over 10 years. | Lorenzo's stated intent. Removes growth-at-all-costs pressure. Enables slower, deeper customer onboarding. |
| C | **Perpetual Engine carve increased from 10% → 15% of revenue to IHA.** | Funding IHA is the actual purpose of the business; 15% reflects that. Makes competitive replication structurally impossible. Marketing value exceeds margin loss in target audience. |
| D | Added Section 0 (Positioning) and Section 12 (Year 5 Vision) as canonical reference. | Every downstream decision should pass through the positioning sentence. Year 5 vision keeps the team aligned on what success looks like beyond the next quarter. |
| E | Added Section 13 (Data Flywheel Architecture) as a Phase 0 deliverable. | "We'll get data" without architecture is a hope. Embedding-only signal extraction designed in Phase 0; impossible to retrofit later. |
| F | Reframed competitive landscape: not OpenAI/Anthropic. Competitors are Replika, Pi, Character, Personal AI, AI-augmented executive coaching. | Generic positioning loses to OpenAI. Niche relational positioning has actual whitespace. |
| G | Persona becomes the product, features secondary. Voice everywhere. Channels = presence. Onboarding = ritual. | All flow from the relational positioning. |

### v0.1 → v0.2 (May 9, 2026)

| # | Change | Why |
|---|--------|-----|
| 1 | Killed default dedicated pods. Shared pod with namespace isolation; dedicated pods are Sovereign-only. | Margin protection at Solo + Pro; 6 weeks of ops infra avoided. |
| 2 | Cut WhatsApp + dedicated phone numbers from v1; deferred to v1.5. | Twilio provisioning would block v1 launch. |
| 3 | Added coaching-addon validation track (Months 1–2) before standalone SaaS (Month 3). | Validates willingness-to-pay before sinking 5 weeks into public infra. |
| 4 | Wrapped Hermes behind adapter interfaces from Phase 0. *(Hermes itself dropped in v0.4; interfaces preserved.)* | Optionality if any runtime goes stale or we want to swap implementations later. |
| 5 | Moved persona-eval harness from Phase 6 to Phase 0. | Persona consistency is the moat; can't build it as an afterthought. |
| 6 | Solo tier dropped from $49 to $29 with voice included. | Voice is viral; $29 captures coaching clients more easily; cost recovered by upsell. |
| 7 | Sovereign tier ($2K) given concrete features instead of "white-glove." | Justifies the $1,851 gap from Pro. |
| 8 | Resolved all five Open Questions. | They were all v1-blocking. Decisions documented. |
| 9 | Added "first-hire trigger" at $5K MRR. | Lorenzo-bandwidth risk wasn't actionable in v0.1. |
| 10 | Added validation-fails branch to risk section. | Coaching-addon failure should pivot the product, not push through. |

---

— end of document —
