"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { TodaysPriorities } from "@/components/briefing/TodaysPriorities";
import { UpcomingMeetings } from "@/components/briefing/UpcomingMeetings";
import { OvernightSummary } from "@/components/briefing/OvernightSummary";
import { AutomationResults } from "@/components/briefing/AutomationResults";
import { AIInsights } from "@/components/briefing/AIInsights";
import { ExternalTasksWidget } from "@/components/briefing/ExternalTasksWidget";
import type { BriefingData } from "@/components/briefing/DailyBriefing";
import {
  ArrowRight,
  Mail,
  CheckSquare,
  Zap,
  UserPlus,
  RefreshCw,
  MessageSquare,
  FileUp,
  ListPlus,
  Calendar,
  Sun,
  Coffee,
  Moon,
  Target,
  Network,
  Bot,
  Bell,
  CircleCheck,
  CircleX,
  Clock,
} from "lucide-react";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

const quickActions = [
  {
    label: "Command Center",
    icon: Target,
    href: "/dashboard/command-center",
    color: "text-slate-700 dark:text-slate-200",
    bg: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
  },
  {
    label: "Add Knowledge",
    icon: FileUp,
    href: "/dashboard/library",
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Add Lead",
    icon: UserPlus,
    href: "/dashboard/leads",
    color: "text-green-500",
    bg: "bg-green-500/10 hover:bg-green-500/20",
  },
  {
    label: "Build Workflow",
    icon: Zap,
    href: "/dashboard/workflows",
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
];

const launchSteps = [
  {
    label: "Bring in context",
    description: "Upload documents, notes, calls, or operating references.",
    href: "/dashboard/library",
    icon: FileUp,
  },
  {
    label: "Capture relationships",
    description: "Add leads and contacts so follow-ups become visible.",
    href: "/dashboard/leads",
    icon: Network,
  },
  {
    label: "Define work",
    description: "Turn recurring work into tasks, projects, and workflows.",
    href: "/dashboard/workflows",
    icon: ListPlus,
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", Icon: Coffee, color: "text-amber-500" };
  if (hour < 17) return { text: "Good afternoon", Icon: Sun, color: "text-yellow-500" };
  return { text: "Good evening", Icon: Moon, color: "text-indigo-500" };
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function BriefingUnavailable({
  userName,
  onRetry,
  refreshing,
}: {
  userName: string;
  onRetry: () => void;
  refreshing: boolean;
}) {
  const router = useRouter();
  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <greeting.Icon className={`h-6 w-6 ${greeting.color}`} />
            {greeting.text}, {userName}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Retry briefing
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary">
              Operating command center
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              The briefing is not available, but the business dashboard is ready.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use Operating as the main surface for Perpetual Core. It tracks leads, paid packages,
              client lanes, and the next actions that move revenue forward.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => router.push("/dashboard/operating")} className="gap-2">
                Open Operating <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/leads")}>
                Manage leads
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {launchSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => router.push(step.href)}
                className="rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.03]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const router = useRouter();
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefing = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/briefing", {
        method: isRefresh ? "POST" : "GET",
      });
      if (!response.ok) throw new Error("Failed to fetch briefing");

      const briefingData = await response.json();
      setData(briefingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load briefing");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [userId]);

  if (loading) return <HomeSkeleton />;

  if (error) {
    return <BriefingUnavailable userName={userName} onRetry={() => fetchBriefing(true)} refreshing={refreshing} />;
  }

  if (!data) return null;

  const greeting = getGreeting();
  const overnight = data.overnight;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <greeting.Icon className={`h-6 w-6 ${greeting.color}`} />
            {greeting.text}, <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{userName}</span>
          </h1>
        </motion.div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchBriefing(true)}
          disabled={refreshing}
          className="gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      {/* ── Product Activation Path ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-sky-700 dark:text-sky-400">
              Operating setup
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Build the workspace around real work.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Perpetual Core becomes useful when it has context, relationships, and repeatable work to coordinate.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            {launchSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => router.push(step.href)}
                className="group rounded-xl border border-border bg-background p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                </div>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <StatCardGrid columns={4}>
        <StatCard
          label="New Emails"
          value={overnight.newEmails}
          icon={Mail}
          iconColor="blue"
        />
        <StatCard
          label="New Tasks"
          value={overnight.newTasks}
          icon={CheckSquare}
          iconColor="green"
        />
        <StatCard
          label="Agent Actions"
          value={data.agentActivity?.todayCount ?? 0}
          icon={Bot}
          iconColor="violet"
        />
        <StatCard
          label="Notifications"
          value={data.unreadNotifications ?? 0}
          icon={Bell}
          iconColor="amber"
        />
      </StatCardGrid>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 rounded-xl border border-border/50 ${action.bg} px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] group`}
          >
            <div className={`p-2 rounded-lg bg-background/80 ${action.color} group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm text-foreground">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Priorities + Overnight */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <TodaysPriorities priorities={data.priorities} />
          </motion.div>

          {/* Overnight highlights (only if there are any) */}
          {overnight.highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <OvernightSummary summary={overnight} />
            </motion.div>
          )}

          {/* External Tasks (Todoist/Linear) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ExternalTasksWidget limit={5} compact />
          </motion.div>
        </div>

        {/* Right Column — Agent Activity + Meetings + Automations + Insights */}
        <div className="space-y-6">
          {/* Recent Agent Actions */}
          {data.agentActivity && data.agentActivity.recentActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-semibold">Recent Agent Activity</h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {data.agentActivity.todayCount} today
                  </span>
                </div>
                <div className="space-y-2">
                  {data.agentActivity.recentActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 text-sm py-1.5 border-b border-border/30 last:border-0"
                    >
                      {action.status === "completed" ? (
                        <CircleCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : action.status === "failed" ? (
                        <CircleX className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">
                          {action.action_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.agent_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UpcomingMeetings meetings={data.meetings} />
          </motion.div>

          {data.automationResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <AutomationResults results={data.automationResults} />
            </motion.div>
          )}

          {data.insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <AIInsights insights={data.insights} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
