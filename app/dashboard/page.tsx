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
    },
    {
      type: "recommendation" as const,
      title: "Optimize Your Workflow",
      description: "Consider setting up automated agents for repetitive tasks. Could save 5+ hours/week.",
      impact: "medium" as const,
      confidence: 87,
    },
    {
      type: "opportunity" as const,
      title: "Untapped Feature",
      description: "You haven't used document analysis yet. It could streamline your research process.",
      impact: "medium" as const,
      confidence: 91,
    },
  ];

  // Metrics Data
  const metrics = [
    {
      title: "AI Conversations",
      value: "47",
      change: 24.1,
      trend: "up" as const,
      icon: Brain,
      description: "This month",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Documents Processed",
      value: "12",
      change: 15.3,
      trend: "up" as const,
      icon: BarChart3,
      description: "This week",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Time Saved",
      value: "8h",
      change: 31.5,
      trend: "up" as const,
      icon: Zap,
      description: "Estimated this week",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Active Workflows",
      value: "3",
      change: 0,
      trend: "up" as const,
      icon: ActivityIcon,
      description: "Running now",
      gradient: "from-orange-500 to-amber-500",
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
        return "from-blue-500 to-cyan-500";
      case "recommendation":
        return "from-purple-500 to-pink-500";
      case "opportunity":
        return "from-green-500 to-emerald-500";
    }
  }

  function getImpactBadgeColor(impact: "high" | "medium" | "low") {
    switch (impact) {
      case "high":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section - Refined and Elegant */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-purple-50/20 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-purple-950/10 rounded-2xl" />

        <div className="relative border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 md:p-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-6">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center shadow-sm">
                <IconComponent className="h-7 w-7 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Your Metrics</h2>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200 dark:border-slate-800">
              View Full Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.trend === "up";

            // Subtle color accents for each metric
            const iconColors: Record<string, string> = {
              "from-blue-500 to-cyan-500": "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
              "from-purple-500 to-pink-500": "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
              "from-green-500 to-emerald-500": "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
              "from-orange-500 to-amber-500": "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
            };
            const iconColor = iconColors[metric.gradient] || iconColors["from-blue-500 to-cyan-500"];

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Brain className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">AI Insights</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Personalized recommendations powered by AI</p>
            </div>
          </div>
          <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-0 px-3 py-1.5 text-xs font-medium">
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

            // Subtle icon colors
            const iconColors: Record<string, string> = {
              "from-blue-500 to-cyan-500": "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
              "from-purple-500 to-pink-500": "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
              "from-green-500 to-emerald-500": "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
            };
            const iconColor = iconColors[gradient] || iconColors["from-blue-500 to-cyan-500"];

            return (
              <Card key={index} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-11 w-11 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-2">{insight.title}</h3>
                      <Badge className={`${impactColor} text-xs px-2 py-0.5`}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {insight.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{insight.confidence}% Confidence</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - Refined */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Quick Actions</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Jump right into what you need</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {config.quickActions.map((action, index) => {
            const ActionIcon = action.icon;

            // Refined icon colors
            const iconColors: Record<string, string> = {
              blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
              purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
              green: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
              orange: "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
              cyan: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400",
              pink: "bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400",
              indigo: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
              violet: "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
              sky: "bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400",
              emerald: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
              primary: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">What's been happening in your workspace</p>
          </div>
          <Link href="/dashboard/activity">
            <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200 dark:border-slate-800">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900">
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
