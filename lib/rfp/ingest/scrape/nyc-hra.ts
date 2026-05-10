/**
 * NYC HRA (Human Resources Administration) RFP / contracting scraper.
 *
 * Source: https://www.nyc.gov/site/hra/about/contracting-procurement.page
 * Auth:   none
 * Throttle: 1 req / sec
 *
 * HRA's procurement page links out to PASSPort (NYC's procurement portal) for
 * the live opportunity list. This scraper extracts whatever is enumerated on
 * the static page itself; entries flow through to OpportunityInput[].
 *
 * Last verified: 2026-05-10. Baseline expected node count: ~5-15 (HRA posts
 * relatively few; bulk of NYC procurement opps live in PASSPort which is
 * paywalled / login-walled, so a future Phase 10 extension may need a real
 * auth flow).
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

const SOURCE = "nyc_hra" as const;

const BASE_URL =
  "https://www.nyc.gov/site/hra/about/contracting-procurement.page";

export async function fetchNycHraOpportunities(): Promise<OpportunityInput[]> {
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

  const records = parseHraListing(resp.html, resp.finalUrl);

  if (records.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: "HRA contracting page may have moved opportunity listings into PASSPort. Confirm at the URL and update parser.",
      },
    });
    return [];
  }

  return records;
}

function parseHraListing(html: string, finalUrl: string): OpportunityInput[] {
  const records: OpportunityInput[] = [];

  // First try table layout (common for static HRA postings).
  const tableMatches = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  for (const tableMatch of tableMatches) {
    for (const rowMatch of tableMatch[1].matchAll(
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    )) {
      const cells = Array.from(
        rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
      ).map((m) => stripTags(m[1]));
      if (cells.length < 2) continue;
      if (/^(title|solicitation|rfp|contract\s*type)/i.test(cells[0])) continue;

      const title =
        cells.find((c) => c && c.length > 12) ?? cells[0];
      if (!title) continue;

      const linkMatch = /<a[^>]+href="([^"]+)"/i.exec(rowMatch[1]);
      const url = linkMatch ? absoluteUrl(linkMatch[1], finalUrl) : null;
      const dateCell = cells.find((c) => /\d{4}|\d{1,2}\/\d{1,2}/.test(c));
      const idCell = cells.find((c) => /^[A-Z0-9-]{6,}$/.test(c));

      records.push({
        source: SOURCE,
        source_id: idCell ?? fallbackSourceId([SOURCE, title, url ?? ""]),
        title: decodeEntities(title),
        agency: "NYC Human Resources Administration",
        deadline: toIsoDate(dateCell),
        url,
        geo: "NYC",
        keywords: normalizeKeywords(title.split(/\s+/)),
        raw_json: { row_cells: cells },
      });
    }
  }

  // Fallback: bullet/paragraph listing — pull anchor titles that look like RFPs.
  if (records.length === 0) {
    for (const linkMatch of html.matchAll(
      /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    )) {
      const href = linkMatch[1];
      const text = stripTags(linkMatch[2]);
      if (!text) continue;
      // Only accept anchors that read like procurement / RFP titles.
      if (!/(rfp|solicitation|procurement|concept paper|negotiated acquisition)/i.test(text)) {
        continue;
      }
      records.push({
        source: SOURCE,
        source_id: fallbackSourceId([SOURCE, text, href]),
        title: decodeEntities(text),
        agency: "NYC Human Resources Administration",
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
