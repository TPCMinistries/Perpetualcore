/**
 * lib/rfp/review/rubric.ts — Reviewer Agent v1 types + prompt construction.
 *
 * Honest framing: a single Opus pass that reads the five drafted sections
 * against the funder's opportunity brief and flags the gaps a real reviewer
 * (federal program officer, foundation reviewer) would surface. This is NOT:
 *   - Inline annotation
 *   - Multi-round critique
 *   - Auto-rewrite
 *   - Voice-fingerprint-aware
 *
 * It is one round of high-judgment criticism, justified by the Opus price tier
 * (~$0.50-1.00/run at proposal size).
 *
 * Output JSON shape is enforced by both the system prompt and the Zod schema
 * at the bottom of this file. If the model returns malformed JSON, we throw —
 * the route turns that into a 502 so the user can retry rather than store junk.
 *
 * Phase 19-02 extensions:
 *   - RubricCriterion type for extracted solicitation criteria
 *   - rubric_criteria on ReviewerInput (optional, backward compatible)
 *   - criterion_id on ReviewerFinding (optional, nullable — echoed from model)
 *   - buildRubricPromptAddendum for criteria-anchored scoring instructions
 */
import { z } from "zod";
import { SECTION_TYPES, SECTION_SPECS } from "../draft/sections";

export const REVIEWER_AGENT = "reviewer_v1";

// ---------------------------------------------------------------------------
// Phase 19-02: Rubric criterion type (from rfp_rubric_criteria rows)
// ---------------------------------------------------------------------------

/**
 * A single extracted evaluation criterion from a solicitation.
 * Mirrors the rfp_rubric_criteria table shape (minus timestamps/audit fields).
 */
export interface RubricCriterion {
  id: string;             // rfp_rubric_criteria.id (UUID)
  section_ref: string;    // e.g. "Section M.3", "Funder Priority: Health Equity"
  criterion_text: string; // verbatim extracted text
  max_points: number | null;
  weight: number | null;  // 0-1 normalized weight, if stated
}

// Special row in rfp_proposal_sections we use to persist the findings JSON.
// Picking a section_type that cannot collide with the canonical SECTION_TYPES
// keeps it out of the main proposal-render loop, which iterates only the
// canonical five.
export const REVIEWER_FINDINGS_SECTION_TYPE = "reviewer_findings_v1";

// Cap the persisted JSON well below Postgres/RLS sanity. The text column has
// no hard limit but we don't want the proposal page to render a 500KB blob.
// Excerpts are truncated in generate.ts before persistence if we approach this.
export const MAX_PERSISTED_BYTES = 100_000;

export const FINDING_CATEGORIES = [
  "theory_of_change",
  "evidence",
  "outcomes_clarity",
  "alignment_with_rubric",
  "page_limit",
  "compliance",
  "voice_consistency",
  "specificity",
  "other",
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const FINDING_SEVERITIES = ["blocker", "high", "medium", "low"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export interface ReviewerFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  /** matches rfp_proposal_sections.section_type, or "global" for cross-cutting */
  section_type: string;
  /** short quote from the draft, or null for missing-element findings */
  excerpt: string | null;
  /** 1-3 sentences naming the gap concretely */
  finding: string;
  /** 1-2 sentences with a concrete fix */
  suggestion: string;
  /**
   * Phase 19-02: ID of the rfp_rubric_criteria row this finding addresses.
   * Null when not anchored to a specific criterion (cross-cutting, generic, or
   * no rubric criteria were provided). The model echoes IDs from the prompt;
   * generate.ts sanitizes unknown IDs to null at post-parse time.
   */
  criterion_id?: string | null;
}

export interface ReviewerResult {
  findings: ReviewerFinding[];
  /** 0-100, calibrated to "would a strong reviewer recommend funding" */
  overall_score: number;
  /** 2-3 sentence executive note */
  summary: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
  session_id: string;
}

// Zod schemas — used both to validate the model's JSON output and at read time
// when the proposal page parses the persisted findings row.

export const ReviewerFindingSchema = z.object({
  category: z.enum(FINDING_CATEGORIES),
  severity: z.enum(FINDING_SEVERITIES),
  section_type: z.string().min(1).max(64),
  excerpt: z.string().nullable(),
  finding: z.string().min(1),
  suggestion: z.string().min(1),
  /**
   * Phase 19-02: optional criterion_id echoed from the prompt.
   * Use z.string().nullable().optional() — do NOT require UUID format.
   * The model echoes IDs and must not hard-fail Zod on a malformed echo.
   * generate.ts sanitizes unknown IDs to null at post-parse time (keep the finding).
   */
  criterion_id: z.string().nullable().optional(),
});

/** Shape the model is asked to return. The route adds token/cost metadata. */
export const ReviewerModelOutputSchema = z.object({
  findings: z.array(ReviewerFindingSchema).max(50),
  overall_score: z.number().min(0).max(100),
  summary: z.string().min(1),
});
export type ReviewerModelOutput = z.infer<typeof ReviewerModelOutputSchema>;

/** Full persisted shape including audit metadata. */
export const ReviewerResultSchema = ReviewerModelOutputSchema.extend({
  tokens_in: z.number(),
  tokens_out: z.number(),
  cost_usd: z.number(),
  model: z.string(),
  session_id: z.string(),
});

export const REVIEWER_SYSTEM_PROMPT = `You are a senior grant/RFP reviewer for a funder. Read the draft against the opportunity brief. Be specific. Cite excerpts. Flag what would cause a federal reviewer or foundation program officer to score the application low. Be honest about weaknesses — fluffy "looks good" reviews are useless.

How to review:
- Read the opportunity brief first. Understand what the funder is actually buying.
- Then read each of the five draft sections. The drafter is a separate model; it sometimes leaves [VERIFY: ...] or [BUDGET: ...] placeholders — treat unresolved placeholders as findings (category: specificity or evidence, severity at least high if the missing fact is load-bearing).
- Focus your findings on things a real reviewer scores against: theory of change, named evidence (not the phrase "evidence-based" without a citation), measurable outcomes, alignment with the funder's stated priorities, compliance with explicit requirements in the brief, page/word limits if mentioned, and budget-narrative specificity.
- Cite a short excerpt (< 200 chars) from the draft for every finding where one exists. For findings about something MISSING from the draft, set excerpt to null.
- Set section_type to one of: executive_summary, organizational_capacity, project_narrative, evaluation_plan, budget_narrative, or "global" for cross-cutting issues.
- Be calibrated. overall_score is on a 0–100 scale where 70 = "merits a closer look", 80 = "competitive", 90 = "would recommend funding". A first-pass draft with several [VERIFY] markers and generic language is typically 50–65.
- Cap findings at ~15 high-signal items. Do not pad.

Output: a single JSON object, no prose before or after, no markdown fences. Shape:

{
  "findings": [
    {
      "category": "theory_of_change" | "evidence" | "outcomes_clarity" | "alignment_with_rubric" | "page_limit" | "compliance" | "voice_consistency" | "specificity" | "other",
      "severity": "blocker" | "high" | "medium" | "low",
      "section_type": "executive_summary" | "organizational_capacity" | "project_narrative" | "evaluation_plan" | "budget_narrative" | "global",
      "excerpt": "short quote from the draft (or null)",
      "finding": "1-3 sentences naming the gap concretely",
      "suggestion": "1-2 sentences with a concrete fix",
      "criterion_id": "the id of the rubric criterion this finding addresses, or null if not applicable"
    }
  ],
  "overall_score": 0-100 integer,
  "summary": "2-3 sentence executive note"
}`;

export interface ReviewerInput {
  opportunity: {
    title: string;
    agency: string | null;
    brief: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    url: string | null;
  };
  sections: Array<{ section_type: string; content: string }>;
  /**
   * Phase 19-02: extracted rubric criteria for this opp.
   * When present, the reviewer is anchored to these criteria (REVIEW-02/03).
   * Absent = v1 generic-rubric behavior (backward compatible).
   */
  rubric_criteria?: RubricCriterion[];
}

// ---------------------------------------------------------------------------
// Phase 19-02: Rubric prompt addendum
// ---------------------------------------------------------------------------

/**
 * Build the rubric addendum block appended to the reviewer user prompt when
 * rubric criteria are available. Enumerates criteria by ID so the model can
 * echo them in criterion_id fields of each finding.
 *
 * Pattern 6 from 19-RESEARCH.md.
 */
export function buildRubricPromptAddendum(criteria: RubricCriterion[]): string {
  const lines = criteria.map(
    (c) =>
      `[${c.id}] ${c.section_ref}: ${c.criterion_text} (${c.max_points ?? "?"} pts, weight ${c.weight ?? "?"})`,
  );

  return `# Solicitation evaluation rubric

Score the draft against THESE criteria, not generic writing quality. For each criterion the draft fails to address, produce at least one finding with that criterion's id in criterion_id (category: alignment_with_rubric, severity at least high if the criterion is heavily weighted). Findings not tied to a specific criterion use criterion_id: null.

${lines.join("\n")}`;
}

function fmtAmount(min: number | null, max: number | null): string {
  if (min && max) return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
  if (max) return `up to $${max.toLocaleString()}`;
  if (min) return `from $${min.toLocaleString()}`;
  return "amount not specified";
}

/**
 * Build the user message for the reviewer call. Includes the funder brief and
 * every drafted section in canonical order. Sections the proposal is missing
 * are shown as "(no draft for this section)" so the reviewer can call out the
 * gap rather than silently ignore it.
 */
export function buildReviewerUserPrompt(input: ReviewerInput): string {
  const { opportunity: opp, sections, rubric_criteria } = input;
  const byType = new Map(sections.map((s) => [s.section_type, s.content]));

  const sectionBlocks = SECTION_TYPES.map((t) => {
    const spec = SECTION_SPECS[t];
    const content = byType.get(t);
    return `---SECTION:${t}---\n[label: ${spec.label} · target ~${spec.target_words} words]\n${
      content ?? "(no draft for this section)"
    }`;
  }).join("\n\n");

  const rubricBlock =
    rubric_criteria && rubric_criteria.length > 0
      ? `\n\n${buildRubricPromptAddendum(rubric_criteria)}`
      : "";

  return `# Funder opportunity

Title: ${opp.title}
Agency: ${opp.agency ?? "(unknown)"}
Amount: ${fmtAmount(opp.amount_min, opp.amount_max)}
Deadline: ${opp.deadline ?? "(unknown)"}
Source URL: ${opp.url ?? "(unknown)"}

Brief / synopsis:
${opp.brief ?? "(no brief on file — be conservative; do not invent funder priorities)"}

# Drafted proposal sections

${sectionBlocks}${rubricBlock}

Now produce the JSON review object as specified in your system instructions. Output JSON only.`;
}
