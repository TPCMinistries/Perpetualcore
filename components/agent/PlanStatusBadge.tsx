"use client";

import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/lib/agents/executor/types";

const STATUS_CONFIG: Record<
  PlanStatus,
  { label: string; color: string; bgColor: string; pulse?: boolean }
> = {
  planning: {
    label: "Planning",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  running: {
    label: "Running",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/10",
    pulse: true,
  },
  paused: {
    label: "Needs Approval",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-500/10",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  failed: {
    label: "Failed",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-500/10",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
};

interface PlanStatusBadgeProps {
  status: PlanStatus;
  className?: string;
}

export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.planning;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}
      {config.label}
    </span>
  );
}
