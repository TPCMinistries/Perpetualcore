# Stack Research — Perpetual Core RFP Engine v2.0

**Domain:** AI-assisted RFP/grant discovery, proposal drafting, and compliance SaaS
**Researched:** 2026-06-05
**Confidence:** HIGH for all library recommendations; MEDIUM for Level 3 global source APIs (less official documentation available); LOW for Candid API commercial licensing (requires direct negotiation, terms are restrictive)

---

## Baseline Stack (Already Installed — Do NOT Reinstall)

The following are confirmed in `package.json` and must not be re-evaluated:

- Next.js 14 (^14.2.33), React 18, TypeScript strict, Tailwind, shadcn/ui
- Supabase (supabase-js ^2.75.1, @supabase/ssr ^0.7.0)
- Stripe (stripe ^19.1.0)
- @anthropic-ai/sdk ^0.67.0, openai ^6.5.0
- @sentry/nextjs ^10.29.0 — already configured with DSN env var
- Playwright (@playwright/test ^1.57.0) — E2E framework already present
- mammoth ^1.11.0 — DOCX parsing already installed
- pdf-parse ^2.4.4 — PDF parsing already installed
- jszip ^3.10.1 — ZIP export already installed
- @upstash/redis ^1.36.2, @upstash/ratelimit ^2.0.8 — Upstash already partially wired
- diff (jsdiff) — NOT currently installed, needs adding
- inngest — NOT currently installed, needs adding

---

## New Library Additions for v2.0

### Document Ingestion

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `unpdf` | ^0.11.x | PDF text extraction on Vercel edge/serverless | pdf-parse (already installed) depends on `canvas` native bindings that fail on Vercel serverless. unpdf is pure-ESM, zero native deps, works on edge runtime, extracts text + metadata from digitally-born PDFs. Use unpdf for all solicitation attachment ingestion in API routes. Keep pdf-parse for local scripts only. |
| `mammoth` | ^1.11.0 | DOCX → plain text/HTML | Already installed. No change needed. Handles Section L/M extraction from Word-format solicitations. |
| `@langchain/community` | ^1.0.0 | RecursiveCharacterTextSplitter | Already installed. Use for chunking vault documents before embedding. Set chunk size 512 tokens, overlap 64 for RAG retrieval quality. |

**Large-file handling pattern:** For attachments >10MB, stream to Supabase Storage first, then trigger an async Inngest job to extract + chunk + embed. Never parse large PDFs inline in a route handler — Vercel function timeout is 300s on Pro, but a 50-page PDF with OCR can exceed that.

### Fit-Scoring and Retrieval at Scale

| Library/Feature | Version | Purpose | Why |
|-----------------|---------|---------|-----|
| pgvector HNSW index | Built into Supabase | Vector similarity search | HNSW is the current recommended index type — better query performance than IVFFlat at <5M vectors, works on empty tables, handles inserts without rebuild. Use `vector_cosine_ops`. Create index: `CREATE INDEX ON rfp_vault_artifacts USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`. |
| Voyage AI `voyage-3.5-lite` | API | Embedding model for vault documents | $0.02/1M tokens (same as OpenAI text-embedding-3-small) but 7.58% better retrieval accuracy and 512-dimensional vectors vs 3072 (6x cheaper vector storage in pgvector). 32K context window vs 8K. First 50M tokens free. Use Voyage for all new vault embeddings going forward. |
| SECURITY DEFINER match RPC | SQL | Tenant-isolated vector search | Required so anon/authenticated roles cannot bypass RLS during the similarity search. Create a Postgres function `match_vault_artifacts(query_embedding, org_id, match_count)` with `SECURITY DEFINER` and a pinned `search_path`. Call from server via `supabase.rpc()` with admin client. Never expose raw vector search to client-callable RPCs. |

**Embedding migration note:** Existing vault artifacts embedded with OpenAI text-embedding-3-small are 3072-dimensional. New artifacts with voyage-3.5-lite are 512-dimensional. These cannot share a single pgvector column. Options: (a) add a second `embedding_voyage` column and migrate progressively, or (b) re-embed all existing artifacts in a batch job. Recommended: add `embedding_512` column now, migrate in background, deprecate `embedding` (3072) after migration completes.

### Amendment / Addendum Diffing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `diff` (jsdiff) | ^7.x | Text diff for solicitation amendments | The canonical JS text diffing library. Ships with TypeScript types in v8+, no `@types/diff` needed. Provides `diffWords`, `diffLines`, and `structuredPatch`. Use `diffWords` for inline redline display, `diffLines` for section-level change summary. Handles large documents well via async mode with `timeout` option. |

**Document diff pattern:** Store the original solicitation text in `rfp_opportunities.solicitation_text` and each amendment's text in `rfp_opp_amendments`. On addendum ingest, run `diffLines(original, amendment)` and store the structured patch as JSONB. Surface added/removed/changed lines in the UI with red/green highlighting.

### Background Jobs / Cron at Scale

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| `inngest` | ^3.x | Durable multi-step background jobs | Vercel Cron alone cannot handle the discovery pipeline at v2.0 scale. Problems: (1) Vercel cron fires HTTP and expects a 200 within the function timeout — complex multi-source discovery jobs will time out. (2) No retry logic. (3) No fan-out. Inngest solves all three: each discovery source becomes an Inngest step, steps are individually retried on failure, fan-out sends per-source jobs in parallel. Free tier: 50K executions/month (100K via Vercel Marketplace integration). Inngest is already in the Vercel Marketplace — one-click install. |
| `@upstash/qstash` | ^2.x | Lightweight HTTP message queue for webhook delivery | Already have @upstash/redis. Add QStash for: tenant webhook delivery (POST to customer webhook URLs with retry), source-health alert fan-out, and future notification jobs. $1/100K messages. Use QStash for fire-and-forget; use Inngest for multi-step workflows needing state. |

**Pattern:** Keep `vercel.json` crons as the entry trigger (fires Inngest event), move all actual work into Inngest functions. This preserves the existing cron schedule in code while gaining retry + observability.

### Stripe Live Billing

No new libraries needed — `stripe ^19.1.0` is current. Key implementation notes:

**Meters API (mandatory for v2.0):** The legacy `usage_type: 'metered'` usage records API was deprecated in Stripe API version 2025-03-31.basil. You must use Stripe Meters for any new metered prices. Create a Meter object, attach it to a price, and report usage via `stripe.billing.meterEvents.create()`. Existing test-mode products may still use legacy pricing — check before going live.

**Entitlement model for coverage tiers:**
- Level 1 Federal = all tiers (Starter, Pro, Agency)
- Level 2 National (50 states + 990) = Pro and above
- Level 3 Global = Agency and above
- Draft quota = metered (report via Meter event per draft generation)

Use Stripe's `metadata.product = 'rfp_engine'` isolation pattern already established in the codebase. The live mode swap requires a dedicated `RFP_STRIPE_SECRET_KEY_LIVE` env var per the live mode checklist in `.planning/research/rfp-engine/STRIPE-LIVE-MODE-CHECKLIST.md`.

**Trial → provision flow:** Stripe Checkout → `checkout.session.completed` webhook → set `rfp_orgs.plan_tier` + `rfp_orgs.trial_ends_at` → send magic link. Already partially built in `app/api/webhooks/rfp-stripe/route.ts`.

### Adversarial Rubric Review (Section L/M Extraction)

No new libraries. Implementation pattern:

Use Claude's **structured outputs** (beta header `structured-outputs-2025-11-13`) to extract rubric sections. The model cannot produce tokens that violate the schema — zero JSON parsing errors. Define a Zod schema matching the rubric structure, convert to JSON Schema, pass to Claude with `output_format`. This is more reliable than regex parsing Section L/M from PDF text.

```typescript
// Schema for rubric extraction
const RubricSchema = z.object({
  evaluation_factors: z.array(z.object({
    factor_name: z.string(),
    point_value: z.number().optional(),
    relative_weight: z.enum(['significant', 'important', 'somewhat_important']).optional(),
    evaluation_criteria: z.string(),
    source_page: z.number().optional()
  })),
  total_points: z.number().optional(),
  evaluation_order: z.enum(['sequential', 'tradeoff', 'pass_fail']).optional()
})
```

Model for rubric extraction: Claude Sonnet 4.5 (not Opus) — structured output constraint does the heavy lifting, the model doesn't need to reason through it. Opus reserved for the adversarial reviewer scoring pass.

### Monitoring and Ops

| Tool | Status | Purpose | Notes |
|------|--------|---------|-------|
| Sentry (@sentry/nextjs ^10.29.0) | Already installed | Error monitoring | Already configured with DSN env var and client/server/edge configs. Confirm `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel for production. Free tier: 5K errors/month; Team plan ($26/month) for higher volume. |
| OpenStatus | Hosted SaaS (free tier) | External uptime + status page | openstatus.dev — open source, SOC 2, free tier for 1 monitor. Integrate with `/api/health/rfp` endpoint. Gives customers a public status URL. No self-hosting needed for v2.0 launch. |
| `/api/health/rfp` | Build in-house | Internal readiness check | Return JSON: `{ status, indexed_count, sources: [{name, last_success, last_count, drift_events}], db_latency_ms }`. Already have `source-readiness.ts` in lib/rfp — wire to health endpoint. |
| Playwright (@playwright/test ^1.57.0) | Already installed | E2E on draft→review→submit path | Already configured. Add tests for: org onboarding, opportunity triage, draft generation (mock AI), compliance check, submission bundle export. Run against staging (not production). |

---

## External Data Source APIs — Full Audit

### Level 1 — Federal (Ship at Launch)

#### SAM.gov Opportunities API v2
- **Endpoint:** `https://api.sam.gov/opportunities/v2/search`
- **Auth:** API key as query param (`api_key=`). Register at sam.gov Account Details. Lead time: same-day for personal accounts, 5-10 business days for system accounts requiring federal contracting officer approval.
- **Rate limit:** 1,000 requests/day for non-federal accounts. Hard cap — returns 429 at midnight UTC reset. No intra-day credit. Cache aggressively.
- **Bulk data:** SAM.gov Data Services offers daily/weekly CSV extracts — use these for backfill/historical, not the API.
- **ToS / redistribution:** Federal government works are public domain and generally free of copyright. However, SAM.gov data includes D&B entity data. D&B Open Data MAY NOT be redistributed in bulk. Opportunity notices themselves (not entity records) are government works — redistribution is fine. Do NOT store or surface D&B fields (DUNS/SAM UEI entity details beyond the UEI itself) in the RFP Engine customer-facing feed. Opportunities data = fine. Entity data = legal risk.
- **Blocker:** Get the system account API key before launch. Personal account keys work for development but the 1,000/day limit breaks at scale (6-hour cron × 4 sources × expected volume). Apply for a system account rate-limit increase via fsd.gov.

#### Grants.gov Search2 REST API
- **Endpoint:** `https://api.grants.gov/v1/api/search2`
- **Auth:** None for search. No key required.
- **Rate limit:** Described as "generous" — no published hard limit, but throttle to 1 req/sec to be safe.
- **ToS / redistribution:** Attribution required (`"This product uses the Grants.gov API but is not endorsed or certified by HHS"`). No explicit bulk redistribution restriction on opportunity data. Do not falsely represent content. Government works = public domain. MEDIUM confidence on redistribution permissiveness.
- **Status:** Already implemented in `lib/rfp/ingest/grants-gov.ts`. Wire attribution string into the UI footer.

#### Simpler.Grants.gov (beta.grants.gov)
- **Endpoint:** `https://api.simpler.grants.gov/v1/opportunities/search`
- **Auth:** `X-API-Key` header. Key registration at simpler.grants.gov.
- **Rate limit:** 60 req/min, 10,000 req/day.
- **ToS:** Government works, same public domain status as Grants.gov.
- **Status:** Already implemented in `lib/rfp/ingest/simpler-grants.ts`.

#### SBIR.gov
- **Endpoint:** `https://api.www.sbir.gov/public/api/` (solicitations, awards, companies)
- **Auth:** None. Public, no key.
- **Rate limit:** Not published. Apply 1 req/sec throttle as defensive practice.
- **ToS:** No published commercial redistribution restriction found on the API page. Solicitation data is government-produced. MEDIUM confidence that redistribution is permissible — consult SBA legal if a customer specifically asks about SBIR data provenance.
- **Status:** Already implemented in `lib/rfp/ingest/sbir.ts`.

#### USASpending.gov
- **Endpoint:** `https://api.usaspending.gov/` (no auth required)
- **Auth:** None. Open, no API key.
- **Rate limit:** Not published. Throttle conservatively.
- **ToS:** Governed by the DATA Act. Data offered free, without restriction, available to copy, adapt, redistribute for commercial or non-commercial purposes. HIGH confidence redistribution is allowed.
- **Use case:** NOT for discovery (USASpending shows awarded contracts, not open solicitations). Use for win/loss learning loop — look up past awards by agency/CFDA to populate funder intelligence and improve fit scoring. Also useful for market sizing and "this funder awarded $X to similar orgs."

---

### Level 2 — National (Phase 2, target 90 days post-launch)

#### State Portals — API vs Scrape Reality

| State | Source | Method | Notes |
|-------|--------|--------|-------|
| New York (Contract Reporter) | ny.gov grants gateway | Web scrape | No public API. Cookie session required. Already implemented in `lib/rfp/ingest/scrape/ny-state.ts`. |
| NYC (PASSPort, DYCD, HRA, DOE) | nyc.gov | Web scrape | Already implemented in scrape directory. |
| California | CA Grants Portal open data | CSV/JSON feed | Already implemented in `lib/rfp/ingest/scrape/ca-grants.ts`. |
| NJ, CT, PA | State procurement portals | Web scrape | Next state targets per RFP_SCALE_PLAN. No public APIs. |
| NIH | `api.reporter.nih.gov/v2/projects/search` | REST API | No key, JSON, generous rate limit. For active grant announcements use `https://grants.nih.gov/funding/searchguide/index.html`. Already in `lib/rfp/ingest/nih-grants.ts`. |
| NSF | `api.nsf.gov/services/v1/awards.json` | REST API | No key required. Already in `lib/rfp/ingest/nsf-grants.ts`. |
| All other 50 states | Various | Web scrape | Assume scrape-only unless proven otherwise. No state has a standardized procurement API. |

**Scraper infrastructure for state portals:** The existing `scrape/utils.ts` + Puppeteer-core pattern is correct. For Vercel deployment, Puppeteer-core requires Chromium via `@sparticuz/chromium` (serverless-compatible). Check if this is already configured — if not, add:

```bash
npm install @sparticuz/chromium-min puppeteer-core
```

Use `@sparticuz/chromium-min` (smaller binary) for Vercel's 50MB function size limit.

#### IRS 990 / Foundation Intelligence (ProPublica Nonprofit Explorer API)
- **Endpoint:** `https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json` and `/search.json`
- **Auth:** None. Free, no API key.
- **Rate limit:** Not published. Throttle to 1 req/sec.
- **ToS:** Free to use under ProPublica's Data Terms of Use. No explicit bulk redistribution restriction. IRS 990 data is public record — ProPublica is just a convenient index.
- **Use case:** Funder intelligence, not open opportunity discovery. Use to populate foundation profiles for Level 2 coverage: past grant amounts, program areas, geography, EIN lookup. Do NOT count foundation profiles as "open opportunities" in the discovery feed per the truth rule in RFP_SCALE_PLAN.

#### Candid / Foundation Directory API — BLOCKED FOR COMMERCIAL USE
- **Verdict: Do NOT integrate Candid API for v2.0 without a commercial licensing negotiation.**
- **Why:** Candid's license agreement (confirmed via their developer portal) explicitly prohibits: (1) republishing/distributing data to third parties, (2) use in AI/LLM/machine learning applications without express prior written consent, (3) creating a service directly competitive with Candid. The RFP Engine is competitive with Foundation Directory. Integrating Candid API without a signed commercial agreement exposes Perpetual Core LLC to breach of contract claims.
- **Alternative for foundation data:** ProPublica (IRS 990 public data, permissive), direct web research, user-uploaded 990 PDFs parsed via unpdf. These are sufficient for v2.0.
- **Path forward if needed:** Contact Candid enterprise sales and negotiate a data licensing agreement. Cost and terms are negotiated per-org. Lead time: weeks to months.

---

### Level 3 — Global (Phase 3, post-PMF)

#### EU TED (Tenders Electronic Daily)
- **Endpoint:** `https://api.ted.europa.eu/` (developer portal: developer.ted.europa.eu)
- **Auth:** Anonymous access for published notice search. API key for submitting eForms (not needed for discovery). Register at the TED Developer Portal.
- **Rate limit:** 700 req/min for public search.
- **ToS:** EU Open Data Licence — redistribution permitted with attribution.
- **Data format:** eForms XML notices or JSON summary records. The search API returns structured JSON.
- **Recommendation:** Defer to Phase 3. TED notices are mostly relevant for US organizations pursuing EU public contracts, which is a small user segment. Prioritize Level 1 reliability over Level 3 breadth.

#### UK Contracts Finder + Find a Tender
- **Contracts Finder:** `https://www.contractsfinder.service.gov.uk/apidocumentation` — REST API, no key required, OCDS data format.
- **Find a Tender:** `https://www.find-tender.service.gov.uk` — As of February 2025, Find a Tender is the primary UK procurement portal under the Procurement Act 2023. No public REST API confirmed; data available via search UI and OCDS bulk download.
- **Rate limit:** Not published for Contracts Finder. Throttle to 1 req/sec.
- **ToS:** No API key required. OCDS data available for download. UK Open Government Licence — redistribution permitted.
- **Recommendation:** Contracts Finder REST API is usable now. Find a Tender requires scraping or OCDS bulk import — defer.

#### Canada (CanadaBuys / Open Government Portal)
- **Endpoint:** `https://open.canada.ca/data/en/dataset/6abd20d4-7a1c-4b38-baa2-9525d0bb2fd2` — CSV/JSON files updated every 2 hours.
- **Auth:** None. Open Government data.
- **Rate limit:** N/A — file downloads, not paginated API.
- **ToS:** Open Government Licence - Canada. Redistribution explicitly permitted. Attribution required.
- **Implementation:** Fetch the daily tender notices CSV at 6AM ET, parse, normalize, insert. No scraping needed — this is cleaner than most US state portals.
- **Recommendation:** This is low-complexity to add. Include in Level 3 launch.

#### World Bank Procurement
- **URL:** `https://projects.worldbank.org/en/projects-operations/procurement`
- **API:** No dedicated REST API found. Procurement notices are searchable via web interface only. The RFX Now portal (`wbgeprocure-rfxnow.worldbank.org`) requires vendor registration.
- **Recommendation:** Web scrape the procurement search page, or defer — low volume, high complexity.

#### UNGM (United Nations Global Marketplace)
- **URL:** `https://www.ungm.org/`
- **API:** No public API found. UNDB (UN Development Business) phased down on March 31, 2025.
- **Recommendation:** Scrape UNGM public notice search or defer entirely. Low addressable market for current user base (nonprofits, workforce programs). Defer to a later phase when international development orgs are a target segment.

---

## Alternatives Considered

| Recommended | Alternative | Why Not Alternative |
|-------------|-------------|---------------------|
| `unpdf` for Vercel PDF parsing | `pdf-parse` (already installed) | `pdf-parse` depends on `canvas` native binary — fails silently on Vercel serverless. Keep for local scripts only. |
| Voyage AI `voyage-3.5-lite` | OpenAI `text-embedding-3-small` | Identical price, but Voyage is 7.58% more accurate and produces 512-dim vs 3072-dim vectors (6x cheaper pgvector storage). The migration cost is worth it. |
| `inngest` for background jobs | Vercel Cron alone | Vercel Cron fires HTTP with no retry on failure, no multi-step state, no fan-out. Discovery pipeline already fails silently in production (18 open drift events per RFP_SCALE_PLAN). Inngest fixes this structurally. |
| `inngest` for background jobs | `@upstash/qstash` alone | QStash is good for fire-and-forget delivery (webhooks, notifications). It lacks step functions and in-flight state management needed for multi-source discovery with partial failures. Use both: Inngest for workflows, QStash for delivery. |
| ProPublica + IRS 990 for foundation data | Candid API | Candid prohibits AI/LLM use and competitive redistribution in their license. ProPublica covers the same IRS 990 data at no cost with no redistribution restriction. |
| `diff` (jsdiff) | `diff-match-patch` | jsdiff has native TypeScript support in v8+, better API for both line-level and word-level diffs, async mode with timeout for large documents. diff-match-patch is a Google archive with less active maintenance. |
| OpenStatus (hosted) | Self-hosted Upptime/Uptime Kuma | OpenStatus free tier is sufficient for v2.0 launch. Self-hosting a status page is engineering overhead that delays launch. Revisit if compliance requires self-hosted monitoring. |
| Claude structured outputs for rubric extraction | Custom regex / prompt engineering | Structured outputs guarantee schema compliance at the token generation level — zero JSON parse errors. Regex on Section L/M text is fragile and breaks with formatting variation across agencies. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Candid Foundation Directory API | License prohibits AI use and competitive redistribution; requires prior written consent for LLM applications. Legal liability for Perpetual Core LLC. | ProPublica Nonprofit Explorer API (free, permissive) for 990 data |
| LangChain for new RAG patterns | Already installed but adds abstraction overhead in debugging. The existing pgvector + Anthropic SDK pattern is simpler and already working. | Direct `supabase.rpc('match_vault_artifacts')` + @anthropic-ai/sdk |
| Separate vector database (Pinecone, Weaviate, Qdrant) | pgvector with HNSW handles up to 5M vectors at <10ms p99 on Supabase Pro. No new infrastructure needed. | pgvector HNSW on existing Supabase instance |
| GraphQL layer | No existing GraphQL usage; adds schema maintenance burden. | Next.js Route Handlers already in use |
| Next.js 15 upgrade mid-milestone | The codebase targets Next.js 14 (package.json shows ^14.2.33). Upgrading to 15 mid-milestone introduces React 19 breaking changes in server components. | Stay on 14.x for this milestone; upgrade after v2.0 ships |
| Browserless / Playwright for state scraping | Cloud Browserless costs scale with page count; Playwright requires a persistent process. | Puppeteer-core + @sparticuz/chromium-min (already in use pattern for Vercel) |
| GHL (GoHighLevel) sub-account provisioning | Listed in original TECH-SPEC but not present in actual codebase. Introduces a $297+/month external dependency. | Supabase RLS multi-tenancy is sufficient for v2.0; GHL is a distraction |
| Elasticsearch / Typesense for full-text search | pgvector + Postgres full-text search (tsvector) covers the hybrid search use case. | `rfp_opportunities` already has `to_tsvector` pattern |

---

## Installation Commands

```bash
# Add unpdf (replace pdf-parse in Vercel serverless contexts)
npm install unpdf

# Add jsdiff for amendment diffing
npm install diff
# TypeScript types built-in since v8 — no @types/diff needed

# Add Inngest for durable background jobs
npm install inngest

# Add QStash client (Upstash already partially installed)
npm install @upstash/qstash

# Add Chromium for Vercel-compatible scraping (if not already present)
npm install @sparticuz/chromium-min

# Voyage AI SDK for embeddings
npm install voyageai
```

---

## Blockers That Can Stop a Paid Launch

1. **SAM.gov system account API key:** Personal account has 1,000 req/day — insufficient for production. Apply for a system account at fsd.gov. Lead time is unpredictable (days to weeks). Apply NOW, not when you're ready to launch.

2. **Stripe live mode swap:** Must NOT flip the shared `STRIPE_SECRET_KEY` until all PC LLC products (Sage, Janice, lorenzodc) are live-mode ready. The live mode checklist in `.planning/research/rfp-engine/STRIPE-LIVE-MODE-CHECKLIST.md` correctly flags this. Per that doc: issue separate `RFP_STRIPE_SECRET_KEY_LIVE` env var or confirm all products are ready simultaneously.

3. **Stripe Meters migration:** The legacy `usage_type: 'metered'` pricing model was deprecated in API version 2025-03-31.basil. If test-mode prices were created before that date using the legacy pattern, they cannot be used in live mode without recreating as Meter-backed prices. Audit current test-mode price objects before live mode swap.

4. **Candid API:** Do NOT integrate before a signed license agreement. Using it without consent is a material legal risk.

5. **D&B data in SAM.gov entity records:** Do not surface or store D&B company data fields from the SAM.gov Entity API in customer-visible outputs without verifying D&B license requirements. Opportunity notices are fine; entity detail fields sourced from D&B are not.

6. **Supabase embedding column migration:** Adding `voyage-3.5-lite` requires a new 512-dim column. Run migration before generating new embeddings — column mismatch causes silent insert failures.

---

## Sources

- SAM.gov official API docs: https://open.gsa.gov/api/get-opportunities-public-api/ — rate limits, auth model, bulk data (MEDIUM confidence on D&B redistribution specifics — consult sam.gov/about/terms-of-use directly)
- Grants.gov API terms: https://www.grants.gov/api/terms-conditions — attribution required, no explicit redistribution block on opportunity data
- Candid license agreement: https://developer.candid.org/page/candid-license-agreement — prohibits AI/LLM use and competitive redistribution (HIGH confidence, fetched directly)
- TED API docs: https://docs.ted.europa.eu/api/latest/index.html — 700 req/min, anonymous search access (MEDIUM confidence)
- UK Contracts Finder: https://www.contractsfinder.service.gov.uk/apidocumentation — no key, OCDS format, Open Government Licence (HIGH confidence)
- Canada Open Government Portal: https://open.canada.ca/data/en/dataset/6abd20d4-7a1c-4b38-baa2-9525d0bb2fd2 — Open Government Licence, redistribution permitted (HIGH confidence, fetched directly)
- ProPublica Nonprofit Explorer API: https://projects.propublica.org/nonprofits/api — free, permissive terms (HIGH confidence)
- SBIR.gov API: https://www.sbir.gov/api — no auth, no published rate limits (MEDIUM confidence on redistribution)
- USASpending.gov: https://api.usaspending.gov — DATA Act, no auth, redistribution permitted (HIGH confidence)
- unpdf vs pdf-parse: https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026 — unpdf recommended for serverless (HIGH confidence)
- Voyage AI pricing + performance: https://docs.voyageai.com/docs/pricing and https://blog.voyageai.com/2025/05/20/voyage-3-5/ — voyage-3.5-lite, $0.02/1M tokens, 512 dimensions (HIGH confidence)
- pgvector HNSW: https://supabase.com/docs/guides/ai/vector-indexes — HNSW recommended for <5M vectors (HIGH confidence)
- Inngest on Vercel: https://vercel.com/marketplace/inngest — free tier 100K executions/month (HIGH confidence)
- QStash pricing: https://upstash.com/pricing/qstash — $1/100K messages, free 1K/day (HIGH confidence)
- jsdiff: https://github.com/kpdecker/jsdiff — TypeScript built-in since v8 (HIGH confidence)
- Claude structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs — beta header `structured-outputs-2025-11-13` (HIGH confidence)
- Stripe Meters migration: https://docs.stripe.com/billing/subscriptions/usage-based-legacy/migration-guide — legacy billing deprecated 2025-03-31 (HIGH confidence)
- OpenStatus: https://www.openstatus.dev — open source, SOC2, free tier (HIGH confidence)
- Sentry pricing 2026: https://sentry.io/for/nextjs/ — free 5K errors/month, Team $26/month (HIGH confidence)

---

*Stack research for: Perpetual Core RFP Engine v2.0 — new feature additions*
*Researched: 2026-06-05*
