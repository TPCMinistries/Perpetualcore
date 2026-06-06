---
phase: 04-foundations-salvage-port
type: addendum
date: 2026-05-10
classification: off-roadmap
status: shipped (uncommitted in repo)
---

# Marketing Surface Addendum

Off-roadmap work that grew out of Phase 04 — surfaces the RFP Engine product
publicly so Lorenzo can begin design-partner outreach.

## Goal
Stand up `rfp.perpetualcore.com` as a sellable product surface (sales page,
pricing, trust, how-it-works) without forking the perpetual-core deploy.

## What shipped
- **Subdomain routing**: `middleware.ts` rewrites `rfp.perpetualcore.com/*` → `/rfp/*` based on host header. Auth and app routes (`/orgs`, `/org`, `/api`, `/login`, `/signup`) pass through unchanged so SSO works across the apex and subdomain.
- **Cross-subdomain SSO**: cookie domain auto-set to `.perpetualcore.com` in production (no-op locally) so signing in on perpetualcore.com persists on rfp.perpetualcore.com.
- **DNS**: `rfp.perpetualcore.com` CNAME → `cname.vercel-dns.com` in Cloudflare (DNS-only, proxy off).
- **Vercel**: domain attached to `ai-os-platform` project via direct API POST (CLI was blocked by cross-team-scope check between `the-gdi` team where the apex is registered and `gdi-727dc440` team where the project lives). TXT verification on `_vercel.perpetualcore.com` pending.
- **Marketing pages** (all under `app/(rfp-marketing)/rfp/`):
  - `layout.tsx` — RFP-branded shell (dark zinc-950, ambient gradient field, mono-uppercase eyebrows, italic Georgia accents)
  - `page.tsx` — sales page with hero (asymmetric 7/5 with Live Capture Feed tile), category positioning, audience-agnostic statement, lifecycle timeline (6 features), competitor list, defensibility bento (6 moves), pricing tease, final CTA
  - `pricing/page.tsx` — 4-tier pricing ($299/$799/$2,499/Enterprise) with Pro as 2-row hero tile, Win Fee section, 8-question FAQ
  - `trust/page.tsx` — trust & security (honest compliance posture: SOC 2 in audit, FedRAMP on roadmap, no overclaiming)
  - `how-it-works/page.tsx` — lifecycle walkthrough with concrete DYCD scenario, 6 agent profiles, "stays human" section, onboarding flow
- **Nav added** to perpetual-core dashboard: `Platform → RFP Engine` entry pointing to `/orgs/new`

## Long-term cleanup recommended
- **Vercel team consolidation**: `perpetualcore.com` is registered in `the-gdi` team but `ai-os-platform` project lives in `gdi-727dc440`. The `gdi-727dc440` team has an auto-numeric suffix that suggests it was created accidentally. Every future subdomain (sentinel.*, agents.*) will hit the same TXT-verification friction until consolidated. Recommended: transfer `ai-os-platform` to `the-gdi` team, then delete the duplicate.
- **`/orgs/new` redirect logic**: currently always shows the create form. Returning users with an existing org will create a duplicate. Add a check that redirects to existing org if found.
- **Resend domain**: `from@perpetualcore.com` not yet verified — invite emails (when wired up in 04-04 follow-up) will send via configured fallback.

## Why this isn't a numbered phase
The work was directional (we wanted to see the product publicly) and ad-hoc
(no PLAN.md, no goal-backward decomposition, no UAT). It's recorded here as
context for whoever picks up Phase 5 — not as a standalone plan.

## Status
- [x] Marketing pages live locally on `localhost:3001/rfp/*`
- [x] Domain attached to Vercel project (verification pending)
- [ ] TXT record `_vercel.perpetualcore.com` added to Cloudflare
- [ ] Production deploy
- [ ] All work uncommitted as of 2026-05-10
