/**
 * Pennsylvania eMarketplace public current-solicitations connector.
 *
 * Source: https://www.emarketplace.state.pa.us/Search.aspx
 *
 * Auth: none. This reads the public current solicitations grid and public
 * solicitation detail links. It does not log in, submit bids, or download files.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fetchHtml,
  normalizeKeywords,
  stripTags,
  toIsoDate,
} from "./utils";

const SOURCE = "pa_grants" as const;
const SEARCH_URL = "https://www.emarketplace.state.pa.us/Search.aspx";
const DETAIL_BASE_URL = "https://www.emarketplace.state.pa.us";

interface PaEMarketplaceRow {
  solicitationId: string;
  type: string | null;
  title: string;
  description: string | null;
  agency: string | null;
  county: string | null;
  amendedDate: string | null;
  startDate: string | null;
  dueDate: string | null;
  bidOpeningDate: string | null;
  status: string | null;
  contactPerson: string | null;
  detailPath: string | null;
}

export async function fetchPaEMarketplaceOpportunities(): Promise<
  OpportunityInput[]
> {
  let html = "";
  let status = 0;
  let finalUrl = SEARCH_URL;

  try {
    const response = await fetchHtml(SEARCH_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PerpetualCore-RFP-Engine/1.0; +https://rfp.perpetualcore.com)",
      },
    });
    html = response.html;
    status = response.status;
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

  if (status >= 400) {
    await recordDrift({
      source: SOURCE,
      reason: "http_status",
      details: { status, endpoint: SEARCH_URL, final_url: finalUrl },
    });
    return [];
  }

  const rows = parseSearchRows(html);
  if (rows.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "zero_nodes",
      details: {
        endpoint: SEARCH_URL,
        html_bytes: html.length,
        parser: "ctl00_MainBody_grdResults",
      },
    });
    return [];
  }

  const opportunities = rows
    .map(normalizeRow)
    .filter((row): row is OpportunityInput => row !== null);

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

function parseSearchRows(html: string): PaEMarketplaceRow[] {
  const table =
    /<table[^>]+id="ctl00_MainBody_grdResults"[^>]*>([\s\S]*?)<\/table>/i.exec(
      html,
    )?.[1] ?? "";
  if (!table) return [];

  const rows: PaEMarketplaceRow[] = [];
  const trMatches = table.matchAll(
    /<tr[^>]+class="Grid(?:Alt)?Item"[^>]*>([\s\S]*?)<\/tr>/gi,
  );

  for (const tr of trMatches) {
    const rawCells = Array.from(
      tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
    ).map((match) => match[1]);
    if (rawCells.length < 12) continue;

    const firstCell = rawCells[0] ?? "";
    const href = /href="([^"]+)"/i.exec(firstCell)?.[1] ?? null;
    const solicitationId = clean(stripTags(firstCell));
    const title = titleFromCell(rawCells[2] ?? "");
    if (!solicitationId || !title) continue;

    rows.push({
      solicitationId,
      type: clean(stripTags(rawCells[1] ?? "")),
      title,
      description: descriptionFromCell(rawCells[3] ?? ""),
      agency: clean(stripTags(rawCells[4] ?? "")),
      county: clean(stripTags(rawCells[5] ?? "")),
      amendedDate: clean(stripTags(rawCells[6] ?? "")),
      startDate: clean(stripTags(rawCells[7] ?? "")),
      dueDate: clean(stripTags(rawCells[8] ?? "")),
      bidOpeningDate: clean(stripTags(rawCells[9] ?? "")),
      status: clean(stripTags(rawCells[10] ?? "")),
      contactPerson: clean(stripTags(rawCells[11] ?? "")),
      detailPath: href,
    });
  }

  return rows;
}

function normalizeRow(row: PaEMarketplaceRow): OpportunityInput | null {
  const detailUrl = row.detailPath
    ? new URL(decodeEntities(row.detailPath), DETAIL_BASE_URL).toString()
    : null;
  const deadline = toIsoDate(row.dueDate ?? row.bidOpeningDate);
  const postedAt = toIsoDate(row.startDate ?? row.amendedDate);
  const brief = buildBrief(row);

  return {
    source: SOURCE,
    source_id: row.solicitationId,
    title: row.title,
    agency: row.agency,
    type: row.type,
    amount_min: null,
    amount_max: null,
    deadline,
    posted_at: postedAt,
    brief,
    keywords: normalizeKeywords([
      "pennsylvania",
      "pa emarketplace",
      "procurement",
      ...(row.type?.split(/\W+/) ?? []),
      ...(row.agency?.split(/\W+/) ?? []),
      ...(row.county?.split(/\W+/) ?? []),
      ...row.title.split(/\W+/),
    ]),
    geo: row.county ? `PA:${row.county}` : "PA",
    url: detailUrl,
    needs_review: deadline === null || row.status?.toLowerCase() !== "open",
    raw_json: {
      source_url: SEARCH_URL,
      detail_url: detailUrl,
      row,
    },
  };
}

function titleFromCell(cell: string): string | null {
  const titleAttr = /\btitle="([^"]+)"/i.exec(cell)?.[1];
  return clean(titleAttr ? decodeEntities(titleAttr) : stripTags(cell));
}

function descriptionFromCell(cell: string): string | null {
  const hoverText = /<div[^>]+_divInfo['"][^>]*>([\s\S]*?)<\/div>/i.exec(
    cell,
  )?.[1];
  return clean(stripTags(hoverText ?? cell));
}

function buildBrief(row: PaEMarketplaceRow): string | null {
  const parts = [
    `PA eMarketplace ${row.solicitationId}: ${row.title}.`,
    row.description,
    row.agency ? `Agency: ${row.agency}.` : null,
    row.county ? `County: ${row.county}.` : null,
    row.contactPerson ? `Contact: ${row.contactPerson}.` : null,
    row.status ? `Status: ${row.status}.` : null,
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
