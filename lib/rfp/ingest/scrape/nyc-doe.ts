/**
 * NYC DOE (Department of Education) scraper — rewritten 2026-05-14.
 *
 * OLD SOURCE (broken, HTTP 404):
 *   https://www.nyc.gov/site/doe/funding/contract-opportunities.page
 *
 * NEW SOURCE (via the shared PASSPort fetcher):
 *   https://passport.cityofnewyork.us/page.aspx/en/rfp/request_browse_public
 *
 * DOE solicitations appear under two PASSPort agency names: "DEPARTMENT OF
 * EDUCATION" itself and "SCHOOL CONSTRUCTION AUTHORITY" (capital-projects arm).
 * `isDoeAgency` (utils.ts) accepts both. DOE's vendor-portal RFx (separate
 * NYCDOE Vendor Portal at vendorportal.nycenet.edu, login-walled) is out of
 * scope and remains a Phase 8 candidate.
 *
 * Same page-1-only limitation as the DYCD/HRA scrapers. See `nyc-dycd.ts` for
 * the architectural rationale.
 */

import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";
import {
  decodeEntities,
  fallbackSourceId,
  fetchPassportPage1Cached,
  isDoeAgency,
  normalizeKeywords,
  toIsoDate,
  type PassportRow,
} from "./utils";

const SOURCE = "nyc_doe" as const;

const PASSPORT_BROWSE_URL =
  "https://passport.cityofnewyork.us/page.aspx/en/rfp/request_browse_public";

export async function fetchNycDoeOpportunities(): Promise<OpportunityInput[]> {
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
    await recordDrift({
      source: SOURCE,
      reason: "shape_mismatch",
      details: {
        url: PASSPORT_BROWSE_URL,
        html_bytes: result.html_bytes,
        hint: "PASSPort grid `#body_x_grid_grd` returned zero rows.",
      },
    });
    return [];
  }

  return result.rows.filter((row) => isDoeAgency(row.agency)).map(toRow);
}

function toRow(row: PassportRow): OpportunityInput {
  const deadline = parsePassportDueDate(row.due_date_raw);
  return {
    source: SOURCE,
    source_id:
      row.epin && row.epin.length >= 4
        ? row.epin
        : fallbackSourceId([SOURCE, row.procurement_name, row.agency]),
    title: decodeEntities(row.procurement_name),
    agency: "NYC Department of Education",
    type: row.procurement_method || null,
    deadline,
    posted_at: toIsoDate(row.release_date_raw),
    brief: [row.program, row.industry, row.main_commodity, row.status]
      .filter(Boolean)
      .join(" • "),
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

function parsePassportDueDate(raw: string): string | null {
  if (!raw) return null;
  if (raw.includes("2099")) return null;
  if (/buyer has not set/i.test(raw)) return null;
  return toIsoDate(raw);
}
