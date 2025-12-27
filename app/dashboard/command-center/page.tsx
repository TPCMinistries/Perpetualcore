"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { CommandCenterMode, DailyCommandSummary, ExecutivePriority, DeadlineItem, RiskLevel } from "@/types/executive-center";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Activity,
  Crown,
  Monitor,
  Target,
  FileCheck,
  Users,
  TrendingUp,
  Brain,
  Zap,
  CalendarDays,
  AlertCircle,
  ChevronRight,
  Briefcase,
  DollarSign,
  BarChart3,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NetworkOpportunities } from "@/components/contacts/NetworkOpportunities";
import { FollowUpReminders } from "@/components/contacts/FollowUpReminders";
import { createClient } from "@/lib/supabase/client";

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
  const [exceptionsData, setExceptionsData] = useState<ExceptionsResponse | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [exceptionEvents, setExceptionEvents] = useState<ExceptionEvent[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  // Executive Mode State
  const [mode, setMode] = useState<CommandCenterMode>("executive");
  const [isAdmin, setIsAdmin] = useState(false);
  const [executiveTab, setExecutiveTab] = useState<string>("daily");

  // Check if user is admin for executive mode access
  useEffect(() => {
    async function checkAdminStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_role, is_super_admin")
        .eq("id", user.id)
        .single();

      if (profile) {
        const hasAdminAccess = profile.is_super_admin ||
          ["admin", "manager"].includes(profile.user_role || "");
        setIsAdmin(hasAdminAccess);
        // Default to executive mode for admins
        if (hasAdminAccess) {
          setMode("executive");
        } else {
          setMode("system");
        }
      }
      setLoading(false);
    }
    checkAdminStatus();
  }, []);

  const fetchSystemData = useCallback(async (showRefresh = false) => {
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "system") {
      fetchSystemData();
      // Poll every 30 seconds for system mode
      const interval = setInterval(() => fetchSystemData(), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchSystemData, mode]);

  const handleExceptionClick = async (exception: Exception) => {
    setSelectedException(exception);
    setDetailOpen(true);

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

  const handleSystemTabChange = async (tab: string) => {
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
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {mode === "executive" ? (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Crown className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {mode === "executive" ? "Executive Command Center" : "System Command Center"}
              </h1>
              <p className="text-muted-foreground">
                {mode === "executive"
                  ? "Your daily operational dashboard for strategic decisions"
                  : "Monitor systems and handle issues that need attention"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle - Only show if admin */}
          {isAdmin && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
              <button
                onClick={() => setMode("executive")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === "executive"
                    ? "bg-white dark:bg-slate-800 text-orange-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Crown className="h-4 w-4" />
                Executive
              </button>
              <button
                onClick={() => setMode("system")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === "system"
                    ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="h-4 w-4" />
                System
              </button>
            </div>
          )}

          {/* System Mode Status/Refresh */}
          {mode === "system" && (
            <>
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm",
                  overallStatus === "healthy" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  overallStatus === "degraded" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                  overallStatus === "unhealthy" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {overallStatus === "healthy" && <CheckCircle2 className="h-4 w-4" />}
                {overallStatus === "degraded" && <AlertTriangle className="h-4 w-4" />}
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
                onClick={() => fetchSystemData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Executive Mode Content */}
      {mode === "executive" && (
        <ExecutiveDashboard
          activeTab={executiveTab}
          onTabChange={setExecutiveTab}
        />
      )}

      {/* System Mode Content */}
      {mode === "system" && (
        <>
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

            <Card className={cn(criticalCount > 0 && "border-red-300 bg-red-50/50 dark:bg-red-950/20")}>
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
                    <p className="text-2xl font-bold">{exceptionsData?.counts.open || 0}</p>
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
                    <p className="text-2xl font-bold">{exceptionsData?.counts.in_progress || 0}</p>
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
            <FollowUpReminders maxContacts={5} />
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
              <Tabs value={activeTab} onValueChange={handleSystemTabChange}>
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
                    onRefresh={() => fetchSystemData()}
                    onExceptionClick={handleExceptionClick}
                  />
                </TabsContent>

                <TabsContent value="resolved" className="mt-0">
                  <ExceptionQueue
                    exceptions={exceptionsData?.exceptions || []}
                    onRefresh={() => fetchSystemData()}
                    onExceptionClick={handleExceptionClick}
                  />
                </TabsContent>

                <TabsContent value="dismissed" className="mt-0">
                  <ExceptionQueue
                    exceptions={exceptionsData?.exceptions || []}
                    onRefresh={() => fetchSystemData()}
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
            onUpdate={() => fetchSystemData()}
          />
        </>
      )}
    </div>
  );
}

// =====================================================
// EXECUTIVE DASHBOARD COMPONENT
// =====================================================

interface ExecutiveDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function ExecutiveDashboard({ activeTab, onTabChange }: ExecutiveDashboardProps) {
  const modules = [
    { id: "daily", label: "Daily View", icon: Target, color: "text-orange-500" },
    { id: "decisions", label: "Decisions", icon: FileCheck, color: "text-blue-500" },
    { id: "people", label: "People & Tasks", icon: Users, color: "text-green-500" },
    { id: "opportunities", label: "Opportunities", icon: TrendingUp, color: "text-purple-500" },
    { id: "memory", label: "Notes & Memory", icon: Brain, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50 w-fit">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onTabChange(module.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === module.id
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <module.icon className={cn("h-4 w-4", activeTab === module.id && module.color)} />
            {module.label}
          </button>
        ))}
      </div>

      {/* Module Content */}
      {activeTab === "daily" && <DailyCommandView />}
      {activeTab === "decisions" && <DecisionInbox />}
      {activeTab === "people" && <PeopleAndTasks />}
      {activeTab === "opportunities" && <OpportunitiesTracker />}
      {activeTab === "memory" && <NotesAndMemory />}
    </div>
  );
}

// =====================================================
// DAILY COMMAND VIEW (Module 1)
// =====================================================

function DailyCommandView() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DailyCommandSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/executive/daily-view");
      if (!response.ok) {
        throw new Error("Failed to fetch daily view data");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Error fetching daily view:", err);
      setError("Failed to load daily command data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={() => fetchDailyData()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const priorities = data?.priorities || [];
  const pendingDecisions = data?.pending_decisions || 0;
  const urgentDecisions = data?.urgent_decisions || 0;
  const activeOpportunities = data?.active_opportunities || 0;
  const taskHealthIssues = data?.task_health_issues || 0;
  const riskLevel = data?.risk_level;
  const deadlines7Days = data?.deadlines_7_days || [];
  const deadlines30Days = data?.deadlines_30_days || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Command Center</h2>
        <p className="text-muted-foreground">Your daily executive briefing</p>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Priorities</p>
                <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{priorities.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active items</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Decisions</p>
                <p className="text-3xl font-bold">{pendingDecisions}</p>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold">{deadlines7Days.length}</p>
                <p className="text-xs text-muted-foreground">Deadlines approaching</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(taskHealthIssues > 0 && "border-amber-200 dark:border-amber-800/50")}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className={cn("text-3xl font-bold", taskHealthIssues > 0 && "text-amber-600")}>{taskHealthIssues}</p>
                <p className="text-xs text-muted-foreground">Items flagged</p>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                taskHealthIssues > 0 ? "bg-amber-100 dark:bg-amber-900/50" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <AlertTriangle className={cn("h-5 w-5", taskHealthIssues > 0 ? "text-amber-600" : "text-gray-600")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Priorities (2/3 width) */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                  <div>
                    <CardTitle className="text-lg">Today's Priorities</CardTitle>
                    <CardDescription>Focus on what matters most</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-600">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priorities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No priorities set for today</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Add Priority
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {priorities.slice(0, 5).map((priority, idx) => (
                    <div
                      key={priority.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-700 dark:text-cyan-400 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{priority.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {priority.source_type && <span className="capitalize">{priority.source_type}</span>}
                          {priority.source_type && " • "}
                          Self
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {priority.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          {deadlines7Days.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                    <CardDescription>Next 7 days</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deadlines7Days.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          item.days_until_due <= 1 ? "bg-red-500" : item.days_until_due <= 3 ? "bg-amber-500" : "bg-green-500"
                        )} />
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        item.days_until_due <= 1 && "border-red-500 text-red-600",
                        item.days_until_due === 0 && "bg-red-50 dark:bg-red-950/30"
                      )}>
                        {item.days_until_due === 0 ? "Today" : item.days_until_due === 1 ? "Tomorrow" : `${item.days_until_due} days`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar Cards (1/3 width) */}
        <div className="space-y-4">
          {/* Decision Inbox Quick View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-base">Decision Inbox</CardTitle>
                    <CardDescription className="text-xs">{pendingDecisions} pending</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 text-xs">
                  Open <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingDecisions === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
              ) : (
                <div className="space-y-2">
                  {urgentDecisions > 0 && (
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">{urgentDecisions} urgent</p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">Require immediate attention</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full">
                    View All Decisions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunities Quick View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle className="text-base">Opportunities</CardTitle>
                    <CardDescription className="text-xs">{activeOpportunities} active</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-600 text-xs">
                  Open <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeOpportunities === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active opportunities</p>
              ) : (
                <Button variant="outline" size="sm" className="w-full">
                  View Pipeline
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Risk Level */}
          {riskLevel && (
            <Card className={cn(
              riskLevel === "critical" && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
              riskLevel === "high" && "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20"
            )}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn(
                    "h-8 w-8",
                    riskLevel === "critical" && "text-red-500",
                    riskLevel === "high" && "text-orange-500",
                    riskLevel === "medium" && "text-yellow-500",
                    riskLevel === "low" && "text-green-500"
                  )} />
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className={cn(
                      "font-semibold capitalize",
                      riskLevel === "critical" && "text-red-600",
                      riskLevel === "high" && "text-orange-600",
                      riskLevel === "medium" && "text-yellow-600",
                      riskLevel === "low" && "text-green-600"
                    )}>{riskLevel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-orange-200 dark:border-orange-800/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Decisions</p>
                <p className="text-3xl font-bold text-orange-600">{pendingDecisions}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(urgentDecisions > 0 && "border-red-300 dark:border-red-800/50")}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className={cn("text-3xl font-bold", urgentDecisions > 0 ? "text-red-600" : "")}>{urgentDecisions}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", urgentDecisions > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}>
                <AlertCircle className={cn("h-6 w-6", urgentDecisions > 0 ? "text-red-600" : "text-muted-foreground")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
                <p className="text-3xl font-bold text-purple-600">{activeOpportunities}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(taskHealthIssues > 0 && "border-amber-300 dark:border-amber-800/50")}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Task Issues</p>
                <p className={cn("text-3xl font-bold", taskHealthIssues > 0 ? "text-amber-600" : "")}>{taskHealthIssues}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", taskHealthIssues > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted")}>
                <Users className={cn("h-6 w-6", taskHealthIssues > 0 ? "text-amber-600" : "text-muted-foreground")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Priorities Column */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Today's Priorities
              </CardTitle>
              <CardDescription>Your top 5 focus areas for today</CardDescription>
            </CardHeader>
            <CardContent>
              {priorities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No priorities set for today</p>
                  <p className="text-sm mt-1">Add priorities manually or let AI suggest them</p>
                  <Button variant="outline" className="mt-4">
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Priorities
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {priorities.map((priority, index) => (
                    <div
                      key={priority.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-bold text-orange-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{priority.title}</p>
                        {priority.description && (
                          <p className="text-sm text-muted-foreground">{priority.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadlines Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Next 7 and 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {deadlines7Days.length === 0 && deadlines30Days.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No upcoming deadlines</p>
                  <p className="text-sm mt-1">Deadlines from tasks and opportunities will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Next 7 Days */}
                  {deadlines7Days.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Next 7 Days ({deadlines7Days.length})
                      </h4>
                      <div className="space-y-2">
                        {deadlines7Days.map((item) => (
                          <DeadlineRow key={item.id} item={item} urgent />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next 30 Days */}
                  {deadlines30Days.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        8-30 Days ({deadlines30Days.length})
                      </h4>
                      <div className="space-y-2">
                        {deadlines30Days.slice(0, 5).map((item) => (
                          <DeadlineRow key={item.id} item={item} />
                        ))}
                        {deadlines30Days.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            + {deadlines30Days.length - 5} more deadlines
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Risk Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                What's at Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!riskLevel || riskLevel === "low" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-75" />
                  <p className="font-medium text-green-600">All Clear</p>
                  <p className="text-sm mt-1">No significant risks detected</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className={cn(
                    "h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                    riskLevel === "critical" && "bg-red-100 dark:bg-red-900/30",
                    riskLevel === "high" && "bg-orange-100 dark:bg-orange-900/30",
                    riskLevel === "medium" && "bg-yellow-100 dark:bg-yellow-900/30"
                  )}>
                    <AlertTriangle className={cn(
                      "h-8 w-8",
                      riskLevel === "critical" && "text-red-600",
                      riskLevel === "high" && "text-orange-600",
                      riskLevel === "medium" && "text-yellow-600"
                    )} />
                  </div>
                  <p className={cn(
                    "font-semibold text-lg capitalize",
                    riskLevel === "critical" && "text-red-600",
                    riskLevel === "high" && "text-orange-600",
                    riskLevel === "medium" && "text-yellow-600"
                  )}>
                    {riskLevel} Risk Level
                  </p>
                  <Button variant="link" size="sm" className="mt-2">
                    View Analysis <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Decisions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-500" />
                Decisions Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDecisions === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No pending decisions</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{pendingDecisions}</div>
                  <p className="text-muted-foreground">decisions awaiting your input</p>
                  {urgentDecisions > 0 && (
                    <Badge variant="destructive" className="mt-3">
                      {urgentDecisions} urgent
                    </Badge>
                  )}
                  <Button variant="link" size="sm" className="mt-2 block mx-auto">
                    View Inbox <ChevronRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Target className="h-4 w-4" />
                Add Priority
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileCheck className="h-4 w-4" />
                New Decision
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="h-4 w-4" />
                Log Opportunity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for deadline rows
function DeadlineRow({ item, urgent = false }: { item: DeadlineItem; urgent?: boolean }) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  const typeIcons: Record<string, typeof Briefcase> = {
    task: Activity,
    opportunity: TrendingUp,
    decision: FileCheck,
    project: Briefcase,
  };

  const Icon = typeIcons[item.source_type] || Activity;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
      urgent && item.days_until_due <= 2 && "border-red-200 dark:border-red-800/50"
    )}>
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {item.days_until_due === 0 && " (Today)"}
          {item.days_until_due === 1 && " (Tomorrow)"}
          {item.days_until_due > 1 && ` (${item.days_until_due} days)`}
        </p>
      </div>
      <Badge variant="secondary" className={cn("text-xs", priorityColors[item.priority])}>
        {item.priority}
      </Badge>
    </div>
  );
}

// =====================================================
// PLACEHOLDER COMPONENTS (To be implemented)
// =====================================================

function DecisionInbox() {
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "decided" | "delegated" | "deferred" | "all">("pending");
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDecision, setNewDecision] = useState({ title: "", description: "", priority: "medium" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDecisions();
  }, [filter]);

  const handleCreateDecision = async () => {
    if (!newDecision.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDecision),
      });
      if (response.ok) {
        toast.success("Decision created!");
        setShowNewForm(false);
        setNewDecision({ title: "", description: "", priority: "medium" });
        fetchDecisions();
      } else {
        toast.error("Failed to create decision");
      }
    } catch (error) {
      toast.error("Error creating decision");
    } finally {
      setCreating(false);
    }
  };

  const fetchDecisions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }
      const response = await fetch(`/api/decisions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || []);
      }
    } catch (error) {
      console.error("Error fetching decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-500" />
            Decision Inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Make decisions with the Decide / Delegate / Defer workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {(["pending", "decided", "delegated", "deferred", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                  filter === f
                    ? "bg-white dark:bg-slate-800 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowNewForm(true)}>
            <FileCheck className="h-4 w-4 mr-2" />
            New Decision
          </Button>
        </div>
      </div>

      {/* New Decision Form */}
      {showNewForm && (
        <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Decision</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <input
                    type="text"
                    placeholder="What decision needs to be made?"
                    value={newDecision.title}
                    onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    placeholder="Additional context or details..."
                    value={newDecision.description}
                    onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <select
                      value={newDecision.priority}
                      onChange={(e) => setNewDecision({ ...newDecision, priority: e.target.value })}
                      className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                  <Button onClick={handleCreateDecision} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />}
                    Create Decision
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Legend */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-medium">Decision Workflow</span>
                <span className="text-muted-foreground ml-2">Three choices for every decision</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Decide
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium">
                <Users className="h-4 w-4" />
                Delegate
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Defer
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decisions List */}
      {decisions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No decisions found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              {filter === "pending"
                ? "You're all caught up! No pending decisions require your attention."
                : `No ${filter} decisions to show.`}
            </p>
            <Button onClick={() => setShowNewForm(true)}>
              <FileCheck className="h-4 w-4 mr-2" />
              Add Decision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {decisions.map((decision) => (
            <Card
              key={decision.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                decision.priority === "urgent" && "border-red-200 dark:border-red-800/50",
                decision.priority === "high" && "border-orange-200 dark:border-orange-800/50"
              )}
              onClick={() => setSelectedDecision(decision)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Priority Indicator */}
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    decision.priority === "urgent" && "bg-red-100 dark:bg-red-900/30",
                    decision.priority === "high" && "bg-orange-100 dark:bg-orange-900/30",
                    decision.priority === "medium" && "bg-blue-100 dark:bg-blue-900/30",
                    decision.priority === "low" && "bg-gray-100 dark:bg-gray-800"
                  )}>
                    <FileCheck className={cn(
                      "h-6 w-6",
                      decision.priority === "urgent" && "text-red-600",
                      decision.priority === "high" && "text-orange-600",
                      decision.priority === "medium" && "text-blue-600",
                      decision.priority === "low" && "text-gray-600"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold truncate">{decision.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={cn("text-xs", priorityColors[decision.priority])}>
                            {decision.priority}
                          </Badge>
                          {decision.source_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {decision.source_type}
                            </Badge>
                          )}
                          {decision.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(decision.due_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          decision.status === "decided" && "border-green-500 text-green-600",
                          decision.status === "delegated" && "border-purple-500 text-purple-600",
                          decision.status === "deferred" && "border-gray-500 text-gray-600",
                          decision.status === "pending" && "border-orange-500 text-orange-600"
                        )}
                      >
                        {decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Description */}
                    {decision.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {decision.description}
                      </p>
                    )}

                    {/* Options Preview */}
                    {decision.options && decision.options.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">Options:</span>
                        {decision.options.slice(0, 3).map((opt: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {opt.title}
                          </Badge>
                        ))}
                        {decision.options.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{decision.options.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Decision Made */}
                    {decision.status === "decided" && decision.decision_made && (
                      <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          <strong>Decision:</strong> {decision.decision_made}
                        </p>
                      </div>
                    )}

                    {/* Delegated To */}
                    {decision.status === "delegated" && decision.delegated_to_user && (
                      <div className="mt-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                          <strong>Delegated to:</strong> {decision.delegated_to_user.full_name}
                        </p>
                      </div>
                    )}

                    {/* Deferred Until */}
                    {decision.status === "deferred" && decision.deferred_until && (
                      <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-400">
                          <strong>Deferred until:</strong>{" "}
                          {new Date(decision.deferred_until).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PeopleAndTasks() {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<any[]>([]);
  const [healthFlags, setHealthFlags] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [peopleRes, flagsRes] = await Promise.all([
        fetch("/api/executive/people"),
        fetch("/api/executive/task-health"),
      ]);
      if (peopleRes.ok) {
        const data = await peopleRes.json();
        setPeople(data.people || []);
      }
      if (flagsRes.ok) {
        const data = await flagsRes.json();
        setHealthFlags(data.flags || []);
      }
    } catch (error) {
      console.error("Error fetching people/tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const flaggedItems = healthFlags.filter(f => f.status === "active");
  const stuckTasks = flaggedItems.filter(f => f.flag_type === "stuck_task" || f.flag_type === "no_progress");
  const overloadedPeople = people.filter(p => p.workload_status === "overloaded");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">People & Tasks</h2>
          <p className="text-muted-foreground">Manage your team and track progress</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* AI Flags Banner */}
      {(stuckTasks.length > 0 || overloadedPeople.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-400">AI Flags</h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {stuckTasks.length > 0 && (
                    <li>• <strong>{stuckTasks.length} stuck tasks</strong> (overdue or blocked for 3+ days)</li>
                  )}
                  {overloadedPeople.map(p => (
                    <li key={p.person_id}>• <strong>{p.full_name}</strong> has {p.total_workload} active tasks (overloaded)</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Layout: Team List + Task Board */}
      <div className="grid grid-cols-4 gap-6">
        {/* Team List (1/4 width) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <CardTitle className="text-base">Team</CardTitle>
                  <CardDescription className="text-xs">{people.length} members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                    selectedPerson === null && "bg-muted"
                  )}
                >
                  <span className="font-medium">All Tasks</span>
                  <Badge variant="secondary">{people.reduce((acc, p) => acc + p.total_workload, 0)}</Badge>
                </button>
                {people.map((person) => (
                  <button
                    key={person.person_id}
                    onClick={() => setSelectedPerson(person.person_id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                      selectedPerson === person.person_id && "bg-muted"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {person.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{person.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{person.workload_status}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        person.workload_status === "overloaded" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        person.workload_status === "heavy" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}
                    >
                      {person.total_workload}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Board (3/4 width) */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-slate-900 w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Kanban Columns */}
              <div className="grid grid-cols-4 gap-4">
                {/* Waiting */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">Waiting</span>
                    <Badge variant="secondary" className="text-xs">{people.reduce((acc, p) => acc + p.pending_tasks, 0)}</Badge>
                  </div>
                  <div className="space-y-2">
                    {people.filter(p => p.pending_tasks > 0).slice(0, 2).map((person, idx) => (
                      <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">Waiting task example</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">medium</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{person.full_name}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {people.reduce((acc, p) => acc + p.pending_tasks, 0) === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No waiting tasks</p>
                    )}
                  </div>
                </div>

                {/* Active */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Active</span>
                    <Badge variant="secondary" className="text-xs">{people.reduce((acc, p) => acc + p.active_tasks, 0)}</Badge>
                  </div>
                  <div className="space-y-2">
                    {people.filter(p => p.active_tasks > 0).slice(0, 3).map((person, idx) => (
                      <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">Active work item</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">high</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{person.full_name}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {people.reduce((acc, p) => acc + p.active_tasks, 0) === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No active tasks</p>
                    )}
                  </div>
                </div>

                {/* Blocked */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-sm">Blocked</span>
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {people.reduce((acc, p) => acc + p.blocked_tasks, 0)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {people.filter(p => p.blocked_tasks > 0).map((person, idx) => (
                      <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow border-red-200 dark:border-red-800/50">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">Blocked item</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-red-500 text-red-600">Overdue</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{person.full_name}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {people.reduce((acc, p) => acc + p.blocked_tasks, 0) === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No blocked tasks</p>
                    )}
                  </div>
                </div>

                {/* Done */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Done</span>
                    <Badge variant="secondary" className="text-xs">0</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center py-4">Recently completed tasks appear here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesTracker() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, [filter]);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("final_decision", filter === "pending" ? "" : filter);
      }
      const response = await fetch(`/api/opportunities?${params}`);
      if (response.ok) {
        const data = await response.json();
        const opps = data.opportunities || [];
        setOpportunities(opps);
        // Auto-select first if none selected
        if (opps.length > 0 && !selectedOpportunity) {
          setSelectedOpportunity(opps[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    const totalValue = opportunities
      .filter((o) => !o.final_decision || o.final_decision === "")
      .reduce((sum, o) => sum + (o.estimated_value || 0), 0);
    const inEvaluation = opportunities.filter(
      (o) => o.weighted_composite_score && (!o.final_decision || o.final_decision === "")
    ).length;
    const pending = opportunities.filter(
      (o) => !o.weighted_composite_score && (!o.final_decision || o.final_decision === "")
    ).length;
    const approved = opportunities.filter((o) => o.final_decision === "approved").length;
    const avgScore = opportunities.length > 0
      ? opportunities
          .filter((o) => o.weighted_composite_score)
          .reduce((sum, o) => sum + (o.weighted_composite_score || 0), 0) /
        Math.max(opportunities.filter((o) => o.weighted_composite_score).length, 1)
      : 0;
    return { totalValue, inEvaluation, pending, approved, avgScore };
  }, [opportunities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Opportunities Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and evaluate opportunities with the 5-factor decision framework
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Opportunity
        </Button>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Active Pipeline</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  ${(pipelineMetrics.totalValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">In Evaluation</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{pipelineMetrics.inEvaluation}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/50 dark:border-amber-800/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Needs Scoring</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{pipelineMetrics.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{pipelineMetrics.approved}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-slate-200/50 dark:border-slate-800/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Avg Score</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                  {pipelineMetrics.avgScore > 0 ? Math.round(pipelineMetrics.avgScore) : "--"}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                <Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "pending" ? "Needs Decision" : f}
          </button>
        ))}
      </div>

      {/* Master-Detail Layout */}
      {opportunities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              {filter === "pending"
                ? "No pending opportunities to evaluate. Add a new opportunity to get started."
                : filter === "all"
                  ? "Start tracking opportunities to see them here."
                  : `No ${filter} opportunities yet.`}
            </p>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-5 gap-6">
          {/* Opportunities List - Left Side */}
          <div className="col-span-2 space-y-3">
            {opportunities.map((opp) => (
              <OpportunityListItem
                key={opp.id}
                opportunity={opp}
                isSelected={selectedOpportunity?.id === opp.id}
                onSelect={() => setSelectedOpportunity(opp)}
              />
            ))}
          </div>

          {/* Opportunity Detail - Right Side */}
          <div className="col-span-3">
            {selectedOpportunity ? (
              <OpportunityDetailPanel
                opportunity={selectedOpportunity}
                onUpdate={() => fetchOpportunities()}
              />
            ) : (
              <Card className="h-full flex items-center justify-center border-dashed">
                <CardContent className="text-center py-16">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">Select an opportunity to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Opportunity List Item (compact card for left panel)
function OpportunityListItem({
  opportunity,
  isSelected,
  onSelect,
}: {
  opportunity: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const score = opportunity.weighted_composite_score;
  const hasScore = score !== null && score !== undefined;

  const getScoreBorderColor = () => {
    if (!hasScore) return "";
    if (score >= 80) return "border-l-green-500";
    if (score >= 60) return "border-l-yellow-500";
    return "border-l-red-500";
  };

  const typeLabels: Record<string, string> = {
    grant: "Grant",
    rfp: "RFP",
    partnership: "Partnership",
    contract: "Contract",
    sponsorship: "Sponsorship",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        isSelected
          ? "ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
          : "hover:bg-muted/50",
        hasScore ? getScoreBorderColor() : "border-l-gray-300 dark:border-l-gray-700"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{opportunity.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              {opportunity.opportunity_type && (
                <Badge variant="outline" className="text-xs">
                  {typeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
                </Badge>
              )}
              {opportunity.estimated_value && (
                <span className="text-xs text-muted-foreground">
                  ${(opportunity.estimated_value / 1000).toFixed(0)}K
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {hasScore ? (
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
                  score >= 80
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    : score >= 60
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                )}
              >
                {Math.round(score)}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">--</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Opportunity Detail Panel (full scoring breakdown on right)
function OpportunityDetailPanel({
  opportunity,
  onUpdate,
}: {
  opportunity: any;
  onUpdate: () => void;
}) {
  const score = opportunity.weighted_composite_score;
  const hasScore = score !== null && score !== undefined;

  const getScoreColor = () => {
    if (!hasScore) return { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-300" };
    if (score >= 80) return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", ring: "ring-green-500" };
    if (score >= 60) return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", ring: "ring-yellow-500" };
    return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", ring: "ring-red-500" };
  };

  const getRecommendation = () => {
    if (!hasScore) return { label: "Not Scored", color: "text-muted-foreground" };
    if (score >= 80) return { label: "Strong Yes", color: "text-green-600 dark:text-green-400" };
    if (score >= 70) return { label: "Yes", color: "text-green-500 dark:text-green-400" };
    if (score >= 60) return { label: "Maybe", color: "text-yellow-600 dark:text-yellow-400" };
    return { label: "No", color: "text-red-600 dark:text-red-400" };
  };

  const typeLabels: Record<string, string> = {
    grant: "Grant",
    rfp: "RFP",
    partnership: "Partnership",
    contract: "Contract",
    sponsorship: "Sponsorship",
    investment: "Investment",
    acquisition: "Acquisition",
  };

  const colors = getScoreColor();
  const recommendation = getRecommendation();

  const handleDecision = async (decision: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_decision: decision }),
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error making decision:", error);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {opportunity.opportunity_type && (
                <Badge variant="outline">
                  {typeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
                </Badge>
              )}
              {opportunity.priority && (
                <Badge
                  variant="outline"
                  className={cn(
                    opportunity.priority === "urgent" && "border-red-500 text-red-600",
                    opportunity.priority === "high" && "border-orange-500 text-orange-600"
                  )}
                >
                  {opportunity.priority}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold">{opportunity.title}</h2>
            {opportunity.description && (
              <p className="text-muted-foreground mt-2">{opportunity.description}</p>
            )}
          </div>
          {opportunity.estimated_value && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Est. Value</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                ${opportunity.estimated_value.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Composite Score Display */}
        <div className={cn("rounded-xl p-6", colors.bg)}>
          <div className="flex items-center gap-6">
            {/* Score Circle */}
            <div className={cn("relative h-24 w-24 rounded-full flex items-center justify-center ring-4", colors.ring, colors.bg)}>
              <div className="text-center">
                <span className={cn("text-3xl font-bold", colors.text)}>
                  {hasScore ? Math.round(score) : "--"}
                </span>
                {hasScore && <span className={cn("text-sm", colors.text)}>%</span>}
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">AI Recommendation</p>
              <p className={cn("text-2xl font-bold", recommendation.color)}>{recommendation.label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on 5-factor weighted analysis
              </p>
            </div>

            {/* Quick Actions */}
            {!opportunity.final_decision && hasScore && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleDecision("approved")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleDecision("rejected")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {opportunity.final_decision && (
              <Badge
                className={cn(
                  "text-sm py-1.5 px-4",
                  opportunity.final_decision === "approved"
                    ? "bg-green-500"
                    : "bg-red-500"
                )}
              >
                {opportunity.final_decision === "approved" ? "Approved" : "Rejected"}
              </Badge>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        {hasScore && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Score Breakdown
            </h3>
            <div className="space-y-3">
              <ScoreBreakdownRow
                label="Hurdle Rate"
                score={opportunity.hurdle_rate_score}
                weight={30}
                color="purple"
                description="ROI & minimum thresholds"
              />
              <ScoreBreakdownRow
                label="Brand Alignment"
                score={opportunity.brand_composite_score}
                weight={25}
                color="blue"
                description="Values, quality, audience fit"
              />
              <ScoreBreakdownRow
                label="Strategic Fit"
                score={opportunity.strategic_composite_score}
                weight={25}
                color="green"
                description="Goals, competencies, diversification"
              />
              <ScoreBreakdownRow
                label="Risk Assessment"
                score={opportunity.risk_composite_score}
                weight={15}
                color="orange"
                description="Financial, operational, reputational, legal"
              />
              <ScoreBreakdownRow
                label="Resource Demand"
                score={opportunity.resource_composite_score}
                weight={5}
                color="gray"
                description="Time, capital, energy, opportunity cost"
              />
            </div>
          </div>
        )}

        {/* Due Date / Timeline */}
        {opportunity.due_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
            <CalendarDays className="h-4 w-4" />
            <span>Due: {new Date(opportunity.due_date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Score Breakdown Row Component
function ScoreBreakdownRow({
  label,
  score,
  weight,
  color,
  description,
}: {
  label: string;
  score: number | null;
  weight: number;
  color: "purple" | "blue" | "green" | "orange" | "gray";
  description: string;
}) {
  const s = score || 0;

  const bgColors = {
    purple: "bg-purple-100 dark:bg-purple-900/30",
    blue: "bg-blue-100 dark:bg-blue-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    orange: "bg-orange-100 dark:bg-orange-900/30",
    gray: "bg-gray-100 dark:bg-gray-800",
  };

  const fillColors = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    gray: "bg-gray-500",
  };

  const textColors = {
    purple: "text-purple-600 dark:text-purple-400",
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    orange: "text-orange-600 dark:text-orange-400",
    gray: "text-gray-600 dark:text-gray-400",
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-32">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{weight}% weight</p>
      </div>
      <div className="flex-1">
        <div className={cn("h-3 rounded-full", bgColors[color])}>
          <div
            className={cn("h-full rounded-full transition-all", fillColors[color])}
            style={{ width: `${s}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className={cn("text-lg font-bold w-12 text-right", textColors[color])}>
        {score !== null ? Math.round(s) : "--"}
      </div>
    </div>
  );
}

function NotesAndMemory() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append("context_type", selectedCategory);
      }
      const response = await fetch(`/api/organization/context?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.contexts || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: null, label: "All Notes", icon: Brain },
    { id: "vision", label: "Vision", icon: Target },
    { id: "strategy", label: "Strategy", icon: TrendingUp },
    { id: "decision_principle", label: "Decisions Made", icon: CheckCircle2 },
    { id: "operational_preference", label: "Context", icon: FileCheck },
  ];

  // Count notes per category
  const getCategoryCount = (categoryId: string | null) => {
    if (categoryId === null) return notes.length;
    return notes.filter(n => n.context_type === categoryId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notes & Memory</h2>
          <p className="text-muted-foreground">Organizational context and knowledge base</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Brain className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Categories & Notes List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full px-3 py-2 pl-9 text-sm rounded-lg border bg-white dark:bg-slate-900"
            />
            <Brain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-pink-500" />
                <CardTitle className="text-base">Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categories.map((cat) => (
                  <button
                    key={cat.id || "all"}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                      selectedCategory === cat.id && "bg-muted"
                    )}
                  >
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 font-medium text-sm">{cat.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryCount(cat.id)}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes List */}
          <div className="space-y-2">
            {notes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewForm(true)}>
                    Create New Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              notes.slice(0, 10).map((note) => (
                <Card
                  key={note.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all",
                    selectedNote?.id === note.id && "ring-2 ring-pink-500"
                  )}
                  onClick={() => setSelectedNote(note)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "h-6 w-6 rounded flex items-center justify-center flex-shrink-0",
                        note.context_type === "vision" && "bg-amber-100 dark:bg-amber-900/30",
                        note.context_type === "strategy" && "bg-green-100 dark:bg-green-900/30",
                        note.context_type === "decision_principle" && "bg-blue-100 dark:bg-blue-900/30"
                      )}>
                        {note.context_type === "vision" && <Target className="h-3 w-3 text-amber-600" />}
                        {note.context_type === "strategy" && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {note.context_type === "decision_principle" && <CheckCircle2 className="h-3 w-3 text-blue-600" />}
                        {!["vision", "strategy", "decision_principle"].includes(note.context_type) && (
                          <FileCheck className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {note.content?.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Note Detail / Editor */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardContent className="py-8">
              {selectedNote ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{selectedNote.context_type?.replace("_", " ")}</Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                  <h3 className="text-xl font-semibold">{selectedNote.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedNote.content}</p>
                  {selectedNote.key_points && selectedNote.key_points.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Key Points</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedNote.key_points.map((point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : showNewForm ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Create New Note</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <select className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900">
                        <option value="vision">Vision</option>
                        <option value="strategy">Strategy</option>
                        <option value="decision_principle">Decision Principle</option>
                        <option value="operational_preference">Operational Preference</option>
                        <option value="lesson_learned">Lesson Learned</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title</label>
                      <input
                        type="text"
                        placeholder="Note title..."
                        className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Content</label>
                      <textarea
                        placeholder="Write your note..."
                        rows={8}
                        className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                      <Button>Save Note</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-semibold mb-2">Select a Note</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                    Click on a note to view and edit, or create a new one
                  </p>
                  <Button onClick={() => setShowNewForm(true)}>
                    <Brain className="h-4 w-4 mr-2" />
                    Create New Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
