/**
 * Local opportunity input shape used by the state/city scrapers.
 *
 * This intentionally mirrors the shape that Plan 05-01's `lib/rfp/ingest/normalize.ts`
 * produces, but is defined locally here so 05-02 has no hard dependency on the
 * order in which Wave 1 plans land. When 05-01's normalize.ts ships, this file
 * can be replaced with a re-export from there with no breaking change.
 *
 * Field semantics match the rfp_opportunities table after the 05-01 extensions
 * migration (brief, keywords, geo, url, needs_review, last_seen_at). All
 * scrapers in this module return rows ready for direct upsert; the orchestrator
 * does NOT call a separate normalize step.
 */

export type StateCitySourceName = "ny_state" | "nyc_dycd" | "nyc_hra" | "nyc_doe";

export interface OpportunityInput {
  /** Source key — must be one of the values allowed by rfp_opportunities_source_check. */
  source: StateCitySourceName;
  /**
   * Stable per-source ID. NY State has a "Funding Opportunity ID"; NYC DYCD
   * has a "RFP #"; HRA has solicitation numbers; DOE has an RFx number.
   * When a source provides no stable ID, we use a SHA-ish hash of (title|url).
   */
  source_id: string;
  title: string;
  agency?: string | null;
  type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  deadline?: string | null; // ISO timestamp
  posted_at?: string | null; // ISO timestamp
  brief?: string | null;
  keywords?: string[];
  geo?: string | null;
  url?: string | null;
  needs_review?: boolean;
  raw_json?: Record<string, unknown>;
}
