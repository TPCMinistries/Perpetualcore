"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, ArrowLeft, RefreshCw } from "lucide-react";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { ActivityFeed } from "@/components/agent/ActivityFeed";
import { createClient } from "@/lib/supabase/client";

export interface ActivityEvent {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "message_received", label: "Messages Received" },
  { value: "message_sent", label: "Messages Sent" },
  { value: "tool_executed", label: "Tool Executions" },
  { value: "heartbeat_completed", label: "Heartbeat" },
  { value: "code_executed", label: "Code Executed" },
  { value: "browser_action", label: "Browser Actions" },
];

export default function AgentActivityPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 20;

  const loadEvents = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Not authenticated");
          return;
        }

        let query = supabase
          .from("agent_activity_feed")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (filter !== "all") {
          query = query.eq("event_type", filter);
        }

        const { data, error } = await query;

        if (error) throw error;

        const transformed: ActivityEvent[] = (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          eventType: row.event_type,
          title: row.title,
          description: row.description,
          metadata: row.metadata,
          createdAt: row.created_at,
        }));

        if (append) {
          setEvents((prev) => [...prev, ...transformed]);
        } else {
          setEvents(transformed);
        }

        setHasMore(transformed.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error loading activity events:", error);
        toast.error("Failed to load activity feed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true);
    setPage(0);
    loadEvents(0);
  }, [filter, loadEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents(0);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadEvents]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(nextPage, true);
  }

  function handleRefresh() {
    setRefreshing(true);
    setPage(0);
    loadEvents(0);
  }

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="5xl">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper maxWidth="5xl">
      <DashboardHeader
        title="Agent Activity"
        subtitle="Real-time stream of your AI agent's actions and events"
        icon={Activity}
        iconColor="blue"
        stats={[{ label: "events shown", value: events.length }]}
        actions={[
          {
            label: "Back to Agent",
            icon: ArrowLeft,
            href: "/dashboard/agent",
            variant: "outline",
          },
        ]}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Feed */}
      <ActivityFeed initialEvents={events} />

      {/* Load More */}
      {hasMore && events.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16">
          <Activity className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No activity yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Activity events will appear here as your agent processes messages and
            executes tools.
          </p>
        </div>
      )}
    </DashboardPageWrapper>
  );
}
