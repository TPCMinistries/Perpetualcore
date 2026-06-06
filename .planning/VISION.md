# RFP Engine — VISION (the permanent "later", never deleted)

**Purpose of this file:** so "later" is never forgotten. This is the full ambition. The ROADMAP is the *path*; this is the *destination*. Every deferred item below has a **why** and a **revisit trigger** — a tripwire that pulls it from "later" into "now" automatically. Read at the start of every RFP session. Companion: `STATE-COVERAGE-PLAN.md`, `REQUIREMENTS.md` (v2.0 active / v2.1 deferred), `research/SUMMARY.md`.

Last updated: 2026-06-06.

---

## North Star (the full thing — do not lose this)

The single best AI-native capture-operations product on the market — beating Cleatus, Granted.ai, Instrumentl, GovWin, GovDash — that takes an organization from **discovery → qualified pursuit → voice-trained draft → compliance → adversarial review → submission → post-award**, across **government RFPs AND foundation grants** in one feed, with coverage that scales **Federal → all-50-state → Global**, priced transparently with a risk-reversal guarantee. The seam no competitor owns: gov + grants, unified, vault-grounded, audit-grade.

That ambition is real and it stays. What changes is the **order** we build it in.

---

## The bridge principle (how "now" never becomes throwaway)

Every "now" deliverable must be a **load-bearing prefix** of the North Star — the same spine, just less of it. Litmus test before building anything: *"Will we rebuild this when we do the full version?"* If yes, redesign it so the answer is no. Proof we're already doing this: the `rfp_state_coverage` registry + generic Socrata connector — NYC today, all-50 later, **same code**.

---

## NOW — the beachhead (v2.0 active milestone)

**Who:** Lorenzo's own orgs first (Uplift, IHA, TPC) + 2-3 trusted design partners. Workforce/health CBOs, NY/NJ-metro.
**Goal:** win 2-3 real grants/contracts *with the engine* in 90 days. Guaranteed ROI even if we never sell a seat; produces case studies no competitor can fake.
**Definition of done:** "design-partner ready" — a real org can go discovery → submitted, winning proposal on it, safely. NOT "self-serve SaaS ready."

Active build (depth over breadth), in order:
1. **Foundation/stability** — merge PR #4, fix dev tooling, one repo/deploy (Phases 13–14).
2. **Security + cost guardrail** — RLS audit + cross-tenant test, per-tenant AI spend limit (Phases 22, 17).
3. **The win-loop, deep, for ONE vertical** — cited fit-scoring, compliance gate, adversarial review, submission, on the coverage we already have (federal + NY/NJ/NYC + foundations) (Phases 18–20, 24-FTUE).
4. **Dogfood to a real win.** Run live Uplift/IHA bids through it.

---

## LATER — deferred with WHY + TRIGGER (this is the part you were afraid of losing)

| # | "Later" item | Why it matters | Revisit trigger (pulls it into "now") | Spec lives in |
|---|--------------|----------------|----------------------------------------|----------------|
| L1 | **All-50-state coverage** | Breadth for a national customer base | When ≥10 customers/partners request states beyond NY/NJ, OR a paid customer's geo needs it | `STATE-COVERAGE-PLAN.md` (Waves 2–5); registry already built |
| L2 | **Global coverage** (EU TED, UK, Canada, World Bank/UN) | Opens international market | When a customer or Lorenzo entity pursues non-US funding | Phase 16 / source map |
| L3 | **Foundation grants at scale** (ProPublica/990 funder intel as discovery) | Half the unified-feed wedge | When beachhead orgs exhaust gov pipeline and need foundation prospecting | research/STACK (ProPublica) |
| L4 | **Self-serve Stripe billing + public signup** | Required to sell to strangers at scale | When ≥3 design partners say "I'd pay for this" + security passed | Phase 23 |
| L5 | **Win/loss learning loop → score recalibration** | Compounding moat (gets smarter per win) | When ≥5 recorded outcomes per category exist | Phase 21 / REQ SCORE-05 |
| L6 | **Closed-loop submission + amendment diffing at full depth** | "Win the bid" differentiator | When dogfood shows manual submission is the bottleneck | Phase 20 |
| L7 | **Public launch / GTM / pricing + guarantee** | Becomes a real product business | When ≥3 published case studies exist | Phase 25 / GTM-PLAN |
| L8 | **MCP/agent-native + bring-your-own-vault as a platform** | Long-term category position | When the core loop is proven and stable | research/FEATURES |

**Rule:** nothing on this list is abandoned. When its trigger fires, it moves into the active roadmap. Until then it waits here, intact, with its reasoning. Review this table at every milestone close.

---

## The decision you still own

This can be **(a)** a high-leverage internal capture tool that *becomes* a product once it earns it (capital-efficient, beachhead-first — what this plan assumes), or **(b)** a funded, staffed SaaS venture to race Cleatus/Granted head-on. Don't build it like (b) while resourcing it like a side-project — that's the gap that kills side-products. Beachhead-first keeps the door to (b) open without betting the farm on it. Revisit this choice when the beachhead produces its first win.
