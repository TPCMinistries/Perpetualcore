/**
 * FeedRow — single row in the Discovery feed list.
 *
 * Layout (locked by 05-CONTEXT.md "Feed layout" → "List row density"):
 *   Line 1:  [FitScoreChip] [Title (truncated)] [Needs review badge?]
 *   Line 2:  agency · amount · deadline (truncated, muted)
 *
 * Selected state: left-edge emerald accent + filled zinc-900 background.
 * Hover state: subtle zinc-900/50 background + pointer cursor.
 *
 * Amount formatting: $2.4M / $480K / $12K — short, scannable.
 * Deadline formatting: "Jun 14" if >7 days away, "In 5d" if 1-7 days,
 *                      "Today" / "Tomorrow" for very near.
 */

import { FitScoreChip } from "./FitScoreChip";
import type { FeedRow as FeedRowType } from "@/lib/rfp/feed";

interface FeedRowProps {
  row: FeedRowType;
  selected: boolean;
  onClick: () => void;
}

function formatAmount(row: FeedRowType): string {
  const amt = row.amount_max ?? row.amount_min;
  if (amt === null || amt === undefined) return "—";
  if (amt >= 1_000_000) return `$${(amt / 1_000_000).toFixed(amt >= 10_000_000 ? 0 : 1)}M`;
  if (amt >= 1_000) return `$${Math.round(amt / 1_000)}K`;
  return `$${amt}`;
}

function formatDeadline(row: FeedRowType): string {
  if (!row.deadline) return "No deadline";
  const dl = new Date(row.deadline);
  if (Number.isNaN(dl.getTime())) return "No deadline";
  const ms = dl.getTime() - Date.now();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days}d`;
  return dl.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FeedRow({ row, selected, onClick }: FeedRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
        selected
          ? "bg-zinc-900 border-emerald-300"
          : "bg-transparent border-transparent hover:bg-zinc-900/50"
      } cursor-pointer`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FitScoreChip score={row.fit_score} tier={row.tier} />
        <span className="font-semibold text-zinc-100 truncate min-w-0 flex-1">
          {row.title}
        </span>
        {row.needs_review && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide bg-amber-950 text-amber-300 border border-amber-700/40">
            Needs review
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-zinc-400 truncate">
        {row.agency ?? "Unknown agency"} · {formatAmount(row)} · {formatDeadline(row)}
      </div>
    </button>
  );
}
