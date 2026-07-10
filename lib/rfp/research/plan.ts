/**
 * Deep Research — per-org vertical planner.
 *
 * Pure function: capture profile in, ResearchVertical[] out. No DB, no AI.
 * The verticals mirror how a human capture consultant divides the funding
 * landscape: federal programs, state/local government, private foundations,
 * and corporate/tech philanthropy — each parameterized by the org's
 * capacity keywords, geography, org type, and award band so the agent
 * searches for THIS org's money, not generic grants.
 */

import type { ResearchVertical } from "./types";

export interface ResearchPlanInput {
  orgName: string;
  orgType: string; // nonprofit | forprofit | dual
  capacityKeywords: string[];
  geoFocus: string[]; // e.g. ["NYC","NY","US"]
  awardBand: { min: number; max: number } | null;
  capacitySummary?: string | null;
}

const GEO_LABELS: Record<string, string> = {
  NYC: "New York City",
  NY: "New York State",
  CA: "California",
  NJ: "New Jersey",
  CT: "Connecticut",
  PA: "Pennsylvania",
  US: "the United States",
};

function geoNarrative(geoFocus: string[]): string {
  const named = geoFocus
    .filter((g) => g !== "US")
    .map((g) => GEO_LABELS[g] ?? g);
  return named.length > 0 ? named.join(" and ") : "the United States";
}

function bandNarrative(band: { min: number; max: number } | null): string {
  if (!band) return "any realistic award size for a small-to-mid organization";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  return `${fmt(band.min)}–${fmt(band.max)} awards (a bit above the top of the band is fine)`;
}

/**
 * Shared preamble: who the org is + non-negotiable evidence rules.
 * The evidence rules are the product's defense against hallucinated grants —
 * every lead must be confirmed on the funder's own page inside the session.
 */
function orgPreamble(input: ResearchPlanInput, todayIso: string): string {
  const eligibility =
    input.orgType === "forprofit"
      ? "a for-profit company (exclude nonprofit-only programs)"
      : input.orgType === "dual"
        ? "a fiscally-linked nonprofit + for-profit pair (either entity may apply)"
        : "a 501(c)(3) nonprofit (exclude programs restricted to governments or universities unless a nonprofit may lead)";

  return [
    `You are a grant/RFP prospect researcher for "${input.orgName}", ${eligibility} based in ${geoNarrative(input.geoFocus)}.`,
    `Their work, in keywords: ${input.capacityKeywords.join(", ")}.`,
    input.capacitySummary ? `Capacity summary: ${input.capacitySummary}` : "",
    `Target award range: ${bandNarrative(input.awardBand)}.`,
    `Today is ${todayIso}. Only include opportunities that are actionable AFTER today: open now, opening within ~9 months, rolling, or on a reliable recurring cycle the org can hit next round. A deadline that already passed with no next cycle is NOT a lead.`,
    ``,
    `EVIDENCE RULES (non-negotiable):`,
    `1. NEVER invent a program. Every lead must come from a page you actually opened in this session.`,
    `2. Before including a lead, open the funder's own page for it and confirm: the program exists, who is eligible, and the deadline/cycle. Set verified_on_funder_page=true ONLY if you did this; if you could only see a third-party listing, set it false and say so in notes.`,
    `3. If a deadline is unknown, write null — do not guess a date.`,
    `4. Record the deepest URL you confirmed (the program page, not the funder homepage).`,
    `5. Note honestly when a program is invite-only or requires a partner (e.g. a university co-applicant) — these are still useful leads if flagged.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build the vertical sweep plan for an org. Order matters — the API runs
 * them front-to-back when the caller doesn't pick, so put the universes
 * most likely to convert first.
 */
export function buildResearchPlan(
  input: ResearchPlanInput,
  todayIso: string
): ResearchVertical[] {
  const pre = orgPreamble(input, todayIso);
  const kw = input.capacityKeywords.slice(0, 10).join(", ");
  const geo = geoNarrative(input.geoFocus);
  const verticals: ResearchVertical[] = [];

  // 1. Private foundations — weakest existing scraper coverage, highest
  //    marginal value from agentic search.
  verticals.push({
    key: "foundations",
    label: "Private & community foundations",
    prompt: `${pre}\n\nVERTICAL: private foundations, community foundations, and family foundations funding work like theirs (${kw}) in ${geo}. Include both open-application/rolling-LOI funders and reliable annual cycles. For each funder check the actual application process (open LOI vs invite-only) on their site. Return the 5-8 strongest leads.`,
  });

  // 2. State & local government (only when the org has a sub-US geography).
  if (input.geoFocus.some((g) => g !== "US")) {
    verticals.push({
      key: "state_local",
      label: "State & local government",
      prompt: `${pre}\n\nVERTICAL: state and local government funding in ${geo} — state agency grant programs (economic development, labor/workforce, health, education agencies), city agency RFPs and discretionary funding, and state consolidated funding portals. Many state programs live on agency sites (e.g. economic-development or health-department pages) rather than a central portal — search agency sites directly. Return the 5-8 strongest leads.`,
    });
  }

  // 3. Federal grants.
  verticals.push({
    key: "federal",
    label: "Federal grants",
    prompt: `${pre}\n\nVERTICAL: federal funding (grants.gov, agency NOFOs) matching their work (${kw}). Prefer programs where their org type may apply directly; flag partner-required programs honestly. Include recently-closed annual programs ONLY if they reliably recur — mark those status=annual_cycle with the expected next window in notes. Return the 4-8 strongest leads.`,
  });

  // 4. Corporate & tech philanthropy.
  verticals.push({
    key: "corporate_tech",
    label: "Corporate & tech philanthropy",
    prompt: `${pre}\n\nVERTICAL: corporate giving programs, bank/CRA community investment, and tech-company philanthropy (including AI-related capacity programs, fellowships, and product grants) relevant to ${kw}. Include non-cash but material programs (funded fellows, major product discounts) and mark them clearly in notes. Return the 4-8 strongest leads.`,
  });

  return verticals;
}
