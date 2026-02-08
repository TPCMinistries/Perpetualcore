"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlanStatusBadge } from "./PlanStatusBadge";
import type { AgentPlan } from "@/lib/agents/executor/types";

interface PlanCardProps {
  plan: AgentPlan;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export function PlanCard({ plan }: PlanCardProps) {
  const completedSteps = plan.steps.filter((s) => s.status === "completed").length;
  const totalSteps = plan.steps.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Link href={`/dashboard/agent/plans/${plan.id}`}>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
          plan.status === "paused" && "border-amber-300 dark:border-amber-700"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                {plan.goal}
              </p>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      plan.status === "failed"
                        ? "bg-red-500"
                        : plan.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {completedSteps}/{totalSteps}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <PlanStatusBadge status={plan.status} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {getRelativeTime(plan.created_at)}
              </span>
            </div>
          </div>

          {plan.status === "paused" && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Waiting for your approval
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
