"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Circle, Sparkles, MessageSquare, Upload, Search } from "lucide-react";
import Link from "next/link";
import { getOnboardingProgress, markStepComplete } from "@/lib/onboarding/actions";

interface ChecklistStep {
  key: string;
  label: string;
  description: string;
  icon: any;
  href: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<ChecklistStep[]>([
    { key: "first_conversation", label: "Start your first conversation", description: "Chat with AI", icon: MessageSquare, href: "/dashboard/chat", completed: false },
    { key: "first_document", label: "Upload a document", description: "Build your knowledge base", icon: Upload, href: "/dashboard/documents", completed: false },
    { key: "first_search", label: "Search your knowledge", description: "Try document search", icon: Search, href: "/dashboard/search", completed: false },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    const { data } = await getOnboardingProgress();

    if (data) {
      setSteps(prevSteps =>
        prevSteps.map(step => {
          const progress = data.find((p: any) => p.step_key === step.key);
          return {
            ...step,
            completed: progress?.completed || false,
          };
        })
      );
    }

    setIsLoading(false);
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (completedCount === steps.length) {
    return null; // Hide checklist when all steps are complete
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1">Get Started</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete these steps to unlock the full power of Perpetual Core
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {completedCount}/{steps.length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">completed</p>
          </div>
        </div>

        <Progress value={progress} className="h-2 mb-6" />

        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  step.completed
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 cursor-default"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.completed
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {step.completed ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${step.completed ? "text-emerald-900 dark:text-emerald-100 line-through" : "text-slate-900 dark:text-slate-100"}`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
                {!step.completed && (
                  <Icon className="h-5 w-5 text-slate-400" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
