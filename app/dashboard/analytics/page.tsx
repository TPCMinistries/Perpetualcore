"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  MessageSquare,
  FileText,
  Mail,
  MessageCircle,
  Calendar,
  Loader2,
  Flame,
  CheckCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  overview: {
    conversations: number;
    messages: number;
    documents: number;
    tasks: number;
    completedTasks: number;
    emails: number;
    whatsappMessages: number;
    notifications: number;
    storageBytes: number;
  };
  activity: Array<{
    date: string;
    messages: number;
    tasks: number;
    completedTasks: number;
    documents: number;
  }>;
  ai: {
    totalAIMessages: number;
    aiWhatsAppMessages: number;
    emailAIActions: number;
    aiNotifications: number;
    totalAIInteractions: number;
  };
  productivity: {
    taskCompletionRate: number;
    avgResponseTimeMs: number;
    mostActiveHour: number;
    currentStreak: number;
  };
  integrations: {
    email: { connected: boolean; count: number };
    calendar: { connected: boolean; count: number };
    whatsapp: { connected: boolean; count: number };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?type=all&period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p>Failed to load analytics</p>
      </div>
    );
  }

  const maxActivityValue = Math.max(
    ...data.activity.map(
      (d) => d.messages + d.tasks + d.completedTasks + d.documents
    ),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Insights into your productivity and AI usage
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("7d")}
              className={period === "7d" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
            >
              7 Days
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("30d")}
              className={period === "30d" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
            >
              30 Days
            </Button>
            <Button
              variant={period === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("90d")}
              className={period === "90d" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
            >
              90 Days
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {data.overview.conversations}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Messages</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {data.overview.messages}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Documents</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {data.overview.documents}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tasks Completed</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {data.overview.completedTasks}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-slate-900 dark:text-slate-100">Activity Over Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {data.activity.map((day, index) => {
              const total =
                day.messages + day.tasks + day.completedTasks + day.documents;
              const height = (total / maxActivityValue) * 100;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-lg border border-slate-700">
                    <div className="font-semibold mb-1">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div>Messages: {day.messages}</div>
                    <div>Tasks: {day.tasks}</div>
                    <div>Documents: {day.documents}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full bg-blue-600 dark:bg-blue-500 rounded-t hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors cursor-pointer"
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      minHeight: total > 0 ? "4px" : "0",
                    }}
                  ></div>

                  {/* Date label (show every 7th day) */}
                  {index % 7 === 0 && (
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 transform rotate-45 origin-left font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">AI Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chat Messages</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.ai.totalAIMessages}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Replies</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.ai.aiWhatsAppMessages}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email AI Actions</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.ai.emailAIActions}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Notifications</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.ai.aiNotifications}</span>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Total AI Interactions</span>
                  <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {data.ai.totalAIInteractions}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Insights */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">Productivity Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Task Completion Rate
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {data.productivity.taskCompletionRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${data.productivity.taskCompletionRate}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Avg Response Time</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatTime(data.productivity.avgResponseTimeMs)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Most Active Hour</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {data.productivity.mostActiveHour}:00
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Current Streak</span>
                </div>
                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {data.productivity.currentStreak} days
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status & Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">Integration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Email</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {data.integrations.email.count} account
                      {data.integrations.email.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {data.integrations.email.connected ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Calendar</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {data.integrations.calendar.count} account
                      {data.integrations.calendar.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {data.integrations.calendar.connected ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">WhatsApp</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {data.integrations.whatsapp.count} account
                      {data.integrations.whatsapp.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {data.integrations.whatsapp.connected ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">Additional Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Emails</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.overview.emails}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Messages</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {data.overview.whatsappMessages}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{data.overview.notifications}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Storage Used</span>
                <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {formatBytes(data.overview.storageBytes)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
