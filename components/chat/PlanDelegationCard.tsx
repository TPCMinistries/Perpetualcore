"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanDelegationCardProps {
  planId: string;
  goal: string;
  stepCount: number;
}

export function PlanDelegationCard({
  planId,
  goal,
  stepCount,
}: PlanDelegationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="my-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
          <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Agent Plan Created
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {goal}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stepCount} steps queued
            </span>
            <Link href={`/dashboard/agent/plans/${planId}`}>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                View Plan
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Parse a delegate_to_agent tool result string to extract plan info.
 * Returns null if the content doesn't match the expected format.
 */
export function parsePlanDelegation(
  content: string
): { planId: string; stepCount: number; goal: string } | null {
  // Pattern: "Plan created (id: <uuid>). <N> steps queued. ..."
  const match = content.match(
    /Plan created \(id: ([a-f0-9-]+)\)\.\s*(\d+) steps queued/
  );
  if (!match) return null;

  // Extract goal from the surrounding text if available, otherwise use a generic label
  // The tool result doesn't include the goal directly, so we use a fallback
  return {
    planId: match[1],
    stepCount: parseInt(match[2], 10),
    goal: "Background plan executing...",
  };
}
