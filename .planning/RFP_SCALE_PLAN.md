# RFP Engine Scale Plan

Last updated: 2026-06-01

## North Star

Build the best grant and RFP sourcing and capture operating system for nonprofits, workforce programs, education providers, faith/community organizations, and small public-sector vendors.

The product should not just search opportunities. It should move the user from discovery to qualified pursuit, draft, compliance, review, submission readiness, and post-submission follow-up.

## Truth Rule

Do not claim a live indexed inventory number unless production can verify it from `rfp_opportunities` and source health. If the system says "80k+ opportunities," production needs to actually index and search that level of verified records, or the copy must frame it as target coverage.

Current verified production health from the last operator check:

- Indexed opportunities: 211
- RFP health: degraded
- Open source drift: 18
- Latest successful RFP cron: healthy
- Main risk: source coverage and parser drift, not UI polish

## This Week's Definition Of Workable

The app is workable for a private beta this week when:

1. Opportunity search returns real, recent, deduplicated opportunities across the live sources.
2. Admin can see source coverage, drift, ingestion volume, and planned source gaps.
3. Users can import an opportunity URL, triage it, save pursuit state, and open a pursuit workspace.
4. A pursuit workspace can produce at least a first-pass draft, compliance checklist, decision log, and command files.
5. Voice/vault data improves quality but is not required for initial discovery.
6. The product avoids unverified source-scale claims.

## Scale Strategy

### P0: Make the current engine reliable

- Resolve existing open drift events.
- Add source readiness tracking to `/admin/rfp`.
- Confirm daily baseline counts for federal, New York, and NYC sources.
- Tighten dedupe so the same opportunity does not appear from multiple feeds as separate pursuits.
- Add alert thresholds: source fetch failure, parsed count collapse, zero new records for expected-active sources.

### P0: Expand high-value public coverage

- Federal: SAM.gov, Grants.gov, Simpler Grants, SBIR/STTR.
- New York/NYC: NY State Contract Reporter, NYC PASSPort, DYCD, DOE, HRA.
- Nearby state expansion: CA is live from the official California Grants Portal
  datastore; NJ, CT, and PA remain next-state connector targets.
- Research/innovation: NIH Guide, NSF funding search.

### P1: Add funder intelligence without mixing it into open opportunity counts

- IRS 990 foundation profiles.
- Corporate giving and bank CRA programs.
- Candid/Foundation Directory only if licensing/API terms allow it.

Funder profiles should power recommendations and outreach, but should not be counted as open RFP/grant opportunities unless there is an actual current opportunity record.

### P1: Become stronger than basic grant search tools

- Fit scoring that explains "why this matches."
- Pursuit/no-pursuit decision workflow.
- Compliance matrix from actual attachments and page text.
- Attachment/page-limit/form extraction.
- Deadline calendar and submission checklist.
- Reusable org profile, programs, outcomes, budgets, and boilerplate library.
- Team assignments and reviewer workflow.
- Post-submission status tracking.

### P2: Distribution and reach

- Weekly opportunity digest by org profile.
- Saved searches and alerts.
- Regional packs for nonprofit/workforce/education users.
- Partner landing pages by niche.
- Public SEO pages for non-sensitive opportunity summaries if allowed by source terms.

## Competitive Bar

The app should beat CLEATUS.ai and Granted.ai by combining:

- Broader source coverage with transparent source health.
- Better opportunity qualification, not just more search results.
- End-to-end pursuit management.
- Draft generation grounded in user vault, prior wins, compliance requirements, and funder language.
- Operator controls for drift, ingestion, AI cost, and tenant activity.

## Immediate Backlog

1. Source readiness dashboard in `/admin/rfp`.
2. Resolve production drift events and refresh source baselines.
3. Add additional public connectors in order: NJ, CT, PA, NIH, NSF.
4. Add verified opportunity count to discovery UI instead of static "80k+" copy.
5. Add attachment extraction for imported opportunities.
6. Add saved searches and alert subscriptions.
7. Add exportable proposal packet: DOCX, PDF, compliance matrix, attachments checklist.
8. Add founder/operator QA checklist before every deploy.
