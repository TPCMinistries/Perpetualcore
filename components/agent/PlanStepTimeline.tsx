"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanStep, StepResult, StepStatus } from "@/lib/agents/executor/types";

const STEP_STATUS_CONFIG: Record<
  StepStatus,
  { icon: typeof Circle; color: string; lineColor: string }
> = {
  pending: {
    icon: Circle,
    color: "text-slate-400 dark:text-slate-500",
    lineColor: "bg-slate-200 dark:bg-slate-700",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    lineColor: "bg-blue-200 dark:bg-blue-800",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    lineColor: "bg-emerald-200 dark:bg-emerald-800",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    lineColor: "bg-red-200 dark:bg-red-800",
  },
  skipped: {
    icon: Circle,
    color: "text-slate-300 dark:text-slate-600",
    lineColor: "bg-slate-200 dark:bg-slate-700",
  },
  awaiting_approval: {
    icon: PauseCircle,
    color: "text-amber-500",
    lineColor: "bg-amber-200 dark:bg-amber-800",
  },
};

interface PlanStepTimelineProps {
  steps: PlanStep[];
  stepResults: Record<string, StepResult>;
}

const stepVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export function PlanStepTimeline({ steps, stepResults }: PlanStepTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  function formatTiming(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const config = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.pending;
        const Icon = config.icon;
        const result = stepResults[step.id];
        const isExpanded = expandedSteps.has(step.id);
        const isLast = index === steps.length - 1;

        return (
          <motion.div
            key={step.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={stepVariants}
            className="relative flex gap-4"
          >
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 relative z-10">
                <Icon
                  className={cn(
                    "h-6 w-6",
                    config.color,
                    step.status === "running" && "animate-spin"
                  )}
                />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    config.lineColor
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {step.id.replace("step_", "#")}
                    </span>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {step.tool}
                    </span>
                    {step.requires_approval && step.status !== "awaiting_approval" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        approval required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {step.description}
                  </p>
                </div>

                {/* Timing badge */}
                {result && result.timing > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {formatTiming(result.timing)}
                  </span>
                )}
              </div>

              {/* Expandable output */}
              {result && (
                <button
                  onClick={() => toggleStep(step.id)}
                  className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {result.error ? "Show error" : "Show output"}
                </button>
              )}

              {result && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <pre
                    className={cn(
                      "text-xs p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono",
                      result.error
                        ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {result.error || result.output || "(no output)"}
                  </pre>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
