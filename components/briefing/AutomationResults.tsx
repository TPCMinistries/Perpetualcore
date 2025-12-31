"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bot,
  Workflow,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AutomationResult {
  id: string;
  name: string;
  type: "bot" | "workflow" | "n8n" | "job";
  status: "success" | "failed" | "running";
  completedAt?: string;
  summary?: string;
}

interface AutomationResultsProps {
  results: AutomationResult[];
}

const typeConfig = {
  bot: { icon: Bot, label: "Bot" },
  workflow: { icon: Workflow, label: "Workflow" },
  n8n: { icon: Zap, label: "n8n" },
  job: { icon: Clock, label: "Job" },
};

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", animate: true },
};

export function AutomationResults({ results }: AutomationResultsProps) {
  const recentResults = results.slice(0, 5);
  const failedCount = results.filter(r => r.status === "failed").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            Automation Results
            {failedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {failedCount} failed
              </Badge>
            )}
          </CardTitle>
          <Link href="/dashboard/automation">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentResults.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No automations have run recently
          </p>
        ) : (
          <div className="space-y-2">
            {recentResults.map((result) => {
              const type = typeConfig[result.type];
              const status = statusConfig[result.status];
              const StatusIcon = status.icon;
              const TypeIcon = type.icon;

              return (
                <div
                  key={result.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${status.bg}`}
                >
                  <StatusIcon
                    className={`h-4 w-4 ${status.color} ${status.animate ? "animate-spin" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {result.name}
                      </span>
                    </div>
                    {result.summary && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.summary}
                      </p>
                    )}
                  </div>
                  {result.completedAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(result.completedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
