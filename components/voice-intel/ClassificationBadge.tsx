"use client";

import { Badge } from "@/components/ui/badge";

const ENTITY_COLORS: Record<string, string> = {
  IHA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Uplift Communities":
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "DeepFutures Capital":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "TPC Ministries":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Perpetual Core":
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "Personal/Family":
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

interface ClassificationBadgeProps {
  entity: string;
  activity: string;
  actionType: string;
}

export function ClassificationBadge({
  entity,
  activity,
  actionType,
}: ClassificationBadgeProps) {
  const entityColor =
    ENTITY_COLORS[entity] ||
    "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="outline" className={entityColor}>
        {entity}
      </Badge>
      <Badge
        variant="outline"
        className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
      >
        {activity}
      </Badge>
      <Badge
        variant="outline"
        className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
      >
        {actionType}
      </Badge>
    </div>
  );
}
