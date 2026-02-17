"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { ExecutionStatus } from "@/lib/workflow-engine";

interface NodeExecutionState {
  nodeId: string;
  nodeLabel: string;
  status: ExecutionStatus;
  durationMs?: number;
  input?: string;
  output?: string;
  error?: string;
}

interface WorkflowExecutionPanelProps {
  executions: NodeExecutionState[];
  visible: boolean;
}

function getStatusIcon(status: ExecutionStatus) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "cancelled":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Circle className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusBadge(status: ExecutionStatus) {
  const variants: Record<ExecutionStatus, string> = {
    pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    cancelled: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {status}
    </Badge>
  );
}

export function WorkflowExecutionPanel({
  executions,
  visible,
}: WorkflowExecutionPanelProps) {
  if (!visible || executions.length === 0) return null;

  return (
    <Card className="absolute bottom-4 right-4 w-80 z-50 shadow-xl border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Execution Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-64">
          <div className="space-y-1 px-4 pb-4">
            {executions.map((exec) => (
              <div
                key={exec.nodeId}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">{getStatusIcon(exec.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {exec.nodeLabel}
                    </span>
                    {getStatusBadge(exec.status)}
                  </div>
                  {exec.durationMs !== undefined && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exec.durationMs}ms
                    </p>
                  )}
                  {exec.output && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {typeof exec.output === "string"
                        ? exec.output.slice(0, 120)
                        : JSON.stringify(exec.output).slice(0, 120)}
                    </p>
                  )}
                  {exec.error && (
                    <p className="text-xs text-red-500 mt-1">{exec.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export type { NodeExecutionState };
