"use client";

import type { A2UIBlock } from "@/lib/a2ui/types";
import type { MetricBlockData, MetricRowBlockData } from "@/lib/a2ui/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricBlockProps {
  block: A2UIBlock;
}

function MetricDisplay({ metric }: { metric: MetricBlockData }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {metric.label}
      </p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {metric.value}
        </span>
        {metric.trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium pb-1",
              metric.trend === "up" && "text-emerald-600 dark:text-emerald-400",
              metric.trend === "down" && "text-red-600 dark:text-red-400",
              metric.trend === "flat" && "text-slate-400 dark:text-slate-500"
            )}
          >
            {metric.trend === "up" && <TrendingUp className="h-3 w-3" />}
            {metric.trend === "down" && <TrendingDown className="h-3 w-3" />}
            {metric.trend === "flat" && <Minus className="h-3 w-3" />}
            {metric.change && <span>{metric.change}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetricBlock({ block }: MetricBlockProps) {
  const metric = block.data as MetricBlockData;
  return <MetricDisplay metric={metric} />;
}

export function MetricRowBlock({ block }: MetricBlockProps) {
  const data = block.data as MetricRowBlockData;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {data.metrics.map((metric, i) => (
        <MetricDisplay key={i} metric={metric} />
      ))}
    </div>
  );
}
