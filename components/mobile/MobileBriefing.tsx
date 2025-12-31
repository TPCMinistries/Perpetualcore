"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckSquare,
  Calendar,
  Mail,
  Zap,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MobileBriefingProps {
  userId: string;
}

interface BriefingSummary {
  priorityCount: number;
  meetingCount: number;
  unreadCount: number;
  automationAlerts: number;
  topPriority?: {
    id: string;
    title: string;
    type: string;
    dueAt?: string;
  };
  nextMeeting?: {
    id: string;
    title: string;
    startTime: string;
  };
}

export function MobileBriefing({ userId }: MobileBriefingProps) {
  const [summary, setSummary] = useState<BriefingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch("/api/briefing?summary=true");
        if (response.ok) {
          const data = await response.json();
          setSummary({
            priorityCount: data.priorities?.length || 0,
            meetingCount: data.meetings?.length || 0,
            unreadCount: data.overnight?.newEmails || 0,
            automationAlerts: data.overnight?.failedAutomations || 0,
            topPriority: data.priorities?.[0],
            nextMeeting: data.meetings?.[0],
          });
        }
      } catch (error) {
        console.error("Failed to fetch briefing summary:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-3 p-4">
      {/* Top Priority Card */}
      {summary.topPriority && (
        <Link href={`/dashboard/tasks?id=${summary.topPriority.id}`}>
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-white/80 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Top Priority
                  </p>
                  <p className="font-semibold line-clamp-2">
                    {summary.topPriority.title}
                  </p>
                  {summary.topPriority.dueAt && (
                    <p className="text-xs text-white/80 mt-1">
                      Due {formatDistanceToNow(new Date(summary.topPriority.dueAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/tasks">
          <Card className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.priorityCount}</p>
                <p className="text-xs text-muted-foreground">Tasks Today</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/calendar">
          <Card className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.meetingCount}</p>
                <p className="text-xs text-muted-foreground">Meetings</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/inbox">
          <Card className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/automation?status=failed">
          <Card className={cn(
            "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
            summary.automationAlerts > 0 && "border-red-200 dark:border-red-800"
          )}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                summary.automationAlerts > 0
                  ? "bg-red-50 dark:bg-red-950/30"
                  : "bg-violet-50 dark:bg-violet-950/30"
              )}>
                {summary.automationAlerts > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Zap className="h-5 w-5 text-violet-500" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.automationAlerts}</p>
                <p className="text-xs text-muted-foreground">Alerts</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Next Meeting */}
      {summary.nextMeeting && (
        <Link href={`/dashboard/calendar?meeting=${summary.nextMeeting.id}`}>
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{summary.nextMeeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(summary.nextMeeting.startTime), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Next Up
              </Badge>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
