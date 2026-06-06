/**
 * NYC DYCD (Dept of Youth & Community Development) scraper — rewritten 2026-05-14.
 *
 * OLD SOURCE (broken, HTTP 404):
 *   https://www.nyc.gov/site/dycd/funding/rfp-listings.page
 *
 * NEW SOURCE (via the shared PASSPort fetcher):
 *   https://passport.cityofnewyork.us/page.aspx/en/rfp/request_browse_public
 *
 * NYC migrated all agency procurements onto PASSPort (Ivalua-hosted). The old
 * `nyc.gov/site/dycd/funding/rfp-listings.page` URL began returning 404 some
 * time before May 2026. Rather than build three near-identical agency scrapers
 * (DYCD, HRA, DOE), we share one HTTP request to PASSPort's public browse page
 * (see `utils.ts::fetchPassportPage1Cached`) and filter the returned rows by
 * agency. Each per-agency scraper still owns its own `source` enum value so
 * the dashboard's filter pills keep working unchanged.
 *
 * Pagination caveat: PASSPort's data grid uses ASP.NET `__doPostBack` for
 * paging behind a session-bound CSRF nonce; raw `fetch()` POSTs don't survive
 * it. See `utils.ts` for the full diagnosis. THIS SCRAPER ONLY SEES THE FIRST
 * PAGE (15 rows across all NYC agencies). DYCD-specific records on later
 * pages are not picked up until Playwright pagination lands in a later phase.
 *
 * If PASSPort returns 0 DYCD rows but does return rows for other agencies, we
 * treat that as a normal "no DYCD opps currently on page 1" condition and
 * return [] without firing drift — the source itself is healthy.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchPassportPage1Cached,
  isDycdAgency,
  normalizeKeywords,
  toAmount,
  toIsoDate,
  type PassportRow,
} from "./utils";

const SOURCE = "nyc_dycd" as const;

const PASSPORT_BROWSE_URL =
  "https://passport.cityofnewyork.us/page.aspx/en/rfp/request_browse_public";

export async function fetchNycDycdOpportunities(): Promise<OpportunityInput[]> {
  let result: Awaited<ReturnType<typeof fetchPassportPage1Cached>>;
  try {
    result = await fetchPassportPage1Cached();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await recordDrift({
      source: SOURCE,
      reason: "fetch_error",
      details: { message, url: PASSPORT_BROWSE_URL },
    });
    return [];
  }

  if (result.status >= 400) {
    await recordDrift({
      source: SOURCE,
      reason: "http_status",
      details: { status: result.status, url: PASSPORT_BROWSE_URL },
    });
    return [];
  }

  if (result.rows.length === 0) {
    // The page returned 200 but no parseable rows — PASSPort changed shape.
    await recordDrift({
      source: SOURCE,
      reason: "shape_mismatch",
      details: {
        url: PASSPORT_BROWSE_URL,
        html_bytes: result.html_bytes,
        hint: "PASSPort grid `#body_x_grid_grd` returned zero rows; Ivalua may have changed the table structure.",
      },
    });
    return [];
  }

  // Filter to DYCD-sponsored opportunities. Note: on page 1 (15 rows) DYCD
  // often has 0 hits — we deliberately do NOT record drift for an empty filter
  // result because PASSPort itself is healthy. The orchestrator's count-anomaly
  // detector handles long-term silences.
  return result.rows
    .filter((row) => isDycdAgency(row.agency))
    .map(toOpportunityInput);
}

function toOpportunityInput(row: PassportRow): OpportunityInput {
  const deadline = parsePassportDueDate(row.due_date_raw);
  return {
    source: SOURCE,
    // EPIN is PASSPort's stable unique ID; use it directly when present.
    source_id:
      row.epin && row.epin.length >= 4
        ? row.epin
        : fallbackSourceId([SOURCE, row.procurement_name, row.agency]),
    title: decodeEntities(row.procurement_name),
    agency: "NYC Department of Youth & Community Development",
    type: row.procurement_method || null,
    amount_min: toAmount(row.procurement_name),
    amount_max: null,
    deadline,
    posted_at: toIsoDate(row.release_date_raw),
    brief: buildBrief(row),
    geo: "NYC",
    url: PASSPORT_BROWSE_URL,
    keywords: normalizeKeywords([
      row.procurement_name,
      row.program,
      row.industry,
      row.main_commodity,
    ].flatMap((s) => s.split(/[\s,\-–()/]+/))),
    raw_json: {
      portal: "passport_nyc",
      epin: row.epin,
      agency_raw: row.agency,
      program: row.program,
      industry: row.industry,
      status: row.status,
      procurement_method: row.procurement_method,
      release_date_raw: row.release_date_raw,
      due_date_raw: row.due_date_raw,
      main_commodity: row.main_commodity,
    },
  };
}

function buildBrief(row: PassportRow): string {
  const parts: string[] = [];
  if (row.program) parts.push(row.program);
  if (row.industry) parts.push(row.industry);
  if (row.main_commodity) parts.push(row.main_commodity);
  if (row.status) parts.push(`Status: ${row.status}`);
  return parts.join(" • ");
}

/**
 * PASSPort displays "12/31/2099 7:00:00 PM" as a sentinel meaning "no formal
 * due date / rolling submission". We treat that as null. Also "Buyer has not
 * set a bid due date" appears in some cells (in the "Remaining time" column
 * but defensively here too).
 */
function parsePassportDueDate(raw: string): string | null {
  if (!raw) return null;
  if (raw.includes("2099")) return null;
  if (/buyer has not set/i.test(raw)) return null;
  return toIsoDate(raw);
}
