"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";

interface ActionQueueHeaderProps {
  pendingRedCount: number;
  totalTodayCount: number;
  totalInsights: number;
}

export function ActionQueueHeader({
  pendingRedCount,
  totalTodayCount,
  totalInsights,
}: ActionQueueHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Voice Intelligence
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Brain-classified voice memos with action queue
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pendingRedCount > 0 && (
          <Badge
            variant="destructive"
            className="gap-1 bg-red-500 hover:bg-red-600"
          >
            <AlertTriangle className="h-3 w-3" />
            {pendingRedCount} urgent
          </Badge>
        )}
        <Badge
          variant="outline"
          className="gap-1 border-amber-300 text-amber-700 dark:text-amber-400"
        >
          <Clock className="h-3 w-3" />
          {totalTodayCount} today
        </Badge>
        <Badge
          variant="outline"
          className="gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400"
        >
          <Sparkles className="h-3 w-3" />
          {totalInsights} insights
        </Badge>
      </div>
    </div>
  );
}
