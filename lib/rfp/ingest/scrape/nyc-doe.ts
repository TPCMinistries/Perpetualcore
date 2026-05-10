/**
 * NYC DOE (Department of Education) Vendor RFP / Contract Opportunities scraper.
 *
 * Source: https://www.nyc.gov/site/doe/funding/contract-opportunities.page
 * Auth:   none
 * Throttle: 1 req / sec
 *
 * Many DOE solicitations live behind the DOE Vendor Portal (login required).
 * The static contract-opportunities page lists active RFPs with title,
 * solicitation number, due date, and a link to the full RFx PDF.
 *
 * Last verified: 2026-05-10. Baseline expected node count: ~5-25 active.
 * If the static page disappears or changes structure, drift fires.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchHtml,
  normalizeKeywords,
  stripTags,
  toIsoDate,
} from "./utils";

const SOURCE = "nyc_doe" as const;

const BASE_URL =
  "https://www.nyc.gov/site/doe/funding/contract-opportunities.page";

export async function fetchNycDoeOpportunities(): Promise<OpportunityInput[]> {
  let resp: Awaited<ReturnType<typeof fetchHtml>>;
  try {
    resp = await fetchHtml(BASE_URL);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: { message, url: BASE_URL },
    });
    return [];
  }

  if (resp.status >= 400) {
    await recordDrift({
      source: SOURCE,
      reason: "http_status",
      details: { status: resp.status, url: BASE_URL },
    });
    return [];
  }

  const records = parseDoeListing(resp.html, resp.finalUrl);

  if (records.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: "DOE contract-opportunities page structure may have changed; verify URL and rebuild parser. Many solicitations live in the DOE Vendor Portal (login-walled).",
      },
    });
    return [];
  }

  return records;
}

function parseDoeListing(html: string, finalUrl: string): OpportunityInput[] {
  const records: OpportunityInput[] = [];

  // Primary table layout.
  for (const tableMatch of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    for (const rowMatch of tableMatch[1].matchAll(
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    )) {
      const cells = Array.from(
        rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
      ).map((m) => stripTags(m[1]));
      if (cells.length < 2) continue;
      if (
        /^(solicitation|title|rfx|contract|due\s*date)/i.test(cells[0])
      ) {
        continue;
      }

      const title =
        cells.find((c) => c && c.length > 12) ?? cells[1] ?? cells[0];
      if (!title) continue;

      const idCell = cells.find((c) =>
        /^(R\d|RFx|RFP|EOI)[A-Z0-9-]*$/i.test(c)
      );

      const linkMatch = /<a[^>]+href="([^"]+)"/i.exec(rowMatch[1]);
      const url = linkMatch ? absoluteUrl(linkMatch[1], finalUrl) : null;
      const dateCell = cells.find((c) => /\d{4}|\d{1,2}\/\d{1,2}/.test(c));

      records.push({
        source: SOURCE,
        source_id: idCell ?? fallbackSourceId([SOURCE, title, url ?? ""]),
        title: decodeEntities(title),
        agency: "NYC Department of Education",
        deadline: toIsoDate(dateCell),
        url,
        geo: "NYC",
        keywords: normalizeKeywords(title.split(/\s+/)),
        raw_json: { row_cells: cells },
      });
    }
  }

  // Fallback: anchor-based extraction for non-tabular layouts.
  if (records.length === 0) {
    for (const linkMatch of html.matchAll(
      /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    )) {
      const href = linkMatch[1];
      const text = stripTags(linkMatch[2]);
      if (!text) continue;
      if (!/(rfp|rfx|solicitation|contract|vendor)/i.test(text)) continue;
      records.push({
        source: SOURCE,
        source_id: fallbackSourceId([SOURCE, text, href]),
        title: decodeEntities(text),
        agency: "NYC Department of Education",
        url: absoluteUrl(href, finalUrl),
        geo: "NYC",
        keywords: normalizeKeywords(text.split(/\s+/)),
        raw_json: { anchor_only: true },
      });
    }
  }

  return records;
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
