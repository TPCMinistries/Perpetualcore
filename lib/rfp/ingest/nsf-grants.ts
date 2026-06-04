/**
 * NSF-focused Grants.gov fetcher.
 *
 * NSF announces funding opportunities on NSF.gov and Grants.gov. This connector
 * uses Grants.gov's current search API so open/forecasted NSF opportunities can
 * be ingested, scored, and monitored separately from broad Grants.gov volume.
 */

import { env } from "@/lib/env";
import {
  extractTitleKeywords,
  type OpportunityInput,
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
  description?: string;
  [key: string]: unknown;
}

interface GrantsGovResponse {
  errorcode?: number;
  msg?: string;
  data?: {
    hitCount?: number;
    oppHits?: GrantsGovOppHit[];
  };
}

export interface FetchNsfGrantsOptions {
  rows?: number;
  maxRecords?: number;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function cleanText(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = decodeHtmlEntities(input).replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function parseNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const parsed = Number(input.replace(/[$,]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function isNsfHit(hit: GrantsGovOppHit): boolean {
  const haystack = [
    hit.agency,
    hit.agencyName,
    hit.agencyCode,
    hit.title,
    hit.number,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("national science foundation") ||
    haystack.includes("u.s. national science foundation") ||
    haystack.includes("nsf") ||
    haystack.includes("agency code: nsf")
  );
}

function mapRecord(record: GrantsGovOppHit): OpportunityInput | null {
  const title = cleanText(record.title);
  const sourceId = record.number || (record.id != null ? String(record.id) : null);
  if (!sourceId || !title) return null;

  const cfdaArr = Array.isArray(record.cfdaList)
    ? record.cfdaList
    : typeof record.cfdaList === "string" && record.cfdaList.length > 0
      ? record.cfdaList.split(/[,;]/).map((value) => value.trim()).filter(Boolean)
      : [];
  const programCode = sourceId.split("-")[0]?.toLowerCase();
  const keywords = [
    "nsf",
    "stem",
    programCode ? `program:${programCode}` : null,
    ...cfdaArr.map((code) => `cfda:${code}`),
    ...extractTitleKeywords(title),
  ].filter((value): value is string => Boolean(value));

  const url = record.id
    ? `https://www.grants.gov/search-results-detail/${record.id}`
    : null;

  return {
    source: "nsf_grants",
    source_id: sourceId,
    title,
    agency:
      cleanText(record.agencyName ?? record.agency ?? record.agencyCode) ??
      "U.S. National Science Foundation",
    type: cleanText(record.docType ?? record.oppStatus) ?? null,
    amount_min: parseNumber(record.awardFloor),
    amount_max: parseNumber(record.awardCeiling),
    deadline: cleanText(record.closeDate),
    posted_at: cleanText(record.openDate),
    brief: cleanText(record.description)?.slice(0, 500) ?? null,
    keywords,
    geo: "US",
    url,
    needs_review: false,
    raw_json: record as Record<string, unknown>,
  };
}

export async function fetchNsfGrantOpportunities(
  opts: FetchNsfGrantsOptions = {},
): Promise<OpportunityInput[]> {
  const rows = opts.rows ?? 100;
  const maxRecords = opts.maxRecords ?? 400;
  const all: OpportunityInput[] = [];
  let startRecordNum = 0;

  while (all.length < maxRecords) {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/search2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          startRecordNum,
          oppStatuses: "forecasted|posted",
          agencies: "NSF",
          keyword: "NSF",
        }),
      });
    } catch (err) {
      console.error("[error] nsf_grants: network error", err);
      break;
    }

    if (!response.ok) {
      console.error(`[error] nsf_grants: HTTP ${response.status}; aborting page loop`);
      break;
    }

    const json = (await response.json()) as GrantsGovResponse;
    if (json.errorcode && json.errorcode !== 0) {
      console.error(
        `[error] nsf_grants: API errorcode=${json.errorcode} msg=${json.msg}`,
      );
      break;
    }

    const hits = json.data?.oppHits ?? [];
    if (hits.length === 0) break;

    for (const hit of hits) {
      if (!isNsfHit(hit)) continue;
      const mapped = mapRecord(hit);
      if (mapped) all.push(mapped);
      if (all.length >= maxRecords) break;
    }

    if (hits.length < rows) break;
    startRecordNum += rows;
  }

  console.log(`[fetch] nsf_grants: ${all.length} records`);
  return all.slice(0, maxRecords);
}
