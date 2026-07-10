/**
 * Deep Research — shared types.
 *
 * A "vertical" is one funder universe the research agent sweeps in a single
 * agentic web-search session (e.g. federal health workforce, NY State
 * agencies, private foundations). Verticals are generated per-org from the
 * capture profile so two orgs never run identical sweeps.
 */

export interface ResearchVertical {
  key: string;
  label: string;
  /** Full instruction block handed to the research agent for this vertical. */
  prompt: string;
}

/** One funding lead as returned by the research agent's submit_leads tool. */
export interface ResearchLead {
  name: string;
  funder: string;
  /** Award size as stated by the source, e.g. "$25K–$125K" or "unknown". */
  amount: string;
  amount_min?: number | null;
  amount_max?: number | null;
  /** ISO date if a hard deadline exists, else null (rolling/cycle). */
  deadline_iso?: string | null;
  status: "open_now" | "opens_soon" | "annual_cycle" | "rolling" | "uncertain";
  /** 1-2 sentences: why THIS org qualifies. */
  eligibility_fit: string;
  url: string;
  /** Anything load-bearing: LOI-first, match required, invite-only, next cycle. */
  notes?: string;
  /** True only when the agent confirmed the program on the funder's own page. */
  verified_on_funder_page: boolean;
}

export interface VerticalRunResult {
  vertical: string;
  leads: ResearchLead[];
  /** Leads that survived filtering and were upserted. */
  ingested: number;
  /** Opportunity ids created/updated for this vertical. */
  opportunity_ids: string[];
  searches_used: number;
  cost_usd: number;
  errors: string[];
}

export interface ResearchRunSummary {
  org_id: string;
  verticals_run: number;
  leads_found: number;
  leads_ingested: number;
  total_cost_usd: number;
  results: VerticalRunResult[];
}
