"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OvernightSummary } from "./OvernightSummary";
import { TodaysPriorities } from "./TodaysPriorities";
import { AutomationResults } from "./AutomationResults";
import { QuickMorningActions } from "./QuickMorningActions";
import { AIInsights } from "./AIInsights";
import { UpcomingMeetings } from "./UpcomingMeetings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Sun, Coffee, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BriefingData {
  overnight: {
    newEmails: number;
    newTasks: number;
    completedAutomations: number;
    failedAutomations: number;
    newMentions: number;
    newContacts: number;
    highlights: string[];
  };
  priorities: {
    id: string;
    title: string;
    type: "task" | "meeting" | "email" | "automation";
    dueAt?: string;
    aiScore: number;
    context?: string;
  }[];
  automationResults: {
    id: string;
    name: string;
    type: "bot" | "workflow" | "n8n" | "job";
    status: "success" | "failed" | "running";
    completedAt?: string;
    summary?: string;
  }[];
  meetings: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    aiPrep?: string;
  }[];
  insights: {
    id: string;
    type: "pattern" | "suggestion" | "warning";
    title: string;
    description: string;
    actionUrl?: string;
  }[];
  quickActions: {
    id: string;
    label: string;
    icon: string;
    action: string;
    count?: number;
  }[];
}

interface DailyBriefingProps {
  userId: string;
}

export function DailyBriefing({ userId }: DailyBriefingProps) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefing = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/briefing");
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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Coffee, color: "text-amber-500" };
    if (hour < 17) return { text: "Good afternoon", icon: Sun, color: "text-yellow-500" };
    return { text: "Good evening", icon: Moon, color: "text-indigo-500" };
  };

  const greeting = getGreeting();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-muted-foreground" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-muted-foreground"
        >
          Preparing your daily briefing...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <greeting.icon className={`h-8 w-8 ${greeting.color}`} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-2xl font-bold">{greeting.text}</h2>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchBriefing(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Morning Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <QuickMorningActions actions={data.quickActions} />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Priorities & Overnight */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TodaysPriorities priorities={data.priorities} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <OvernightSummary summary={data.overnight} />
          </motion.div>
        </div>

        {/* Right Column - Meetings, Automations, Insights */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UpcomingMeetings meetings={data.meetings} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AutomationResults results={data.automationResults} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AIInsights insights={data.insights} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
