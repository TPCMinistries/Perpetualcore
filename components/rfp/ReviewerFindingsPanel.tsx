/**
 * ReviewerFindingsPanel — server component that renders a parsed ReviewerResult.
 *
 * Display order:
 *   1. Overall score chip + 2-3 sentence summary
 *   2. Findings grouped by severity (blockers → high → medium → low)
 *      with category eyebrow, finding sentence, suggestion sentence, and
 *      cited excerpt rendered as a styled blockquote.
 *
 * Aesthetic matches the dark zinc-950 / emerald-accented surface of the
 * proposal view. No client interactivity — re-running the reviewer rerenders
 * the page via router.refresh() in ReviewButton.
 */

import type {
  FindingCategory,
  FindingSeverity,
  ReviewerFinding,
  ReviewerResult,
} from "@/lib/rfp/review/rubric";

const SEVERITY_ORDER: FindingSeverity[] = ["blocker", "high", "medium", "low"];

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  blocker: "Blockers",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Tailwind needs literal class strings, so we use a hardcoded lookup instead
// of templating the color name.
const SEVERITY_CLASSES: Record<
  FindingSeverity,
  { chip: string; bar: string; label: string }
> = {
  blocker: {
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
    label: "text-rose-700",
  },
  high: {
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
    label: "text-amber-700",
  },
  medium: {
    chip: "border-zinc-300 bg-zinc-100 text-zinc-700",
    bar: "bg-zinc-400",
    label: "text-zinc-700",
  },
  low: {
    chip: "border-zinc-200 bg-zinc-50 text-zinc-500",
    bar: "bg-zinc-300",
    label: "text-zinc-500",
  },
};

const CATEGORY_LABEL: Record<FindingCategory, string> = {
  theory_of_change: "Theory of change",
  evidence: "Evidence",
  outcomes_clarity: "Outcomes clarity",
  alignment_with_rubric: "Alignment with rubric",
  page_limit: "Page/word limit",
  compliance: "Compliance",
  voice_consistency: "Voice consistency",
  specificity: "Specificity",
  other: "Other",
};

const SECTION_LABEL: Record<string, string> = {
  executive_summary: "Executive Summary",
  organizational_capacity: "Organizational Capacity",
  project_narrative: "Project Narrative",
  evaluation_plan: "Evaluation Plan",
  budget_narrative: "Budget Narrative",
  global: "Cross-cutting",
};

function scoreTone(score: number): string {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 65) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

interface CriterionForPanel {
  id: string;
  section_ref: string;
}

interface ReviewerFindingsPanelProps {
  result: ReviewerResult;
  /**
   * Phase 19-02: rubric criteria for this opp. Used to resolve criterion_id
   * on each finding to a human-readable section_ref chip. Default empty array
   * = no criterion chips rendered (backward compatible).
   */
  criteria?: CriterionForPanel[];
}

export function ReviewerFindingsPanel({
  result,
  criteria = [],
}: ReviewerFindingsPanelProps) {
  // Build id → section_ref lookup for O(1) resolution
  const criterionMap = new Map<string, string>(
    criteria.map((c) => [c.id, c.section_ref]),
  );
  const grouped = new Map<FindingSeverity, ReviewerFinding[]>();
  for (const sev of SEVERITY_ORDER) grouped.set(sev, []);
  for (const f of result.findings) {
    const bucket = grouped.get(f.severity);
    if (bucket) bucket.push(f);
  }

  return (
    <section className="mt-8 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
            Reviewer pass · preview
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {result.model} · {result.findings.length} finding
            {result.findings.length === 1 ? "" : "s"}
          </p>
        </div>
        <div
          className={`flex flex-col items-center rounded-md border px-4 py-2 font-mono ${scoreTone(
            result.overall_score,
          )}`}
        >
          <div className="text-[9px] uppercase tracking-[0.22em] opacity-80">
            Score
          </div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums">
            {result.overall_score}
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-700">
        {result.summary}
      </p>

      {/* Findings by severity */}
      <div className="mt-6 space-y-6">
        {SEVERITY_ORDER.map((sev) => {
          const items = grouped.get(sev) ?? [];
          if (items.length === 0) return null;
          const classes = SEVERITY_CLASSES[sev];
          return (
            <div key={sev}>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${classes.bar}`}
                />
                <h3
                  className={`font-mono text-[10px] uppercase tracking-[0.22em] ${classes.label}`}
                >
                  {SEVERITY_LABEL[sev]} · {items.length}
                </h3>
              </div>
              <ul className="mt-3 space-y-4">
                {items.map((f, idx) => (
                  <li
                    key={`${sev}-${idx}`}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${classes.chip}`}
                      >
                        {SEVERITY_LABEL[sev]}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                        {CATEGORY_LABEL[f.category] ?? f.category}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                        ·
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                        {SECTION_LABEL[f.section_type] ?? f.section_type}
                      </span>
                      {/* Phase 19-02: criterion chip — show when finding has a known criterion_id */}
                      {f.criterion_id && criterionMap.has(f.criterion_id) ? (
                        <>
                          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                            ·
                          </span>
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-700">
                            {criterionMap.get(f.criterion_id)}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <p className="mt-3 text-[14px] leading-relaxed text-zinc-900">
                      {f.finding}
                    </p>

                    {f.excerpt ? (
                      <blockquote className="mt-3 border-l-2 border-zinc-300 pl-3 text-[13px] italic leading-relaxed text-zinc-500">
                        “{f.excerpt}”
                      </blockquote>
                    ) : null}

                    <p className="mt-3 text-[13px] leading-relaxed text-emerald-700">
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-600">
                        Suggestion ·{" "}
                      </span>
                      {f.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {result.findings.length === 0 ? (
          <p className="text-sm italic text-zinc-500">
            The reviewer surfaced no specific findings. That is unusual for a
            first-pass draft — confirm the model output looks right before
            trusting the score.
          </p>
        ) : null}
      </div>
    </section>
  );
}
