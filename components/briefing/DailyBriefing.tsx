"use client";

import { useState, useEffect } from "react";
import { OvernightSummary } from "./OvernightSummary";
import { TodaysPriorities } from "./TodaysPriorities";
import { AutomationResults } from "./AutomationResults";
import { QuickMorningActions } from "./QuickMorningActions";
import { AIInsights } from "./AIInsights";
import { UpcomingMeetings } from "./UpcomingMeetings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchBriefing(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Morning Actions */}
      <QuickMorningActions actions={data.quickActions} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Priorities & Overnight */}
        <div className="lg:col-span-2 space-y-6">
          <TodaysPriorities priorities={data.priorities} />
          <OvernightSummary summary={data.overnight} />
        </div>

        {/* Right Column - Meetings, Automations, Insights */}
        <div className="space-y-6">
          <UpcomingMeetings meetings={data.meetings} />
          <AutomationResults results={data.automationResults} />
          <AIInsights insights={data.insights} />
        </div>
      </div>
    </div>
  );
}
