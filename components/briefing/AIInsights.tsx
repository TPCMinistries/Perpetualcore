"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Brain,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface Insight {
  id: string;
  type: "pattern" | "suggestion" | "warning";
  title: string;
  description: string;
  actionUrl?: string;
}

interface AIInsightsProps {
  insights: Insight[];
}

const typeConfig = {
  pattern: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  suggestion: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  warning: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
};

export function AIInsights({ insights }: AIInsightsProps) {
  const topInsights = insights.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No insights available yet. Keep using the platform!
          </p>
        ) : (
          <div className="space-y-3">
            {topInsights.map((insight) => {
              const config = typeConfig[insight.type];
              const Icon = config.icon;

              return (
                <div
                  key={insight.id}
                  className={`p-3 rounded-lg ${config.bg}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 ${config.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                      {insight.actionUrl && (
                        <Link href={insight.actionUrl}>
                          <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
                            Take action
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
