"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, MessageSquare, Users, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface UsageStats {
  summary: {
    total_messages: number;
    total_tokens: number;
    total_cost: string;
    unique_users: number;
    unique_conversations: number;
  };
  by_user: Array<{
    user_id: string;
    full_name: string;
    email: string;
    message_count: number;
    total_tokens: number;
    total_cost: number;
  }>;
  by_conversation: Array<{
    conversation_id: string;
    message_count: number;
    total_tokens: number;
    total_cost: number;
  }>;
  by_model: Array<{
    model: string;
    message_count: number;
    total_tokens: number;
    total_cost: number;
  }>;
  by_date: Array<{
    date: string;
    message_count: number;
    total_tokens: number;
    total_cost: number;
  }>;
}

export default function AdminUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  async function loadStats() {
    try {
      setLoading(true);
      setError(null);

      // Calculate start date based on range
      let startDate = "";
      const now = new Date();
      if (dateRange === "7d") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === "90d") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      const url = startDate
        ? `/api/admin/usage?start_date=${startDate}`
        : "/api/admin/usage";

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load usage stats");
      }

      setStats(data);
    } catch (err: any) {
      console.error("Error loading stats:", err);
      setError(err.message);
      toast.error("Failed to load usage statistics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {error || "Failed to load usage statistics"}
            </p>
            <button
              onClick={() => loadStats()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Usage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Organization-wide AI usage and cost tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.summary.total_cost}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI API usage costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.summary.total_messages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total AI responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.summary.total_tokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Input + output tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.unique_users}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Using AI features
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">By User</TabsTrigger>
          <TabsTrigger value="conversations">By Conversation</TabsTrigger>
          <TabsTrigger value="models">By Model</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* By User Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usage by User</CardTitle>
              <CardDescription>
                AI usage and costs per team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">User</div>
                  <div className="col-span-2 text-right">Messages</div>
                  <div className="col-span-3 text-right">Tokens</div>
                  <div className="col-span-3 text-right">Cost</div>
                </div>
                {stats.by_user.map((user) => (
                  <div
                    key={user.user_id}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0"
                  >
                    <div className="col-span-4">
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      {user.message_count}
                    </div>
                    <div className="col-span-3 text-right">
                      {user.total_tokens.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-right font-medium">
                      ${user.total_cost.toFixed(4)}
                    </div>
                  </div>
                ))}
                {stats.by_user.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Conversation Tab */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Top Conversations by Cost</CardTitle>
              <CardDescription>
                Most expensive conversations (top 20)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-6">Conversation ID</div>
                  <div className="col-span-2 text-right">Messages</div>
                  <div className="col-span-2 text-right">Tokens</div>
                  <div className="col-span-2 text-right">Cost</div>
                </div>
                {stats.by_conversation.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0"
                  >
                    <div className="col-span-6 font-mono text-xs">
                      {conv.conversation_id}
                    </div>
                    <div className="col-span-2 text-right">
                      {conv.message_count}
                    </div>
                    <div className="col-span-2 text-right">
                      {(conv.total_tokens / 1000).toFixed(1)}K
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      ${conv.total_cost.toFixed(4)}
                    </div>
                  </div>
                ))}
                {stats.by_conversation.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Model Tab */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Usage by AI Model</CardTitle>
              <CardDescription>
                Breakdown of usage across different AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-5">Model</div>
                  <div className="col-span-2 text-right">Messages</div>
                  <div className="col-span-3 text-right">Tokens</div>
                  <div className="col-span-2 text-right">Cost</div>
                </div>
                {stats.by_model.map((model) => (
                  <div
                    key={model.model}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0"
                  >
                    <div className="col-span-5 font-medium">{model.model}</div>
                    <div className="col-span-2 text-right">
                      {model.message_count}
                    </div>
                    <div className="col-span-3 text-right">
                      {model.total_tokens.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      ${model.total_cost.toFixed(4)}
                    </div>
                  </div>
                ))}
                {stats.by_model.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Timeline</CardTitle>
              <CardDescription>
                AI usage and costs over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">Date</div>
                  <div className="col-span-2 text-right">Messages</div>
                  <div className="col-span-3 text-right">Tokens</div>
                  <div className="col-span-3 text-right">Cost</div>
                </div>
                {stats.by_date.map((day) => (
                  <div
                    key={day.date}
                    className="grid grid-cols-12 gap-4 text-sm py-3 border-b last:border-b-0"
                  >
                    <div className="col-span-4 font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="col-span-2 text-right">
                      {day.message_count}
                    </div>
                    <div className="col-span-3 text-right">
                      {day.total_tokens.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-right font-medium">
                      ${day.total_cost.toFixed(4)}
                    </div>
                  </div>
                ))}
                {stats.by_date.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
