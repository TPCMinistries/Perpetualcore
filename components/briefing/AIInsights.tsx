"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Users,
  Calendar,
  CheckSquare,
  Folder,
  Trophy,
  Clock,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface Insight {
  id: string;
  type: "pattern" | "suggestion" | "warning";
  title: string;
  description: string;
  actionUrl?: string;
}

interface AIInsightsProps {
  insights: Insight[];
  onDismiss?: (insightId: string) => void;
}

const typeConfig = {
  pattern: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    label: "Trend",
    labelBg: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    label: "Suggestion",
    labelBg: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    label: "Action Needed",
    labelBg: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  },
};

// Get contextual icon based on insight content
function getContextualIcon(title: string, type: string) {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("lead")) return Users;
  if (titleLower.includes("task")) return CheckSquare;
  if (titleLower.includes("meeting")) return Calendar;
  if (titleLower.includes("project")) return Folder;
  if (titleLower.includes("great") || titleLower.includes("achieved") || titleLower.includes("completed")) return Trophy;
  if (titleLower.includes("overdue") || titleLower.includes("due")) return Clock;

  return typeConfig[type as keyof typeof typeConfig]?.icon || Sparkles;
}

export function AIInsights({ insights, onDismiss }: AIInsightsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id)).slice(0, 5);

  const handleDismiss = async (insightId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDismissedIds(prev => new Set([...prev, insightId]));

    if (onDismiss) {
      onDismiss(insightId);
    } else {
      // Default dismiss behavior - call API
      try {
        await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insightId, action: "dismiss" }),
        });
      } catch (error) {
        console.error("Failed to dismiss insight:", error);
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Brain className="h-4 w-4 text-violet-500" />
          </motion.div>
          AI Insights
          {visibleInsights.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {visibleInsights.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {visibleInsights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No insights right now. Keep using the platform!
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {visibleInsights.map((insight, index) => {
                const config = typeConfig[insight.type];
                const ContextIcon = getContextualIcon(insight.title, insight.type);

                return (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow-md`}
                  >
                    {/* Dismiss button */}
                    <button
                      onClick={(e) => handleDismiss(insight.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                      title="Dismiss insight"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>

                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${config.labelBg}`}>
                        <ContextIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{insight.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {insight.description}
                        </p>
                        {insight.actionUrl && (
                          <Link href={insight.actionUrl}>
                            <Button
                              variant="link"
                              size="sm"
                              className={`h-auto p-0 mt-1.5 text-xs ${config.color} hover:underline`}
                            >
                              Take action
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Show "View all" if there are more */}
        {insights.length > 5 && (
          <div className="mt-3 pt-3 border-t">
            <Link href="/dashboard/insights">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                View all {insights.length} insights
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
