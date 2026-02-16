"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TodaysPriorities } from "@/components/briefing/TodaysPriorities";
import { UpcomingMeetings } from "@/components/briefing/UpcomingMeetings";
import { OvernightSummary } from "@/components/briefing/OvernightSummary";
import { AutomationResults } from "@/components/briefing/AutomationResults";
import { AIInsights } from "@/components/briefing/AIInsights";
import { ExternalTasksWidget } from "@/components/briefing/ExternalTasksWidget";
import type { BriefingData } from "@/components/briefing/DailyBriefing";
import {
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
} from "lucide-react";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

const quickActions = [
  {
    label: "New Chat",
    icon: MessageSquare,
    href: "/dashboard/chat",
    color: "text-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
  },
  {
    label: "Upload Document",
    icon: FileUp,
    href: "/dashboard/library",
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Create Task",
    icon: ListPlus,
    href: "/dashboard/tasks",
    color: "text-green-500",
    bg: "bg-green-500/10 hover:bg-green-500/20",
  },
  {
    label: "Calendar",
    icon: Calendar,
    href: "/dashboard/calendar",
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
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
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
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
            {greeting.text}, {userName}
          </h1>
        </motion.div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchBriefing(true)}
          disabled={refreshing}
          className="gap-2 text-muted-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing" : "Refresh"}
        </Button>
      </div>

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
          label="Automations"
          value={overnight.completedAutomations}
          icon={Zap}
          iconColor="violet"
          change={
            overnight.failedAutomations > 0
              ? { value: `${overnight.failedAutomations} failed`, trend: "down" as const }
              : undefined
          }
        />
        <StatCard
          label="New Contacts"
          value={overnight.newContacts}
          icon={UserPlus}
          iconColor="cyan"
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
          <Button
            key={action.label}
            variant="ghost"
            className={`h-auto py-3 px-4 justify-start gap-3 rounded-xl border border-transparent ${action.bg} transition-all`}
            onClick={() => router.push(action.href)}
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="font-medium text-sm">{action.label}</span>
          </Button>
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

        {/* Right Column — Meetings + Automations + Insights */}
        <div className="space-y-6">
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
