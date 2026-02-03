"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Search,
  Filter,
  AlertCircle,
  Check,
  X,
  Activity,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { AuditLog, AuditLogStats } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const statusConfig: Record<
  string,
  { icon: any; bg: string; text: string; border: string }
> = {
  success: {
    icon: Check,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  failure: {
    icon: X,
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
};

const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
  debug: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
  info: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  warning: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  error: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  critical: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
};

const categoryConfig: Record<string, { icon: any; color: string }> = {
  authentication: { icon: Shield, color: "violet" },
  authorization: { icon: Shield, color: "blue" },
  data_access: { icon: FileText, color: "emerald" },
  data_modification: { icon: FileText, color: "amber" },
  configuration: { icon: Activity, color: "violet" },
  security: { icon: Shield, color: "rose" },
  integration: { icon: Activity, color: "blue" },
  admin: { icon: Users, color: "violet" },
};

const categoryColors: Record<string, string> = {
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    event_category: "",
    event_action: "",
    status: "",
    severity: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filters]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/audit-logs/stats?days=30");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching audit log stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      search: "",
      event_category: "",
      event_action: "",
      status: "",
      severity: "",
      date_from: "",
      date_to: "",
    });
    setPage(1);
  }

  function getStatusBadge(status: string) {
    const config = statusConfig[status] || statusConfig.success;
    const Icon = config.icon;

    return (
      <Badge
        variant="outline"
        className={`${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }

  function getSeverityBadge(severity: string) {
    const config = severityConfig[severity] || severityConfig.info;

    return (
      <Badge
        variant="outline"
        className={`${config.bg} ${config.text} ${config.border}`}
      >
        {severity}
      </Badge>
    );
  }

  function getCategoryIcon(category: string) {
    const config = categoryConfig[category] || { icon: Activity, color: "violet" };
    return { Icon: config.icon, color: config.color };
  }

  if (loading && logs.length === 0) {
    return (
      <DashboardPageWrapper>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Table Skeleton */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Audit Logs"
          subtitle="Comprehensive audit trail of all system activity"
          icon={Shield}
          iconColor="violet"
          stats={
            stats
              ? [
                  { label: "events", value: stats.total_events },
                  { label: "critical", value: stats.critical_events },
                ]
              : undefined
          }
          actions={
            <Button
              variant="outline"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          }
        />

        {/* Statistics */}
        {!statsLoading && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StatCardGrid>
              <StatCard
                label="Total Events"
                value={stats.total_events.toLocaleString()}
                icon={Activity}
                iconColor="violet"
                trend="Last 30 days"
              />
              <StatCard
                label="Successful"
                value={stats.successful_events.toLocaleString()}
                icon={Check}
                iconColor="emerald"
                trend={
                  stats.total_events > 0
                    ? `${((stats.successful_events / stats.total_events) * 100).toFixed(1)}% success rate`
                    : "No events"
                }
              />
              <StatCard
                label="Failed"
                value={stats.failed_events.toLocaleString()}
                icon={X}
                iconColor="rose"
                trend={
                  stats.total_events > 0
                    ? `${((stats.failed_events / stats.total_events) * 100).toFixed(1)}% failure rate`
                    : "No events"
                }
              />
              <StatCard
                label="Critical"
                value={stats.critical_events.toLocaleString()}
                icon={AlertTriangle}
                iconColor="amber"
                trend="Requires attention"
              />
            </StatCardGrid>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Filter className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Filters
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="search"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="search"
                      placeholder="Search description, actor..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="event_category"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Category
                  </Label>
                  <Select
                    value={filters.event_category}
                    onValueChange={(value) =>
                      handleFilterChange("event_category", value)
                    }
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="authorization">Authorization</SelectItem>
                      <SelectItem value="data_access">Data Access</SelectItem>
                      <SelectItem value="data_modification">
                        Data Modification
                      </SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Status
                  </Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fetchLogs()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audit Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">
                    Audit Trail
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Showing {logs.length} of {totalRecords.toLocaleString()} events
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {logs.map((log, idx) => {
                  const { Icon: CategoryIcon, color } = getCategoryIcon(
                    log.event_category
                  );
                  return (
                    <motion.div
                      key={log.id}
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-2.5 rounded-lg ${categoryColors[color]}`}
                        >
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {log.description}
                            </p>
                            {getStatusBadge(log.status)}
                            {getSeverityBadge(log.severity)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {log.actor_email || log.actor_name || "System"}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">
                              |
                            </span>
                            <span className="capitalize">{log.event_action}</span>
                            <span className="text-slate-300 dark:text-slate-600">
                              |
                            </span>
                            <span className="capitalize">
                              {log.event_category.replace("_", " ")}
                            </span>
                            {log.resource_type && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">
                                  |
                                </span>
                                <span className="capitalize">
                                  {log.resource_type}
                                </span>
                              </>
                            )}
                          </div>
                          {log.error_message && (
                            <p className="text-sm text-rose-600 dark:text-rose-400">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {logs.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No audit logs found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardPageWrapper>
  );
}
