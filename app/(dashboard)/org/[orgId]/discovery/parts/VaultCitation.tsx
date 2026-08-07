/**
 * VaultCitation — presentational chip for a cited vault artifact.
 *
 * Shows the artifact name prominently, a small type badge, and the excerpt
 * in a quoted/muted style. Matches the mono-label aesthetic used throughout
 * DetailPane (zinc palette, font-mono uppercase tracking labels).
 *
 * Phase 18-04 — SCORE-02: cited vault artifact name + excerpt chip.
 */

interface VaultCitationProps {
  artifactTitle: string;
  artifactType: string;
  excerpt: string;
  similarity?: number;
}

/** Normalize a vault artifact type into a short readable badge label. */
function formatType(type: string): string {
  const labels: Record<string, string> = {
    past_proposal: "Past proposal",
    annual_report: "Annual report",
    founder_letter: "Founder letter",
    case_study: "Case study",
    policy: "Policy doc",
    other: "Document",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

/** Format a 0-1 similarity score as a percentage label. */
function formatSimilarity(sim: number): string {
  return `${Math.round(sim * 100)}% match`;
}

export function VaultCitation({
  artifactTitle,
  artifactType,
  excerpt,
  similarity,
}: VaultCitationProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      {/* Header row: artifact name + type badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900">{artifactTitle}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {formatType(artifactType)}
          </span>
          {similarity !== undefined && (
            <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {formatSimilarity(similarity)}
            </span>
          )}
        </div>
      </div>
      {/* Excerpt — quoted muted style */}
      {excerpt && (
        <p className="mt-1.5 border-l-2 border-zinc-300 pl-2.5 text-xs leading-5 text-zinc-500 italic">
          {excerpt}
        </p>
      )}
    </div>
  );
}
