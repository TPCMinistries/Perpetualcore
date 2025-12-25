"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Exception,
  getSeverityColor,
  getStatusColor,
  getSourceLabel,
} from "@/types/command-center";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bot,
  Workflow,
  Plug,
  Webhook,
  FileText,
  Server,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExceptionQueueProps {
  exceptions: Exception[];
  onRefresh: () => void;
  onExceptionClick: (exception: Exception) => void;
}

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case "agent":
      return <Bot className="h-4 w-4" />;
    case "workflow":
      return <Workflow className="h-4 w-4" />;
    case "integration":
      return <Plug className="h-4 w-4" />;
    case "webhook":
      return <Webhook className="h-4 w-4" />;
    case "work_item":
      return <FileText className="h-4 w-4" />;
    case "system":
      return <Server className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

export function ExceptionQueue({
  exceptions,
  onRefresh,
  onExceptionClick,
}: ExceptionQueueProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleQuickAction = async (
    e: React.MouseEvent,
    exception: Exception,
    action: "acknowledge" | "resolve" | "dismiss"
  ) => {
    e.stopPropagation();
    setActionLoading(`${exception.id}-${action}`);

    try {
      const statusMap = {
        acknowledge: "acknowledged",
        resolve: "resolved",
        dismiss: "dismissed",
      };

      const response = await fetch(
        `/api/command-center/exceptions/${exception.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusMap[action] }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      toast.success(
        action === "acknowledge"
          ? "Exception acknowledged"
          : action === "resolve"
          ? "Exception resolved"
          : "Exception dismissed"
      );
      onRefresh();
    } catch {
      toast.error("Failed to update exception");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (e: React.MouseEvent, exception: Exception) => {
    e.stopPropagation();
    if (!exception.can_retry) return;

    setActionLoading(`${exception.id}-retry`);

    try {
      const response = await fetch(
        `/api/command-center/exceptions/${exception.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        }
      );

      if (!response.ok) throw new Error("Failed to retry");

      toast.success("Retrying operation...");
      onRefresh();
    } catch {
      toast.error("Failed to retry");
    } finally {
      setActionLoading(null);
    }
  };

  if (exceptions.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-700">
            No Active Exceptions
          </h3>
          <p className="text-sm text-green-600 mt-1">
            All systems are running smoothly
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {exceptions.map((exception) => {
        const isLoading = actionLoading?.startsWith(exception.id);

        return (
          <Card
            key={exception.id}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              exception.severity === "critical" && "border-red-300 bg-red-50/50",
              exception.severity === "high" && "border-orange-300 bg-orange-50/30"
            )}
            onClick={() => onExceptionClick(exception)}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                {/* Source Icon */}
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    exception.severity === "critical"
                      ? "bg-red-100 text-red-600"
                      : exception.severity === "high"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <SourceIcon source={exception.source_type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {exception.title}
                    </h4>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  {exception.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {exception.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-4",
                        getSeverityColor(exception.severity)
                      )}
                    >
                      {exception.severity}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-4",
                        getStatusColor(exception.status)
                      )}
                    >
                      {exception.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(exception.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {getSourceLabel(exception.source_type)}
                      {exception.source_name && `: ${exception.source_name}`}
                    </span>
                  </div>

                  {/* AI Suggestion */}
                  {exception.ai_suggested_resolution && (
                    <div className="mt-2 p-2 rounded bg-blue-50 text-blue-700 text-xs">
                      <span className="font-medium">AI Suggestion:</span>{" "}
                      {exception.ai_suggested_resolution}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {exception.can_retry && exception.status !== "resolved" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleRetry(e, exception)}
                      disabled={isLoading}
                      title="Retry"
                    >
                      {actionLoading === `${exception.id}-retry` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}

                  {exception.status === "open" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleQuickAction(e, exception, "acknowledge")}
                      disabled={isLoading}
                      title="Acknowledge"
                    >
                      {actionLoading === `${exception.id}-acknowledge` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}

                  {exception.status !== "resolved" &&
                    exception.status !== "dismissed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        onClick={(e) => handleQuickAction(e, exception, "dismiss")}
                        disabled={isLoading}
                        title="Dismiss"
                      >
                        {actionLoading === `${exception.id}-dismiss` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
