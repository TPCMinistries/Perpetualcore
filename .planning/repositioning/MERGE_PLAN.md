# Merge Plan — feat/studio-repositioning → main

**Status:** Drafted ahead of build completion. Update after Session 3 lands.

---

## Pre-merge checklist (Lorenzo runs this in browser)

Before merging `feat/studio-repositioning` to main, verify in a browser running the worktree's dev server:

### Homepage (/)
- [ ] Hero loads with new copy: "We install operating systems for mission-driven organizations"
- [ ] JV-name-check paragraph reads correctly (Anthropic-Blackstone + OpenAI-TPG mentioned)
- [ ] "Engagements start at $75,000" exact string visible
- [ ] 3-card product strip shows Sentinel / Atlas / Sage in that order, NOT all 7
- [ ] Methodology teaser shows 4 phases (Learn / Wire / Automate / Scale)
- [ ] Engine commitment block has $7,500–$25,000+ language and links to /engine
- [ ] Final CTA names exact buyer profiles (foundation program officer, ED, fund OP, regional health system COO)
- [ ] No "Built for Everyone" personas grid present (deleted)
- [ ] No "Stop juggling tools" section (deleted)
- [ ] No "Watch It Learn" / Day 1 → Month 3 timeline on `/` (moved to /products/platform)

### Navigation
- [ ] Top nav: Studio | Products | Industries | Pricing | About + [Sign In] [Start Engagement]
- [ ] Studio dropdown: Engagements / Methodology / Process / Case Studies
- [ ] Products dropdown: Platform / Atlas / Sentinel / Sage / Vellum / RFP Engine / RFP Sentry
- [ ] Industries dropdown links to existing /solutions/* pages
- [ ] One Navbar component used everywhere (not three implementations)

### /studio/engagements
- [ ] Hero: "Engagements start at $75,000"
- [ ] Three engagement bands ($75K / $150K / $250K+) with durations
- [ ] Retainer line: "$5,000–$15,000/month, scoped to engagement"
- [ ] /consulting URL 301-redirects here

### /engine — load-bearing page
- [ ] 6 sections render in order (Hero → 8 Registries → AI-First Framework → Skills library → Engine commitment → Final CTA)
- [ ] 8-node SVG diagram renders (placeholder OK)
- [ ] Cap-table argument in §5 reads correctly
- [ ] Mixed-rate giving table (10% engagements, 15% Sage SaaS, 10% other)

### /about
- [ ] Founder section names IHA, Uplift Communities, DeepFutures Capital
- [ ] No CUNY mention (abstracted to "community-college workforce program")
- [ ] No specific Nairobi parishes named (abstracted to "parish-network field deployment")
- [ ] /about §5 closing line "joint ventures haven't called you back" (or your edit)

### /pricing
- [ ] Engagements section LEADS the page (above Platform tiers)
- [ ] Platform tiers: Free / $49 / $99
- [ ] License + Embedded = "Contact us"
- [ ] Footer: "Every engagement funds the Institute for Human Advancement. 10% of revenue."

### /studio + /studio/methodology + /studio/process + /studio/case-studies (Session 2)
- [ ] All 4 routes exist and render
- [ ] /studio/case-studies shows 3 abstracted slots with placeholder NDA copy (not fabricated metrics)
- [ ] /studio/methodology §3 "What we don't do" shows the 5 antipattern bullets

### /products + /products/* (Sessions 2-3)
- [ ] /products portfolio shows 7 cards in correct order: Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform
- [ ] /products/platform has all the moved sections (Bento, InteractiveDemo, ComparisonTable, ExecSuite, UseCases, "Watch It Learn", "Built for Every Industry", "11 Models. One Price.")
- [ ] /products/atlas has by-invitation card pattern, "Request introduction" CTA, NO pricing
- [ ] /products/sentinel links to live sentinel.perpetualcore.com
- [ ] /products/sage links to sage.perpetualcore.com (subdomain may not resolve yet — page still ships)
- [ ] /products/vellum has 4-tier pricing, "Vellum by Perpetual Core" qualifier, 30% 501(c)(3) discount line
- [ ] /products/rfp-engine 301-redirects to /rfp (preserves SEO)
- [ ] /products/rfp-sentry stub with early-list email capture

### Mobile
- [ ] Homepage at 375px: hero readable, no horizontal scroll
- [ ] Nav drawer/hamburger works
- [ ] /engine at 375px: 8-node diagram doesn't overflow
- [ ] /products grid at 375px: cards stack cleanly

### Correctness sweep (BRIEF_RECONCILED A8)
- [ ] No "Uplift" reference in 10%-giving context (must be "Institute for Human Advancement")
- [ ] No client names (CUNY, specific parishes, specific UN agencies)
- [ ] License tier "Contact us" only — no published price
- [ ] All retired sections actually deleted from `/`
- [ ] Compliance claims: hedged or verified (Session 3 sweep)

---

## Merge strategy

**Option A — Squash merge (recommended).** All 19-21 commits squash into one feature commit on main. Clean main history. Easier to revert as a unit.

**Option B — Merge commit.** Preserves Session 1/2/3 atomic commits in main history. More commits but easier to bisect if a regression surfaces.

**Option C — Rebase + merge.** Linear history, atomic commits preserved. My preference if main has moved (second-RFP session committed).

Lorenzo's call. Default if unspecified: Option C.

## Merge prerequisites

1. ✅ All Session 1-3 commits land on `feat/studio-repositioning`
2. ✅ Typecheck + build + lint all pass
3. ✅ Manual browser QA checklist above all green
4. ✅ Second-RFP session has committed its work to main (or branched separately)
5. ✅ Compliance-claim hedging reviewed by Lorenzo (and ideally legal counsel)
6. ✅ Real founder photo provided (or Lorenzo OK with placeholder for first deploy)

## After merge

- Deploy to Vercel preview first (push to main triggers preview if main is preview-tracked)
- Smoke-test the preview URL against the QA checklist
- If green: promote preview to production
- Update `MEMORY.md` repositioning entry: status → DEPLOYED
- Send a one-paragraph update to whoever runs the IHA site about the cross-brand "Perpetual Engine" disambiguation (so theiha.org stays consistent)

## Draft PR description

```markdown
## Perpetual Core Studio Repositioning

Repositions perpetualcore.com from a $49/mo SaaS hero into the AI-first studio that installs operating systems for mission-driven organizations.

### What changes for visitors
- Homepage leads with engagements ($75K floor), not the platform
- New /studio surface (engagements, methodology, process, abstracted case studies)
- New /engine page — the 8 registries, AI-First Framework, skills library, and the 10–15% commitment to the Institute for Human Advancement, bundled
- New /products portfolio of 7 products, ordered: Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform
- /about reframes Perpetual Core as the for-profit infrastructure entity inside the IHA ecosystem
- /pricing leads with engagements; Platform tiers preserved below

### What's preserved
- Visual system (palette, type, logo) — sharpened per UI audit but not redesigned
- Existing /solutions/* industry pages (with new banners linking to /studio/engagements)
- Existing /agents and /features platform feature pages
- Platform pricing (Free / $49 / $99) at /products/platform

### Non-obvious decisions
- "Sage" splits into TWO products: relational coach SaaS (B2C, sage.perpetualcore.com) and Vellum (institutional memory, /products/vellum). The brief's "Sage = knowledge synthesis" was renamed.
- Atlas is by-invitation only — no public pricing, "Request introduction" CTA only.
- RFP becomes two products: RFP Engine (response/drafting, live) and RFP Sentry (bid intel, in build).
- "Background Check" folded as Sentinel Quick Vet tier; not a standalone product card.

### Records on disk
Architecture, copy docs, audit findings, and per-session reports in `.planning/repositioning/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
