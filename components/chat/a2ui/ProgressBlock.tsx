"use client";

import type { A2UIBlock } from "@/lib/a2ui/types";
import type { ProgressBlockData } from "@/lib/a2ui/types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBlockProps {
  block: A2UIBlock;
}

export default function ProgressBlock({ block }: ProgressBlockProps) {
  const data = block.data as ProgressBlockData;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="space-y-0">
        {data.steps.map((step, index) => {
          const isLast = index === data.steps.length - 1;

          return (
            <div key={index} className="flex gap-3">
              {/* Timeline line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                    step.status === "complete" &&
                      "bg-emerald-500 border-emerald-500",
                    step.status === "current" &&
                      "bg-violet-500 border-violet-500 animate-pulse",
                    step.status === "pending" &&
                      "bg-transparent border-slate-300 dark:border-slate-600"
                  )}
                >
                  {step.status === "complete" && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                  {step.status === "current" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[24px]",
                      step.status === "complete"
                        ? "bg-emerald-300 dark:bg-emerald-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={cn("pb-4", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-6",
                    step.status === "complete" &&
                      "text-emerald-700 dark:text-emerald-400",
                    step.status === "current" &&
                      "text-violet-700 dark:text-violet-400",
                    step.status === "pending" &&
                      "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
