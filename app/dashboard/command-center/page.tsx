"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SystemHealthGrid,
  ExceptionQueue,
  ExceptionDetail,
} from "@/components/command-center";
import {
  Exception,
  ExceptionEvent,
  SystemHealthSummary,
  HealthStatus,
} from "@/types/command-center";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NetworkOpportunities } from "@/components/contacts/NetworkOpportunities";
import { FollowUpReminders } from "@/components/contacts/FollowUpReminders";

interface HealthResponse {
  overall_status: HealthStatus;
  health: SystemHealthSummary[];
  exceptions: {
    total: number;
    critical: number;
    high: number;
  };
}

interface ExceptionsResponse {
  exceptions: Exception[];
  counts: {
    open: number;
    acknowledged: number;
    in_progress: number;
    resolved: number;
    dismissed: number;
    critical: number;
  };
}

export default function CommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [exceptionsData, setExceptionsData] = useState<ExceptionsResponse | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("active");
  const [selectedException, setSelectedException] = useState<Exception | null>(
    null
  );
  const [exceptionEvents, setExceptionEvents] = useState<ExceptionEvent[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      const [healthRes, exceptionsRes] = await Promise.all([
        fetch("/api/command-center/health"),
        fetch("/api/command-center/exceptions?status=active"),
      ]);

      if (healthRes.ok) {
        const health = await healthRes.json();
        setHealthData(health);
      }

      if (exceptionsRes.ok) {
        const exceptions = await exceptionsRes.json();
        setExceptionsData(exceptions);
      }
    } catch (error) {
      console.error("Error fetching command center data:", error);
      toast.error("Failed to load command center data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExceptionClick = async (exception: Exception) => {
    setSelectedException(exception);
    setDetailOpen(true);

    // Fetch events
    try {
      const response = await fetch(
        `/api/command-center/exceptions/${exception.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setExceptionEvents(data.events || []);
      }
    } catch {
      console.error("Error fetching exception details");
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    const statusParam =
      tab === "active" ? "active" : tab === "resolved" ? "resolved" : "dismissed";

    try {
      const response = await fetch(
        `/api/command-center/exceptions?status=${statusParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setExceptionsData(data);
      }
    } catch {
      console.error("Error fetching exceptions");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallStatus = healthData?.overall_status || "healthy";
  const criticalCount = healthData?.exceptions.critical || 0;
  const totalActive = healthData?.exceptions.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="h-7 w-7" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your systems and handle issues that need attention
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm",
              overallStatus === "healthy" && "bg-green-100 text-green-700",
              overallStatus === "degraded" && "bg-yellow-100 text-yellow-700",
              overallStatus === "unhealthy" && "bg-red-100 text-red-700"
            )}
          >
            {overallStatus === "healthy" && (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {overallStatus === "degraded" && (
              <AlertTriangle className="h-4 w-4" />
            )}
            {overallStatus === "unhealthy" && <XCircle className="h-4 w-4" />}
            {overallStatus === "healthy"
              ? "All Systems Operational"
              : overallStatus === "degraded"
              ? "Degraded Performance"
              : "Issues Detected"}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            criticalCount > 0 && "border-red-300 bg-red-50/50"
          )}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">
                  {exceptionsData?.counts.open || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {exceptionsData?.counts.in_progress || 0}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      {healthData && (
        <SystemHealthGrid
          health={healthData.health}
          overallStatus={healthData.overall_status}
        />
      )}

      {/* Relationship Intelligence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Follow-up Reminders */}
        <FollowUpReminders maxContacts={5} />

        {/* Network Opportunities - AI-powered contact suggestions */}
        <NetworkOpportunities maxProjects={3} />
      </div>

      {/* Exception Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issues & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-2">
                Active
                {totalActive > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-1.5 rounded-full">
                    {totalActive}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              <ExceptionQueue
                exceptions={exceptionsData?.exceptions || []}
                onRefresh={() => fetchData()}
                onExceptionClick={handleExceptionClick}
              />
            </TabsContent>

            <TabsContent value="resolved" className="mt-0">
              <ExceptionQueue
                exceptions={exceptionsData?.exceptions || []}
                onRefresh={() => fetchData()}
                onExceptionClick={handleExceptionClick}
              />
            </TabsContent>

            <TabsContent value="dismissed" className="mt-0">
              <ExceptionQueue
                exceptions={exceptionsData?.exceptions || []}
                onRefresh={() => fetchData()}
                onExceptionClick={handleExceptionClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Exception Detail Modal */}
      <ExceptionDetail
        exception={selectedException}
        events={exceptionEvents}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={() => fetchData()}
      />
    </div>
  );
}
