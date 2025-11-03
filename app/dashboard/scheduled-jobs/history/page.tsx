"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface JobExecution {
  id: string;
  job_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  retry_count: number;
  job: {
    name: string;
    job_type: string;
  };
}

export default function JobHistoryPage() {
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const filters = [
    { id: "all", label: "All Executions" },
    { id: "success", label: "Successful" },
    { id: "failed", label: "Failed" },
    { id: "running", label: "Running" },
  ];

  useEffect(() => {
    fetchExecutions();
  }, []);

  async function fetchExecutions() {
    try {
      const response = await fetch("/api/scheduled-jobs/history");
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error("Error fetching executions:", error);
      toast.error("Failed to load execution history");
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Activity className="h-5 w-5 text-blue-600 animate-pulse" />;
      case "timeout":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  }

  function getStatusBadge(status: string) {
    const variants: { [key: string]: string } = {
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      timeout: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.pending}>
        {status}
      </Badge>
    );
  }

  function formatDuration(durationMs: number | null): string {
    if (!durationMs) return "N/A";

    if (durationMs < 1000) return `${durationMs}ms`;

    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleString();
  }

  const filteredExecutions =
    filter === "all"
      ? executions
      : executions.filter((e) => e.status === filter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/scheduled-jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Execution History</h1>
          <p className="text-muted-foreground">
            View the history of all job executions
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <Badge variant="secondary" className="ml-2">
              {f.id === "all"
                ? executions.length
                : executions.filter((e) => e.status === f.id).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Executions List */}
      {filteredExecutions.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No executions found"
          description={
            filter === "all"
              ? "Job executions will appear here"
              : `No ${filter} executions found`
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredExecutions.map((execution) => (
            <Card key={execution.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {getStatusIcon(execution.status)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {execution.job.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(execution.started_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(execution.status)}
                        <Badge variant="secondary" className="text-xs">
                          {execution.job.job_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {execution.duration_ms !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Duration: {formatDuration(execution.duration_ms)}
                        </span>
                      )}

                      {execution.retry_count > 0 && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-3 w-3" />
                          Retried {execution.retry_count} time
                          {execution.retry_count > 1 ? "s" : ""}
                        </span>
                      )}

                      {execution.status === "running" && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Activity className="h-3 w-3 animate-pulse" />
                          In progress...
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {execution.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                          Error:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                          {execution.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
