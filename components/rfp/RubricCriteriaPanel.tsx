/**
 * RubricCriteriaPanel — presentational, server-component-friendly.
 *
 * Displays the extracted evaluation rubric criteria for a proposal's linked
 * opportunity. Each criterion shows its section reference (as a mono uppercase
 * label), criterion text, weight percentage and/or point value, and an amber
 * "inferred — verify against source" badge when is_inferred is true.
 *
 * Phase 19-02 (REVIEW-01 visible-in-workspace clause / REVIEW-02).
 *
 * Aesthetic: matches SubmissionReadinessPanel and ReviewerFindingsPanel
 * (zinc-palette, font-mono labels, border border-zinc-200 bg-white shadow-sm).
 */

interface RubricCriterionDisplay {
  id: string;
  section_ref: string;
  criterion_text: string;
  max_points: number | null;
  weight: number | null;
  is_inferred: boolean;
}

interface RubricCriteriaPanelProps {
  criteria: RubricCriterionDisplay[];
}

/**
 * Format weight as percentage string (0-1 normalized → 0–100%).
 * Returns null when weight is null.
 */
function fmtWeight(weight: number | null): string | null {
  if (weight === null) return null;
  return `${Math.round(weight * 100)}%`;
}

/**
 * Build a compact scoring label from weight and/or max_points.
 * Returns null when neither is present.
 */
function scoringLabel(
  weight: number | null,
  max_points: number | null,
): string | null {
  const parts: string[] = [];
  const w = fmtWeight(weight);
  if (w) parts.push(w);
  if (max_points !== null) parts.push(`${max_points} pts`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function RubricCriteriaPanel({ criteria }: RubricCriteriaPanelProps) {
  // Empty state: show nothing (workspace only renders when criteria exist)
  if (criteria.length === 0) return null;

  return (
    <section className="mt-8 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
          Evaluation Rubric
        </p>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
          · {criteria.length} criterion{criteria.length === 1 ? "" : "a"}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {criteria.map((c) => {
          const label = scoringLabel(c.weight, c.max_points);
          return (
            <li
              key={c.id}
              className="rounded-md border border-zinc-100 bg-zinc-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Section reference — mono uppercase chip */}
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                  {c.section_ref}
                </span>

                {/* Scoring label (weight % and/or pts) */}
                {label ? (
                  <>
                    <span className="font-mono text-[9px] text-zinc-300">·</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                      {label}
                    </span>
                  </>
                ) : null}

                {/* Inferred badge — amber, Pitfall 2 UI guard */}
                {c.is_inferred ? (
                  <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-700">
                    inferred — verify against source
                  </span>
                ) : null}
              </div>

              {/* Criterion text */}
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-800">
                {c.criterion_text}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
