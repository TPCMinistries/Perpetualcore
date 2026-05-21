/**
 * Simpler.Grants.gov fetcher.
 *
 * Endpoint: POST https://api.simpler.grants.gov/v1/opportunities/search
 * Auth:     X-API-Key header (SIMPLER_GRANTS_API_KEY)
 *
 * NOTE: when this fetcher first runs against a real key the exact response shape
 * needs verification. The TECH-SPEC §4.1 mirrors Grants.gov field names but the
 * Simpler v1 envelope is `{ data: [...], pagination_info: {...} }` with each
 * record carrying `opportunity_id`, `opportunity_title`, etc.
 *
 * Defensive strategy: extract whatever fields we can find, fall back to the raw
 * payload, and flip `needs_review = true` when key fields (deadline / amount /
 * agency) are missing — that lets the feed UI surface ambiguous rows for human
 * cleanup rather than dropping them.
 */

import { env } from "@/lib/env";
import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

const BASE_URL =
  env.SIMPLER_GRANTS_BASE_URL ?? "https://api.simpler.grants.gov/v1";

interface SimplerGrantsRecord {
  opportunity_id?: string | number;
  opportunity_number?: string;
  opportunity_title?: string;
  agency?: string;
  agency_name?: string;
  agency_code?: string;
  category?: string;
  category_explanation?: string;
  // Summary may live under .summary.summary_description or .summary_description
  summary?: {
    summary_description?: string;
    award_floor?: number | string;
    award_ceiling?: number | string;
    close_date?: string;
    post_date?: string;
    [k: string]: unknown;
  };
  summary_description?: string;
  award_floor?: number | string;
  award_ceiling?: number | string;
  close_date?: string;
  post_date?: string;
  // Some records carry these at top-level instead of nested:
  opportunity_status?: string;
  funding_instrument?: string | string[];
  funding_category?: string | string[];
  cfda_numbers?: string[];
  [k: string]: unknown;
}

interface SimplerGrantsResponse {
  data?: SimplerGrantsRecord[];
  pagination_info?: {
    page_offset?: number;
    page_size?: number;
    total_pages?: number;
    total_records?: number;
  };
  // Sometimes endpoints wrap in `result` instead — defensive read.
  result?: SimplerGrantsRecord[];
}

export interface FetchSimplerGrantsOptions {
  pageSize?: number;
  maxRecords?: number;
}

export async function fetchSimplerGrantsOpportunities(
  opts: FetchSimplerGrantsOptions = {}
): Promise<OpportunityInput[]> {
  const apiKey = env.SIMPLER_GRANTS_API_KEY;
  if (!apiKey) {
    console.log("[skip] simpler_grants: SIMPLER_GRANTS_API_KEY not set");
    return [];
  }

  const pageSize = opts.pageSize ?? 100;
  const maxRecords = opts.maxRecords ?? 200;

  const all: OpportunityInput[] = [];
  let pageOffset = 1; // Simpler Grants pagination is 1-indexed.

  while (all.length < maxRecords) {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/opportunities/search`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagination: {
            page_size: pageSize,
            page_offset: pageOffset,
            sort_order: [
              {
                order_by: "opportunity_id",
                sort_direction: "descending",
              },
            ],
          },
        }),
      });
    } catch (err) {
      console.error("[error] simpler_grants: network error", err);
      break;
    }

    if (!res.ok) {
      console.error(
        `[error] simpler_grants: HTTP ${res.status} (page ${pageOffset}); aborting page loop`
      );
      break;
    }

    const json = (await res.json()) as SimplerGrantsResponse;
    const records = json.data ?? json.result ?? [];
    if (records.length === 0) break;

    for (const r of records) {
      const mapped = mapRecord(r);
      if (mapped) all.push(mapped);
    }

    if (records.length < pageSize) break;
    pageOffset += 1;
  }

  console.log(`[fetch] simpler_grants: ${all.length} records`);
  return all.slice(0, maxRecords);
}

function mapRecord(r: SimplerGrantsRecord): OpportunityInput | null {
  const sourceId =
    r.opportunity_id != null ? String(r.opportunity_id) : r.opportunity_number;
  if (!sourceId || !r.opportunity_title) return null;

  const agency = r.agency_name ?? r.agency ?? r.agency_code ?? null;

  // Summary fields can live at top-level or nested under `summary`.
  const desc =
    r.summary?.summary_description ?? r.summary_description ?? null;
  const closeDate = r.summary?.close_date ?? r.close_date ?? null;
  const postDate = r.summary?.post_date ?? r.post_date ?? null;
  const awardFloor = r.summary?.award_floor ?? r.award_floor ?? null;
  const awardCeiling = r.summary?.award_ceiling ?? r.award_ceiling ?? null;

  const cfdaArr = Array.isArray(r.cfda_numbers) ? r.cfda_numbers : [];
  const keywords = [
    ...cfdaArr.map((c) => `cfda:${c}`),
    ...extractTitleKeywords(r.opportunity_title),
  ];

  // Flip needs_review when we have a title but no other usable fields — feed UI
  // surfaces these for manual cleanup rather than us silently dropping data.
  const minimallyComplete = !!(closeDate || awardCeiling || agency);

  return {
    source: "simpler_grants",
    source_id: sourceId,
    title: r.opportunity_title,
    agency,
    type: r.opportunity_status ?? r.category ?? null,
    amount_min:
      typeof awardFloor === "number"
        ? awardFloor
        : awardFloor != null
          ? Number(awardFloor)
          : null,
    amount_max:
      typeof awardCeiling === "number"
        ? awardCeiling
        : awardCeiling != null
          ? Number(awardCeiling)
          : null,
    deadline: typeof closeDate === "string" ? closeDate : null,
    posted_at: typeof postDate === "string" ? postDate : null,
    brief: typeof desc === "string" ? desc.slice(0, 500) : null,
    keywords,
    geo: "US",
    url: `https://simpler.grants.gov/opportunity/${sourceId}`,
    needs_review: !minimallyComplete,
    raw_json: r as Record<string, unknown>,
  };
}
