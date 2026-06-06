/**
 * Generic Socrata (SODA) connector — Phase 16 / DISCO-10.
 *
 * One connector reaches EVERY Socrata open-data portal (data.ny.gov, data.nj.gov,
 * data.cityofnewyork.us, data.texas.gov, data.wa.gov, …). It is driven entirely by
 * a declarative config stored in `rfp_state_coverage.source_config`, so onboarding a
 * new Socrata jurisdiction is a registry row + field map — NOT new code.
 *
 * Endpoint:  GET https://<domain>/resource/<dataset_id>.json   (keyless SODA)
 * Openness:  rows whose `open_field` (e.g. due_date) is in the future.
 * Auth:      none. Optional X-App-Token only if the anon throttle is hit.
 *
 * Never throws — on any error it logs a [skip]/[error] line and returns [].
 */

import {
  type OpportunityInput,
  extractTitleKeywords,
} from "@/lib/rfp/ingest/normalize";

export interface SocrataFieldMap {
  source_id: string;
  title: string;
  agency?: string;
  type?: string;
  deadline?: string;
  posted_at?: string;
  brief?: string;
  url?: string;
  amount_max?: string;
}

export interface SocrataSourceConfig {
  domain: string; // e.g. "data.cityofnewyork.us"
  dataset_id: string; // e.g. "dg92-zbpx"
  source_tag: string; // stored as rfp_opportunities.source, e.g. "nyc_cityrecord"
  field_map: SocrataFieldMap;
  geo?: string;
  /** Column used to decide "open" (deadline in the future). If absent, no date filter. */
  open_field?: string;
  /** Equality filters applied as SoQL query params, e.g. { type_of_notice_description: "Solicitation" }. */
  filters?: Record<string, string>;
  /** Max rows per run (default 300). */
  limit?: number;
  /** ISO date "now" override for testing. */
  now?: string;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(row: Record<string, unknown>, field?: string): string | null {
  if (!field) return null;
  const v = row[field];
  return v == null ? null : String(v);
}

export async function fetchSocrata(
  cfg: SocrataSourceConfig
): Promise<OpportunityInput[]> {
  const limit = cfg.limit ?? 300;
  const nowIso = (cfg.now ?? new Date().toISOString()).slice(0, 19);

  const url = new URL(`https://${cfg.domain}/resource/${cfg.dataset_id}.json`);
  for (const [k, v] of Object.entries(cfg.filters ?? {})) {
    url.searchParams.set(k, v);
  }
  if (cfg.open_field) {
    url.searchParams.set("$where", `${cfg.open_field} > '${nowIso}'`);
    url.searchParams.set("$order", `${cfg.open_field} ASC`);
  }
  url.searchParams.set("$limit", String(limit));

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  } catch (err) {
    console.error(`[error] ${cfg.source_tag}: network error`, err);
    return [];
  }
  if (!res.ok) {
    console.error(`[error] ${cfg.source_tag}: HTTP ${res.status}`);
    return [];
  }

  const rows = (await res.json()) as Record<string, unknown>[];
  const fm = cfg.field_map;
  const out: OpportunityInput[] = [];

  for (const r of rows) {
    const source_id = pick(r, fm.source_id);
    const title = pick(r, fm.title);
    if (!source_id || !title) continue;

    const briefRaw = pick(r, fm.brief);
    const amountRaw = pick(r, fm.amount_max);
    out.push({
      source: cfg.source_tag,
      source_id,
      title: title.slice(0, 300),
      agency: pick(r, fm.agency),
      type: pick(r, fm.type),
      amount_min: null,
      amount_max: amountRaw != null ? Number(amountRaw) || null : null,
      deadline: pick(r, fm.deadline),
      posted_at: pick(r, fm.posted_at),
      brief: briefRaw ? stripHtml(briefRaw).slice(0, 500) : null,
      keywords: extractTitleKeywords(title),
      geo: cfg.geo ?? null,
      url: pick(r, fm.url),
      needs_review: false,
      raw_json: r,
    });
  }

  console.log(`[fetch] ${cfg.source_tag}: ${out.length} records`);
  return out;
}
