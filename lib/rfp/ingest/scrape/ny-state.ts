/**
 * NY State Grants Gateway scraper (rewritten 2026-05-14).
 *
 * OLD SOURCE (broken, HTTP 404 since some time pre-May 2026):
 *   https://grantsmanagement.ny.gov/grant-opportunities
 *
 * NEW SOURCE:
 *   https://grantsgateway.ny.gov/IntelliGrants_NYSGG/module/nysgg/goportal.aspx?NavItem1=2
 *
 * The Grants Gateway public portal was migrated onto Agate Software's
 * IntelliGrants platform. The "Browse for Opportunities" tab is the public,
 * un-authenticated landing page for available state grants — it renders a
 * server-side HTML data grid (`<table id="...dgdGOBrowseResults">`) with
 * columns:
 *   Funding Agency | Grant Opportunity | Status | Eligibility |
 *   Availability Date | Anticipated Release Date | Due Date
 *
 * The default Browse view filters to status=Available (no pagination required
 * for the typical record count — observed 5-10 records on 2026-05-14). The
 * Search tab supports broader queries (including Anticipated and Closed) but
 * is a real ASP.NET WebForms postback flow with `__VIEWSTATE` and pagination;
 * that's a future enhancement once we need the broader corpus.
 *
 * The portal does not expose a stable "Funding Opportunity ID" in the listing
 * itself — applicants click through to a detail page (a JavaScript postback)
 * for the ID. We therefore fall back to a FNV-1a hash of (title + agency) as
 * the source_id, which is stable across runs as long as the grant title and
 * sponsoring agency don't change.
 *
 * Auth: none. Throttle: 1 req/sec (single GET per run). HTML, not JS-rendered.
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

const SOURCE = "ny_state" as const;

const BASE_URL =
  "https://grantsgateway.ny.gov/IntelliGrants_NYSGG/module/nysgg/goportal.aspx?NavItem1=2";

const GRID_ID = "ctl00_cphPageContent_wclGOBrowseResults_dgdGOBrowseResults";

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

  const records = parseGrantsGatewayGrid(resp.html);

  if (records.length === 0) {
    // The page may legitimately be empty (no grants in "Available" status); we
    // still emit a drift event so a multi-day silence raises an admin alert.
    const looksLikePortal =
      resp.html.includes("IntelliGrants") &&
      resp.html.includes("Grant Opportunity Portal");
    await recordDrift({
      source: SOURCE,
      reason: looksLikePortal ? "zero_nodes" : "shape_mismatch",
      details: {
        url: BASE_URL,
        html_bytes: resp.html.length,
        hint: `Verify ${BASE_URL} still renders the dgdGOBrowseResults data grid; Agate may have changed the portal layout.`,
      },
    });
    return [];
  }

  return records;
}

interface ParsedRow {
  agency: string;
  title: string;
  status: string;
  eligibility: string;
  availabilityDate: string;
  anticipatedReleaseDate: string;
  dueDate: string;
}

function parseGrantsGatewayGrid(html: string): OpportunityInput[] {
  // The IntelliGrants portal uses an outer `<table>` for layout AND an inner
  // `<table>` for the data grid; we target the grid by its ID to avoid matching
  // the wrapper.
  const gridRe = new RegExp(
    `<table[^>]+id="${GRID_ID}"[^>]*>([\\s\\S]*?)</table>`,
    "i"
  );
  const gridMatch = gridRe.exec(html);
  if (!gridMatch) return [];

  const records: OpportunityInput[] = [];
  const trMatches = gridMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const tr of trMatches) {
    const cells = Array.from(
      tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    ).map((m) => stripTags(m[1]));

    // Header row has 7 cells starting with "Funding Agency"; pagination row has
    // a single cell with the page number. Data rows have 7 cells with content.
    if (cells.length < 7) continue;
    if (/^funding\s*agency$/i.test(cells[0])) continue;

    const row: ParsedRow = {
      agency: cells[0],
      title: cells[1],
      status: cells[2],
      eligibility: cells[3],
      availabilityDate: cells[4],
      anticipatedReleaseDate: cells[5],
      dueDate: cells[6],
    };

    if (!row.title || row.title.length < 4) continue;

    records.push({
      source: SOURCE,
      source_id: fallbackSourceId([SOURCE, row.title, row.agency]),
      title: decodeEntities(row.title),
      agency: row.agency ? decodeEntities(row.agency) : null,
      type: row.status || null,
      deadline:
        row.dueDate && row.dueDate.trim() && row.dueDate !== " "
          ? toIsoDate(row.dueDate)
          : null,
      posted_at: toIsoDate(row.availabilityDate),
      brief: row.eligibility
        ? `Eligibility: ${decodeEntities(row.eligibility)}`
        : null,
      geo: "NY",
      url: BASE_URL,
      keywords: normalizeKeywords(row.title.split(/[\s,\-–()]+/)),
      raw_json: {
        portal: "intelligrants_nysgg",
        funding_agency: row.agency,
        status: row.status,
        eligibility: row.eligibility,
        availability_date: row.availabilityDate,
        anticipated_release_date: row.anticipatedReleaseDate,
        due_date: row.dueDate,
      },
    });
  }

  return records;
}
