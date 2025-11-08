import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CoachingSection } from "@/components/ai-coach/CoachingSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  Brain,
  BarChart3,
  Zap,
  Activity as ActivityIcon,
  TrendingDown,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { getIndustryConfig } from "@/lib/dashboard/industry-config";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  const industry = "personal";
  const config = getIndustryConfig(industry);

  const IconComponent = config.icon;

  // AI Insights Data
  const insights = [
    {
      type: "prediction" as const,
      title: "Strong Engagement Trend",
      description: "Your activity is up 32% this week. You're on track for a highly productive month.",
      impact: "high" as const,
      confidence: 94,
      link: "/dashboard/analytics",
    },
    {
      type: "recommendation" as const,
      title: "Optimize Your Workflow",
      description: "Consider setting up automated agents for repetitive tasks. Could save 5+ hours/week.",
      impact: "medium" as const,
      confidence: 87,
      link: "/dashboard/agents",
    },
    {
      type: "opportunity" as const,
      title: "Cost Savings Optimization",
      description: "Auto-router saved $4.50 this week by selecting cost-efficient models for 70% of queries.",
      impact: "high" as const,
      confidence: 98,
      link: "/dashboard/analytics",
    },
  ];

  // Metrics Data - Enterprise color strategy
  const metrics = [
    {
      title: "AI Conversations",
      value: "47",
      change: 24.1,
      trend: "up" as const,
      icon: Brain,
      description: "This month",
      gradient: "from-blue-600 to-blue-700", // Primary brand: Deep trustworthy blue
      category: "core" as const,
    },
    {
      title: "Documents Processed",
      value: "12",
      change: 15.3,
      trend: "up" as const,
      icon: BarChart3,
      description: "This week",
      gradient: "from-blue-500 to-blue-600", // Core usage: Soft primary blue
      category: "core" as const,
    },
    {
      title: "Time Saved",
      value: "8h",
      change: 31.5,
      trend: "up" as const,
      icon: Zap,
      description: "Estimated this week",
      gradient: "from-emerald-600 to-teal-600", // Efficiency: Emerald green/teal
      category: "efficiency" as const,
    },
    {
      title: "Active Workflows",
      value: "3",
      change: 0,
      trend: "up" as const,
      icon: ActivityIcon,
      description: "Running now",
      gradient: "from-slate-600 to-slate-700", // Neutral: Professional gray
      category: "status" as const,
    },
  ];

  function getInsightIcon(type: "prediction" | "recommendation" | "opportunity") {
    switch (type) {
      case "prediction":
        return TrendingUp;
      case "recommendation":
        return Lightbulb;
      case "opportunity":
        return Target;
    }
  }

  function getInsightColor(type: "prediction" | "recommendation" | "opportunity") {
    switch (type) {
      case "prediction":
        return "from-blue-600 to-blue-700"; // Primary brand blue
      case "recommendation":
        return "from-amber-600 to-orange-600"; // Warning/optimization - muted gold
      case "opportunity":
        return "from-emerald-600 to-teal-600"; // Efficiency - emerald green
    }
  }

  function getImpactBadgeColor(impact: "high" | "medium" | "low") {
    switch (impact) {
      case "high":
        return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0";
      case "medium":
        return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0";
      case "low":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-0";
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section - Refined and Elegant */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-blue-100/20 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-blue-900/10 rounded-2xl" />

        <div className="relative border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 md:p-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 md:mb-8">
            <div className="flex items-start gap-4 md:gap-6 w-full">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center shadow-sm flex-shrink-0">
                <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-white dark:text-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                  {config.headline}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome back, <span className="text-slate-900 dark:text-slate-100 font-medium">{profile?.full_name || "User"}</span>
                </p>
              </div>
            </div>
          </div>

          <p className="text-base text-slate-700 dark:text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {config.welcomeMessage}
          </p>

          {/* Action Buttons - Clean Design */}
          <QuickActions />
        </div>
      </div>

      {/* Metrics Grid - Refined */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Your Metrics</h2>
          <Link href="/dashboard/analytics" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200 dark:border-slate-800">
              <span className="hidden sm:inline">View Full Analytics</span>
              <span className="sm:hidden">Analytics</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.trend === "up";

            // Enterprise color strategy - strategic and controlled
            const iconColors: Record<string, string> = {
              // Primary brand blue - core metrics
              "from-blue-600 to-blue-700": "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
              "from-blue-500 to-blue-600": "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
              // Efficiency/value - emerald green
              "from-emerald-600 to-teal-600": "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
              // Status/neutral - professional gray
              "from-slate-600 to-slate-700": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
            };
            const iconColor = iconColors[metric.gradient] || iconColors["from-blue-600 to-blue-700"];

            return (
              <Card key={index} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-11 w-11 rounded-lg ${iconColor} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {metric.change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {Math.abs(metric.change)}%
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {metric.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Smart Coaching Section - Temporarily disabled */}
      {/* <CoachingSection /> */}

      {/* AI Insights - Clean and Professional */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">AI Insights</h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Personalized recommendations powered by AI</p>
            </div>
          </div>
          <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-0 px-3 py-1.5 text-xs font-medium w-fit">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Powered by Claude
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const gradient = getInsightColor(insight.type);

            // Refined impact badge colors
            const impactColors: Record<string, string> = {
              high: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0",
              medium: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0",
              low: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-0",
            };
            const impactColor = impactColors[insight.impact];

            // Enterprise icon colors - strategic mapping
            const iconColors: Record<string, string> = {
              "from-blue-600 to-blue-700": "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
              "from-amber-600 to-orange-600": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
              "from-emerald-600 to-teal-600": "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
            };
            const iconColor = iconColors[gradient] || iconColors["from-blue-600 to-blue-700"];

            const insightContent = (
              <Card key={index} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900 h-full group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-11 w-11 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{insight.title}</h3>
                      <Badge className={`${impactColor} text-xs px-2 py-0.5`}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {insight.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                      <Zap className="h-3.5 w-3.5" />
                      <span>{insight.confidence}% Confidence</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );

            return insight.link ? (
              <Link key={index} href={insight.link}>
                {insightContent}
              </Link>
            ) : insightContent;
          })}
        </div>
      </div>

      {/* Quick Actions - Refined */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Quick Actions</h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">Jump right into what you need</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {config.quickActions.map((action, index) => {
            const ActionIcon = action.icon;

            // Enterprise icon colors - strategic mapping only
            const iconColors: Record<string, string> = {
              blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
              purple: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400", // Map purple to blue
              green: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
              orange: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400", // Map orange to amber
              cyan: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", // Map cyan to blue
              pink: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400", // Map pink to blue
              indigo: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", // Map indigo to blue
              violet: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400", // Map violet to blue
              sky: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400", // Map sky to blue
              emerald: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
              primary: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
            };
            const iconColor = iconColors[action.color as keyof typeof iconColors] || iconColors.primary;

            return (
              <Link key={index} href={action.href}>
                <Card className="group border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer h-full bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-lg ${iconColor} flex items-center justify-center mb-4`}>
                      <ActionIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-slate-900 dark:text-slate-100">
                      {action.label}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                      Get started
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity - Clean */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">What's been happening in your workspace</p>
          </div>
          <Link href="/dashboard/activity" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200 dark:border-slate-800">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-900">
          <ActivityFeed limit={5} />
        </div>
      </div>

      {/* Executive Summary - Refined */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-8">
          <div className="flex items-start gap-5">
            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-lg text-slate-900 dark:text-slate-100 mb-3">Your Week in Review</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Excellent progress this week! Your platform usage is strong with
                notable increases in AI conversations and document processing. The AI has identified several opportunities to
                optimize your workflow and save even more time. Keep up the momentum!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
