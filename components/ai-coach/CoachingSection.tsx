"use client";

import { useSmartCoaching } from "@/hooks/useSmartCoaching";
import { SmartCoachingCard } from "./SmartCoachingCard";
import { Brain, Sparkles } from "lucide-react";

export function CoachingSection() {
  const { suggestions, dismissSuggestion, completeSuggestion } = useSmartCoaching();

  // Don't render section if no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 dark:shadow-green-500/20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-900 via-emerald-800 to-teal-900 dark:from-green-100 dark:via-emerald-100 dark:to-teal-100 bg-clip-text text-transparent">
              Smart Coaching
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Personalized tips to help you get the most from Perpetual Core
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => (
          <SmartCoachingCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={dismissSuggestion}
            onComplete={completeSuggestion}
          />
        ))}
      </div>
    </div>
  );
}
