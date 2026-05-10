/**
 * Grants.gov fetcher.
 *
 * Endpoint: POST https://api.grants.gov/v1/api/search2
 * Auth:     none required
 *
 * The API responds in a deeply nested envelope:
 *   { errorcode, msg, token, data: { hitCount, oppHits: [...], ... } }
 */

import { env } from "@/lib/env";
import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

const BASE_URL = env.GRANTS_GOV_BASE_URL ?? "https://api.grants.gov/v1/api";

interface GrantsGovOppHit {
  id?: string | number;
  number?: string;
  title?: string;
  agency?: string;
  agencyName?: string;
  agencyCode?: string;
  oppStatus?: string;
  openDate?: string;
  closeDate?: string;
  docType?: string;
  cfdaList?: string[] | string;
  awardCeiling?: string | number;
  awardFloor?: string | number;
  // Synopsis arrives via a separate endpoint, but search2 sometimes returns a snippet.
  description?: string;
  [k: string]: unknown;
}

interface GrantsGovResponse {
  errorcode?: number;
  msg?: string;
  data?: {
    hitCount?: number;
    oppHits?: GrantsGovOppHit[];
  };
}

export interface FetchGrantsGovOptions {
  /** Records per page (max 100). */
  rows?: number;
  /** Max total records pulled per run. */
  maxRecords?: number;
}

export async function fetchGrantsGovOpportunities(
  opts: FetchGrantsGovOptions = {}
): Promise<OpportunityInput[]> {
  const rows = opts.rows ?? 100;
  const maxRecords = opts.maxRecords ?? 200;

  const all: OpportunityInput[] = [];
  let startRecordNum = 0;

  while (all.length < maxRecords) {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/search2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          startRecordNum,
          oppStatuses: "forecasted|posted",
        }),
      });
    } catch (err) {
      console.error("[error] grants_gov: network error", err);
      break;
    }

    if (!res.ok) {
      console.error(`[error] grants_gov: HTTP ${res.status}; aborting page loop`);
      break;
    }

    const json = (await res.json()) as GrantsGovResponse;
    if (json.errorcode && json.errorcode !== 0) {
      console.error(
        `[error] grants_gov: API errorcode=${json.errorcode} msg=${json.msg}`
      );
      break;
    }

    const hits = json.data?.oppHits ?? [];
    if (hits.length === 0) break;

    for (const h of hits) {
      const mapped = mapRecord(h);
      if (mapped) all.push(mapped);
    }

    if (hits.length < rows) break;
    startRecordNum += rows;
  }

  console.log(`[fetch] grants_gov: ${all.length} records`);
  return all.slice(0, maxRecords);
}

function mapRecord(r: GrantsGovOppHit): OpportunityInput | null {
  // The unique identifier on Grants.gov is `id` (numeric OPPORTUNITY_ID)
  // OR `number` (e.g. "HHS-2025-IHS-..."). Prefer `id`.
  const sourceId = r.id != null ? String(r.id) : r.number;
  if (!sourceId || !r.title) return null;

  const agency = r.agencyName ?? r.agency ?? r.agencyCode ?? null;

  const cfdaArr = Array.isArray(r.cfdaList)
    ? r.cfdaList
    : typeof r.cfdaList === "string" && r.cfdaList.length > 0
      ? r.cfdaList.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : [];

  const keywords = [
    ...cfdaArr.map((c) => `cfda:${c}`),
    ...extractTitleKeywords(r.title),
  ];

  // Grants.gov posting URL pattern; the search response doesn't always include
  // a direct URL but the public viewer follows this pattern.
  const url = r.id
    ? `https://www.grants.gov/search-results-detail/${r.id}`
    : null;

  return {
    source: "grants_gov",
    source_id: sourceId,
    title: r.title,
    agency,
    type: r.oppStatus ?? r.docType ?? null,
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
    deadline: r.closeDate ?? null,
    posted_at: r.openDate ?? null,
    brief: r.description ? r.description.slice(0, 500) : null,
    keywords,
    geo: "US",
    url,
    needs_review: false,
    raw_json: r as Record<string, unknown>,
  };
}
