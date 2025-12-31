"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
  FileText,
  Mail,
  Calendar,
  MessageSquare,
  Activity,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutomationLog {
  id: string;
  workflow_name: string;
  workflow_type?: string;
  workflow_id?: string;
  status: "success" | "error" | "pending" | "running";
  input_summary?: string;
  output_summary?: string;
  execution_time_ms?: number;
  error_message?: string;
  error_details?: any;
  source_type?: string;
  source_id?: string;
  metadata?: any;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface Stats {
  total: number;
  success: number;
  error: number;
  running: number;
  byType: Record<string, number>;
}

const statusConfig = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
  },
  error: {
    label: "Error",
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  running: {
    label: "Running",
    icon: Loader2,
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
};

const workflowTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  meeting_processor: { icon: Video, label: "Meeting Processor", color: "text-blue-500" },
  briefing_generator: { icon: Mail, label: "Briefing Generator", color: "text-violet-500" },
  daily_briefing: { icon: Calendar, label: "Daily Briefing", color: "text-emerald-500" },
  document_processor: { icon: FileText, label: "Document Processor", color: "text-amber-500" },
  email_processor: { icon: Mail, label: "Email Processor", color: "text-rose-500" },
  notification: { icon: MessageSquare, label: "Notification", color: "text-cyan-500" },
};

export default function AutomationCenterPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, typeFilter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("workflow_type", typeFilter);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/automation-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch automation logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshLogs = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const toggleLogExpanded = (logId: string) => {
    setExpandedLogs({ ...expandedLogs, [logId]: !expandedLogs[logId] });
  };

  const filteredLogs = logs.filter((log) =>
    searchQuery
      ? log.workflow_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.input_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.output_summary?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const successRate = stats && stats.total > 0
    ? Math.round((stats.success / stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Automation Center</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Monitor your n8n workflow executions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refreshLogs}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => window.open("https://upliftcommunities.app.n8n.cloud", "_blank")}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open n8n
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Runs</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-violet-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Success</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats?.success || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Errors</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats?.error || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{successRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Type Breakdown */}
          {stats && Object.keys(stats.byType).length > 0 && (
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Workflow Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const config = workflowTypeConfig[type] || { icon: Zap, label: type, color: "text-slate-500" };
                    const Icon = config.icon;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {config.label}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800/50">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800/50">
                <Zap className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Workflow type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="meeting_processor">Meeting Processor</SelectItem>
                <SelectItem value="briefing_generator">Briefing Generator</SelectItem>
                <SelectItem value="daily_briefing">Daily Briefing</SelectItem>
                <SelectItem value="document_processor">Document Processor</SelectItem>
                <SelectItem value="email_processor">Email Processor</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No automation logs yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Workflow executions will appear here once n8n starts processing
            </p>
            <Button
              onClick={() => window.open("https://upliftcommunities.app.n8n.cloud", "_blank")}
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Configure n8n
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const config = statusConfig[log.status];
              const StatusIcon = config.icon;
              const typeConfig = log.workflow_type
                ? workflowTypeConfig[log.workflow_type]
                : null;
              const TypeIcon = typeConfig?.icon || Zap;
              const isExpanded = expandedLogs[log.id];

              return (
                <Card
                  key={log.id}
                  className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Status icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                        <StatusIcon className={`h-5 w-5 ${config.text} ${log.status === "running" ? "animate-spin" : ""}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {log.workflow_name}
                              </h3>
                              <Badge className={`${config.bg} ${config.text} border-0`}>
                                {config.label}
                              </Badge>
                            </div>
                            {log.input_summary && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {log.input_summary}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {/* Workflow type */}
                          {typeConfig && (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${typeConfig.color} bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full`}>
                              <TypeIcon className="h-3 w-3" />
                              {typeConfig.label}
                            </span>
                          )}

                          {/* Execution time */}
                          {log.execution_time_ms && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
                              <Clock className="h-3 w-3" />
                              {formatDuration(log.execution_time_ms)}
                            </span>
                          )}

                          {/* Source link */}
                          {log.source_type && log.source_id && (
                            <button
                              onClick={() => {
                                if (log.source_type === "meeting") {
                                  router.push(`/dashboard/meetings/${log.source_id}`);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              View {log.source_type}
                            </button>
                          )}

                          {/* Expand/collapse */}
                          {(log.output_summary || log.error_message || log.metadata) && (
                            <button
                              onClick={() => toggleLogExpanded(log.id)}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-auto"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  Show details
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {log.output_summary && (
                              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Output</p>
                                <p className="text-sm text-green-600 dark:text-green-300">
                                  {log.output_summary}
                                </p>
                              </div>
                            )}

                            {log.error_message && (
                              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Error</p>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                  {log.error_message}
                                </p>
                                {log.error_details && (
                                  <pre className="mt-2 text-xs text-red-500 dark:text-red-400 overflow-x-auto">
                                    {JSON.stringify(log.error_details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}

                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-400 mb-1">Metadata</p>
                                <pre className="text-xs text-slate-600 dark:text-slate-300 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.started_at && log.completed_at && (
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span>Started: {new Date(log.started_at).toLocaleString()}</span>
                                <span>Completed: {new Date(log.completed_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
