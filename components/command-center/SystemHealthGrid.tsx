"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SystemHealthSummary,
  HealthStatus,
  getHealthColor,
  getAreaLabel,
} from "@/types/command-center";
import { CheckCircle2, AlertTriangle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemHealthGridProps {
  health: SystemHealthSummary[];
  overallStatus: HealthStatus;
}

function StatusIcon({ status }: { status: HealthStatus }) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "unhealthy":
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function OverallStatusBadge({ status }: { status: HealthStatus }) {
  const colors = {
    healthy: "bg-green-500 text-white",
    degraded: "bg-yellow-500 text-white",
    unhealthy: "bg-red-500 text-white",
  };

  const labels = {
    healthy: "All Systems Operational",
    degraded: "Degraded Performance",
    unhealthy: "System Issues Detected",
  };

  return (
    <Badge className={cn("text-sm px-3 py-1", colors[status])}>
      <StatusIcon status={status} />
      <span className="ml-2">{labels[status]}</span>
    </Badge>
  );
}

export function SystemHealthGrid({
  health,
  overallStatus,
}: SystemHealthGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </h2>
        <OverallStatusBadge status={overallStatus} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {health.map((item) => (
          <Card
            key={item.area}
            className={cn(
              "transition-colors",
              item.status === "healthy" && "border-green-200",
              item.status === "degraded" && "border-yellow-200 bg-yellow-50/50",
              item.status === "unhealthy" && "border-red-200 bg-red-50/50"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{getAreaLabel(item.area)}</span>
                <StatusIcon status={item.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span
                    className={cn(
                      "font-medium",
                      item.success_rate >= 99 && "text-green-600",
                      item.success_rate >= 95 &&
                        item.success_rate < 99 &&
                        "text-yellow-600",
                      item.success_rate < 95 && "text-red-600"
                    )}
                  >
                    {item.success_rate}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Operations</span>
                  <span>{item.total_operations}</span>
                </div>
                {item.failed_operations > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="text-red-600">{item.failed_operations}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
