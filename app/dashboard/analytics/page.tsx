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
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";
import { motion } from "framer-motion";

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
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/analytics?type=all&period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <DashboardPageWrapper>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </DashboardPageWrapper>
    );
  }

  if (!data) {
    return (
      <DashboardPageWrapper>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load analytics</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fetchAnalytics()}
          >
            Try Again
          </Button>
        </div>
      </DashboardPageWrapper>
    );
  }

  const maxActivityValue = Math.max(
    ...data.activity.map(
      (d) => d.messages + d.tasks + d.completedTasks + d.documents
    ),
    1
  );

  return (
    <DashboardPageWrapper>
      {/* Header */}
      <DashboardHeader
        title="Analytics"
        subtitle="Insights into your productivity and AI usage"
        icon={BarChart3}
        iconColor="blue"
        actions={[
          {
            label: refreshing ? "Refreshing..." : "Refresh",
            icon: RefreshCw,
            onClick: () => fetchAnalytics(true),
            variant: "outline",
          },
        ]}
      >
        {/* Period Filter */}
        <div className="mt-4">
          <FilterPills
            options={[
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "90d", label: "90 Days" },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </div>
      </DashboardHeader>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatCardGrid columns={4} className="mb-8">
          <StatCard
            label="Conversations"
            value={data.overview.conversations}
            icon={MessageSquare}
            iconColor="blue"
          />
          <StatCard
            label="Messages"
            value={data.overview.messages}
            icon={Activity}
            iconColor="violet"
          />
          <StatCard
            label="Documents"
            value={data.overview.documents}
            icon={FileText}
            iconColor="indigo"
          />
          <StatCard
            label="Tasks Completed"
            value={data.overview.completedTasks}
            icon={CheckCircle2}
            iconColor="emerald"
          />
        </StatCardGrid>
      </motion.div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-8 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">Activity Over Time</span>
                <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  Messages, tasks, and documents
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        Messages: {day.messages}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Tasks: {day.tasks}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Documents: {day.documents}
                      </div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                    </div>

                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 2)}%` }}
                      transition={{ delay: index * 0.02, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-violet-600 to-purple-500 rounded-t hover:from-violet-500 hover:to-purple-400 transition-colors cursor-pointer shadow-sm"
                      style={{
                        minHeight: total > 0 ? "4px" : "0",
                      }}
                    />

                    {/* Date label (show every 7th day) */}
                    {index % 7 === 0 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 transform rotate-45 origin-left font-medium">
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* AI Usage */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">AI Usage</span>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Your AI interactions
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chat Messages</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.ai.totalAIMessages}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Replies</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.ai.aiWhatsAppMessages}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email AI Actions</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.ai.emailAIActions}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Notifications</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.ai.aiNotifications}</span>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 rounded-xl border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Total AI Interactions</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {data.ai.totalAIInteractions}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Productivity Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Productivity</span>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Your performance metrics
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Task Completion Rate
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {data.productivity.taskCompletionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.productivity.taskCompletionRate}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Avg Response Time</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatTime(data.productivity.avgResponseTimeMs)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Most Active Hour</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {data.productivity.mostActiveHour}:00
                  </span>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">Current Streak</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {data.productivity.currentStreak} days
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CheckCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Integrations</span>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Connected services
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[
                  { key: 'email', icon: Mail, label: 'Email', color: 'blue' },
                  { key: 'calendar', icon: Calendar, label: 'Calendar', color: 'indigo' },
                  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'emerald' },
                ].map((integration) => {
                  const integrationData = data.integrations[integration.key as keyof typeof data.integrations];
                  return (
                    <div
                      key={integration.key}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-${integration.color}-100 dark:bg-${integration.color}-900/30 flex items-center justify-center`}>
                          <integration.icon className={`h-5 w-5 text-${integration.color}-600 dark:text-${integration.color}-400`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{integration.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {integrationData.count} account{integrationData.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      {integrationData.connected ? (
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/25">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Additional Metrics</span>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    Other activity stats
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Emails</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.overview.emails}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Messages</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {data.overview.whatsappMessages}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.overview.notifications}</span>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Storage Used</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatBytes(data.overview.storageBytes)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardPageWrapper>
  );
}
