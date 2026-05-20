"use client";

/**
 * SectionFindings — per-section reviewer findings, rendered inline below the
 * section content in read mode.
 *
 * The global ReviewerFindingsPanel still renders the overall score + cross-
 * cutting findings at the top of the proposal view. This component is the
 * "click-into-context" view: when you're reading a specific section, the
 * reviewer's notes for THAT section appear immediately under it.
 *
 * No fuzzy excerpt-matching in v1 — the reviewer's `excerpt` is rendered as
 * a styled blockquote inside each finding card. Wave 2 may anchor excerpts
 * inline against the section text.
 */

import { useState } from "react";
import type {
  FindingCategory,
  FindingSeverity,
  ReviewerFinding,
} from "@/lib/rfp/review/rubric";

const SEVERITY_ORDER: FindingSeverity[] = ["blocker", "high", "medium", "low"];

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  blocker: "Blocker",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const SEVERITY_CLASSES: Record<
  FindingSeverity,
  { chip: string; dot: string; label: string }
> = {
  blocker: {
    chip: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-500/60",
    label: "text-rose-300",
  },
  high: {
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-500/60",
    label: "text-amber-300",
  },
  medium: {
    chip: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
    dot: "bg-zinc-500/60",
    label: "text-zinc-300",
  },
  low: {
    chip: "border-zinc-700/60 bg-zinc-900/60 text-zinc-400",
    dot: "bg-zinc-700",
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

interface SectionFindingsProps {
  findings: ReviewerFinding[];
}

export function SectionFindings({ findings }: SectionFindingsProps) {
  // Group by severity preserving SEVERITY_ORDER for stable rendering.
  const grouped = new Map<FindingSeverity, ReviewerFinding[]>();
  for (const sev of SEVERITY_ORDER) grouped.set(sev, []);
  for (const f of findings) grouped.get(f.severity)?.push(f);

  // Default to expanded. Collapse if there are many findings to keep the
  // section readable; the writer can re-expand on demand.
  const totalFindings = findings.length;
  const [expanded, setExpanded] = useState<boolean>(totalFindings <= 4);

  if (totalFindings === 0) return null;

  const worstSeverity =
    SEVERITY_ORDER.find((sev) => (grouped.get(sev) ?? []).length > 0) ?? "low";
  const headerClasses = SEVERITY_CLASSES[worstSeverity];

  return (
    <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/30">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-900/50"
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${headerClasses.dot}`}
          />
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.22em] ${headerClasses.label}`}
          >
            Reviewer notes · {totalFindings}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded ? (
        <ul className="space-y-3 border-t border-zinc-800 px-4 py-3">
          {SEVERITY_ORDER.flatMap((sev) =>
            (grouped.get(sev) ?? []).map((f, idx) => {
              const classes = SEVERITY_CLASSES[sev];
              return (
                <li
                  key={`${sev}-${idx}`}
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
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
                  </div>

                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-100">
                    {f.finding}
                  </p>

                  {f.excerpt ? (
                    <blockquote className="mt-2 border-l-2 border-zinc-700 pl-3 text-[12px] italic leading-relaxed text-zinc-400">
                      “{f.excerpt}”
                    </blockquote>
                  ) : null}

                  <p className="mt-2 text-[12px] leading-relaxed text-emerald-200/90">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-400">
                      Suggestion ·{" "}
                    </span>
                    {f.suggestion}
                  </p>
                </li>
              );
            }),
          )}
        </ul>
      ) : null}
    </div>
  );
}
