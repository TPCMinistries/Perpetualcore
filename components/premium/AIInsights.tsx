"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  ArrowRight,
  Brain,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface Insight {
  type: "prediction" | "recommendation" | "alert" | "opportunity";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  action?: {
    label: string;
    href: string;
  };
}

const insights: Insight[] = [
  {
    type: "prediction",
    title: "Revenue Forecast Looking Strong",
    description: "Based on current trends, you're projected to exceed your Q4 target by 18%. User engagement is up 32% and conversion rates are climbing.",
    impact: "high",
    confidence: 94,
    action: {
      label: "View Full Forecast",
      href: "/dashboard/analytics/forecast",
    },
  },
  {
    type: "recommendation",
    title: "Optimize AI Agent Workflows",
    description: "Your scheduling agent is running 3x more than needed. Consolidating to batch processing could save $450/month in compute costs.",
    impact: "medium",
    confidence: 87,
    action: {
      label: "Optimize Now",
      href: "/dashboard/agents",
    },
  },
  {
    type: "opportunity",
    title: "Untapped Feature Potential",
    description: "Only 23% of your team is using the document analysis feature. Training could unlock 15 hours/week in productivity gains.",
    impact: "high",
    confidence: 91,
    action: {
      label: "Schedule Training",
      href: "/dashboard/settings/training",
    },
  },
  {
    type: "alert",
    title: "API Usage Nearing Limit",
    description: "You're at 78% of your monthly API quota with 9 days remaining. Consider upgrading or optimizing high-volume queries.",
    impact: "medium",
    confidence: 100,
    action: {
      label: "Review Usage",
      href: "/dashboard/settings/billing",
    },
  },
];

const quickWins = [
  {
    title: "Enable Smart Caching",
    description: "Reduce API calls by 40%",
    estimatedSavings: "$180/month",
  },
  {
    title: "Archive Old Conversations",
    description: "Free up 2.3 GB of storage",
    estimatedSavings: "$23/month",
  },
  {
    title: "Update Agent Schedules",
    description: "Better align with peak usage",
    estimatedSavings: "15% faster response",
  },
];

function getInsightIcon(type: Insight["type"]) {
  switch (type) {
    case "prediction":
      return TrendingUp;
    case "recommendation":
      return Lightbulb;
    case "alert":
      return AlertCircle;
    case "opportunity":
      return Target;
  }
}

function getInsightColor(type: Insight["type"]) {
  switch (type) {
    case "prediction":
      return "from-blue-500 to-cyan-500";
    case "recommendation":
      return "from-purple-500 to-pink-500";
    case "alert":
      return "from-orange-500 to-red-500";
    case "opportunity":
      return "from-green-500 to-emerald-500";
  }
}

function getImpactBadgeColor(impact: Insight["impact"]) {
  switch (impact) {
    case "high":
      return "bg-green-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-gray-500 text-white";
  }
}

export function AIInsights() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
                <CardDescription>
                  Predictive analytics and personalized recommendations
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 text-sm px-4 py-2">
              <Sparkles className="mr-2 h-4 w-4" />
              Powered by Claude
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Insights */}
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          const gradient = getInsightColor(insight.type);
          const impactColor = getImpactBadgeColor(insight.impact);

          return (
            <Card key={index} className="border-2 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                      <Badge className={impactColor}>
                        {insight.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-medium">{insight.confidence}% Confidence</span>
                        </div>
                      </div>

                      {insight.action && (
                        <Button variant="outline" size="sm" className="group">
                          {insight.action.label}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Wins */}
      <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Quick Wins
          </CardTitle>
          <CardDescription>
            Easy optimizations you can implement right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {quickWins.map((win, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-background border-2 hover:border-green-500/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <h4 className="font-semibold text-sm group-hover:text-green-600 transition-colors">
                    {win.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {win.description}
                </p>
                <p className="text-xs font-semibold text-green-600">
                  Save {win.estimatedSavings}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Executive Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your platform usage is <span className="font-semibold text-foreground">exceptional</span> this month.
                You're on track for a record quarter with strong user engagement and efficient resource utilization.
                The AI has identified 3 high-impact opportunities that could boost productivity by an estimated
                <span className="font-semibold text-green-600"> 15-20%</span>. Consider scheduling a review with your
                account manager to discuss scaling strategies for Q1.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
