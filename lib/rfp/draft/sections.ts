/**
 * Section definitions for the first-pass RFP Engine drafter.
 *
 * v1 is honest about its limits: no voice fingerprint, no vault grounding,
 * no reviewer pass. The model gets the opportunity + the org's
 * capacity_summary and is asked to draft five standard sections that map
 * to most US grant and government RFP templates. The output is the
 * starting point a human writer iterates on — not a submission-ready file.
 *
 * The five sections were picked because they map almost 1:1 onto:
 *  - SAM.gov / Grants.gov SF-424 narrative attachments
 *  - NYC DYCD Concept Paper templates
 *  - HHS / SAMHSA NOFO narrative requirements
 *  - Most foundation LOI/full proposal structures
 *
 * Section guidance comes from the GTM positioning: concrete dollar figures,
 * named outcomes, no hype. The model is told to insert `[VERIFY]` markers
 * anywhere it would otherwise invent org-specific facts — because without
 * vault grounding it doesn't actually know them.
 */

export const SECTION_TYPES = [
  "executive_summary",
  "organizational_capacity",
  "project_narrative",
  "evaluation_plan",
  "budget_narrative",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface SectionSpec {
  type: SectionType;
  label: string;
  guidance: string;
  target_words: number;
}

export const SECTION_SPECS: Record<SectionType, SectionSpec> = {
  executive_summary: {
    type: "executive_summary",
    label: "Executive Summary",
    guidance:
      "One paragraph. State who is applying, what they will do with the funds, who they will serve, and the requested amount. Lead with the population served and the measurable outcome, not the organization.",
    target_words: 180,
  },
  organizational_capacity: {
    type: "organizational_capacity",
    label: "Organizational Capacity",
    guidance:
      "Two short paragraphs. Establish the applicant's standing to do this work: years operating, populations served, prior similar awards. Use `[VERIFY: <claim>]` markers around any specific number, award, or partnership the model is inferring rather than citing from provided context.",
    target_words: 220,
  },
  project_narrative: {
    type: "project_narrative",
    label: "Project Narrative",
    guidance:
      "The body. Three to five paragraphs covering: need / problem statement, theory of change, specific activities, target population and reach, and timeline. Use concrete numbers, not adjectives. Avoid generic phrases like 'evidence-based' without naming the evidence.",
    target_words: 600,
  },
  evaluation_plan: {
    type: "evaluation_plan",
    label: "Evaluation Plan",
    guidance:
      "How outcomes will be measured. Identify 3-5 specific quantitative or qualitative indicators, the measurement instrument or data source for each, and the schedule (e.g., baseline + 6-month + 12-month). End with the named role responsible for evaluation oversight. Use `[VERIFY]` markers for tools or staff the model is inferring.",
    target_words: 300,
  },
  budget_narrative: {
    type: "budget_narrative",
    label: "Budget Narrative",
    guidance:
      "Justify the request size in line items. Personnel + fringe (named roles with FTE), Other Than Personnel Services (OTPS) bucketed (consultants, supplies, evaluation, training, occupancy if applicable), and indirect rate if relevant. Do NOT invent dollar figures the model wasn't given — use bracketed placeholders like `[BUDGET: salary for 1.0 FTE Program Director]` instead.",
    target_words: 280,
  },
};

export const ALL_SECTION_SPECS: SectionSpec[] = SECTION_TYPES.map(
  (t) => SECTION_SPECS[t],
);
