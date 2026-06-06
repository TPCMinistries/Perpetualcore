# Pitfalls Research

**Domain:** AI RFP/Grant Capture SaaS — Multi-Source Discovery, Explainable Scoring, Adversarial Review, Submission Tracking
**Researched:** 2026-06-05
**Confidence:** HIGH (security/RLS/billing from ecosystem experience + official sources; data-quality and legal from official API terms + verified community; AI risks from NIH/GSA official guidance)

---

## Critical Pitfalls

### Pitfall 1: Silent Parser Drift — Scrapers Keep Running, Data Goes Corrupt

**What goes wrong:**
A source (state portal, agency site, NY PASSPort) silently changes its HTML structure or pagination. The parser continues executing, returning zero or malformed records without raising an error. The cron job reports "success" because it completed without a thrown exception. Users see stale or empty results weeks later. This is already happening: 18 open source-drift events at 211 indexed opportunities is the live symptom.

**Why it happens:**
Parsers are written against a snapshot of a site's DOM. Government sites update without notice. Scrapers validate execution success ("did it run?") rather than output quality ("did it produce plausible records?"). No baseline count comparison means collapse goes undetected.

**How to avoid:**
1. After every parse run, compare the fetched record count against a rolling baseline (e.g., last 7-day average ± 30%). If count falls below threshold, mark the source `degraded` and fire an alert — do NOT let degraded sources silently pollute the feed.
2. Implement a `source_health` table with fields: `last_successful_fetch`, `last_record_count`, `baseline_count`, `drift_events[]`, `status (healthy/degraded/dead)`. Surface this in `/admin/rfp` before any other UI work.
3. For HTML scrapers: pin a structural fingerprint (e.g., hash of the top-level container XPath). On mismatch, halt and alert rather than ingest garbage.
4. Resolve all 18 current drift events before expanding to new sources. Expanding on a broken foundation compounds errors.

**Warning signs:**
- Record count for an active source drops more than 50% week-over-week.
- `rfp_opportunities` row count plateaus for >3 days on a source expected to produce daily results.
- Drift event count keeps climbing without corresponding alerts firing.
- Users report "no results" for searches that should return results.

**Phase to address:** P0 (Source Reliability & Health SLA) — before any discovery expansion.

---

### Pitfall 2: Dedup Failure — Same Opportunity Appears in Multiple Sources

**What goes wrong:**
SAM.gov and Grants.gov both publish many of the same federal opportunities. A state agency cross-posts to its own portal AND to a federal feed. The same opportunity appears 2–3 times in search results under different internal IDs. Users chase duplicates. Pursuit workspaces fragment. Counts are inflated. When you fix dedup retroactively, existing pursuits point to orphaned records.

**Why it happens:**
Dedup at ingestion time requires a canonical identifier strategy. Government data has no universal opportunity ID — SAM.gov uses solicitation number, Grants.gov uses opportunity ID, state portals use their own codes. Naive dedup on title alone collides on similarly named programs. No dedup means count inflation; aggressive dedup on title means false merges.

**How to avoid:**
1. Define a dedup key hierarchy before adding any new source: `(source_agency, solicitation_number_normalized)` as primary; title + funder + deadline within a 30-day window as fuzzy fallback. Never dedup on title alone.
2. Add a `canonical_id` field to `rfp_opportunities` at the schema level now. Multi-source records that resolve to the same canonical opportunity link to one canonical record; source-specific records become satellites.
3. Run a dedup audit on the existing 211 records before expanding coverage. Establish a clean baseline.
4. Never inflate displayed counts with undeduped totals. RFP_SCALE_PLAN.md's Truth Rule ("Do not claim a live indexed inventory number unless production can verify it") is exactly right — enforce it in UI code via `verified_count` computed from the canonical table, not raw source table row count.

**Warning signs:**
- The same funder/program name appears twice in search results with different internal IDs.
- User creates a pursuit on one record, finds the "same" opportunity already in another pursuit.
- Opportunity count jumps unexpectedly when a new source is added.

**Phase to address:** P0 (Source Reliability) — dedup schema must be in place before new sources ingest.

---

### Pitfall 3: SAM.gov 90-Day API Key Expiration Kills Discovery Silently

**What goes wrong:**
SAM.gov individual-account API keys expire every 90 days. If the renewal is missed (or the system account re-registration — which was already "pending" per project state — is not completed), all SAM.gov ingestion silently stops. The cron job may return auth errors that get swallowed, the source shows 0 new records, and the health dashboard shows "degraded" rather than "key expired." This is already a live risk given the known re-registration issue.

**Why it happens:**
Key rotation is a manual process with a 15-day renewal window. It requires a human action (retrieve the new key, update the environment variable, redeploy). Teams miss the 15-day window because the email goes unread or the reminder lands in a non-monitored inbox. Production depends on a secret that has a hard expiry calendar built in.

**How to avoid:**
1. Complete the pending SAM.gov system account re-registration immediately — before any other discovery phase work.
2. Store the key expiry date in the `source_health` table. Add a cron job that alerts when any API key is within 21 days of expiry (more than the 15-day renewal window to create slack).
3. Add SAM.gov auth failure as a distinct health status separate from parse failure, so the admin dashboard distinguishes "key expired" from "site changed."
4. Consider using a system account (not individual account) for production — system account keys do not expire on the 90-day individual cycle.

**Warning signs:**
- SAM.gov ingest shows HTTP 401 or 403 in logs.
- Source health shows 0 new federal records for >48 hours without a corresponding site outage.
- The admin dashboard shows "SAM.gov: degraded" with no parse errors — suspect key expiry first.

**Phase to address:** P0 (Source Reliability) — resolve before launch, then build the key-expiry alerting into the health dashboard.

---

### Pitfall 4: Compliance Gate Displays Wrong Timezone — User Misses a Submission Deadline

**What goes wrong:**
A real nonprofit customer misses a $500K HHS submission because your compliance gate showed the deadline in their local timezone (ET) when the solicitation stated it in a different timezone (PT or UTC). This is the highest-reputation-risk failure mode in the product. A single missed deadline caused by timezone display error could trigger a chargeback, legal demand, and public negative review. The NIAID explicitly warns: submit to the calendar, not the clock.

**Why it happens:**
Deadline data arrives from sources in mixed formats: some post UTC, some post "5:00 PM ET," some post just a date with no time. Parsers normalize to a single storage format (usually UTC) but the display layer shows local time without displaying the source timezone. Users assume local time.

**How to avoid:**
1. Store ALL deadlines in UTC in the database with a separate `deadline_timezone_source` field capturing the raw timezone string from the solicitation ("Eastern Time," "5:00 PM ET," "midnight PT," etc.).
2. Display deadlines in BOTH the stored UTC equivalent AND the timezone as stated in the solicitation. Never just show local time.
3. Add a compliance gate rule: if deadline timezone cannot be definitively parsed from the source document, flag the deadline as "Timezone Unverified — Check Original Solicitation" with a link to the source URL.
4. Surface the raw deadline string from the source alongside the computed value, so users can spot discrepancies.
5. Never allow the compliance gate to show a deadline without showing the solicitation's stated timezone next to it.

**Warning signs:**
- Deadline fields showing only dates (no times) from scraped sources.
- Compliance gate displaying deadlines without a timezone badge.
- Users in test asking "is this ET or my local time?"

**Phase to address:** Phase covering Compliance Gate v1 — must be a hard requirement before any paying customer uses compliance features.

---

### Pitfall 5: Cross-Tenant RLS Leakage — One Org's Pursuits Visible to Another

**What goes wrong:**
An RLS policy is written as `USING (true)` or uses the service role key in a route that returns data without org-scoping, allowing one tenant's draft, pursuit, or org profile data to be returned to a different authenticated tenant. This exact pattern has already occurred in this ecosystem (analytics-view PII leaks, `USING(true)` bugs on Workforce and TPC). For an RFP product where org strategy is the crown jewel, cross-tenant leakage is a catastrophic trust failure.

**Why it happens:**
- Developers use `createAdminClient()` (service role) in API routes without adding explicit org_id filters in the query — the service role bypasses RLS entirely.
- RLS policies on `rfp_opportunities` (shared table) are correctly scoped, but `rfp_pursuits`, `rfp_drafts`, or `rfp_rubric_reviews` use `USING (true)` as a placeholder that never gets hardened.
- Joined queries — RLS on the root table fires correctly but a joined table lacks a policy, leaking data through the join.
- Analytics and admin views are created with `security_definer` or `SECURITY INVOKER` set wrong, and anon/auth roles are not revoked.

**How to avoid:**
1. Before launch: run a full RLS audit on every table in the RFP schema. Every table with org or user data must have an explicit `USING (org_id = get_org_id_from_jwt())` policy or equivalent. Zero `USING (true)` policies on data tables.
2. Application-layer defense: even with RLS, all server-side queries that return tenant data must include an explicit `.eq('org_id', orgId)` filter. Defense in depth — RLS is a backstop, not the only gate.
3. Separate the `rfp_opportunities` (shared public data) from `rfp_pursuits` / `rfp_drafts` (tenant-private data) in both schema design and RLS policy logic.
4. For analytics views: set `security_invoker = true`, revoke `SELECT` from `anon` and `authenticated` roles, verify with `\dp` in psql after every migration.
5. Create a CI test that authenticates as two different test orgs and asserts Org A cannot read Org B's pursuits, drafts, or rubric reviews.

**Warning signs:**
- Any `USING (true)` in a migration on a table that contains org-specific data.
- An API route using `createAdminClient()` that returns data without an explicit `org_id` WHERE clause.
- A view created without explicit role grants/revokes.
- The Supabase advisor flagging "RLS disabled" on any table.

**Phase to address:** Security/RLS Audit phase — must be a complete gate before Stripe goes live. Also: apply the CI cross-tenant test in the foundation work so it runs on every PR.

---

### Pitfall 6: AI Hallucination in Fit Scores and Rubric Extractions

**What goes wrong:**
The fit-scoring AI invents a citation from the org's vault that doesn't exist ("your 2023 HHS grant achieved 94% outcomes" when no such grant is in the vault). The rubric extractor hallucinates evaluation criteria not present in the actual solicitation Section M. A customer submits a proposal that was "scored 87/100" by the adversarial reviewer, but the reviewer was scoring against fabricated criteria. The proposal fails. The customer blames the product.

**Why it happens:**
LLMs produce confident-sounding text even when they have no grounding for a claim. Fit scoring over sparse vault data is particularly vulnerable — if the org has few prior wins in their vault, the model fills gaps with plausible-sounding fabrications. Rubric extraction from PDFs fails when OCR is poor or the document uses non-standard section labeling.

**How to avoid:**
1. Fit scoring must be citation-grounded: every score rationale must point to a specific retrieved chunk from the vault (RAG reference with source document + page/chunk ID). If no relevant chunk exists, the system must say "Insufficient vault data — score is estimated, not evidence-based" rather than fabricate.
2. Rubric extraction: store the raw extracted text alongside the structured rubric. Display both in the UI so users can verify the extraction against the source. Flag any rubric criterion that was inferred (not directly quoted) with a "verify against source" badge.
3. Add a "hallucination guard" prompt layer: after extraction, ask the model "for each criterion listed, quote the exact sentence from the document that supports it." If the model cannot quote it, drop the criterion or flag it as inferred.
4. Never show a composite fit score without showing the component scores and their evidence. A score of "87/100" without a breakdown is unverifiable and untrustworthy.

**Warning signs:**
- Fit score rationales that don't cite specific vault documents.
- Rubric criteria with no direct solicitation text quote.
- Score variance of >20 points between runs on the same opportunity with the same vault (suggests hallucination, not reasoning).

**Phase to address:** Fit Scoring and Adversarial Rubric Review phases — build citation-grounding into the architecture from day one, not as a retrofit.

---

### Pitfall 7: Per-Tenant AI Cost Runaway

**What goes wrong:**
One tenant triggers a batch job that runs the full suite: discovery ingestion + fit scoring + rubric extraction + draft generation across 200 opportunities. The job runs for 6 hours, burns $3,000 in Claude/OpenAI tokens, and the platform eats the cost because there are no per-tenant hard limits. If multiple tenants do this on the same day (or a misconfigured cron fires in a loop), the month's AI budget is gone before the 10th.

**Why it happens:**
Multi-step AI pipelines (discovery → score → extract → draft) have token costs that compound. A single draft + rubric review for a complex 50-page RFP can cost $2–5 in LLM tokens. At 200 opportunities per tenant, that's $400–$1,000 per tenant per full sweep. Without per-tenant cost tracking and hard limits, there is no circuit breaker.

**How to avoid:**
1. Build a `tenant_ai_usage` ledger table from day one: record every LLM call with `(org_id, model, input_tokens, output_tokens, cost_usd, feature_type, timestamp)`. This is the source of truth for cost enforcement and for the operator billing dashboard.
2. Enforce hard limits per tier before each LLM call: check remaining monthly token budget, reserve the expected cost, reject if over limit. Do not let the LLM call succeed and then discover the overage.
3. Soft limits (at 80% of monthly budget): notify the org admin via email and show a warning in the UI. Hard limits (100%): block AI features and show an upgrade prompt.
4. For batch operations (fit scoring across all 200 weekly opportunities): require explicit user confirmation with a cost estimate before the job runs ("This will score 200 opportunities. Estimated cost: 50 AI credits. Proceed?").
5. Map AI credits to Stripe entitlements by tier — do this in the billing phase, not as an afterthought.

**Warning signs:**
- No row in a `ai_usage_log` or equivalent table tracking per-org costs.
- Batch scoring jobs with no confirmation gate.
- Monthly AI bills that cannot be attributed to specific orgs.
- LLM calls triggered by cron without a per-org quota check.

**Phase to address:** Billing and AI cost metering phase — must be in place before public launch. The usage ledger can be built early (foundation) and enforced at billing time.

---

### Pitfall 8: Legal/ToS Violations — Storing or Redistributing Restricted Source Data

**What goes wrong:**
The product ingests and stores data from sources whose terms prohibit storing or redistributing their data for commercial purposes. Candid/Foundation Directory is a specific risk: their API terms grant only "internal, personal, and/or non-commercial purposes" on the free tier, and commercial use requires a negotiated license. Building a feature that queries Candid data and stores it in `rfp_opportunities` for redistribution to paying tenants likely violates their terms. A cease-and-desist or data-pull requirement mid-launch is a significant incident.

**Key per-source findings (verified from official terms):**
- **SAM.gov (public API):** Public opportunity data can be displayed and redistributed. Sensitive API data (entity management, contractor history) cannot. SAM.gov individual API keys must rotate every 90 days. Public opportunities data is explicitly public domain.
- **Grants.gov:** Permitted uses include search, display, analyze, retrieve. Must display "This product uses the Grants.gov API but is not endorsed or certified by Grants.gov." Low legal risk for displaying opportunity data.
- **Candid/Foundation Directory:** Free/trial tier is explicitly non-commercial and limited. Commercial use requires a paid API License Agreement. Storing their data in a product that charges customers almost certainly requires a commercial license. Do NOT ingest Candid data without a signed agreement.
- **IRS 990 data (direct from IRS):** Publicly available. No legal restriction on accessing or using public 990 filings. Safe.
- **EU TED (Tenders Electronic Daily):** Data is publicly available under EU open data principles. The search API can be accessed anonymously. Redistribution of public procurement notices appears permissible. Verify the specific TED Developer Portal terms before launch.
- **UK Contracts Finder:** Published under Open Government Licence — commercial use and redistribution are explicitly permitted.
- **GDPR (when indexing EU opportunities):** Scraping EU public procurement notices is low risk — they contain no personal data of private individuals. Risk rises only if you collect or store contact data of EU-resident individuals (procurement officers, foundation staff). If you store any EU-resident personal contact data, you need a privacy policy addressing GDPR and a legitimate interest basis.

**How to avoid:**
1. Create a source-terms registry: for each source, document the license/terms, what is permitted, and what requires a paid agreement. Make this a required step before any new source is added to production.
2. For Candid: do not ingest or store without a commercial license. Use IRS 990 public data (which IS free) for foundation intelligence instead, and be explicit in the product about what powers funder profiles.
3. Add the required Grants.gov attribution notice to the discovery UI.
4. Do not display or store SAM.gov "sensitive" fields (banking, proprietary contract data). Public opportunity fields only.
5. For GDPR: add a privacy policy before enabling Global (Level 3) coverage. Scope the policy to explain data collected about users (not about the opportunities themselves).

**Warning signs:**
- A source was added to the scraper pipeline without a corresponding entry in a source-terms registry.
- Candid data appearing in `rfp_opportunities` without a commercial license on file.
- No Grants.gov attribution notice in the product UI.

**Phase to address:** Legal/ToS review phase — should be a gate before each new coverage level ships. Level 1 (federal) is mostly safe. Level 2 (foundations/990) requires Candid terms review. Level 3 (global) requires GDPR policy.

---

### Pitfall 9: Stripe Webhook Reliability — Entitlement Drift and Trial-to-Provision Races

**What goes wrong:**
A user completes checkout. Stripe fires `checkout.session.completed`. The webhook handler fails (timeout, DB error, upstream exception). Stripe retries after 1 hour. In the gap, the user has paid but the system shows no active subscription — they hit the upgrade wall. Alternatively: the webhook fires twice (Stripe guarantees at-least-once delivery), the handler is not idempotent, and the org is provisioned twice or the quota is reset incorrectly. The RFP Engine already has a wired webhook (`we_1TZb39IwAPnWjXPHK87nPL4F`) — but the idempotency and retry handling needs explicit verification.

**Why it happens:**
Stripe delivers webhooks asynchronously. A 200ms database transaction during high load can exceed Stripe's response timeout (5 seconds), triggering a retry. Without idempotency keys stored in the database, the retry creates a duplicate action. Without a webhook event log, you cannot diagnose what happened during a failed provisioning.

**How to avoid:**
1. Log every incoming Stripe event to a `stripe_events` table: `(stripe_event_id, type, status, raw_payload, processed_at)`. Check this table before processing — if the event ID is already present and `status = 'success'`, skip and return 200.
2. Wrap all provisioning logic in a database transaction. If any step fails, the entire provisioning rolls back. On retry, the idempotency check catches it and re-attempts cleanly.
3. Process the webhook in under 3 seconds (return 200 immediately, queue the heavy work). For heavy provisioning (creating org, seeding entitlements, sending welcome email), use a background job triggered by the webhook, not inline processing.
4. Handle the trial-to-provision race explicitly: after Stripe checkout redirect, the success page should poll a `/api/billing/status` endpoint (with exponential backoff) until the subscription is confirmed in the database — not assume it's ready on first load.
5. Test: simulate a webhook delivery failure and verify retry works without double-provisioning.

**Warning signs:**
- No `stripe_events` table or equivalent idempotency log.
- Webhook handler performs database writes inline without a transaction.
- The success page does not poll for subscription state — it assumes immediate consistency.
- No alerting when webhook processing fails (Stripe dashboard shows failed deliveries that go unnoticed).

**Phase to address:** Billing hardening phase (Stripe Live) — must be verified before going live.

---

### Pitfall 10: Inflated Opportunity Counts — "80k+" Claims With 211 Indexed

**What goes wrong:**
Static copy claiming "80,000+ opportunities" when the verified production count is 211 is already live (the RFP_SCALE_PLAN.md explicitly calls this out). A paying customer searches, gets 3 results for their niche, and compares to the "80k+" claim — instant trust destruction and likely chargeback. This is the fastest way to damage word-of-mouth in a market where grant professionals talk to each other.

**Why it happens:**
Marketing copy is written against the aspirational roadmap, not the current production state. The UI count is hardcoded rather than queried from the database.

**How to avoid:**
1. Remove ALL hardcoded opportunity count claims from UI and marketing copy before any paid customer accesses the product.
2. Replace with a live-computed `verified_count` queried from the canonical opportunities table, with a "last updated" timestamp.
3. For sources not yet live, show "Coming Soon: [Source Name]" with no count.
4. Optionally: show count per source in the discovery UI, so users understand the composition ("211 federal opportunities from SAM.gov, Grants.gov, and SBIR").
5. The Truth Rule from RFP_SCALE_PLAN.md must be enforced in code: make it impossible to display a static number by removing the hardcoded string and requiring the UI to fetch from the API.

**Warning signs:**
- Any hardcoded number in UI components (search for "80k", "80,000", or "opportunities" in JSX/TSX).
- Marketing copy that references a count higher than what `SELECT COUNT(*) FROM rfp_opportunities WHERE status='active'` returns.

**Phase to address:** P0 / Source Reliability — before any paid customer gets access.

---

### Pitfall 11: PR #4 Merge Collision — 70+ Commits Diverged from Main

**What goes wrong:**
PR #4 is 70+ commits ahead of main and has not been merged. The longer this remains open, the more divergence accumulates. When it is finally merged, conflicts in migration files cause duplicate or skipped migrations, resulting in schema drift between what the code expects and what the production database has. This is especially dangerous for RLS policies — a migration conflict can silently drop or duplicate a policy.

**Why it happens:**
Large PRs accumulate because each feature needs the previous one. Without a regular merge-to-main cadence, the branch diverges to the point where merging is a multi-hour conflict resolution exercise. The ecosystem has explicit history of this pattern (Sage feat/studio-repositioning at 49 commits, Uplift exam-engine parallel session divergence).

**How to avoid:**
1. Merge PR #4 to main immediately — before adding any new features in this milestone. Every commit added while PR #4 is open makes the eventual merge harder.
2. After merge: verify the production database schema matches the migration history by running `supabase db diff` or equivalent. Do not assume the deployment applied all migrations in order.
3. Going forward: no feature branch should exceed 2 weeks without a merge or at least a rebase against main.
4. Protect migrations: each migration file should have a unique, timestamped name. Never rename or edit a migration file after it has been applied to any environment.

**Warning signs:**
- `git log main..feat/branch --oneline | wc -l` > 20.
- Migration files in the PR that conflict with main branch migrations.
- Vercel production deployment was last triggered from a branch, not main.

**Phase to address:** First phase / immediate pre-work — do this before anything else in the milestone.

---

### Pitfall 12: Federal AI Disclosure Requirements for Customers Using Drafts

**What goes wrong:**
A customer uses the product's AI drafting feature to produce a federal contract proposal. The resulting proposal does not disclose AI use. GSA's proposed GSAR clause 552.239-7001 (February 2026) would require federal contractors to disclose all AI tools used in contract performance, including proposal drafting. NIH already states that AI-substantially-drafted proposals may be considered research misconduct. If a customer's federal submission is reviewed and found to contain undisclosed AI-generated content, the customer faces disqualification or worse — and they blame the tool they used.

**Why it happens:**
The product's terms of service and UI do not inform users of the disclosure obligations their downstream submitters face. AI drafting tools in the grant space have been built faster than the disclosure frameworks that govern their use.

**How to avoid:**
1. Add a disclosure notice in the draft output: "This draft was generated with AI assistance. Federal and some foundation funders may require disclosure of AI use. Review your solicitation's AI use policy before submission."
2. Include an AI Use Disclosure section in the product's ToS that clearly states the user is responsible for compliance with their funder's AI-use policies.
3. Add a compliance gate checklist item: "Have you reviewed the solicitation's AI use policy?" — required to mark a pursuit as submission-ready.
4. For NIH/federal agency submissions specifically, flag the opportunity type and surface a warning: "NIH guidance (NOT-OD-25-132) states AI-substantially-developed applications may not be considered original work."
5. Add the AI use disclosure to the legal pages before launch.

**Warning signs:**
- Draft output has no disclaimer about AI use.
- Legal pages (ToS, privacy) don't mention AI-generated content disclosure obligations.
- The compliance gate has no AI disclosure checklist item.

**Phase to address:** Legal pages phase and Compliance Gate v1 phase — both must address this before paid launch.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `USING (true)` RLS placeholder | Gets feature working fast during dev | Cross-tenant data leakage in prod; requires audit-and-rewrite later | Never in any table holding tenant data |
| Hardcoded opportunity counts in UI copy | Avoids building a live count endpoint | Trust destruction when users see discrepancy | Never — remove before any paid user access |
| Service role key in Next.js API routes without org_id filter | All queries succeed; no debugging RLS | Bypasses all tenant isolation; one route leaks everything | Only in admin-only routes with explicit admin auth check |
| Batch AI scoring without cost guards | Users get rich data quickly | Uncontrolled cost runaway; shared budget exhausted by one tenant | Never without a per-tenant cost limit in place |
| Single SAM.gov API key with no expiry alert | Simple setup | Discovery silently dies at 90 days; no warning | Never in production — expiry alerting must be paired |
| Scraper "success" = completed without exception | Easy to implement | Silent data corruption from parser drift goes undetected for weeks | Never — output validation (record count vs. baseline) required |
| Inline webhook processing (synchronous within request) | Simpler code | Timeout → Stripe retry → duplicate provisioning | Never for provisioning webhooks — use async queue |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SAM.gov API | Using individual account key in production without expiry tracking | Use system account key (no 90-day expiry) OR store expiry date and alert at 21 days |
| SAM.gov API | Fetching "sensitive" entity/contract data and displaying it to customers | Only use public opportunities API (`/opportunities/v2/search`) for customer-facing data |
| Grants.gov API | Not displaying required attribution notice | Add "This product uses the Grants.gov API but is not endorsed or certified by Grants.gov" to the discovery UI |
| Candid API | Ingesting foundation data under free/trial tier for a commercial product | Obtain commercial API License Agreement before ingesting; use IRS 990 public data as an alternative |
| EU TED API | Assuming anonymous access = no terms apply | Review TED Developer Portal terms before storing data; GDPR applies to any EU-resident personal data collected alongside opportunity records |
| Stripe webhooks | Returning 200 after DB write — which can timeout | Return 200 immediately, process asynchronously; log event ID first for idempotency |
| Stripe webhooks | Processing `checkout.session.completed` without checking if org already provisioned | Check `stripe_events` table for event ID before processing; skip if already handled |
| Anthropic/OpenAI API | Firing LLM calls from a cron job without per-tenant quota check | Check and reserve token budget before every LLM call; reject if over limit |
| Supabase `createAdminClient()` | Using service role in an API route that returns tenant data without explicit org_id filter | Always add `.eq('org_id', orgId)` on every query in routes using service role |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-table vector search without org_id pre-filter | Fit scoring gets slower as opportunity count grows; timeouts at scale | Filter by `org_id` and `status = 'active'` before running vector similarity; use pgvector HNSW index | At ~10K opportunities in the table |
| Synchronous attachment extraction on upload | User waits 30–60 seconds for a large PDF to process before seeing anything | Queue extraction as a background job; show "Processing..." state | First 50-page PDF uploaded by a real user |
| Per-opportunity AI scoring triggered on every discovery ingest | AI costs scale linearly with opportunity count | Score only on explicit user request (or scheduled batch with quota check) | At >50 new opportunities per day per tenant |
| Embedding generation blocking the ingest pipeline | New opportunities don't appear in search until embeddings complete | Generate embeddings asynchronously; show opportunities immediately with "AI match scoring pending" | At >100 new records per ingest run |
| No pagination on the admin source-health dashboard | Page load times out when drift events are in the hundreds | Paginate all admin data tables; set default page size ≤ 50 | At >200 open drift events |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `USING (true)` on any tenant-data table | One authenticated user reads another org's pursuits, drafts, vault | Audit every policy before launch; CI cross-tenant test on every PR |
| Service role key in a client-reachable Next.js file (prefixed `NEXT_PUBLIC_`) | Full database bypass; attacker reads/writes all tenant data | Grep for `NEXT_PUBLIC_SUPABASE_SERVICE` in build artifacts; rotate immediately if found |
| Storing Stripe secret key in Vercel environment without restricting to Production | Dev/preview environments expose live payment keys | Use Stripe test keys in dev/preview; only production environment gets live keys |
| No per-tenant API rate limiting on AI endpoints | Any authenticated user can exhaust global AI quota | Implement per-org rate limiting at the API layer before the LLM call |
| Analytics/admin views without explicit role revokes | `anon` or `authenticated` role can query admin-level aggregated data | Always run `REVOKE SELECT ON view_name FROM anon, authenticated` after creating admin views |
| Draft/proposal content stored without org_id scoping | Draft content searchable across tenants via full-text search | Ensure `rfp_drafts` table has org_id column with RLS `USING (org_id = current_org())` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a numeric opportunity count that doesn't match search results | Users lose trust immediately ("you said 80k, I see 3") | Live-computed count from DB; per-source breakdown; no static claims |
| Deadline shown in user's local timezone without labeling it | User submits 3 hours late because ET ≠ PT | Always show timezone as stated in solicitation, plus UTC equivalent |
| Fit score shown without evidence citations | Users can't trust the score; no way to verify | Show score breakdown + vault citations; flag "low evidence" when vault is sparse |
| Rubric criteria shown without source quotes | Users discover the reviewer scored against hallucinated criteria after submission | Show raw extracted text alongside each criterion; flag inferred criteria |
| AI draft generated without a disclosure notice | User submits to NIH/federal funder without knowing disclosure may be required | Add disclosure notice to every draft output; compliance gate checklist item |
| Opportunity search returns stale or expired records | User spends time on a closed opportunity | Filter expired opportunities by default; show "Deadline passed" badge; deduplicate before display |

---

## "Looks Done But Isn't" Checklist

- [ ] **Source Health Dashboard:** Often missing baseline count comparison — verify each source shows `last_count vs. baseline` and `status (healthy/degraded/dead)`, not just "last run."
- [ ] **RLS Audit:** Often "done" after policies are written but before cross-tenant CI test is added — verify with a two-org integration test that Org A cannot read Org B's pursuits.
- [ ] **Stripe Webhook:** Often "done" after the handler is wired — verify there is a `stripe_events` idempotency log, the handler returns 200 before processing, and a failed delivery re-test works without double-provisioning.
- [ ] **Compliance Gate:** Often "done" after deadline/page-limit fields are shown — verify timezone is displayed as stated in the solicitation (not just converted to local time) and there is an AI disclosure checklist item.
- [ ] **Fit Scoring:** Often "done" after a score is displayed — verify every score component is backed by a vault citation, and "low evidence" state is handled when the vault is sparse.
- [ ] **AI Cost Metering:** Often "done" after a `usage_log` table exists — verify hard limits actually block LLM calls before they fire, not just log them after.
- [ ] **PR #4 Merge:** Often considered "fine to defer" — verify production schema matches migration history after merge; do not assume Vercel applied all migrations in order.
- [ ] **Grants.gov Attribution:** Often forgotten — verify the attribution notice "This product uses the Grants.gov API but is not endorsed or certified by Grants.gov" appears in the discovery UI.
- [ ] **Legal Pages:** Often "done" when ToS and Privacy pages exist — verify both include AI use disclosure obligations, Grants.gov attribution, and GDPR scope statement for Level 3 coverage.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cross-tenant RLS leakage discovered post-launch | HIGH | Disable affected feature immediately; notify affected orgs per breach notification obligations; patch RLS; conduct full audit; consider security disclosure |
| SAM.gov key expired, discovery down | LOW | Retrieve new key from SAM.gov system account; update Vercel env var; redeploy; re-run backfill for missed dates |
| Stripe entitlement drift (user paid, not provisioned) | MEDIUM | Query `stripe_events` for the missed event; manually re-process the event via Stripe webhook replay or admin script; refund if provisioning cannot be recovered |
| Parser drift producing corrupt records | MEDIUM | Mark source as `dead` in source_health; halt ingestion; purge corrupt records from `rfp_opportunities` for that source; fix parser; re-ingest with baseline validation |
| Dedup failure — duplicate pursuits discovered by users | MEDIUM | Run dedup merge script; redirect orphaned pursuit IDs to canonical record; notify affected users; add dedup CI test to prevent recurrence |
| AI cost overrun from batch job | MEDIUM | Identify which org triggered the runaway; disable the job for that org; implement retroactive cost cap; adjust tier limits; contact org about usage policy |
| Hallucinated rubric criteria discovered post-submission | HIGH | Cannot recover the customer's proposal; acknowledge the error; consider remediation offer; retrofit citation-grounding before next use |
| Candid data ingested without license | HIGH | Purge Candid-sourced records from database; negotiate license or remove the integration; notify customers about temporary feature gap |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Silent parser drift / source health | P0 Source Reliability | Source health dashboard shows count vs. baseline; drift alerts fire in staging test |
| Dedup failure | P0 Source Reliability | Canonical ID in schema; dedup audit on 211 existing records; no duplicate in search results for known cross-posted opportunities |
| SAM.gov key expiry | P0 Source Reliability (immediate) | Expiry date stored in source_health; alert fires 21 days before expiry; tested in staging |
| Compliance gate timezone error | Compliance Gate v1 Phase | Timezone test suite: store UTC, display source timezone label, flag "timezone unverified" cases |
| Cross-tenant RLS leakage | Security/RLS Audit Phase | CI cross-tenant test passes; Supabase advisor shows no RLS-disabled tables; no `USING (true)` on data tables |
| AI hallucination in scoring/rubric | Fit Scoring + Rubric Review Phases | Every score component has a vault citation or "low evidence" flag; rubric criteria have source quotes or "inferred" badge |
| Per-tenant AI cost runaway | Billing Phase (before Stripe live) | Hard limit blocks LLM call before it fires; usage ledger queryable by org; batch job shows cost estimate before proceeding |
| Legal/ToS violations (Candid, GDPR) | Legal Phase (gate per coverage level) | Source-terms registry exists; Candid license confirmed or integration excluded; Grants.gov attribution live; GDPR policy live before Level 3 |
| Stripe webhook drift / race conditions | Billing Hardening Phase | `stripe_events` idempotency log exists; duplicate delivery test passes; success page polls for subscription state |
| Inflated opportunity counts | P0 (immediate) | No hardcoded count strings in codebase; UI count is live-queried; search for "80k" and "80,000" in codebase returns zero |
| PR #4 merge collision | Phase 0 / Pre-work (immediate) | PR #4 merged to main; `supabase db diff` shows zero schema drift; production migration history verified |
| Federal AI disclosure | Legal Phase + Compliance Gate Phase | Draft output includes AI disclosure notice; compliance gate has AI-use checklist item; ToS covers user's disclosure obligations |

---

## Sources

- SAM.gov Terms of Use: https://sam.gov/about/terms-of-use
- SAM.gov Get Opportunities Public API (GSA Open Technology): https://open.gsa.gov/api/get-opportunities-public-api/
- SAM.gov System Account User Guide (API key rotation, 90-day expiry): https://dodprocurementtoolbox.com/uploads/System_Account_User_Guide_v3_01_5f66649acf.pdf
- Grants.gov API Terms and Conditions: https://www.grants.gov/api/terms-conditions
- Candid API License Agreement: https://candid.org/terms-of-service/api-license-agreement/
- Candid Free/Trial API Terms: https://api.foundationcenter.org/docs/v2.0/api_terms_of_service.pdf
- EU TED Developer Documentation: https://docs.ted.europa.eu/home/index.html
- NIH NOT-OD-25-132 (AI use in grant applications): https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html
- GSA AI Procurement Rules (GSAR 552.239-7001, Feb 2026): https://www.gibsondunn.com/gsa-ai-procurement-rules-would-introduce-new-disclosure-and-use-rights-requirements-for-federal-contractors/
- National Law Review — AI Use in Federal Contracting Proposals: https://natlawreview.com/article/navigating-federal-solicitations-artificial-intelligence
- Supabase RLS Multi-Tenant Best Practices: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- Supabase service_role key exposure (CVE-2025-48757 context): https://vibeappscanner.com/is-supabase-safe
- Stripe Webhook Race Conditions and Idempotency: https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/
- Stripe Webhook Reliability Patterns: https://dev.to/diven_rastdus_c5af27d68f3/stripe-webhook-reliability-patterns-every-saas-should-implement-2pg1
- Multi-Tenant LLM Cost Controls: https://dev.to/pranay_batta/building-hierarchical-budget-controls-for-multi-tenant-llm-gateways-ceo
- GDPR Web Scraping Compliance 2025: https://groupbwt.com/blog/gdpr-safe-web-scraping/
- NIAID Deadline Submission Warning (timezone): https://www.niaid.nih.gov/grants-contracts/early-calendar-not-clock
- AI Grant Writing Risks (E.B. Howard Consulting): https://www.ebhoward.com/the-risks-of-generative-ai-in-grant-proposal-preparation/
- Ecosystem-specific history: `ecosystem-supabase-security-sweep.md`, `uplift-workforce-interview-prep-v1.md` (analytics-view RLS lockdown), `rfp-stripe-webhook-wired.md`, `rfp-engine-canonical-login.md` (Claude memory)

---
*Pitfalls research for: AI RFP/Grant Capture SaaS — Perpetual Core RFP Engine v2.0*
*Researched: 2026-06-05*
