"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  MousePointerClick,
  UserPlus,
  MessageSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface FunnelStep {
  event_type: string;
  label: string;
  count: number;
  unique_users: number;
  conversion_rate: number;
}

interface ConversionMetricsProps {
  steps: FunnelStep[];
  totalVisitors: number;
}

const METRIC_CONFIG: Record<
  string,
  { icon: typeof Eye; color: string; bgColor: string }
> = {
  page_view: {
    icon: Eye,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  cta_click: {
    icon: MousePointerClick,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  signup: {
    icon: UserPlus,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  first_chat: {
    icon: MessageSquare,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  trial_converted: {
    icon: CreditCard,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
};

export function ConversionMetrics({
  steps,
  totalVisitors,
}: ConversionMetricsProps) {
  // Key metrics to show as cards
  const keyMetrics = ["page_view", "cta_click", "signup", "first_chat", "trial_converted"];

  const displaySteps = steps.filter((s) => keyMetrics.includes(s.event_type));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {displaySteps.map((step) => {
        const config = METRIC_CONFIG[step.event_type] || {
          icon: TrendingUp,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
        const Icon = config.icon;

        // Overall conversion from visitors
        const overallRate =
          totalVisitors > 0
            ? Math.round((step.unique_users / totalVisitors) * 10000) / 100
            : 0;

        return (
          <Card key={step.event_type}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {step.label}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {step.unique_users.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {step.conversion_rate >= 50 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {step.conversion_rate}% step &middot; {overallRate}% overall
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
