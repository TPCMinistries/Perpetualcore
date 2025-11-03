"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  TrendingUp,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuditLog, AuditLogStats } from "@/types";
import { formatDistanceToNow } from "date-fns";

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
    setPage(1); // Reset to first page when filtering
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
    const variants = {
      success: { variant: "default" as const, icon: Check, className: "bg-green-50 border-green-300 text-green-700" },
      failure: { variant: "destructive" as const, icon: X, className: "bg-red-50 border-red-300 text-red-700" },
      warning: { variant: "secondary" as const, icon: AlertCircle, className: "bg-yellow-50 border-yellow-300 text-yellow-700" },
    };
    const config = variants[status as keyof typeof variants] || variants.success;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }

  function getSeverityBadge(severity: string) {
    const colors = {
      debug: "bg-gray-50 border-gray-300 text-gray-700",
      info: "bg-blue-50 border-blue-300 text-blue-700",
      warning: "bg-yellow-50 border-yellow-300 text-yellow-700",
      error: "bg-orange-50 border-orange-300 text-orange-700",
      critical: "bg-red-50 border-red-300 text-red-700",
    };

    return (
      <Badge variant="outline" className={colors[severity as keyof typeof colors] || colors.info}>
        {severity}
      </Badge>
    );
  }

  function getCategoryIcon(category: string) {
    const icons = {
      authentication: Shield,
      authorization: Shield,
      data_access: FileText,
      data_modification: FileText,
      configuration: Activity,
      security: Shield,
      integration: Activity,
      admin: Users,
    };
    return icons[category as keyof typeof icons] || Activity;
  }

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activity</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-950/20 dark:via-slate-950/20 dark:to-zinc-950/20 border border-gray-100 dark:border-gray-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-slate-800 to-zinc-900 dark:from-gray-100 dark:via-slate-100 dark:to-zinc-100 bg-clip-text text-transparent">Audit Logs</h1>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                Comprehensive audit trail of all system activity
              </p>
            </div>
          </div>
          <Button variant="outline" className="shadow-md">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {!statsLoading && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successful_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_events > 0
                  ? `${((stats.successful_events / stats.total_events) * 100).toFixed(1)}% success rate`
                  : "No events"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_events > 0
                  ? `${((stats.failed_events / stats.total_events) * 100).toFixed(1)}% failure rate`
                  : "No events"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search description, actor..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_category">Category</Label>
              <Select value={filters.event_category} onValueChange={(value) => handleFilterChange("event_category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="authorization">Authorization</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="data_modification">Data Modification</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
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
            <Button onClick={() => fetchLogs()} variant="default">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Showing {logs.length} of {totalRecords.toLocaleString()} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => {
              const CategoryIcon = getCategoryIcon(log.event_category);
              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded">
                      <CategoryIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{log.description}</p>
                        {getStatusBadge(log.status)}
                        {getSeverityBadge(log.severity)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{log.actor_email || log.actor_name || "System"}</span>
                        <span>•</span>
                        <span className="capitalize">{log.event_action}</span>
                        <span>•</span>
                        <span className="capitalize">{log.event_category.replace("_", " ")}</span>
                        {log.resource_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{log.resource_type}</span>
                          </>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-sm text-red-600">{log.error_message}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No audit logs found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
