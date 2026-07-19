import Link from "next/link";
import type { HdiOperationalSummary } from "@/lib/hq/development-intelligence";

const metrics = [
  { key: "pendingReviews", label: "Awaiting human review" },
  { key: "flaggedReviews", label: "Safety flags" },
  { key: "openCommitments", label: "Open commitments" },
  { key: "recentSessions", label: "Sessions · 30 days" },
] as const;

export function DevelopmentSummary({
  summary,
}: {
  summary: HdiOperationalSummary;
}) {
  if (!summary.available) {
    return (
      <div className="hq-panel p-5">
        <div className="hq-eyebrow">Foundation installed</div>
        <p className="mt-2 text-sm" style={{ color: "var(--hq-ink-dim)" }}>
          Apply the reviewed HDI migration to activate the human-review and
          commitment rollup.
        </p>
        <Link
          href="/dashboard/development"
          className="hq-focusable mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium"
          style={{ borderColor: "var(--hq-border)", color: "var(--hq-ink)" }}
        >
          Open Development Intelligence
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="hq-panel p-4">
            <div className="text-2xl font-semibold" style={{ color: "var(--hq-ink)" }}>
              {summary[metric.key]}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--hq-ink-dim)" }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/dashboard/development"
        className="hq-focusable inline-flex min-h-11 w-fit cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium"
        style={{ borderColor: "var(--hq-border)", color: "var(--hq-ink)" }}
      >
        Review evidence reports
      </Link>
    </div>
  );
}
