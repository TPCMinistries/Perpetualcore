"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, MessageSquare, Upload, Bot, X } from "lucide-react";
import Link from "next/link";
import { getOnboardingProgress, dismissOnboardingChecklist, isChecklistDismissed } from "@/lib/onboarding/actions";
import { trackClientEvent } from "@/lib/analytics/track-event";

interface ChecklistStep {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  completed: boolean;
}

const INITIAL_STEPS: ChecklistStep[] = [
  {
    key: "first_chat",
    label: "Have your first conversation",
    description: "Chat with your AI brain",
    icon: MessageSquare,
    href: "/dashboard/chat",
    completed: false,
  },
  {
    key: "first_document",
    label: "Upload a document",
    description: "Build your knowledge base",
    icon: Upload,
    href: "/dashboard/library",
    completed: false,
  },
  {
    key: "explore_agents",
    label: "Explore AI agents",
    description: "Discover specialized AI assistants",
    icon: Bot,
    href: "/dashboard/assistants/browse",
    completed: false,
  },
];

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<ChecklistStep[]>(INITIAL_STEPS);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);

    // Check if dismissed first
    const { dismissed } = await isChecklistDismissed();
    if (dismissed) {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    const { data } = await getOnboardingProgress();

    if (data) {
      setSteps(prevSteps =>
        prevSteps.map(step => {
          const progress = data.find((p: { step_key: string; completed: boolean }) => p.step_key === step.key);
          const nowComplete = progress?.completed || false;

          // Track activation milestone when newly completed
          if (nowComplete && !step.completed) {
            const eventType = step.key as "first_chat" | "first_document" | "explore_agents";
            trackClientEvent(eventType, { event_name: `activation_${step.key}` });
          }

          return {
            ...step,
            completed: nowComplete,
          };
        })
      );
    }

    setIsLoading(false);
  };

  const handleDismiss = async () => {
    await dismissOnboardingChecklist();
    setIsDismissed(true);
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  // Hide if dismissed or all steps complete
  if (isDismissed || (!isLoading && completedCount === steps.length)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1">
              Complete your setup
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {completedCount === 0
                ? "Get the most out of Perpetual Core with these first steps"
                : completedCount === steps.length - 1
                  ? "Almost there — one more step to go!"
                  : `${completedCount} of ${steps.length} completed`}
            </p>
          </div>
          <div className="flex items-start gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {completedCount}/{steps.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">completed</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={handleDismiss}
              title="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar with gradient */}
        <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-5 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                  step.completed
                    ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 cursor-default pointer-events-none"
                    : "border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md hover:scale-[1.01]"
                }`}
              >
                {/* Status icon */}
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    step.completed
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step.completed ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      step.completed
                        ? "text-emerald-700 dark:text-emerald-300 line-through"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Action icon (only for incomplete steps) */}
                {!step.completed && (
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
