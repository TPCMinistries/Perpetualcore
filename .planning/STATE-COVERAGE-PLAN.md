# All-50-State Coverage Plan — "ability to do every state"

Owner requirement (2026-06-06): the product must cover **every US state, or have the architecture to onboard any state declaratively** — not 50 bespoke scrapers. Tri-state (NY, NYC, NJ) ships live first (owner's personal priority).

Companion data: `.planning/research/STATE-SOURCE-MAP.md` (51-row source map, live-verified 2026-06-06).

## The principle: a connector framework, not 50 scrapers

A state is "onboarded" by adding a **registry row + config**, not new code. Three generic connectors + a registry reach the vast majority of states; only big non-open-data states get bespoke scrapers.

### Reach per connector (from the verified source map)
- **Generic Socrata connector** → 16+ states (NY, NJ, TX, WA, PA, MI, IL, MD, CO, CT, DE, MO, OR, VT, IA) **+ NYC** — all keyless, one connector.
- **Generic CKAN connector** → CA (already live) + VA — one connector.
- **Aggregator connectors** (Bonfire templated `<agency>.bonfirehub.com`, DemandStar, BidNet ~100k agencies) → the local-government long tail.
- **Hardened scrapers** → only the big states with NO open-data API: FL, GA, OH, NC, + TX ESBD / PA eMarketplace for procurement depth.

Result: ~20 states reachable with near-zero marginal code, the rest via aggregators + a handful of targeted scrapers. **Every state has at least a bid board, so 0 states are unreachable.**

## Data model (the "ability" made concrete)

New table `rfp_state_coverage` — the declarative registry:
```sql
create table rfp_state_coverage (
  state_code      text primary key,          -- 'NY','NJ','CA',... ('US-NYC' for NYC)
  display_name    text not null,
  connector       text not null,             -- 'socrata'|'ckan'|'aggregator'|'scrape'|'federal_passthrough'
  source_config   jsonb not null,            -- { domain, dataset_id?, base_url?, query?, tenant_id? }
  feed_kind       text not null,             -- 'live_solicitation' | 'grant_reference'
  status          text not null default 'planned', -- 'live'|'partial'|'planned'|'none'
  reliability     text,                      -- 'A'|'B'|'C'|'D' (from source map)
  last_success_at timestamptz,
  opportunity_count int default 0,
  updated_at      timestamptz default now()
);
```
- New state = `insert` a row + config. Socrata/CKAN states need **zero** new code.
- `feed_kind` distinguishes live RFPs from grant-reference datasets (many Socrata portals give the latter — we don't count those as open opportunities, per the truth rule).
- Powers a public **per-state coverage status page** (sales asset + honest counts).

Generic connectors live in `lib/rfp/ingest/connectors/{socrata,ckan,aggregator}.ts`, each `(config) => OpportunityInput[]`, driven entirely by `rfp_state_coverage` rows. Reuses the existing normalize + upsert + drift-detection pipeline.

## Execution waves

**Wave 0 — Framework (structural, unlocks everything)**
- `rfp_state_coverage` table + seed rows from the source map.
- Generic `SocrataConnector` (SODA `$where`/`$q`, keyless) + `CkanConnector` (datastore_search) behind the registry.
- Wire into `runStateCityIngest` via the registry instead of hardcoded scrapers.
- Per-state health → existing `rfp_source_drift` + source-health SLA.

**Wave 1 — Tri-state live (owner priority)**
- **NY**: `data.ny.gov` Socrata grant datasets → replaces the brittle Grants Gateway scraper.
- **NYC**: City Record Online dataset on `data.cityofnewyork.us` Socrata → replaces PASSPort scraping.
- **NJ**: `data.nj.gov` Socrata (A) live now; add NJSTART + SAGE/IntelliGrants as scrape fallback for procurement depth.
- Verify real open opportunities land for all three; retire the fragile NY/NYC scrapers.

**Wave 2 — Socrata/CKAN sweep (where "every state" mostly lands)**
- Seed + activate the remaining ~14 Socrata states (TX, WA, PA, MI, IL, MD, CO, CT, DE, MO, OR, VT, IA) + VA (CKAN) — config rows only, no new code.
- Filter each to `feed_kind = live_solicitation` where available; mark grant-reference feeds for funder intel only.

**Wave 3 — Aggregator long tail (local governments)**
- Bonfire templated-tenant connector (`<agency>.bonfirehub.com`), then DemandStar / BidNet notice feeds.
- One integration → hundreds–thousands of city/county agencies.

**Wave 4 — Targeted scrapers for big non-open-data states**
- FL (MyFloridaMarketPlace VBS), GA (Team Georgia/Jaggaer), OH (OhioBuys), NC (eVP), TX ESBD, PA eMarketplace — hardened with durable retry (Inngest) + drift SLA. Prioritize by population/market.

**Wave 5 — Coverage transparency**
- `/admin/rfp` coverage map (per-state status + count + last success).
- Public per-state status page driven by `rfp_state_coverage`.

## Definition of done ("strong enough to claim every state")
1. `rfp_state_coverage` registry live; adding a Socrata/CKAN state requires only a config row.
2. Tri-state (NY, NYC, NJ) returning real open opportunities from open-data APIs (scrapers retired).
3. ≥20 states `status = live` via generic connectors.
4. Aggregator connector live for the local tail.
5. Targeted scrapers for the top non-open-data states, under the source-health SLA.
6. Coverage status visible per state (operator + public).
7. Honest counts: `grant_reference` feeds never counted as open opportunities.

## Sequencing note
Wave 0 + Wave 1 can build on the **existing** `rfp_opportunities` schema now (it already holds 2,969 rows from multiple sources); the Phase 14 canonical model refines it later without blocking tri-state. This is a sharpened scope for **Phase 16 (Extended Discovery — National)** plus the new requirement DISCO-10.
