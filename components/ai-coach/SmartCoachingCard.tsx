"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  ChevronRight,
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  Play,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export interface CoachingSuggestion {
  id: string;
  type: "tip" | "opportunity" | "quick-win" | "learning-path";
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
  priority?: "low" | "medium" | "high";
}

interface SmartCoachingCardProps {
  suggestion: CoachingSuggestion;
  onDismiss?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function SmartCoachingCard({ suggestion, onDismiss, onComplete }: SmartCoachingCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(suggestion.id);
    }, 300);
  };

  const handleComplete = () => {
    onComplete?.(suggestion.id);
    if (suggestion.action?.onClick) {
      suggestion.action.onClick();
    }
  };

  if (!isVisible) return null;

  const getTypeConfig = () => {
    switch (suggestion.type) {
      case "opportunity":
        return {
          icon: Target,
          gradient: "from-purple-500/10 to-pink-500/10",
          border: "border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-100 dark:bg-purple-900/30",
          iconColor: "text-purple-600 dark:text-purple-400",
          badge: "Opportunity",
          badgeColor: "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400",
        };
      case "quick-win":
        return {
          icon: Zap,
          gradient: "from-yellow-500/10 to-orange-500/10",
          border: "border-yellow-200 dark:border-yellow-800",
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          badge: "Quick Win",
          badgeColor: "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400",
        };
      case "learning-path":
        return {
          icon: TrendingUp,
          gradient: "from-blue-500/10 to-cyan-500/10",
          border: "border-blue-200 dark:border-blue-800",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          badge: "Learning Path",
          badgeColor: "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
        };
      default:
        return {
          icon: Lightbulb,
          gradient: "from-green-500/10 to-emerald-500/10",
          border: "border-green-200 dark:border-green-800",
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
          badge: "Tip",
          badgeColor: "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <Card
      className={`relative overflow-hidden border ${config.border} bg-gradient-to-br ${config.gradient} transition-all duration-300 animate-in fade-in slide-in-from-top-2`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-16 -mt-16" />

      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`h-10 w-10 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={config.badgeColor}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {config.badge}
                </Badge>
                {suggestion.priority === "high" && (
                  <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                    High Priority
                  </Badge>
                )}
              </div>

              {suggestion.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <h4 className="font-semibold mb-1 text-sm">{suggestion.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {suggestion.description}
            </p>

            {/* Action */}
            {suggestion.action && (
              <div className="flex items-center gap-2">
                {suggestion.action.href ? (
                  <Link href={suggestion.action.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleComplete}
                    >
                      {suggestion.type === "quick-win" ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {suggestion.action.label}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleComplete}
                  >
                    {suggestion.type === "quick-win" ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {suggestion.action.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
