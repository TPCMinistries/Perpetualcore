"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
  ChevronRight,
  Bot,
  Workflow,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Execution {
  id: string;
  automationId: string;
  automationName: string;
  automationType: "bot" | "workflow" | "n8n" | "job";
  status: "success" | "failed" | "running" | "pending";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  summary?: string;
  error?: string;
}

export function ExecutionHistory() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/automation/executions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (error) {
      console.error("Error fetching executions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    // Poll for updates
    const interval = setInterval(fetchExecutions, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  const statusConfig = {
    success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
    failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", animate: true },
    pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  };

  const typeIcons = {
    bot: Bot,
    workflow: Workflow,
    n8n: Zap,
    job: Clock,
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bot">Bots</SelectItem>
            <SelectItem value="workflow">Workflows</SelectItem>
            <SelectItem value="n8n">n8n</SelectItem>
            <SelectItem value="job">Jobs</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={fetchExecutions}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {executions.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No executions found</p>
            </div>
          ) : (
            executions.map((execution) => {
              const status = statusConfig[execution.status];
              const StatusIcon = status.icon;
              const TypeIcon = typeIcons[execution.automationType];

              return (
                <div
                  key={execution.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  )}
                >
                  {/* Status indicator */}
                  <div className={cn("p-2 rounded-lg", status.bg)}>
                    <StatusIcon
                      className={cn(
                        "h-5 w-5",
                        status.color,
                        status.animate && "animate-spin"
                      )}
                    />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/dashboard/automation?execution=${execution.id}`}
                        className="font-medium hover:underline truncate"
                      >
                        {execution.automationName}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {execution.automationType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(execution.startedAt), "MMM d, h:mm a")}
                      </span>
                      {execution.duration && (
                        <span>Duration: {formatDuration(execution.duration)}</span>
                      )}
                    </div>
                    {execution.error && (
                      <p className="text-sm text-red-500 mt-1 truncate">
                        {execution.error}
                      </p>
                    )}
                    {execution.summary && !execution.error && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {execution.summary}
                      </p>
                    )}
                  </div>

                  {/* Time ago */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                  </div>

                  {/* Detail link */}
                  <Link href={`/dashboard/automation?execution=${execution.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
