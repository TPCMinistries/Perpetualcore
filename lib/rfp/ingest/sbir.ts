/**
 * SBIR.gov Solicitations fetcher.
 *
 * Endpoint (official, per https://www.sbir.gov/api/solicitation):
 *   GET https://api.www.sbir.gov/public/api/solicitations?keyword=&agency=&rows=&start=
 * Auth:  none required.
 * Pagination: `rows` (default 100, max ~400) and `start` (offset).
 * Sort: by release date desc (default; not parameterizable per docs).
 *
 * RESEARCH NOTE — 2026-05-10 (Phase 05-01 Plan execution):
 *   The legacy host `www.sbir.gov/api/solicitations.json` (per Phase 04 TECH-SPEC) is
 *   defunct since the SBIR.gov Drupal 7 -> 10 migration. Probing on 2026-05-10:
 *     - https://www.sbir.gov/api/solicitations          -> 404
 *     - https://www.sbir.gov/api/solicitations.json     -> 404
 *     - https://www.sbir.gov/sites/default/files/Solicitations.csv -> 404
 *     - https://api.www.sbir.gov/public/api/solicitations -> 429 with body
 *       {"Code":"TooManyRequestsError","Message":"The SBIR Public API is not available at this time."}
 *   The /api documentation page (https://www.sbir.gov/api) carries an explicit
 *   maintenance banner: "Please be advised that the SBIR.gov APIs are currently
 *   undergoing maintenance. In the meantime, if you require assistance in
 *   obtaining your data, please contact our helpdesk."
 *
 * Implementation: we wire in the OFFICIAL host + path so the integration is
 * future-proof. While the API is in maintenance, every call returns 429 with the
 * maintenance message; we treat that as a soft SKIP (same lifecycle as a missing
 * key on SAM.gov / Simpler Grants) so the orchestrator continues with the other
 * sources. When the API returns from maintenance the fetcher starts producing
 * rows automatically with no code change. Tracked in deferred-items.md as
 * SBIR-API-MAINTENANCE; the SBIR-ENDPOINT-UPDATE entry from Phase 04 is now
 * resolved (correct endpoint identified) and superseded by the maintenance entry.
 *
 * Canonical field shape (from https://www.sbir.gov/api/solicitation):
 *   solicitation_title, solicitation_number, program, phase, agency, branch,
 *   solicitation_year, release_date, open_date, close_date,
 *   application_due_date (multiple), current_status, solicitation_agency_url,
 *   solicitation_topics (multiple).
 */

import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

const SBIR_BASE = "https://api.www.sbir.gov/public/api";

interface SbirSolicitation {
  solicitation_title?: string;
  solicitation_number?: string;
  program?: string;
  phase?: string;
  agency?: string;
  branch?: string;
  solicitation_year?: string | number;
  release_date?: string;
  open_date?: string;
  close_date?: string;
  application_due_date?: string | string[];
  current_status?: string;
  solicitation_agency_url?: string;
  solicitation_topics?: Array<{
    topic_title?: string;
    topic_number?: string;
    topic_description?: string;
    [k: string]: unknown;
  }>;
  [k: string]: unknown;
}

interface SbirMaintenanceResponse {
  Code?: string;
  Message?: string;
}

export interface FetchSbirOptions {
  /** Filter to currently-open solicitations only (default true). */
  openOnly?: boolean;
  /** Records per page (default 100). */
  rows?: number;
  /** Hard cap on total records (default 200). */
  maxRecords?: number;
}

export async function fetchSbirOpportunities(
  opts: FetchSbirOptions = {}
): Promise<OpportunityInput[]> {
  const openOnly = opts.openOnly ?? true;
  const rows = opts.rows ?? 100;
  const maxRecords = opts.maxRecords ?? 200;

  const all: OpportunityInput[] = [];
  let start = 0;

  while (all.length < maxRecords) {
    const url = new URL(`${SBIR_BASE}/solicitations`);
    if (openOnly) url.searchParams.set("current_status", "open");
    url.searchParams.set("rows", String(rows));
    url.searchParams.set("start", String(start));

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent":
            "PerpeturalCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)",
        },
      });
    } catch (err) {
      console.error("[error] sbir: network error", err);
      break;
    }

    // Maintenance/rate-limit — treat as soft skip and bail out.
    if (res.status === 429) {
      try {
        const body = (await res.json()) as SbirMaintenanceResponse;
        if (body?.Message) {
          console.log(`[skip] sbir: ${body.Message} (HTTP 429)`);
        } else {
          console.log("[skip] sbir: HTTP 429 (rate-limited or maintenance)");
        }
      } catch {
        console.log("[skip] sbir: HTTP 429 (rate-limited or maintenance)");
      }
      break;
    }

    if (!res.ok) {
      console.error(`[error] sbir: HTTP ${res.status} (start ${start}); aborting`);
      break;
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch (err) {
      console.error("[error] sbir: JSON parse error", err);
      break;
    }

    // The SBIR public API returns a JSON array directly (per official docs:
    // "Return Types: XML, JSON" with no envelope object).
    if (!Array.isArray(json)) {
      console.error("[error] sbir: unexpected response shape", typeof json);
      break;
    }

    const page = json as SbirSolicitation[];
    if (page.length === 0) break;

    for (const r of page) {
      const mapped = mapRecord(r);
      if (mapped) all.push(mapped);
    }

    if (page.length < rows) break;
    start += rows;
  }

  console.log(`[fetch] sbir: ${all.length} records`);
  return all.slice(0, maxRecords);
}

function mapRecord(r: SbirSolicitation): OpportunityInput | null {
  if (!r.solicitation_title || !r.solicitation_number) return null;

  const agency = [r.agency, r.branch].filter(Boolean).join(" — ") || null;

  const topicKeywords = (r.solicitation_topics ?? [])
    .map((t) => t.topic_number)
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => `topic:${s}`);

  const keywords = [
    ...topicKeywords,
    ...extractTitleKeywords(r.solicitation_title),
  ];

  // Build a brief from the first topic description if present, else null.
  const firstTopicDesc = r.solicitation_topics?.[0]?.topic_description;
  const brief =
    typeof firstTopicDesc === "string" && firstTopicDesc.length > 0
      ? firstTopicDesc.slice(0, 500)
      : null;

  // application_due_date can be a single string or array; pick the latest valid one.
  let deadline: string | null = null;
  if (Array.isArray(r.application_due_date)) {
    const dates = r.application_due_date
      .filter((s): s is string => typeof s === "string")
      .map((s) => Date.parse(s))
      .filter((n) => !Number.isNaN(n));
    if (dates.length > 0) {
      deadline = new Date(Math.max(...dates)).toISOString();
    }
  } else if (typeof r.application_due_date === "string") {
    deadline = r.application_due_date;
  } else if (typeof r.close_date === "string") {
    deadline = r.close_date;
  }

  return {
    source: "sbir_gov",
    source_id: r.solicitation_number,
    title: r.solicitation_title,
    agency,
    type: r.program ?? null,
    amount_min: null,
    amount_max: null, // SBIR awards vary; not in solicitation summary.
    deadline,
    posted_at: r.open_date ?? r.release_date ?? null,
    brief,
    keywords,
    geo: "US",
    url: r.solicitation_agency_url ?? null,
    needs_review: false,
    raw_json: r as Record<string, unknown>,
  };
}
