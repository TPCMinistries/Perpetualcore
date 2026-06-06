# Architecture Research

**Domain:** Multi-tenant AI-powered RFP & Grant Capture SaaS (v2.0 feature integration)
**Researched:** 2026-06-05
**Confidence:** HIGH — derived from reading the actual codebase, not inference

---

## Standard Architecture

### System Overview — Existing + v2.0 Additions

```
┌─────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 14 APP ROUTER (Vercel)                     │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │  (dashboard)   │  │  (rfp-mkt)   │  │    app/admin/rfp        │   │
│  │  /org/[id]/    │  │  /rfp/*      │  │    (operator console)   │   │
│  │  discovery     │  │  pricing     │  │    NEW: v2 metrics page  │   │
│  │  pursuits      │  │  how-it-works│  │                         │   │
│  │  proposals     │  │  vs          │  │                         │   │
│  └────────┬───────┘  └──────────────┘  └───────────┬────────────┘   │
│           │                                         │                │
│  ┌────────▼──────────────────────────────────────────────────────┐   │
│  │           app/api/rfp/* Route Handlers (authenticated)         │   │
│  │  /orgs/[id]/vault   /opps   /proposals   /draft   /review      │   │
│  │  NEW: /orgs/[id]/fit-score  /amendments  /outcomes             │   │
│  └────────┬──────────────────────────────────────────────────────┘   │
│           │                                                           │
│  ┌────────▼──────────────────────────────────────────────────────┐   │
│  │              app/api/cron/* (Vercel Cron — service-role only)   │   │
│  │  rfp-discovery-federal   rfp-discovery-state-city              │   │
│  │  rfp-score-coverage-repair   rfp-sequences                     │   │
│  │  NEW: rfp-fit-score-recompute  rfp-amendment-poll              │   │
│  │  NEW: rfp-win-loss-ingest      rfp-usage-meter                 │   │
│  └────────┬──────────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────────┐
│                   lib/rfp/* — Domain Logic Layer                      │
│                                                                       │
│  EXISTING                              NEW (v2.0)                    │
│  ├── ingest/                           ├── connector/                 │
│  │   ├── run.ts (federal orch)         │   ├── interface.ts (contract)│
│  │   ├── run-state-city.ts             │   ├── registry.ts            │
│  │   ├── normalize.ts                  │   ├── health-monitor.ts      │
│  │   ├── canonicalize.ts               │   └── level-gate.ts          │
│  │   ├── sam-gov.ts / grants-gov.ts    │                              │
│  │   ├── simpler-grants.ts / sbir.ts   ├── fit-score/                 │
│  │   ├── nih-grants.ts / nsf-grants.ts │   ├── explainer.ts           │
│  │   └── scrape/ (drift.ts + sources)  │   ├── vault-rpc.ts           │
│  │                                     │   └── recompute-v2.ts        │
│  ├── scoring/                          │                              │
│  │   ├── score.ts (pure fn, 5-dim)     ├── rubric/                    │
│  │   ├── recompute.ts (orch)           │   ├── extract.ts             │
│  │   ├── summary.ts (AI prose)         │   └── adversarial.ts         │
│  │   └── weights.ts                    │                              │
│  │                                     ├── amendment/                 │
│  ├── draft/                            │   ├── poll.ts                │
│  │   ├── generate.ts                   │   ├── diff.ts                │
│  │   └── sections.ts                   │   └── re-trigger.ts          │
│  │                                     │                              │
│  ├── review/                           ├── outcome/                   │
│  │   ├── generate.ts                   │   ├── ingest.ts              │
│  │   └── rubric.ts                     │   └── feedback-loop.ts       │
│  │                                     │                              │
│  ├── vault/                            ├── entitlement/               │
│  │   ├── retrieve.ts (in-Node cosine)  │   ├── coverage-gate.ts       │
│  │   ├── embed.ts                      │   ├── quota-meter.ts         │
│  │   ├── chunker.ts                    │   └── rfp-matrix.ts          │
│  │   └── upload.ts                     │                              │
│  │                                     └── monitoring/                │
│  ├── compliance/                           ├── health-aggregator.ts   │
│  ├── submission/                           └── cost-alarm.ts          │
│  ├── billing.ts (Stripe + rfp_org_subscriptions)                      │
│  ├── source-catalog.ts                                                │
│  └── admin-metrics.ts                                                │
└───────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────────┐
│              SUPABASE (LDC Brain AI — hgxxxmtfmvguotkowxbu)           │
│  Postgres + pgvector + RLS + Storage                                  │
│                                                                       │
│  EXISTING TABLES                       NEW / EXTENDED (v2.0)         │
│  rfp_orgs                              rfp_connector_health           │
│  rfp_users / rfp_user_orgs             rfp_source_sla                 │
│  rfp_capture_profiles                  rfp_funder_profiles            │
│  rfp_vault_artifacts (vector(1024))    rfp_opp_solicitation_versions  │
│  rfp_opportunities                     rfp_opp_amendments             │
│  rfp_opp_matches (fit scores)          rfp_rubric_criteria            │
│  rfp_proposals                         rfp_outcomes                   │
│  rfp_proposal_sections                 rfp_org_entitlements           │
│  rfp_compliance_checks                 rfp_ai_usage_events            │
│  rfp_agent_sessions (audit log)        rfp_fit_score_citations        │
│  rfp_source_drift / rfp_source_baseline                               │
│  rfp_org_subscriptions (Stripe)                                       │
│  rfp_submission_tasks                                                 │
│  rfp_opportunity_canonicals                                           │
│  rfp_opportunity_enrichments                                          │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Existing — Reuse Without Modification

| Component | Responsibility | Reuse Pattern |
|-----------|---------------|---------------|
| `lib/rfp/ingest/normalize.ts` | `OpportunityInput → OpportunityRow` canonical transform | Connector outputs must satisfy `OpportunityInput`; normalizer unchanged |
| `lib/rfp/ingest/run.ts` | Federal ingest orchestrator | Add global connectors as new fetchers in `FetcherSpec[]` array |
| `lib/rfp/ingest/run-state-city.ts` | State/city scrape orchestrator | Same pattern for L2 state connectors |
| `lib/rfp/ingest/scrape/drift.ts` | `recordDrift / recordBaseline` telemetry | Connectors call this for all health events — no change |
| `lib/rfp/scoring/score.ts` | Pure 5-dim fit scoring function | Extended to accept AI-enhanced input (citations) but pure core stays |
| `lib/rfp/scoring/recompute.ts` | Recompute orchestrators for cron + on-demand | Add v2 recompute path that calls explainable scorer |
| `lib/rfp/vault/retrieve.ts` | Top-K vault RAG retrieval (in-Node cosine) | Must be replaced with SECURITY DEFINER RPC when vault > 50 docs/org |
| `lib/rfp/review/rubric.ts` | Reviewer prompt + types + Zod schemas | Extend `ReviewerInput` to add `rubric_criteria[]`; prompt stays |
| `lib/rfp/submission/readiness-gate.ts` | Submit gate evaluator | Extend `SubmitReadinessGateInput` with amendment status |
| `lib/rfp/billing.ts` | Stripe checkout/portal for rfp_org_subscriptions | Extend to include `coverage_level` + `quota_limits` in subscription metadata |
| `lib/rfp/source-catalog.ts` | Source registry + catalog entries | Add global sources (EU TED, World Bank) + `coverage_level` field |
| `lib/rfp/admin-metrics.ts` | Platform-wide operator queries | Add AI cost aggregation, amendment health, win/loss rates |
| `lib/audit/logger.ts` | Audit log writer | Reuse for all new agent sessions — no change |
| `lib/features/matrix.ts` | Plan-to-feature gating (existing PC SaaS) | Build parallel `lib/rfp/entitlement/rfp-matrix.ts` for RFP-specific gates |

### Existing — Modify (Extend Without Breaking)

| Component | Current State | v2.0 Change |
|-----------|--------------|-------------|
| `lib/rfp/scoring/score.ts` | 5-dim deterministic, no citations | Add optional `ai_enhancement` field to output; wrap in explainer service |
| `lib/rfp/review/rubric.ts` | Generic reviewer prompt | Add `rubric_criteria: RubricCriterion[]` to `ReviewerInput`; route conditions into prompt |
| `lib/rfp/submission/readiness-gate.ts` | 7-item gate | Add `amendmentStatus` item to `SubmitReadinessGateInput` |
| `lib/rfp/billing.ts` | `pro` and `agency` tiers only | Add `starter` tier + `coverage_level` + `quota_limit_drafts` + `quota_limit_scores` to subscription row |
| `lib/rfp/source-catalog.ts` | US-only sources, no `coverage_level` | Add `coverage_level: 1 | 2 | 3` field to `RfpSourceCatalogEntry`; add global source entries |
| `lib/rfp/admin-metrics.ts` | Discovery/scoring/AI cost totals | Add AI cost per org, amendment drift rates, win/loss rates, connector health by level |
| `app/admin/rfp/page.tsx` | Operator console scaffold | Full build: source health SLA panel, AI cost alarms, org entitlement view |
| `app/api/cron/rfp-discovery-federal/route.ts` | Calls `runFederalIngest()` | Pass connector config through entitlement-aware level gate |

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `lib/rfp/connector/interface.ts` | new | TypeScript interface all connectors must satisfy |
| `lib/rfp/connector/registry.ts` | new | Runtime connector map keyed by source string |
| `lib/rfp/connector/health-monitor.ts` | new | Compares connector output against SLA thresholds |
| `lib/rfp/connector/level-gate.ts` | new | Filters active connectors by org entitlement level |
| `lib/rfp/fit-score/explainer.ts` | new | Wraps pure scorer + vault RAG → adds cited, narrative explanation |
| `lib/rfp/fit-score/vault-rpc.ts` | new | SECURITY DEFINER RPC caller for pgvector HNSW at scale |
| `lib/rfp/fit-score/recompute-v2.ts` | new | Cron recompute that populates `rfp_fit_score_citations` |
| `lib/rfp/rubric/extract.ts` | new | Extracts eval criteria from solicitation text/attachments |
| `lib/rfp/rubric/adversarial.ts` | new | Multi-pass reviewer that scores each criterion separately |
| `lib/rfp/amendment/poll.ts` | new | Polls source APIs for solicitation version changes |
| `lib/rfp/amendment/diff.ts` | new | Computes text diff between solicitation versions |
| `lib/rfp/amendment/re-trigger.ts` | new | Fires compliance + fit re-evaluation after amendment detected |
| `lib/rfp/outcome/ingest.ts` | new | Stores win/loss + award amount in `rfp_outcomes` |
| `lib/rfp/outcome/feedback-loop.ts` | new | Updates `rfp_capture_profiles.past_funders` + scoring weights from outcomes |
| `lib/rfp/entitlement/coverage-gate.ts` | new | Guards connector execution by org's `coverage_level` |
| `lib/rfp/entitlement/quota-meter.ts` | new | Checks and decrements `rfp_ai_usage_events` quotas |
| `lib/rfp/entitlement/rfp-matrix.ts` | new | RFP-specific feature matrix (parallel to `lib/features/matrix.ts`) |
| `lib/rfp/monitoring/health-aggregator.ts` | new | Rolls up connector SLA, drift, AI cost into `/api/health/rfp` |
| `lib/rfp/monitoring/cost-alarm.ts` | new | Triggers admin alert when org AI spend crosses threshold |
| `app/api/health/rfp/route.ts` | new | Public/operator health endpoint |
| `app/api/cron/rfp-fit-score-recompute/route.ts` | new | Daily fit-score + citation recompute cron |
| `app/api/cron/rfp-amendment-poll/route.ts` | new | Amendment polling cron (6h cadence, reuses existing cron pattern) |
| `app/api/cron/rfp-win-loss-ingest/route.ts` | new | Nightly outcome batch cron |
| `app/api/cron/rfp-usage-meter/route.ts` | new | Hourly metering flush to Stripe |
| `app/api/rfp/orgs/[orgId]/fit-score/route.ts` | new | On-demand fit score with citations |
| `app/api/rfp/orgs/[orgId]/outcomes/route.ts` | new | Win/loss submission endpoint |
| `app/api/rfp/opps/[id]/amendments/route.ts` | new | Amendment list + diff endpoint |
| `supabase/migrations/20260606_rfp_v2_schema.sql` | new | All v2 schema additions (see DDL section) |

---

## Schema Deltas — DDL Sketches

These are new tables only. No existing `rfp_*` tables are modified except via additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

### 1. Connector Health SLA

```sql
-- Replaces the informal rfp_source_baseline + rfp_source_drift split for v2.
-- The existing tables stay; this adds structured SLA tracking on top.

CREATE TABLE IF NOT EXISTS rfp_connector_health (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text        NOT NULL,
  coverage_level  int         NOT NULL CHECK (coverage_level IN (1, 2, 3)),
  last_run_at     timestamptz,
  last_run_status text        CHECK (last_run_status IN ('ok', 'degraded', 'down')),
  fetched_count   int,
  upserted_count  int,
  error_message   text,
  sla_threshold   int         NOT NULL DEFAULT 1,  -- min records per run
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source)
);
-- RLS: USING (false); service-role only (same as rfp_source_drift pattern)
CREATE POLICY rfp_connector_health_service_only ON rfp_connector_health USING (false);
```

### 2. Funder Profiles (L1/L2 foundation intelligence)

```sql
CREATE TABLE IF NOT EXISTS rfp_funder_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text        NOT NULL,             -- 'irs_990', 'candid', 'manual'
  source_id       text,
  name            text        NOT NULL,
  ein             text,
  grant_focus     text[],
  typical_amount_min numeric,
  typical_amount_max numeric,
  geo_focus       text[],
  active_rfp_ids  uuid[],                           -- FK to rfp_opportunities
  raw_json        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  last_enriched_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);
-- No tenant_id: funder profiles are global intelligence, not per-org.
-- RLS: accessible to all authenticated users (read-only), service-role for write.
```

### 3. Solicitation Versions and Amendments

```sql
CREATE TABLE IF NOT EXISTS rfp_opp_solicitation_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  version_number  int         NOT NULL DEFAULT 1,
  source_version  text,                             -- e.g. "Amendment 3"
  full_text       text,                             -- extracted solicitation body
  attachments     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  captured_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, version_number)
);

CREATE TABLE IF NOT EXISTS rfp_opp_amendments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  from_version_id uuid        NOT NULL REFERENCES rfp_opp_solicitation_versions(id),
  to_version_id   uuid        NOT NULL REFERENCES rfp_opp_solicitation_versions(id),
  diff_json       jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- {added, removed, changed} sections
  material_change boolean     NOT NULL DEFAULT false,        -- triggers re-eval when true
  detected_at     timestamptz NOT NULL DEFAULT now()
);
-- RLS on opp_amendments: USING (true) for read; service-role for write.
-- No org_id because amendments are global to the opportunity.
```

### 4. Rubric Criteria

```sql
CREATE TABLE IF NOT EXISTS rfp_rubric_criteria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id) ON DELETE CASCADE,
  version_id      uuid        REFERENCES rfp_opp_solicitation_versions(id),
  section_ref     text,                             -- e.g. "Section M.3"
  criterion_text  text        NOT NULL,
  max_points      numeric,
  weight          numeric,
  extracted_by    text        NOT NULL DEFAULT 'claude',
  extracted_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opp_id, section_ref)
);
-- RLS: readable by org members if they have a proposal on that opp.
```

### 5. Explainable Fit Score Citations

```sql
-- Extends rfp_opp_matches with cited, narrative explanation.
-- Add columns to existing table rather than new table:
ALTER TABLE rfp_opp_matches
  ADD COLUMN IF NOT EXISTS explanation        text,
  ADD COLUMN IF NOT EXISTS citations          jsonb  NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS explanation_model  text,
  ADD COLUMN IF NOT EXISTS explanation_tokens int,
  ADD COLUMN IF NOT EXISTS explanation_cost   numeric,
  ADD COLUMN IF NOT EXISTS explained_at       timestamptz;
-- citations shape: [{chunk_id, doc_title, excerpt, relevance_label}]
```

### 6. Win/Loss Outcomes

```sql
CREATE TABLE IF NOT EXISTS rfp_outcomes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid        NOT NULL REFERENCES rfp_proposals(id) ON DELETE CASCADE,
  org_id          uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  opp_id          uuid        NOT NULL REFERENCES rfp_opportunities(id),
  outcome         text        NOT NULL CHECK (outcome IN ('won', 'lost', 'withdrawn', 'no_award')),
  award_amount    numeric,
  funder_feedback text,
  loss_reason     text,        -- 'price', 'technical', 'past_performance', 'scope_mismatch', 'other'
  submitted_at    timestamptz,
  decided_at      timestamptz,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id)
);
-- RLS: USING (org_id IN (SELECT org_id FROM rfp_user_orgs WHERE user_id = auth.uid()))
```

### 7. Entitlements

```sql
CREATE TABLE IF NOT EXISTS rfp_org_entitlements (
  org_id          uuid        PRIMARY KEY REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  coverage_level  int         NOT NULL DEFAULT 1 CHECK (coverage_level IN (1, 2, 3)),
  quota_scores_mo int         NOT NULL DEFAULT 100,    -- fit score calls/month
  quota_drafts_mo int         NOT NULL DEFAULT 10,     -- draft generations/month
  quota_reviews_mo int        NOT NULL DEFAULT 5,      -- reviewer passes/month
  used_scores_mo  int         NOT NULL DEFAULT 0,
  used_drafts_mo  int         NOT NULL DEFAULT 0,
  used_reviews_mo int         NOT NULL DEFAULT 0,
  quota_reset_at  timestamptz NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- RLS: org members can read their own row; service-role writes.
-- Stripe webhook populates this on subscription.updated.
```

### 8. AI Usage Events (cost metering)

```sql
CREATE TABLE IF NOT EXISTS rfp_ai_usage_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  operation       text        NOT NULL,   -- 'fit_score', 'draft', 'review', 'rubric_extract', 'amendment_diff'
  model           text        NOT NULL,
  tokens_in       int,
  tokens_out      int,
  cost_usd        numeric,
  proposal_id     uuid,
  opp_id          uuid,
  metered_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rfp_ai_usage_org_month_idx
  ON rfp_ai_usage_events (org_id, metered_at);
-- RLS: USING (org_id IN (...)) for org reads; service-role for writes.
-- Operator admin reads across all orgs via createAdminClient().
```

---

## Data Flow

### 1. Discovery Ingest Flow (existing, extended for v2)

```
Vercel Cron (6h)
  → lib/rfp/connector/level-gate.ts   ← checks rfp_org_entitlements.coverage_level
  → lib/rfp/connector/registry.ts     ← returns connectors for that level
  → lib/rfp/ingest/run.ts             ← existing federal orchestrator (L1)
  → lib/rfp/ingest/run-state-city.ts  ← existing state/city orch (L2)
  [NEW] → lib/rfp/ingest/run-global.ts ← EU TED / World Bank / etc. (L3)
  → normalizeOpportunity()            ← OpportunityInput → OpportunityRow (unchanged)
  → rfp_opportunities upsert          ← (source, source_id) unique key (unchanged)
  → lib/rfp/connector/health-monitor.ts → rfp_connector_health upsert
  → lib/rfp/ingest/scrape/drift.ts    ← existing drift recording (unchanged)
  → scoreNewOpportunitiesForAllActiveOrgs() ← existing recompute orch
  → [NEW] maybeExplainHighScores()    ← adds citations for fit_score >= 70
```

### 2. Explainable Fit Score Flow (new)

```
On-demand: POST /api/rfp/orgs/[orgId]/fit-score?opp_id=X
  OR cron: rfp-fit-score-recompute (daily, processes top matches)

  → lib/rfp/entitlement/quota-meter.ts  ← check + decrement used_scores_mo
  → scoreOpportunity()                   ← existing pure 5-dim score
  → lib/rfp/fit-score/vault-rpc.ts       ← rpc('rfp_vault_search_hnsw', {org_id, query, k})
      ↳ SECURITY DEFINER fn: SELECT ... ORDER BY embedding <=> $query_vec LIMIT k
  → lib/rfp/fit-score/explainer.ts       ← Claude Haiku call with score + vault chunks
      ↳ output: {narrative, citations[], strong_signals[], weak_signals[]}
  → INSERT rfp_opp_matches SET explanation=..., citations=..., explained_at=now()
  → INSERT rfp_ai_usage_events           ← cost metering
```

### 3. Rubric Extraction + Adversarial Review Flow (new)

```
User trigger: "Run Adversarial Review" in pursuit workspace
  → lib/rfp/entitlement/quota-meter.ts  ← check + decrement used_reviews_mo
  → lib/rfp/rubric/extract.ts
      ← reads rfp_opp_solicitation_versions.full_text + attachments
      ← Claude Sonnet 4 structured extraction
      → INSERT rfp_rubric_criteria rows
  → lib/rfp/rubric/adversarial.ts
      ← reads rfp_rubric_criteria for the opp
      ← reads rfp_proposal_sections for the proposal
      ← Claude Opus pass, scoring each criterion + overall
      → INSERT rfp_proposal_sections row (section_type = 'adversarial_review_v1')
        (REUSE existing rfp_proposal_sections — store as a special section_type like
         REVIEWER_FINDINGS_SECTION_TYPE is already used for reviewer_findings_v1)
  → INSERT rfp_agent_sessions            ← existing audit log (unchanged)
  → INSERT rfp_ai_usage_events           ← cost metering
```

### 4. Amendment Detection + Re-trigger Flow (new)

```
Vercel Cron (6h): rfp-amendment-poll
  → lib/rfp/amendment/poll.ts
      ← queries rfp_proposals WHERE status IN ('drafting', 'review', 'ready')
      ← fetches current solicitation from source API
      → if version changed: INSERT rfp_opp_solicitation_versions
  → lib/rfp/amendment/diff.ts
      ← text diff between rfp_opp_solicitation_versions rows
      → INSERT rfp_opp_amendments (material_change flag set by AI classification)
  → lib/rfp/amendment/re-trigger.ts
      ← if material_change = true:
        → queue compliance re-check (POST /api/rfp/proposals/[id]/compliance-check)
        → queue fit re-score (marks rfp_opp_matches.explained_at = NULL)
        → notify org owner via existing lib/rfp/alerts/dispatch.ts
```

### 5. Win/Loss Feedback Loop (new)

```
User submits: POST /api/rfp/orgs/[orgId]/outcomes
  → INSERT rfp_outcomes
  → lib/rfp/outcome/feedback-loop.ts
      ← reads rfp_outcomes for this org (last 12 months)
      ← updates rfp_capture_profiles: add/weight past_funders from won opps
      ← updates rfp_orgs.voice_fingerprint.past_win_count
      ← marks stale rfp_opp_matches for this org (explained_at = NULL)
        so next cron recompute refreshes scores with new funder intelligence
```

### 6. Entitlements + Billing Gate Flow (new)

```
Stripe Webhook: customer.subscription.updated
  → lib/stripe/webhooks.ts (existing handler)
  → NEW branch: if metadata.product === 'rfp_engine'
      → UPSERT rfp_org_entitlements:
          coverage_level = tierToCoverageLevel(tier)   -- pro→1, agency→2, enterprise→3
          quota_scores_mo = tierToQuota(tier, 'scores')
          quota_drafts_mo = tierToQuota(tier, 'drafts')
          quota_reviews_mo = tierToQuota(tier, 'reviews')

Middleware gating (in route handlers, NOT Next.js middleware.ts):
  → lib/rfp/entitlement/coverage-gate.ts
      ← SELECT coverage_level FROM rfp_org_entitlements WHERE org_id = $1
      → compare against connector.coverage_level
      → if insufficient: 402 with upgrade prompt
  → lib/rfp/entitlement/quota-meter.ts
      ← SELECT used_*_mo, quota_*_mo FROM rfp_org_entitlements WHERE org_id = $1
      → if over quota: 429 with quota reset date
      → on pass: UPDATE ... SET used_*_mo = used_*_mo + 1
```

---

## Architectural Patterns

### Pattern 1: Connector Interface — All Sources Must Conform

All discovery sources (existing and new) must satisfy a single interface. The existing code has per-source fetchers that all return `OpportunityInput[]` — formalize this:

**What:** A TypeScript interface (`SourceConnector`) that every fetcher module exports a singleton of. The registry instantiates connectors from this interface.

**When to use:** Every new source connector (NJ, CT, EU TED, World Bank, IRS 990).

**Integration:** `lib/rfp/connector/interface.ts` defines the contract; existing fetchers get a thin wrapper export to satisfy it. The orchestrators continue calling fetchers directly but through the registry when level-gating is needed.

```typescript
// lib/rfp/connector/interface.ts
export interface SourceConnector {
  readonly source: string;
  readonly coverage_level: 1 | 2 | 3;
  readonly category: 'federal' | 'state' | 'city' | 'foundation' | 'global';
  fetch(): Promise<OpportunityInput[]>;
  checkHealth(): Promise<{ status: 'ok' | 'degraded' | 'down'; detail?: string }>;
}
```

### Pattern 2: SECURITY DEFINER RPC for pgvector at Scale

**What:** Replace the in-Node cosine similarity in `lib/rfp/vault/retrieve.ts` with a Postgres function that uses the `<=>` operator with the existing HNSW/ivfflat index.

**When to use:** When any org exceeds ~50 vault docs (500 chunks at 200 chunks/doc). The current implementation fetches ALL rows and scores in Node — this will OOM for Agency/Enterprise customers.

**Why NOW:** Build the RPC as part of v2 schema migration. The fallback path (in-Node) stays for dev environments without the function.

```sql
-- In supabase/migrations/20260606_rfp_v2_schema.sql
CREATE OR REPLACE FUNCTION rfp_vault_search_hnsw(
  p_org_id uuid,
  p_query_embedding vector(1024),
  p_k int DEFAULT 8
)
RETURNS TABLE (
  id uuid, body text, type text, title text,
  chunk_index int, doc_id uuid, similarity float
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, body, type, title,
    (source_metadata->>'chunk_index')::int AS chunk_index,
    (source_metadata->>'doc_id')::uuid    AS doc_id,
    1 - (embedding <=> p_query_embedding) AS similarity
  FROM rfp_vault_artifacts
  WHERE org_id = p_org_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_k;
$$;
-- SECURITY DEFINER: bypasses RLS safely because we hard-filter by org_id.
-- Caller (service-role context) verifies org membership BEFORE calling.
```

**Reuse:** `lib/rfp/fit-score/vault-rpc.ts` calls this function; `lib/rfp/vault/retrieve.ts` stays for backward compat but gains a `useRpc: boolean` option.

### Pattern 3: Reuse `rfp_proposal_sections` for All AI Outputs

**What:** Store adversarial review results as special `section_type` rows in the existing `rfp_proposal_sections` table, not a new table.

**When to use:** Any AI output that is scoped to a specific proposal and should appear in the proposal's timeline.

**Evidence:** The existing code already does this — `reviewer_findings_v1` is stored as a section row (see `REVIEWER_FINDINGS_SECTION_TYPE` in `lib/rfp/review/rubric.ts`). The adversarial review output follows the same pattern with `section_type = 'adversarial_review_v1'`.

**Anti-pattern avoided:** Creating `rfp_adversarial_reviews` as a new table would duplicate the version tracking, RLS policies, and proposal association logic already built for sections.

### Pattern 4: Additive Column Extension Over New Tables

**What:** When extending existing records (fit scores, matches), prefer `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` over a new join table, unless the extension has its own lifecycle.

**When to use:** `rfp_opp_matches.explanation`, `rfp_opp_matches.citations`, `rfp_opp_matches.explained_at` — these are attributes of the match record, not separate entities.

**When NOT to use:** `rfp_outcomes` needs its own table because it has independent lifecycle (recorded after proposal submission), FK to proposals, and may exist even without a match row.

### Pattern 5: createAdminClient() Everywhere in Server Contexts

**What:** All cron handlers, route handlers, and lib functions that write to the DB use `createAdminClient()`, never `createClient()`.

**Existing evidence:** Every file in `lib/rfp/` that touches Supabase already uses this pattern. New components must follow it.

**RLS enforcement point:** RLS is enforced in route handlers by checking org membership BEFORE calling admin functions, not inside the functions themselves. This is the existing pattern — maintain it for new routes.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Stripe | `lib/rfp/billing.ts` + `lib/stripe/webhooks.ts` | Add coverage_level + quota fields to subscription metadata; webhook provisions `rfp_org_entitlements` |
| Anthropic (Claude) | `lib/ai/router.ts` → `lib/ai/model-router.ts` | Haiku for fit explanations, Sonnet for rubric extract, Opus for adversarial review |
| Resend | `lib/rfp/alerts/` (existing dispatch pattern) | Amendment alerts + quota warnings use existing channel dispatch |
| SAM.gov / Grants.gov | Existing fetchers in `lib/rfp/ingest/` | Amendment polling queries same endpoints for version changes |

### Internal Boundaries

| Boundary | Communication | Pattern |
|----------|---------------|---------|
| Ingest → Scoring | `upserted_ids[]` returned from `upsertBatch()`, passed to `scoreNewOpportunitiesForAllActiveOrgs()` | Existing — reuse for v2 global connector output |
| Scoring → Explainer | `ScoreBreakdown` + `org_id` passed to `explainer.ts` | New — explainer wraps, not replaces, the pure scorer |
| Rubric → Reviewer | `rfp_rubric_criteria` rows read by `adversarial.ts` | New join via `opp_id`; section_type distinguishes output |
| Amendment → Compliance | `re-trigger.ts` calls existing compliance POST endpoint | New trigger, existing endpoint — no compliance code changes |
| Outcomes → Scoring | `feedback-loop.ts` marks matches stale by nulling `explained_at` | Lazy re-score pattern; cron picks up on next run |
| Stripe → Entitlements | Webhook → `rfp_org_entitlements` upsert | New branch in existing `lib/stripe/webhooks.ts` handler |
| Route handlers → Quota | Every AI-consuming route calls `quota-meter.ts` before model call | New guard layer; must be added to draft, review, fit-score, rubric extract routes |

---

## Build Order (Dependency-Ordered)

This sequence respects what each feature requires to be in place before building it.

### Phase A: Schema Foundation + Connector Framework
**Must be first** — all subsequent phases write to these tables.

1. Schema migration (`20260606_rfp_v2_schema.sql`):
   - `rfp_connector_health` with RLS
   - `rfp_org_entitlements` with RLS
   - `rfp_ai_usage_events` with index + RLS
   - `rfp_opp_solicitation_versions` + `rfp_opp_amendments` with RLS
   - `rfp_rubric_criteria` with RLS
   - `rfp_outcomes` with RLS
   - `rfp_funder_profiles` (read-only for users)
   - `ALTER TABLE rfp_opp_matches ADD COLUMN IF NOT EXISTS explanation / citations / explained_at`
   - SECURITY DEFINER `rfp_vault_search_hnsw` function (pgvector RPC)

2. `lib/rfp/connector/interface.ts` + `lib/rfp/connector/registry.ts`
   - Wrap existing fetchers to conform to `SourceConnector` interface
   - Add `coverage_level` to `RfpSourceCatalogEntry` in `source-catalog.ts`

3. `lib/rfp/connector/health-monitor.ts`
   - Writes to `rfp_connector_health` after every ingest run
   - Integrates with existing `drift.ts` (calls `recordDrift` for severe failures)

4. `lib/rfp/entitlement/rfp-matrix.ts` + `lib/rfp/entitlement/coverage-gate.ts` + `lib/rfp/entitlement/quota-meter.ts`
   - Reads `rfp_org_entitlements`; provides guards for all AI routes

### Phase B: Billing + Entitlement Provisioning
**Depends on:** Phase A schema (entitlements table)

5. Extend `lib/rfp/billing.ts`: add `starter` tier; include `coverage_level` + quotas in Stripe metadata
6. Extend `lib/stripe/webhooks.ts`: add `rfp_engine` branch that upserts `rfp_org_entitlements`
7. Extend `app/api/cron/rfp-score-coverage-repair/route.ts`: add monthly quota reset logic
8. `app/api/cron/rfp-usage-meter/route.ts`: hourly flush of `rfp_ai_usage_events` costs to Stripe metered billing (if used) or internal cost tracking

### Phase C: Explainable Fit Scoring
**Depends on:** Phase A schema (citations columns, vault RPC), Phase B (quota meter)

9. `lib/rfp/fit-score/vault-rpc.ts`: call `rfp_vault_search_hnsw` with fallback to in-Node retrieve
10. `lib/rfp/fit-score/explainer.ts`: wrap `scoreOpportunity()` + vault RPC → Claude Haiku explanation + citations
11. `lib/rfp/fit-score/recompute-v2.ts`: batch recompute for top matches, inserts citations, records usage events
12. `app/api/rfp/orgs/[orgId]/fit-score/route.ts`: on-demand endpoint with quota gate
13. `app/api/cron/rfp-fit-score-recompute/route.ts`: daily cron for background recompute

### Phase D: Rubric Extraction + Adversarial Review
**Depends on:** Phase A schema (rubric_criteria table, solicitation_versions), Phase B (quota meter)

14. `lib/rfp/rubric/extract.ts`: Claude Sonnet call → `rfp_rubric_criteria` rows
15. Extend `lib/rfp/review/rubric.ts`: add `rubric_criteria[]` to `ReviewerInput`; update prompt
16. `lib/rfp/rubric/adversarial.ts`: Opus multi-criterion pass → `rfp_proposal_sections` row (`section_type = 'adversarial_review_v1'`)
17. Route: `POST /api/rfp/proposals/[id]/adversarial-review` (quota-gated)

### Phase E: Amendment Tracking
**Depends on:** Phase A schema (solicitation_versions, amendments tables), Phase C (fit-score re-trigger)

18. `lib/rfp/amendment/poll.ts`: query active proposals → fetch source version
19. `lib/rfp/amendment/diff.ts`: compute text diff; classify material vs cosmetic via Claude Haiku
20. `lib/rfp/amendment/re-trigger.ts`: on material change → null `explained_at`, re-queue compliance
21. `app/api/cron/rfp-amendment-poll/route.ts`: 6h cron (reuse existing cron auth pattern)
22. `app/api/rfp/opps/[id]/amendments/route.ts`: list + diff endpoint for UI

### Phase F: Win/Loss Feedback Loop
**Depends on:** Phase A schema (outcomes table), Phase C (fit-score explanation invalidation)

23. `lib/rfp/outcome/ingest.ts`: validates + inserts `rfp_outcomes`
24. `lib/rfp/outcome/feedback-loop.ts`: updates capture profile + marks stale matches
25. `app/api/rfp/orgs/[orgId]/outcomes/route.ts`: user-facing submission endpoint
26. `app/api/cron/rfp-win-loss-ingest/route.ts`: batch ingest from external sources (optional; direct UI submission is the primary path)

### Phase G: Operator Admin Console + Monitoring
**Depends on:** All prior phases (reads from every new table)

27. Extend `lib/rfp/admin-metrics.ts`: add AI cost per org, connector health by level, amendment stats, win rates
28. `lib/rfp/monitoring/health-aggregator.ts`: aggregates connector SLA + drift + cost into single health object
29. `lib/rfp/monitoring/cost-alarm.ts`: threshold-based alerting via existing `lib/rfp/alerts/dispatch.ts`
30. `app/api/health/rfp/route.ts`: public (operator-authenticated) health endpoint
31. Rebuild `app/admin/rfp/page.tsx`: source health SLA panel, AI cost per org, entitlement view, amendment status, win/loss rates

---

## New vs Modified — Summary Table

| Component | Status | File Path |
|-----------|--------|-----------|
| Connector interface | NEW | `lib/rfp/connector/interface.ts` |
| Connector registry | NEW | `lib/rfp/connector/registry.ts` |
| Connector health monitor | NEW | `lib/rfp/connector/health-monitor.ts` |
| Coverage level gate | NEW | `lib/rfp/entitlement/coverage-gate.ts` |
| Quota meter | NEW | `lib/rfp/entitlement/quota-meter.ts` |
| RFP feature matrix | NEW | `lib/rfp/entitlement/rfp-matrix.ts` |
| pgvector HNSW RPC caller | NEW | `lib/rfp/fit-score/vault-rpc.ts` |
| Fit score explainer | NEW | `lib/rfp/fit-score/explainer.ts` |
| Fit score recompute v2 | NEW | `lib/rfp/fit-score/recompute-v2.ts` |
| Rubric extractor | NEW | `lib/rfp/rubric/extract.ts` |
| Adversarial reviewer | NEW | `lib/rfp/rubric/adversarial.ts` |
| Amendment poller | NEW | `lib/rfp/amendment/poll.ts` |
| Amendment differ | NEW | `lib/rfp/amendment/diff.ts` |
| Amendment re-trigger | NEW | `lib/rfp/amendment/re-trigger.ts` |
| Outcome ingestor | NEW | `lib/rfp/outcome/ingest.ts` |
| Outcome feedback loop | NEW | `lib/rfp/outcome/feedback-loop.ts` |
| Health aggregator | NEW | `lib/rfp/monitoring/health-aggregator.ts` |
| Cost alarm | NEW | `lib/rfp/monitoring/cost-alarm.ts` |
| Health endpoint | NEW | `app/api/health/rfp/route.ts` |
| Fit score recompute cron | NEW | `app/api/cron/rfp-fit-score-recompute/route.ts` |
| Amendment poll cron | NEW | `app/api/cron/rfp-amendment-poll/route.ts` |
| Win/loss cron | NEW | `app/api/cron/rfp-win-loss-ingest/route.ts` |
| Usage meter cron | NEW | `app/api/cron/rfp-usage-meter/route.ts` |
| On-demand fit score route | NEW | `app/api/rfp/orgs/[orgId]/fit-score/route.ts` |
| Adversarial review route | NEW | `app/api/rfp/proposals/[id]/adversarial-review/route.ts` |
| Outcomes route | NEW | `app/api/rfp/orgs/[orgId]/outcomes/route.ts` |
| Amendments route | NEW | `app/api/rfp/opps/[id]/amendments/route.ts` |
| v2 schema migration | NEW | `supabase/migrations/20260606_rfp_v2_schema.sql` |
| Source catalog | MODIFY | Add `coverage_level` field to `RfpSourceCatalogEntry` |
| `lib/rfp/scoring/score.ts` | MODIFY | Extend `ScoreBreakdown` with optional `ai_enhancement` |
| `lib/rfp/review/rubric.ts` | MODIFY | Add `rubric_criteria[]` to `ReviewerInput` |
| `lib/rfp/submission/readiness-gate.ts` | MODIFY | Add amendment status to gate items |
| `lib/rfp/billing.ts` | MODIFY | Add `starter` tier + coverage/quota fields |
| `lib/stripe/webhooks.ts` | MODIFY | Add `rfp_engine` entitlement provisioning branch |
| `lib/rfp/admin-metrics.ts` | MODIFY | Add AI cost, amendment stats, win rates |
| `lib/rfp/vault/retrieve.ts` | MODIFY | Add `useRpc` option; `vault-rpc.ts` is the new primary path |
| `app/admin/rfp/page.tsx` | MODIFY (rebuild) | Full operator console with new data |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Table for Every AI Output

**What people do:** Create `rfp_adversarial_reviews`, `rfp_rubric_scores`, `rfp_fit_explanations` as independent tables with their own proposal FK.

**Why it's wrong:** Duplicates the RLS policies (tenant isolation + proposal scoping), version tracking, and proposal-render logic already in `rfp_proposal_sections`. Increases migration surface area.

**Do this instead:** Use `rfp_proposal_sections` with distinct `section_type` values (`adversarial_review_v1`, `rubric_score_v1`) for all proposal-scoped AI outputs. Only create new tables for entities with independent lifecycle (outcomes, amendments, funder profiles).

### Anti-Pattern 2: Next.js Middleware for RFP Entitlement Checks

**What people do:** Add coverage_level + quota checks to `middleware.ts` (the Next.js edge middleware).

**Why it's wrong:** Edge middleware cannot make Supabase DB calls efficiently. The existing `middleware.ts` handles only auth session refresh. Putting quota DB reads there adds latency to every request, including non-RFP routes, and breaks the existing host-aware chrome pattern.

**Do this instead:** Check entitlements inside the route handler, after verifying the user's org membership. Call `lib/rfp/entitlement/coverage-gate.ts` and `lib/rfp/entitlement/quota-meter.ts` as the first step of any AI-consuming route handler.

### Anti-Pattern 3: In-Node Cosine for All Vault Retrieval

**What people do:** Keep `lib/rfp/vault/retrieve.ts` as the only retrieval path as the product grows.

**Why it's wrong:** The current implementation fetches ALL rows for an org and scores in Node. At 50+ docs/org (common for Agency customers with multiple past proposals), this pulls 25MB+ of vector data per query, causing timeout/OOM on Vercel serverless functions.

**Do this instead:** Build `rfp_vault_search_hnsw` as a SECURITY DEFINER RPC in Phase A, switch `lib/rfp/fit-score/vault-rpc.ts` to call it, and keep the in-Node path only as a dev/test fallback.

### Anti-Pattern 4: Blocking Ingest on Score Recompute

**What people do:** Run full fit-score + citation recompute synchronously inside the cron ingest handler.

**Why it's wrong:** The existing ingest already calls `scoreNewOpportunitiesForAllActiveOrgs()` synchronously after upsert. Adding citation generation (Claude Haiku calls) to this path will cause the cron to exceed Vercel's 300s function timeout for large ingest batches.

**Do this instead:** Keep the deterministic `scoreOpportunity()` call in the ingest path (fast, no AI). The explainer/citation generation runs in a separate daily cron (`rfp-fit-score-recompute`) that processes top matches in batches with a concurrency pool (existing `asyncPool` pattern in `recompute.ts`).

### Anti-Pattern 5: Storing Coverage Level Only on the Subscription Row

**What people do:** Derive `coverage_level` from `rfp_org_subscriptions.tier` at query time.

**Why it's wrong:** Enterprise orgs may have custom coverage levels that don't match their Stripe tier. The coverage gate is checked on every discovery request; adding a join to subscriptions + a tier-to-level mapping on the hot path adds complexity.

**Do this instead:** `rfp_org_entitlements` is the single source of truth for coverage level and quotas. The Stripe webhook populates it from tier defaults; operators can override it directly via admin tools without changing the subscription.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (211 opps, 1-2 orgs) | Current in-Node vault cosine is fine; deterministic scorer + cron recompute is sufficient |
| Beta (50 orgs, 5K opps) | Switch to HNSW RPC for vault retrieval; add concurrency pool for citation generation |
| Growth (500 orgs, 50K opps) | Separate the fit-score cron into priority tiers (high-fit first); consider job queue |
| Scale (2500 orgs, 200K opps) | Partition `rfp_ai_usage_events` by month; consider Supabase pg_cron for monthly quota resets |

### First Bottleneck

`rfp_opp_matches` will have `orgs * opps` rows. At 500 orgs and 50K opps, this is 25M rows. Add a partial index on `(org_id, fit_score)` where `fit_score >= 60` for the discovery feed query. The cron recompute should use cursor-based pagination, not OFFSET.

### Second Bottleneck

AI cost per cron run grows linearly with active orgs. The citation recompute cron must process only matches where `explained_at IS NULL OR explained_at < now() - interval '7 days'`, not all matches on every run.

---

## Sources

- Codebase read: `lib/rfp/ingest/run.ts`, `lib/rfp/scoring/score.ts`, `lib/rfp/vault/retrieve.ts`, `lib/rfp/review/rubric.ts`, `lib/rfp/submission/readiness-gate.ts`, `lib/rfp/billing.ts`, `lib/rfp/source-catalog.ts`, `lib/rfp/admin-metrics.ts`, `lib/features/matrix.ts`, `lib/rfp/ingest/scrape/drift.ts`
- Migration files read: `20260509_rfp_schema.sql` and all subsequent `rfp_*.sql` migrations
- Project plans read: `.planning/PROJECT.md`, `.planning/RFP_SCALE_PLAN.md`, `.planning/research/rfp-engine/TECH-SPEC.md`
- pgvector HNSW documentation: confidence HIGH (established pattern in Supabase ecosystem; `<=>` operator and SECURITY DEFINER RPC are standard patterns)
- Stripe metered billing + subscription metadata: confidence HIGH (existing `lib/rfp/billing.ts` pattern extended)

---

*Architecture research for: Perpetual Core RFP Engine v2.0 — feature integration onto existing Next.js 14 + Supabase stack*
*Researched: 2026-06-05*
