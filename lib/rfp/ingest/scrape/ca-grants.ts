/**
 * California Grants Portal connector.
 *
 * Source: California Open Data CKAN datastore
 * Dataset: "California Grants Portal- Grants Offered"
 * Resource ID: 111c8c88-21f6-453c-ae2c-b4785a0624f5
 *
 * Auth: none. The datastore is public and updates daily from the official
 * California Grants Portal.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  fallbackSourceId,
  normalizeKeywords,
  SCRAPER_USER_AGENT,
  toAmount,
  toIsoDate,
} from "./utils";

const SOURCE = "ca_grants" as const;
const RESOURCE_ID = "111c8c88-21f6-453c-ae2c-b4785a0624f5";
const DATASTORE_URL = "https://data.ca.gov/api/3/action/datastore_search";
const PAGE_SIZE = 500;
const MAX_RECORDS = 2_500;

interface CkanResponse {
  success: boolean;
  result?: {
    total?: number;
    records?: CaGrantRecord[];
  };
  error?: {
    message?: string;
  };
}

interface CaGrantRecord {
  _id?: number;
  PortalID?: string | null;
  GrantID?: string | null;
  Status?: string | null;
  LastUpdated?: string | null;
  AgencyDept?: string | null;
  Title?: string | null;
  Type?: string | null;
  Categories?: string | null;
  Purpose?: string | null;
  Description?: string | null;
  ApplicantType?: string | null;
  ApplicantTypeNotes?: string | null;
  Geography?: string | null;
  FundingSource?: string | null;
  EstAvailFunds?: string | null;
  EstAmounts?: string | null;
  OpenDate?: string | null;
  ApplicationDeadline?: string | null;
  GrantURL?: string | null;
  AgencyURL?: string | null;
  ContactInfo?: string | null;
  [key: string]: unknown;
}

export async function fetchCaGrantOpportunities(): Promise<OpportunityInput[]> {
  const records: CaGrantRecord[] = [];

  try {
    for (let offset = 0; offset < MAX_RECORDS; offset += PAGE_SIZE) {
      const page = await fetchPage(offset);
      records.push(...page.records);
      if (records.length >= page.total || page.records.length === 0) break;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: { message, endpoint: DATASTORE_URL, resource_id: RESOURCE_ID },
    });
    return [];
  }

  const opportunities = records
    .map(normalizeRecord)
    .filter((o): o is OpportunityInput => o !== null);

  if (opportunities.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: records.length > 0 ? "shape_mismatch" : "zero_nodes",
      details: {
        endpoint: DATASTORE_URL,
        resource_id: RESOURCE_ID,
        records_seen: records.length,
      },
    });
  }

  return opportunities;
}

async function fetchPage(
  offset: number,
): Promise<{ records: CaGrantRecord[]; total: number }> {
  const url = new URL(DATASTORE_URL);
  url.searchParams.set("resource_id", RESOURCE_ID);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const resp = await fetch(url, {
    headers: {
      "User-Agent": SCRAPER_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} from California datastore`);
  }

  const json = (await resp.json()) as CkanResponse;
  if (!json.success || !json.result) {
    throw new Error(json.error?.message ?? "California datastore returned failure");
  }

  return {
    records: json.result.records ?? [],
    total: json.result.total ?? 0,
  };
}

function normalizeRecord(row: CaGrantRecord): OpportunityInput | null {
  const title = clean(row.Title);
  if (!title || title.length < 4) return null;

  const sourceId =
    clean(row.PortalID) ||
    clean(row.GrantID) ||
    fallbackSourceId([SOURCE, title, clean(row.GrantURL) ?? String(row._id ?? "")]);
  const amount = parseAmountBand(row.EstAmounts) ?? {
    min: null,
    max: toAmount(row.EstAvailFunds),
  };
  const brief = buildBrief(row);
  const url = clean(row.GrantURL) ?? clean(row.AgencyURL);

  return {
    source: SOURCE,
    source_id: sourceId,
    title,
    agency: clean(row.AgencyDept),
    type: normalizeType(row.Type, row.Status),
    amount_min: amount.min,
    amount_max: amount.max,
    deadline:
      toIsoDate(row.ApplicationDeadline) ?? extractDeadlineFromText(row.Description),
    posted_at: toIsoDate(row.OpenDate) ?? toIsoDate(row.LastUpdated),
    brief,
    keywords: normalizeKeywords([
      ...splitKeywords(row.Categories),
      ...splitKeywords(row.ApplicantType),
      ...splitKeywords(row.FundingSource),
      ...title.split(/\s+/),
    ]),
    geo: "CA",
    url,
    needs_review: isSoftDate(row.OpenDate) || isSoftDate(row.ApplicationDeadline),
    raw_json: {
      ...row,
      datastore_resource_id: RESOURCE_ID,
      source_url:
        "https://data.ca.gov/dataset/california-grants-portal/resource/111c8c88-21f6-453c-ae2c-b4785a0624f5",
    },
  };
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const out = value.replace(/\s+/g, " ").trim();
  return out.length > 0 ? out : null;
}

function buildBrief(row: CaGrantRecord): string | null {
  const parts = [row.Purpose, row.Description, row.ApplicantTypeNotes, row.Geography]
    .map(clean)
    .filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  const joined = parts.join(" ");
  return joined.length > 1_200 ? `${joined.slice(0, 1_197)}...` : joined;
}

function splitKeywords(value: unknown): string[] {
  const text = clean(value);
  if (!text) return [];
  return text.split(/[;,/|]+/).map((item) => item.trim());
}

function normalizeType(type: unknown, status: unknown): string {
  const typeText = clean(type) ?? "Grant";
  const statusText = clean(status);
  return statusText ? `${typeText} (${statusText})` : typeText;
}

function parseAmountBand(
  input: string | null | undefined,
): { min: number | null; max: number | null } | null {
  const text = clean(input);
  if (!text) return null;

  const between = /between\s+(\$?[\d,.]+\s*[kKmMbB]?)\s+and\s+(\$?[\d,.]+\s*[kKmMbB]?)/i.exec(
    text,
  );
  if (between) {
    return { min: toAmount(between[1]), max: toAmount(between[2]) };
  }

  const range = /(\$?[\d,.]+\s*[kKmMbB]?)\s*[-–]\s*(\$?[\d,.]+\s*[kKmMbB]?)/.exec(
    text,
  );
  if (range) {
    return { min: toAmount(range[1]), max: toAmount(range[2]) };
  }

  const upTo = /(?:up to|max(?:imum)?(?: of)?)\s+(\$?[\d,.]+\s*[kKmMbB]?)/i.exec(
    text,
  );
  if (upTo) {
    return { min: null, max: toAmount(upTo[1]) };
  }

  const single = toAmount(text);
  return single === null ? null : { min: null, max: single };
}

function extractDeadlineFromText(input: unknown): string | null {
  const text = clean(input);
  if (!text) return null;
  const match =
    /\b(?:due|deadline)[^.]{0,80}?([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i.exec(
      text,
    );
  return match ? toIsoDate(match[1]) : null;
}

function isSoftDate(value: unknown): boolean {
  const text = clean(value);
  if (!text) return false;
  return /^[A-Z][a-z]+\s+\d{4}$/.test(text);
}
