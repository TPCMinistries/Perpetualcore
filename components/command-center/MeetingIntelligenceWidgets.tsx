"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Handshake,
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  Loader2,
  Calendar,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =====================================================
// TODAY'S MEETINGS WIDGET
// =====================================================

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_type: string;
  attendees?: string[];
}

export function TodaysMeetingsWidget() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    fetchTodaysMeetings();
  }, []);

  const fetchTodaysMeetings = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const params = new URLSearchParams({
        from: today.toISOString(),
        to: tomorrow.toISOString(),
        limit: "5",
      });

      const response = await fetch(`/api/meetings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setTodayCount(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const meetingTypeColors: Record<string, string> = {
    investor: "bg-emerald-500",
    coaching: "bg-blue-500",
    team: "bg-purple-500",
    "1:1": "bg-amber-500",
    sales: "bg-rose-500",
    support: "bg-cyan-500",
    other: "bg-slate-500",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Video className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Today's Meetings</CardTitle>
              <CardDescription className="text-xs">{todayCount} scheduled</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/meetings")}
            className="text-blue-600 text-xs"
          >
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No meetings today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.slice(0, 4).map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                  !isUpcoming(meeting.meeting_date) && "opacity-60"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  meetingTypeColors[meeting.meeting_type] || meetingTypeColors.other
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meeting.meeting_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(meeting.meeting_date)}
                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <span> • {meeting.attendees.length} attendee{meeting.attendees.length > 1 ? "s" : ""}</span>
                    )}
                  </p>
                </div>
                {isUpcoming(meeting.meeting_date) && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-200">
                    Upcoming
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// OPEN PROMISES WIDGET
// =====================================================

interface Promise {
  id: string;
  promise_text: string;
  due_date?: string;
  status: string;
  promiser_contact_id?: string;
  promisee_contact_id?: string;
}

export function OpenPromisesWidget() {
  const router = useRouter();
  const [promises, setPromises] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    iOwe: 0,
    owedToMe: 0,
  });

  useEffect(() => {
    fetchPromises();
  }, []);

  const fetchPromises = async () => {
    try {
      const response = await fetch("/api/promises?status=pending&limit=10");
      if (response.ok) {
        const data = await response.json();
        const pendingPromises = data.promises || [];

        // Calculate stats
        const now = new Date();
        let overdue = 0;
        let iOwe = 0;
        let owedToMe = 0;

        pendingPromises.forEach((p: Promise) => {
          if (p.due_date && new Date(p.due_date) < now) {
            overdue++;
          }
          // User is promiser (no promiser_contact_id means user made the promise)
          if (!p.promiser_contact_id) {
            iOwe++;
          }
          // User is promisee (no promisee_contact_id means promise was made to user)
          if (!p.promisee_contact_id) {
            owedToMe++;
          }
        });

        setPromises(pendingPromises);
        setStats({
          total: data.total || pendingPromises.length,
          overdue,
          iOwe,
          owedToMe,
        });
      }
    } catch (error) {
      console.error("Failed to fetch promises:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDueStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Overdue", urgent: true };
    if (days === 0) return { text: "Today", urgent: true };
    if (days === 1) return { text: "Tomorrow", urgent: false };
    return { text: `${days}d`, urgent: false };
  };

  return (
    <Card className={cn(stats.overdue > 0 && "border-red-200 dark:border-red-800/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              stats.overdue > 0
                ? "bg-red-100 dark:bg-red-900/50"
                : "bg-rose-100 dark:bg-rose-900/50"
            )}>
              <Handshake className={cn(
                "h-4 w-4",
                stats.overdue > 0 ? "text-red-600" : "text-rose-600"
              )} />
            </div>
            <div>
              <CardTitle className="text-base">Open Promises</CardTitle>
              <CardDescription className="text-xs">
                {stats.total} pending
                {stats.overdue > 0 && (
                  <span className="text-red-600 font-medium"> • {stats.overdue} overdue</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/promises")}
            className="text-rose-600 text-xs"
          >
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : stats.total === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
            <p className="text-sm">All promises fulfilled!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">I owe</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.iOwe}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Owed to me</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.owedToMe}</p>
              </div>
            </div>

            {/* Recent promises */}
            <div className="space-y-1">
              {promises.slice(0, 3).map((promise) => {
                const dueStatus = getDueStatus(promise.due_date);
                return (
                  <div
                    key={promise.id}
                    onClick={() => router.push("/dashboard/promises")}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{promise.promise_text}</p>
                    </div>
                    {dueStatus && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          dueStatus.urgent
                            ? "bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200"
                            : "text-muted-foreground"
                        )}
                      >
                        {dueStatus.text}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// RECENT AUTOMATIONS WIDGET
// =====================================================

interface AutomationLog {
  id: string;
  workflow_name: string;
  status: "success" | "error" | "pending" | "running";
  created_at: string;
}

export function RecentAutomationsWidget() {
  const router = useRouter();
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/automation-logs?limit=5");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        if (data.stats) {
          setStats({
            total: data.stats.total || 0,
            success: data.stats.success || 0,
            error: data.stats.error || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch automation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const statusConfig = {
    success: { color: "bg-green-500", label: "Success" },
    error: { color: "bg-red-500", label: "Error" },
    pending: { color: "bg-amber-500", label: "Pending" },
    running: { color: "bg-blue-500 animate-pulse", label: "Running" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
              <Bot className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Automations</CardTitle>
              <CardDescription className="text-xs">
                {stats.success}/{stats.total} successful
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/automation")}
            className="text-violet-600 text-xs"
          >
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No automations yet</p>
            <p className="text-xs mt-1">n8n workflows will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const config = statusConfig[log.status];
              return (
                <div
                  key={log.id}
                  onClick={() => router.push("/dashboard/automation")}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.workflow_name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(log.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// MEETING INTELLIGENCE QUICK ACTION
// =====================================================

interface MeetingIntelligenceQuickActionProps {
  onOpenSubmitMeeting?: () => void;
}

export function MeetingIntelligenceQuickAction({ onOpenSubmitMeeting }: MeetingIntelligenceQuickActionProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onOpenSubmitMeeting) {
      onOpenSubmitMeeting();
    } else {
      router.push("/dashboard/meetings");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800/50">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">Meeting Intelligence</h3>
            <p className="text-sm text-muted-foreground">Submit meeting transcript for AI analysis</p>
          </div>
          <Button
            onClick={handleClick}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
