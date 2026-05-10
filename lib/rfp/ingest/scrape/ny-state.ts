/**
 * NY State Grants Gateway scraper.
 *
 * Source: https://grantsmanagement.ny.gov/grant-opportunities (public listing)
 * Auth:   none
 * Throttle: 1 req / sec (REQUEST_DELAY_MS)
 *
 * Strategy:
 *   1. Fetch the listing page HTML.
 *   2. Detect grant-opportunity rows. The Grants Gateway uses a table or card
 *      layout where each row exposes a Funding Opportunity ID, Title, Agency,
 *      Deadline, Award Amount range, and a detail link.
 *   3. Extract each row via a regex bounded to the listing block, then parse
 *      the inner cells via per-field regex.
 *   4. Map to OpportunityInput[].
 *
 * If the chosen URL returns 404 or the structure is fundamentally different
 * (no rows match), we record drift (`http_status` or `zero_nodes`) and return
 * []. We never throw — the orchestrator continues with the other sources.
 *
 * Last verified: 2026-05-10. Baseline expected node count: ~30-80 (varies by
 * filing window). See README.md for re-verification steps.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchHtml,
  normalizeKeywords,
  stripTags,
  toAmount,
  toIsoDate,
} from "./utils";

const SOURCE = "ny_state" as const;

const BASE_URL = "https://grantsmanagement.ny.gov/grant-opportunities";

export async function fetchNyStateOpportunities(): Promise<OpportunityInput[]> {
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

  const records = parseNyStateListing(resp.html, resp.finalUrl);

  if (records.length === 0) {
    // Differentiate "we got HTML but couldn't find any rows" from "page is empty".
    // We only report `zero_nodes` when the page clearly has *some* listing-shaped
    // markup but our parser missed; otherwise we suspect URL drift.
    const looksLikeListingPage =
      /grant-?opportunities/i.test(resp.html) ||
      /<table[^>]*>/i.test(resp.html);
    await recordDrift({
      source: SOURCE,
      reason: looksLikeListingPage ? "zero_nodes" : "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: "Verify https://grantsmanagement.ny.gov/grant-opportunities still renders the listing table; structure may have changed.",
      },
    });
    return [];
  }

  return records;
}

/**
 * Parses the NY State Grants Gateway listing page into OpportunityInput[].
 *
 * The Grants Gateway has historically rendered listings in two formats:
 *   1. A `<table>` with one row per opportunity (older).
 *   2. A repeating `<article>` or `<div class="...opportunity...">` card (newer).
 *
 * We try both. Each successful match contributes records; if both yield zero
 * the caller surfaces drift.
 */
function parseNyStateListing(
  html: string,
  finalUrl: string
): OpportunityInput[] {
  const records: OpportunityInput[] = [];

  // -- Attempt 1: table rows --
  const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  if (tableMatch) {
    const rowMatches = tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const rowMatch of rowMatches) {
      const cells = Array.from(
        rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)
      ).map((m) => stripTags(m[1]));
      // Skip header rows (first cell is "Title" or "Funding Opportunity").
      if (cells.length < 3) continue;
      if (/^(title|funding|opportunity|grant\s*name|name)/i.test(cells[0])) {
        continue;
      }

      const title = cells.find((c) => c && c.length > 8) ?? cells[0];
      if (!title) continue;

      // Try to find a detail link inside the row.
      const linkMatch = /<a[^>]+href="([^"]+)"/i.exec(rowMatch[1]);
      const url = linkMatch ? absoluteUrl(linkMatch[1], finalUrl) : null;

      // Heuristics: deadline cell typically contains "due" or a date pattern,
      // amount cells contain "$".
      const deadlineCell = cells.find((c) =>
        /\b(due|deadline|close|closes|by)\b/i.test(c)
      );
      const amountCell = cells.find((c) => /\$/.test(c));

      const id =
        cells.find((c) => /^[A-Z0-9-]{6,}$/.test(c)) ??
        fallbackSourceId([SOURCE, title, url ?? ""]);

      records.push({
        source: SOURCE,
        source_id: id,
        title: decodeEntities(title),
        agency: cells[1] && cells[1] !== title ? cells[1] : null,
        deadline: toIsoDate(deadlineCell),
        amount_max: amountCell ? toAmount(amountCell) : null,
        url,
        geo: "NY",
        keywords: normalizeKeywords(title.split(/\s+/)),
        raw_json: { row_cells: cells },
      });
    }
  }

  // -- Attempt 2: card layout --
  if (records.length === 0) {
    const cardMatches = html.matchAll(
      /<(article|div)[^>]*class="[^"]*(opportunity|grant-listing|funding-card)[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi
    );
    for (const cardMatch of cardMatches) {
      const inner = cardMatch[3];
      const titleMatch =
        /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/i.exec(inner) ??
        /<a[^>]*>([\s\S]*?)<\/a>/i.exec(inner);
      if (!titleMatch) continue;
      const title = stripTags(titleMatch[2] ?? titleMatch[1]);
      if (!title) continue;

      const linkMatch = /<a[^>]+href="([^"]+)"/i.exec(inner);
      const url = linkMatch ? absoluteUrl(linkMatch[1], finalUrl) : null;
      const text = stripTags(inner);
      const dueMatch = /(deadline|close[ds]?|due)[^A-Za-z0-9]{0,5}([A-Za-z0-9 ,/-]{6,30})/i.exec(
        text
      );
      const dollarMatch = /\$[0-9,]+(?:\.[0-9]{2})?(?:\s*[KMB])?/i.exec(text);

      records.push({
        source: SOURCE,
        source_id: fallbackSourceId([SOURCE, title, url ?? ""]),
        title: decodeEntities(title),
        deadline: dueMatch ? toIsoDate(dueMatch[2]) : null,
        amount_max: dollarMatch ? toAmount(dollarMatch[0]) : null,
        url,
        geo: "NY",
        keywords: normalizeKeywords(title.split(/\s+/)),
        raw_json: { card_html_bytes: inner.length },
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
