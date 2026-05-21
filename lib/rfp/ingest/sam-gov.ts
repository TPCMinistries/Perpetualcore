/**
 * SAM.gov Opportunities fetcher.
 *
 * Endpoint: GET https://api.sam.gov/prod/opportunities/v2/search
 * Auth:     api_key query param (SAM_GOV_API_KEY)
 * Window:   postedFrom/postedTo (mm/dd/yyyy)
 *
 * When SAM_GOV_API_KEY is unset (re-registration pending), this fetcher
 * returns [] and logs a [skip] line. NEVER throws.
 *
 * Rate limit: 1,000 requests/day on the free tier — we cap at 200 records
 * per run (2 paginated pages of 100) to stay well below.
 */

import { env } from "@/lib/env";
import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

const BASE_URL =
  env.SAM_GOV_BASE_URL ?? "https://api.sam.gov/prod/opportunities/v2";

interface SamGovOpportunity {
  noticeId?: string;
  title?: string;
  department?: string;
  subTier?: string;
  type?: string;
  awardCeiling?: string | number;
  awardFloor?: string | number;
  responseDeadLine?: string;
  postedDate?: string;
  description?: string;
  uiLink?: string;
  naicsCode?: string | string[];
  placeOfPerformance?: {
    country?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
  };
  [k: string]: unknown;
}

interface SamGovResponse {
  totalRecords?: number;
  opportunitiesData?: SamGovOpportunity[];
}

export interface FetchSamGovOptions {
  /** How many days back to look (default 7). */
  sinceDays?: number;
  /** Records per page (max 1000 per API; we use 100 default). */
  limit?: number;
  /** Hard cap on total records pulled per run (default 200). */
  maxRecords?: number;
}

/** Format a Date as mm/dd/yyyy for SAM.gov's API (it does NOT accept ISO). */
function fmtMmDdYyyy(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

export async function fetchSamGovOpportunities(
  opts: FetchSamGovOptions = {}
): Promise<OpportunityInput[]> {
  const apiKey = env.SAM_GOV_API_KEY;
  if (!apiKey) {
    console.log("[skip] sam_gov: SAM_GOV_API_KEY not set");
    return [];
  }

  const sinceDays = opts.sinceDays ?? 7;
  const limit = opts.limit ?? 100;
  const maxRecords = opts.maxRecords ?? 200;

  const now = new Date();
  const from = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);
  const postedFrom = fmtMmDdYyyy(from);
  const postedTo = fmtMmDdYyyy(now);

  const all: OpportunityInput[] = [];
  let offset = 0;

  while (all.length < maxRecords) {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("postedFrom", postedFrom);
    url.searchParams.set("postedTo", postedTo);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      console.error("[error] sam_gov: network error", err);
      break;
    }

    if (!res.ok) {
      console.error(
        `[error] sam_gov: HTTP ${res.status} (offset ${offset}); aborting page loop`
      );
      break;
    }

    const json = (await res.json()) as SamGovResponse;
    const page = json.opportunitiesData ?? [];
    if (page.length === 0) break;

    for (const r of page) {
      const mapped = mapRecord(r);
      if (mapped) all.push(mapped);
    }

    if (page.length < limit) break;
    offset += limit;
  }

  console.log(`[fetch] sam_gov: ${all.length} records`);
  return all.slice(0, maxRecords);
}

function mapRecord(r: SamGovOpportunity): OpportunityInput | null {
  if (!r.noticeId || !r.title) return null;

  const agency = [r.department, r.subTier].filter(Boolean).join(" — ") || null;

  // Geography: prefer state when present, else country code.
  const geo =
    r.placeOfPerformance?.state?.code ??
    r.placeOfPerformance?.state?.name ??
    r.placeOfPerformance?.country?.code ??
    "US";

  // Keywords: NAICS codes (string or array) + title bigrams.
  const naicsArr = Array.isArray(r.naicsCode)
    ? r.naicsCode
    : r.naicsCode
      ? [r.naicsCode]
      : [];
  const keywords = [
    ...naicsArr.map((c) => `naics:${c}`),
    ...extractTitleKeywords(r.title),
  ];

  return {
    source: "sam_gov",
    source_id: r.noticeId,
    title: r.title,
    agency,
    type: r.type ?? null,
    amount_min:
      typeof r.awardFloor === "number"
        ? r.awardFloor
        : r.awardFloor != null
          ? Number(r.awardFloor)
          : null,
    amount_max:
      typeof r.awardCeiling === "number"
        ? r.awardCeiling
        : r.awardCeiling != null
          ? Number(r.awardCeiling)
          : null,
    deadline: r.responseDeadLine ?? null,
    posted_at: r.postedDate ?? null,
    brief: r.description ? r.description.slice(0, 500) : null,
    keywords,
    geo,
    url: r.uiLink ?? null,
    needs_review: false,
    raw_json: r as Record<string, unknown>,
  };
}
