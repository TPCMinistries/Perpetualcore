"use client";

/**
 * DeadlineTracker — "Closing soon" panel that surfaces opportunities with
 * a deadline in the next 7 days. Sorted by urgency.
 *
 * Client component because it's filtered + sorted from the same `initialRows`
 * the DiscoveryClient receives — no extra query. Renders above the
 * filter/feed split so users see urgent items first.
 *
 * Tone:
 *   <= 1 day → rose
 *   <= 3 days → amber
 *   <= 7 days → emerald (warning-but-not-urgent)
 */

import Link from "next/link";

interface OppLite {
  opp_id: string;
  title: string;
  agency?: string | null;
  deadline: string | null;
}

interface DeadlineTrackerProps {
  orgId: string;
  rows: OppLite[];
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = t - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

function urgencyClasses(days: number): string {
  if (days <= 1) return "border-rose-500/40 bg-rose-500/[0.06] text-rose-200";
  if (days <= 3) return "border-amber-500/40 bg-amber-500/[0.06] text-amber-200";
  return "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-200";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "overdue";
  if (days === 0) return "due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function DeadlineTracker({ orgId, rows }: DeadlineTrackerProps) {
  // Compute closing-soon set: deadline within next 7 days, not in the past.
  const closing = rows
    .map((r) => ({ row: r, days: daysUntil(r.deadline) }))
    .filter(
      (x): x is { row: OppLite; days: number } =>
        x.days !== null && x.days >= 0 && x.days <= 7,
    )
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (closing.length === 0) return null;

  return (
    <section className="mx-auto mb-4 max-w-5xl px-6">
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            Closing soon
          </h2>
          <span className="font-mono text-[10px] text-zinc-500">
            {closing.length} this week
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {closing.map(({ row, days }) => (
            <li key={row.opp_id}>
              <Link
                href={`/org/${orgId}/discovery?opp=${row.opp_id}`}
                className="block rounded-md border border-zinc-900 bg-zinc-950 p-3 transition hover:border-zinc-800"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${urgencyClasses(days)}`}
                  >
                    {urgencyLabel(days)}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-[13px] leading-snug text-zinc-100">
                  {row.title}
                </div>
                {row.agency ? (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {row.agency}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
