/**
 * New Jersey NJSTART public open-bids connector.
 *
 * Source: https://www.njstart.gov/bso/view/search/external/advancedSearchBid.xhtml?openBids=true
 *
 * Auth: none. This reads the public open-bids table and public bid detail pages.
 * It does not log in, submit forms, or download attachments.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchHtml,
  normalizeKeywords,
  sleep,
  stripTags,
  toIsoDate,
} from "./utils";

const SOURCE = "nj_grants" as const;
const SEARCH_URL =
  "https://www.njstart.gov/bso/view/search/external/advancedSearchBid.xhtml?openBids=true";
const DETAIL_BASE_URL = "https://www.njstart.gov";
const MAX_DETAIL_PAGES = 25;

interface NjStartSearchRow {
  bidNumber: string;
  organization: string | null;
  buyer: string | null;
  description: string;
  bidOpeningDate: string | null;
  status: string | null;
  detailPath: string | null;
}

interface NjStartDetail {
  bidNumber: string | null;
  description: string | null;
  bidOpeningDate: string | null;
  purchaser: string | null;
  organization: string | null;
  department: string | null;
  location: string | null;
  typeCode: string | null;
  availableDate: string | null;
  bidType: string | null;
  purchaseMethod: string | null;
  preBidConference: string | null;
  infoContact: string | null;
  attachments: string[];
}

export async function fetchNjStartOpportunities(): Promise<OpportunityInput[]> {
  let searchHtml = "";
  let searchStatus = 0;
  let finalUrl = SEARCH_URL;

  try {
    const response = await fetchHtml(SEARCH_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PerpetualCore-RFP-Engine/1.0; +https://rfp.perpetualcore.com)",
      },
    });
    searchHtml = response.html;
    searchStatus = response.status;
    finalUrl = response.finalUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: { message, endpoint: SEARCH_URL },
    });
    return [];
  }

  if (searchStatus >= 400) {
    await recordDrift({
      source: SOURCE,
      reason: "http_status",
      details: { status: searchStatus, endpoint: SEARCH_URL, final_url: finalUrl },
    });
    return [];
  }

  const rows = parseSearchRows(searchHtml);
  if (rows.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "zero_nodes",
      details: {
        endpoint: SEARCH_URL,
        html_bytes: searchHtml.length,
        parser: "bidSearchResultsForm:bidResultId_data",
      },
    });
    return [];
  }

  const opportunities: OpportunityInput[] = [];
  for (const row of rows.slice(0, MAX_DETAIL_PAGES)) {
    const detailUrl = row.detailPath
      ? new URL(decodeEntities(row.detailPath), DETAIL_BASE_URL).toString()
      : null;
    let detail: NjStartDetail | null = null;

    if (detailUrl) {
      await sleep(250);
      try {
        const response = await fetchHtml(detailUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; PerpetualCore-RFP-Engine/1.0; +https://rfp.perpetualcore.com)",
          },
        });
        if (response.status < 400) {
          detail = parseDetail(response.html);
        }
      } catch {
        detail = null;
      }
    }

    const normalized = normalizeRow(row, detail, detailUrl);
    if (normalized) opportunities.push(normalized);
  }

  if (opportunities.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "shape_mismatch",
      details: {
        endpoint: SEARCH_URL,
        rows_seen: rows.length,
        sample: rows.slice(0, 3),
      },
    });
  }

  return opportunities;
}

function parseSearchRows(html: string): NjStartSearchRow[] {
  const tbody = /<tbody[^>]+id="bidSearchResultsForm:bidResultId_data"[^>]*>([\s\S]*?)<\/tbody>/i.exec(
    html,
  )?.[1];
  if (!tbody) return [];

  const rows: NjStartSearchRow[] = [];
  for (const tr of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
    if (cells.length < 11) continue;

    const firstCell = cells[0]?.[1] ?? "";
    const href = /href="([^"]+)"/i.exec(firstCell)?.[1] ?? null;
    const bidNumber = clean(stripTags(firstCell));
    const description = clean(stripTags(cells[6]?.[1] ?? ""));
    if (!bidNumber || !description) continue;

    rows.push({
      bidNumber,
      organization: clean(stripTags(cells[2]?.[1] ?? "")),
      buyer: clean(stripTags(cells[5]?.[1] ?? "")),
      description,
      bidOpeningDate: clean(stripTags(cells[7]?.[1] ?? "")),
      status: clean(stripTags(cells[10]?.[1] ?? "")),
      detailPath: href,
    });
  }
  return rows;
}

function parseDetail(html: string): NjStartDetail {
  return {
    bidNumber: fieldValue(html, "Bid Number"),
    description: fieldValue(html, "Description"),
    bidOpeningDate: fieldValue(html, "Bid Opening Date"),
    purchaser: fieldValue(html, "Purchaser"),
    organization: fieldValue(html, "Organization"),
    department: fieldValue(html, "Department"),
    location: fieldValue(html, "Location"),
    typeCode: fieldValue(html, "Type Code"),
    availableDate: fieldValue(html, "Available Date"),
    bidType: fieldValue(html, "Bid Type"),
    purchaseMethod: fieldValue(html, "Purchase Method"),
    preBidConference: fieldValue(html, "Pre Bid Conference"),
    infoContact: fieldValue(html, "Info Contact"),
    attachments: parseAttachmentNames(html),
  };
}

function fieldValue(html: string, label: string): string | null {
  const pattern = new RegExp(
    `<td[^>]*class=["']?t-head-01["']?[^>]*>\\s*${escapeRegExp(label)}\\s*:?\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
    "i",
  );
  return clean(stripTags(pattern.exec(html)?.[1] ?? ""));
}

function parseAttachmentNames(html: string): string[] {
  const fileSection = /File Attachments:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i.exec(
    html,
  )?.[1];
  if (!fileSection) return [];
  return Array.from(fileSection.matchAll(/class="link-01"[^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => clean(stripTags(match[1])))
    .filter((value): value is string => Boolean(value))
    .slice(0, 12);
}

function normalizeRow(
  row: NjStartSearchRow,
  detail: NjStartDetail | null,
  detailUrl: string | null,
): OpportunityInput | null {
  const title = clean(detail?.description) ?? row.description;
  if (!title || title.length < 4) return null;

  const sourceId =
    clean(detail?.bidNumber) ??
    row.bidNumber ??
    fallbackSourceId([SOURCE, title, detailUrl ?? ""]);
  const agency = clean(detail?.organization) ?? row.organization;
  const type = clean(detail?.typeCode) ?? clean(detail?.bidType) ?? "Bid solicitation";
  const deadline = toIsoDate(detail?.bidOpeningDate ?? row.bidOpeningDate);
  const postedAt = toIsoDate(detail?.availableDate);
  const attachments = detail?.attachments ?? [];
  const brief = buildBrief(detail, row, attachments);

  return {
    source: SOURCE,
    source_id: sourceId,
    title,
    agency,
    type,
    amount_min: null,
    amount_max: null,
    deadline,
    posted_at: postedAt,
    brief,
    keywords: normalizeKeywords([
      "new jersey",
      "njstart",
      "procurement",
      ...(type?.split(/\W+/) ?? []),
      ...(detail?.department?.split(/\W+/) ?? []),
      ...(detail?.location?.split(/\W+/) ?? []),
      ...title.split(/\W+/),
    ]),
    geo: "NJ",
    url: detailUrl,
    needs_review: deadline === null || detail === null,
    raw_json: {
      source_url: SEARCH_URL,
      detail_url: detailUrl,
      search_row: row,
      detail,
      attachments,
    },
  };
}

function buildBrief(
  detail: NjStartDetail | null,
  row: NjStartSearchRow,
  attachments: string[],
): string | null {
  const parts = [
    `NJSTART ${detail?.bidNumber ?? row.bidNumber}: ${detail?.description ?? row.description}`,
    detail?.department ? `Department: ${detail.department}.` : null,
    detail?.purchaseMethod ? `Purchase method: ${detail.purchaseMethod}.` : null,
    detail?.preBidConference ? `Pre-bid conference: ${detail.preBidConference}.` : null,
    detail?.infoContact ? `Contact: ${detail.infoContact}.` : null,
    attachments.length > 0
      ? `Attachments: ${attachments.slice(0, 6).join("; ")}.`
      : null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  const text = parts.join(" ");
  return text.length > 1_200 ? `${text.slice(0, 1_197)}...` : text;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = decodeEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
