/**
 * NYC DYCD (Dept of Youth & Community Development) RFP listing scraper.
 *
 * Source: https://www.nyc.gov/site/dycd/funding/rfp-listings.page
 * Auth:   none
 * Throttle: 1 req / sec
 *
 * Strategy:
 *   1. Fetch the listing page.
 *   2. Parse the RFP table (DYCD lists active discretionary RFPs in a
 *      structured table with columns: RFP #, Title, Released, Due Date).
 *   3. Map to OpportunityInput[].
 *
 * Last verified: 2026-05-10. Baseline expected node count: ~10-30 active.
 * If the page structure changes, drift is recorded with `zero_nodes` /
 * `shape_mismatch` and an empty array is returned.
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

const SOURCE = "nyc_dycd" as const;

const BASE_URL = "https://www.nyc.gov/site/dycd/funding/rfp-listings.page";

export async function fetchNycDycdOpportunities(): Promise<OpportunityInput[]> {
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

  const records = parseDycdListing(resp.html, resp.finalUrl);

  if (records.length === 0) {
    const looksLikeListingPage =
      /rfp/i.test(resp.html) && /<table[^>]*>/i.test(resp.html);
    await recordDrift({
      source: SOURCE,
      reason: looksLikeListingPage ? "zero_nodes" : "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: "Verify https://www.nyc.gov/site/dycd/funding/rfp-listings.page still has an RFP listing table.",
      },
    });
    return [];
  }
  return records;
}

function parseDycdListing(
  html: string,
  finalUrl: string
): OpportunityInput[] {
  const records: OpportunityInput[] = [];

  const tableMatches = html.matchAll(
    /<table[^>]*>([\s\S]*?)<\/table>/gi
  );
  for (const tableMatch of tableMatches) {
    const rowMatches = tableMatch[1].matchAll(
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    );
    for (const rowMatch of rowMatches) {
      const cells = Array.from(
        rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
      ).map((m) => stripTags(m[1]));
      if (cells.length < 2) continue;
      if (/^(rfp\s*#?|title|name|released|due)/i.test(cells[0])) continue;

      // DYCD pattern: [RFP #, Title, Released Date, Due Date] (column order may vary).
      const rfpNumber =
        cells.find((c) => /^[A-Z]+-?[0-9]+/i.test(c)) ??
        fallbackSourceId([SOURCE, cells.join("|")]);
      const title =
        cells.find((c) => c && c.length > 12 && !/^[A-Z]+-?[0-9]+/i.test(c)) ??
        cells[1] ??
        cells[0];
      if (!title) continue;

      const dueCell = cells.find((c) =>
        /\b(due|close|deadline)\b/i.test(c)
      );
      const datedCells = cells.filter((c) =>
        /\d{4}|\d{1,2}\/\d{1,2}/i.test(c)
      );
      const deadlineRaw = dueCell ?? datedCells[datedCells.length - 1] ?? null;

      const linkMatch = /<a[^>]+href="([^"]+)"/i.exec(rowMatch[1]);
      const url = linkMatch ? absoluteUrl(linkMatch[1], finalUrl) : null;

      records.push({
        source: SOURCE,
        source_id: rfpNumber,
        title: decodeEntities(title),
        agency: "NYC Department of Youth & Community Development",
        deadline: toIsoDate(deadlineRaw),
        url,
        geo: "NYC",
        keywords: normalizeKeywords(title.split(/\s+/)),
        raw_json: { row_cells: cells },
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
