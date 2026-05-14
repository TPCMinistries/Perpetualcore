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
    chip: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    bar: "bg-rose-500/40",
    label: "text-rose-300",
  },
  high: {
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    bar: "bg-amber-500/40",
    label: "text-amber-300",
  },
  medium: {
    chip: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
    bar: "bg-zinc-500/40",
    label: "text-zinc-300",
  },
  low: {
    chip: "border-zinc-700/60 bg-zinc-900/60 text-zinc-400",
    bar: "bg-zinc-700/60",
    label: "text-zinc-400",
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
  if (score >= 80) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (score >= 65) return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-rose-500/40 bg-rose-500/10 text-rose-200";
}

interface ReviewerFindingsPanelProps {
  result: ReviewerResult;
}

export function ReviewerFindingsPanel({ result }: ReviewerFindingsPanelProps) {
  const grouped = new Map<FindingSeverity, ReviewerFinding[]>();
  for (const sev of SEVERITY_ORDER) grouped.set(sev, []);
  for (const f of result.findings) {
    const bucket = grouped.get(f.severity);
    if (bucket) bucket.push(f);
  }

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-900/40 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
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
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-200">
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
                    className="rounded-md border border-zinc-800 bg-zinc-950 p-4"
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
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                        ·
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                        {SECTION_LABEL[f.section_type] ?? f.section_type}
                      </span>
                    </div>

                    <p className="mt-3 text-[14px] leading-relaxed text-zinc-100">
                      {f.finding}
                    </p>

                    {f.excerpt ? (
                      <blockquote className="mt-3 border-l-2 border-zinc-700 pl-3 text-[13px] italic leading-relaxed text-zinc-400">
                        “{f.excerpt}”
                      </blockquote>
                    ) : null}

                    <p className="mt-3 text-[13px] leading-relaxed text-emerald-200/90">
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400">
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
