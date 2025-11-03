"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Zap,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScheduledJob {
  id: string;
  name: string;
  description: string;
  cron_expression: string;
  job_type: string;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  next_run_at: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  paused: number;
  total_executions: number;
  success_rate: number;
}

export default function ScheduledJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    paused: 0,
    total_executions: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch("/api/scheduled-jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        calculateStats(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load scheduled jobs");
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(jobsList: ScheduledJob[]) {
    const active = jobsList.filter((j) => j.enabled).length;
    const totalRuns = jobsList.reduce((sum, j) => sum + j.total_runs, 0);
    const successfulRuns = jobsList.reduce((sum, j) => sum + j.successful_runs, 0);
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

    setStats({
      total: jobsList.length,
      active,
      paused: jobsList.length - active,
      total_executions: totalRuns,
      success_rate: successRate,
    });
  }

  async function toggleJob(jobId: string, currentlyEnabled: boolean) {
    setActionLoading(jobId);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      if (response.ok) {
        toast.success(`Job ${!currentlyEnabled ? "enabled" : "paused"}`);
        fetchJobs();
      } else {
        toast.error("Failed to toggle job");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  async function runJobNow(jobId: string, jobName: string) {
    setActionLoading(jobId);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}/run`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success(`Running ${jobName}...`);
        // Wait a bit then refresh to show updated stats
        setTimeout(() => fetchJobs(), 2000);
      } else {
        toast.error("Failed to run job");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteJob(jobId: string, jobName: string) {
    if (!confirm(`Delete "${jobName}"? This cannot be undone.`)) return;

    setActionLoading(jobId);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Job deleted");
        fetchJobs();
      } else {
        toast.error("Failed to delete job");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  function formatCron(cron: string): string {
    const patterns: { [key: string]: string } = {
      "0 * * * *": "Every hour",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
      "0 0 * * *": "Daily at midnight",
      "0 8 * * *": "Daily at 8am",
      "0 9 * * *": "Daily at 9am",
      "0 9 * * 1-5": "Weekdays at 9am",
      "0 17 * * 1-5": "Weekdays at 5pm",
      "0 9 * * 1": "Monday at 9am",
      "0 9 1 * *": "First day of month at 9am",
    };

    return patterns[cron] || cron;
  }

  function formatNextRun(nextRun: string | null): string {
    if (!nextRun) return "Not scheduled";

    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) return "Overdue";
    if (diffMins < 60) return `In ${diffMins} minutes`;
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${diffDays} days`;
  }

  function getSuccessRate(job: ScheduledJob): number {
    if (job.total_runs === 0) return 0;
    return Math.round((job.successful_runs / job.total_runs) * 100);
  }

  function getJobTypeIcon(type: string) {
    switch (type) {
      case "workflow":
        return <Zap className="h-4 w-4" />;
      case "agent":
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  }

  function getJobTypeBadge(type: string) {
    const colors: { [key: string]: string } = {
      workflow: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      agent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      custom: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };

    return (
      <Badge variant="outline" className={colors[type] || colors.custom}>
        {type}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 p-8 border border-orange-100 dark:border-orange-900/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 flex items-center justify-center shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-900 via-amber-800 to-yellow-900 dark:from-orange-100 dark:via-amber-100 dark:to-yellow-100 bg-clip-text text-transparent">
                Scheduled Jobs
              </h1>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Automate tasks with intelligent cron-based scheduling
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              asChild
              className="bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 border-orange-200 dark:border-orange-800"
            >
              <Link href="/dashboard/scheduled-jobs/templates">
                <Plus className="mr-2 h-4 w-4" />
                Browse Templates
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 border-orange-200 dark:border-orange-800"
            >
              <Link href="/dashboard/scheduled-jobs/history">
                <Activity className="mr-2 h-4 w-4" />
                Execution History
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-3 shadow-sm">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Total Jobs</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3 shadow-sm">
                <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Active Jobs</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-100 dark:border-yellow-900/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mb-3 shadow-sm">
                <Pause className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Paused Jobs</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats.paused}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-100 dark:border-purple-900/20 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-3 shadow-sm">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Total Executions</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.total_executions}</p>
            </div>
          </div>
        </Card>

        <Card className={`p-6 bg-gradient-to-br border hover:shadow-lg transition-all duration-300 ${
          stats.success_rate >= 90
            ? "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-100 dark:border-emerald-900/20"
            : stats.success_rate >= 70
            ? "from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-100 dark:border-yellow-900/20"
            : "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-100 dark:border-red-900/20"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 shadow-sm ${
                stats.success_rate >= 90
                  ? "bg-emerald-100 dark:bg-emerald-900/40"
                  : stats.success_rate >= 70
                  ? "bg-yellow-100 dark:bg-yellow-900/40"
                  : "bg-red-100 dark:bg-red-900/40"
              }`}>
                <TrendingUp className={`h-6 w-6 ${
                  stats.success_rate >= 90
                    ? "text-emerald-600 dark:text-emerald-400"
                    : stats.success_rate >= 70
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`} />
              </div>
              <p className={`text-sm font-medium ${
                stats.success_rate >= 90
                  ? "text-emerald-700 dark:text-emerald-300"
                  : stats.success_rate >= 70
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-red-700 dark:text-red-300"
              }`}>Success Rate</p>
              <p className={`text-3xl font-bold mt-1 ${
                stats.success_rate >= 90
                  ? "text-emerald-900 dark:text-emerald-100"
                  : stats.success_rate >= 70
                  ? "text-yellow-900 dark:text-yellow-100"
                  : "text-red-900 dark:text-red-100"
              }`}>
                {stats.success_rate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Job Templates Suggestions */}
      {jobs.length === 0 && (
        <Card className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100">
                Popular Job Templates
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Get started quickly with pre-configured automation templates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/scheduled-jobs/templates?template=daily-summary">
              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:shadow-lg group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      Daily Summary Report
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Generate and email daily activity summaries every morning at 9am
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Clock className="h-3 w-3" />
                  <span>Daily at 9am</span>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/scheduled-jobs/templates?template=weekly-backup">
              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:shadow-lg group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      Data Sync & Backup
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Automatically sync and backup your data every Sunday at midnight
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Clock className="h-3 w-3" />
                  <span>Weekly on Sunday</span>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/scheduled-jobs/templates?template=hourly-monitor">
              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:shadow-lg group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      System Health Monitor
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Check system health and alert on issues every hour
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Clock className="h-3 w-3" />
                  <span>Every hour</span>
                </div>
              </Card>
            </Link>
          </div>
        </Card>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No scheduled jobs yet"
          description="Create automated tasks that run on a schedule"
          action={{
            label: "Browse Templates",
            href: "/dashboard/scheduled-jobs/templates",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`hover:shadow-lg transition-all duration-300 ${
                job.enabled
                  ? "border-orange-200 dark:border-orange-900/40 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/10"
                  : "opacity-60 border-gray-200 dark:border-gray-800"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        job.job_type === "workflow"
                          ? "bg-purple-100 dark:bg-purple-900/40"
                          : job.job_type === "agent"
                          ? "bg-blue-100 dark:bg-blue-900/40"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {getJobTypeIcon(job.job_type)}
                      </div>
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 ml-10">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {job.enabled ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                        Paused
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Type and Schedule */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getJobTypeBadge(job.job_type)}
                    <span className="text-muted-foreground">
                      {formatCron(job.cron_expression)}
                    </span>
                  </div>
                  {job.enabled && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatNextRun(job.next_run_at)}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {job.total_runs > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {job.successful_runs} successful
                      </span>
                      {job.failed_runs > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {job.failed_runs} failed
                        </span>
                      )}
                    </div>
                    <span className={`font-medium ${
                      getSuccessRate(job) >= 90 ? "text-green-600" :
                      getSuccessRate(job) >= 70 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {getSuccessRate(job)}% success
                    </span>
                  </div>
                )}

                {/* Last Run */}
                {job.last_run_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Last run:</span>
                    <span>{new Date(job.last_run_at).toLocaleString()}</span>
                    {job.last_run_status && (
                      <Badge
                        variant="outline"
                        className={
                          job.last_run_status === "success"
                            ? "border-green-600 text-green-600"
                            : "border-red-600 text-red-600"
                        }
                      >
                        {job.last_run_status}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-orange-100 dark:border-orange-900/20">
                  <Button
                    size="sm"
                    variant={job.enabled ? "outline" : "default"}
                    onClick={() => toggleJob(job.id, job.enabled)}
                    disabled={actionLoading === job.id}
                    className={job.enabled
                      ? "hover:bg-orange-50 dark:hover:bg-orange-950/40 border-orange-200 dark:border-orange-900/40"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    }
                  >
                    {job.enabled ? (
                      <>
                        <Pause className="mr-2 h-3 w-3" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-3 w-3" />
                        Enable
                      </>
                    )}
                  </Button>

                  {job.enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runJobNow(job.id, job.name)}
                      disabled={actionLoading === job.id}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-800"
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Run Now
                    </Button>
                  )}

                  <div className="flex-1"></div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteJob(job.id, job.name)}
                    disabled={actionLoading === job.id}
                    className="hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
