"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditLog } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function CrossOrgAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  async function loadLogs(p: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: "50" });
      if (search) params.set("event_type", search);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotalPages(data.total_pages ?? 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    error: "bg-red-50 text-red-600",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-50 text-blue-600",
    debug: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cross-Organization Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          View audit events across all organizations (super admin only)
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by event type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); loadLogs(1); } }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => { setPage(1); loadLogs(1); }}>
          Search
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-slate-500" />
            Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No audit logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Time</th>
                    <th className="pb-2 font-medium text-muted-foreground">Actor</th>
                    <th className="pb-2 font-medium text-muted-foreground">Event</th>
                    <th className="pb-2 font-medium text-muted-foreground">Resource</th>
                    <th className="pb-2 font-medium text-muted-foreground">Severity</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted">
                      <td className="py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-2">
                        <div className="text-xs">{log.actor_email || "System"}</div>
                      </td>
                      <td className="py-2">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {log.event_type}
                        </code>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {log.resource_type ? `${log.resource_type}${log.resource_name ? `: ${log.resource_name}` : ""}` : "-"}
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[log.severity] ?? severityColors.info}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2">
                        <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
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
