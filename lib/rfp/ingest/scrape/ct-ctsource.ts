/**
 * Connecticut CTsource public bid-board connector.
 *
 * Source: https://portal.ct.gov/das/ctsource/bidboard
 *
 * Auth: none. CT's public page embeds the Proactis WebProcure bid board for
 * customer id 51. This connector reads the same public JSON search endpoint the
 * embedded app uses; it does not log in, submit bids, or download attachments.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import { normalizeKeywords, sleep } from "./utils";
import { request as httpsRequest } from "node:https";

const SOURCE = "ct_grants" as const;
const OFFICIAL_BID_BOARD_URL = "https://portal.ct.gov/das/ctsource/bidboard";
const RESOURCE_URL =
  "https://webprocure.proactiscloud.com/wp-web-public/en/resource/?eboId=51&oid=-1";
const SEARCH_URL =
  "https://webprocure.proactiscloud.com/wp-full-text-search/search/sols";
const CUSTOMER_ID = "51";
const PAGE_SIZE = 10;
const MAX_RECORDS = 250;

interface CtSearchResponse {
  hits?: number;
  records?: CtBidRecord[];
  facets?: unknown;
}

interface CtBidRecord {
  bidid?: number;
  bidNumber?: string;
  title?: string;
  description?: string;
  startDate?: number;
  openDate?: number;
  prtcpBeginDate?: number;
  prtcpEndDate?: number;
  cdate?: number;
  statusDate?: number;
  estimatedTotal?: number | string | null;
  creatorOrg?: CtOrg;
  ownerOrg?: CtOrg;
  ctBidstatus?: {
    publicStatus?: string;
    dStatus?: string;
    name?: string;
    status?: number;
  };
  orgBidClassType?: {
    code?: string;
    description?: string;
  };
  bidRespondAccessType?: {
    description?: string;
  };
  bidHeaderCats?: Array<{
    catItem?: {
      nic?: string;
      name?: string;
    };
  }>;
}

interface CtOrg {
  oid?: number;
  name?: string;
  homeUrl?: string | null;
  timeZone?: string;
}

export async function fetchCtCtsourceOpportunities(): Promise<
  OpportunityInput[]
> {
  const resourceOk = await verifyResource();
  if (!resourceOk) return [];

  const opportunities: OpportunityInput[] = [];
  let expectedHits: number | null = null;

  for (let offset = 0; offset < MAX_RECORDS; offset += PAGE_SIZE) {
    if (offset > 0) await sleep(250);
    const response = await fetchSearchPage(offset);
    if (!response) return opportunities;

    if (typeof response.hits === "number") expectedHits = response.hits;
    const records = response.records ?? [];
    if (records.length === 0) break;

    for (const record of records) {
      const normalized = normalizeRecord(record);
      if (normalized) opportunities.push(normalized);
    }

    if (records.length < PAGE_SIZE) break;
    if (expectedHits !== null && opportunities.length >= expectedHits) break;
  }

  if (opportunities.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "zero_nodes",
      details: {
        endpoint: SEARCH_URL,
        parser: "wp-full-text-search/search/sols",
        expected_hits: expectedHits,
      },
    });
  }

  return dedupeBySourceId(opportunities);
}

async function verifyResource(): Promise<boolean> {
  try {
    const response = await fetchJsonWithScopedTlsFallback<Record<string, unknown>>(
      RESOURCE_URL,
    );
    if (response.status >= 400) {
      await recordDrift({
        source: SOURCE,
        reason: "http_status",
        details: {
          endpoint: RESOURCE_URL,
          status: response.status,
        },
      });
      return false;
    }

    const json = response.json;
    if (
      typeof json.apiBaseURL !== "string" ||
      !json.apiBaseURL.includes("wp-full-text-search")
    ) {
      await recordDrift({
        source: SOURCE,
        reason: "shape_mismatch",
        details: {
          endpoint: RESOURCE_URL,
          keys: Object.keys(json),
        },
      });
      return false;
    }
    return true;
  } catch (err) {
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: {
        endpoint: RESOURCE_URL,
        message: err instanceof Error ? err.message : String(err),
      },
    });
    return false;
  }
}

async function fetchSearchPage(
  offset: number,
): Promise<CtSearchResponse | null> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("customerid", CUSTOMER_ID);
  url.searchParams.set("q", "*");
  url.searchParams.set("from", String(offset));
  url.searchParams.set("sort", "r");
  url.searchParams.set("f", "ps=Open");
  url.searchParams.set("oids", "");

  try {
    const response = await fetchJsonWithScopedTlsFallback<CtSearchResponse>(
      url.toString(),
    );
    if (response.status >= 400) {
      await recordDrift({
        source: SOURCE,
        reason: "http_status",
        details: {
          endpoint: SEARCH_URL,
          status: response.status,
          offset,
        },
      });
      return null;
    }

    const json = response.json;
    if (!Array.isArray(json.records)) {
      await recordDrift({
        source: SOURCE,
        reason: "shape_mismatch",
        details: {
          endpoint: SEARCH_URL,
          offset,
          keys: Object.keys(json as Record<string, unknown>),
        },
      });
      return null;
    }
    return json;
  } catch (err) {
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: {
        endpoint: SEARCH_URL,
        offset,
        message: err instanceof Error ? err.message : String(err),
      },
    });
    return null;
  }
}

async function fetchJsonWithScopedTlsFallback<T>(
  url: string,
): Promise<{ status: number; json: T }> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; PerpetualCore-RFP-Engine/1.0; +https://rfp.perpetualcore.com)",
      },
    });
    return {
      status: response.status,
      json: (await response.json()) as T,
    };
  } catch (err) {
    if (!isNodeCertificateChainError(err)) throw err;
    return fetchJsonWithRelaxedCertificate(url);
  }
}

function fetchJsonWithRelaxedCertificate<T>(
  url: string,
): Promise<{ status: number; json: T }> {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; PerpetualCore-RFP-Engine/1.0; +https://rfp.perpetualcore.com)",
        },
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({
              status: response.statusCode ?? 0,
              json: JSON.parse(body) as T,
            });
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

function isNodeCertificateChainError(err: unknown): boolean {
  const cause =
    typeof err === "object" && err !== null && "cause" in err
      ? (err as { cause?: unknown }).cause
      : err;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code?: unknown }).code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  );
}

function normalizeRecord(record: CtBidRecord): OpportunityInput | null {
  const sourceId = record.bidid
    ? String(record.bidid)
    : clean(record.bidNumber);
  const title = clean(record.title);
  if (!sourceId || !title) return null;

  const status = clean(
    record.ctBidstatus?.publicStatus ??
      record.ctBidstatus?.dStatus ??
      record.ctBidstatus?.name,
  );
  const agency = clean(record.creatorOrg?.name ?? record.ownerOrg?.name);
  const type = clean(
    record.orgBidClassType?.description ?? record.orgBidClassType?.code,
  );
  const deadline = msToIso(record.openDate ?? record.prtcpEndDate);
  const postedAt = msToIso(
    record.startDate ?? record.prtcpBeginDate ?? record.cdate ?? record.statusDate,
  );
  const detailUrl = buildDetailUrl(record.bidid, record.bidNumber);
  const commodityKeywords =
    record.bidHeaderCats
      ?.flatMap((category) => [
        category.catItem?.nic ?? "",
        category.catItem?.name ?? "",
      ])
      .filter(Boolean) ?? [];

  return {
    source: SOURCE,
    source_id: sourceId,
    title,
    agency,
    type,
    amount_min: null,
    amount_max: amountToNumber(record.estimatedTotal),
    deadline,
    posted_at: postedAt,
    brief: buildBrief(record, agency, type, status),
    keywords: normalizeKeywords([
      "connecticut",
      "ctsource",
      "ct",
      "procurement",
      record.orgBidClassType?.code ?? "",
      type ?? "",
      agency ?? "",
      ...title.split(/\W+/),
      ...commodityKeywords.flatMap((keyword) => keyword.split(/\W+/)),
    ]),
    geo: "CT",
    url: detailUrl,
    needs_review: status?.toLowerCase() !== "open" || deadline === null,
    raw_json: {
      source_url: OFFICIAL_BID_BOARD_URL,
      search_url: SEARCH_URL,
      detail_url: detailUrl,
      record,
    },
  };
}

function buildDetailUrl(
  bidId: number | undefined,
  bidNumber: string | undefined,
): string {
  const id = bidId ? String(bidId) : clean(bidNumber) ?? "";
  const url = new URL(
    `https://webprocure.proactiscloud.com/wp-web-public/en/#/bidboard/bid/${encodeURIComponent(
      id,
    )}`,
  );
  url.searchParams.set("customerid", CUSTOMER_ID);
  url.searchParams.set("searchterm", "*");
  url.searchParams.set("pagenumber", "1");
  return url.toString();
}

function buildBrief(
  record: CtBidRecord,
  agency: string | null,
  type: string | null,
  status: string | null,
): string | null {
  const parts = [
    record.bidNumber ? `CTsource ${record.bidNumber}: ${record.title}.` : null,
    clean(record.description),
    agency ? `Agency: ${agency}.` : null,
    type ? `Type: ${type}.` : null,
    status ? `Status: ${status}.` : null,
    record.bidRespondAccessType?.description
      ? `Respond access: ${record.bidRespondAccessType.description}.`
      : null,
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 1_200 ? `${text.slice(0, 1_197)}...` : text;
}

function msToIso(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function amountToNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

function dedupeBySourceId(
  opportunities: OpportunityInput[],
): OpportunityInput[] {
  const seen = new Set<string>();
  const deduped: OpportunityInput[] = [];
  for (const opportunity of opportunities) {
    if (seen.has(opportunity.source_id)) continue;
    seen.add(opportunity.source_id);
    deduped.push(opportunity);
  }
  return deduped;
}
