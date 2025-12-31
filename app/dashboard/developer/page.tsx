"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Code2,
  Key,
  Webhook,
  Activity,
  BarChart3,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FileJson,
  ExternalLink,
  Loader2,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow, format, subDays } from "date-fns";

interface UsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  tokens_used: number;
  cost_usd: number;
  daily_usage: { date: string; requests: number; tokens: number }[];
  top_endpoints: { endpoint: string; count: number }[];
}

interface ApiKeyOverview {
  total: number;
  active: number;
  total_usage: number;
  last_used: string | null;
}

interface WebhookOverview {
  total: number;
  active: number;
  pending_deliveries: number;
  recent_deliveries: {
    id: string;
    status: string;
    event_type: string;
    created_at: string;
  }[];
}

export default function DeveloperPortalPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [apiKeyOverview, setApiKeyOverview] = useState<ApiKeyOverview | null>(null);
  const [webhookOverview, setWebhookOverview] = useState<WebhookOverview | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    loadDeveloperData();
  }, [selectedPeriod]);

  async function loadDeveloperData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Load data in parallel
      const [usageRes, apiKeysRes, webhooksRes] = await Promise.all([
        fetch(`/api/developers/usage?period=${selectedPeriod}`).then(r => r.json()),
        loadApiKeyOverview(supabase, user.id),
        loadWebhookOverview(supabase, user.id),
      ]);

      if (usageRes.error) {
        console.error("Usage error:", usageRes.error);
      } else {
        setUsageStats(usageRes);
      }

      setApiKeyOverview(apiKeysRes);
      setWebhookOverview(webhooksRes);
    } catch (error) {
      console.error("Error loading developer data:", error);
      toast.error("Failed to load developer data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadApiKeyOverview(supabase: any, userId: string): Promise<ApiKeyOverview> {
    const { data: keys } = await supabase
      .from("api_keys")
      .select("id, is_active, usage_count, last_used_at")
      .eq("user_id", userId);

    const activeKeys = keys?.filter((k: any) => k.is_active) || [];
    const totalUsage = keys?.reduce((sum: number, k: any) => sum + (k.usage_count || 0), 0) || 0;
    const lastUsed = keys
      ?.filter((k: any) => k.last_used_at)
      ?.sort((a: any, b: any) => new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime())[0]?.last_used_at;

    return {
      total: keys?.length || 0,
      active: activeKeys.length,
      total_usage: totalUsage,
      last_used: lastUsed || null,
    };
  }

  async function loadWebhookOverview(supabase: any, userId: string): Promise<WebhookOverview> {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return { total: 0, active: 0, pending_deliveries: 0, recent_deliveries: [] };
    }

    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("id, is_active")
      .eq("organization_id", profile.organization_id);

    const { data: deliveries } = await supabase
      .from("webhook_deliveries")
      .select("id, status, event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const pendingCount = deliveries?.filter((d: any) => d.status === "pending").length || 0;
    const activeWebhooks = webhooks?.filter((w: any) => w.is_active) || [];

    return {
      total: webhooks?.length || 0,
      active: activeWebhooks.length,
      pending_deliveries: pendingCount,
      recent_deliveries: deliveries || [],
    };
  }

  function handleRefresh() {
    setRefreshing(true);
    loadDeveloperData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const successRate = usageStats
    ? Math.round((usageStats.successful_requests / Math.max(usageStats.total_requests, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-100 dark:border-emerald-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Code2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 dark:from-emerald-100 dark:via-teal-100 dark:to-cyan-100 bg-clip-text text-transparent">
                Developer Portal
              </h1>
              <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                Build integrations with the Perpetual Core API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md">
              <Link href="/dashboard/developer/docs">
                <BookOpen className="h-4 w-4 mr-2" />
                API Docs
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-3xl font-bold">
                  {usageStats?.total_requests?.toLocaleString() || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{successRate}% success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-3xl font-bold">
                  {(usageStats?.tokens_used || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>${(usageStats?.cost_usd || 0).toFixed(4)} estimated cost</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-3xl font-bold">{apiKeyOverview?.active || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center">
                <Key className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>{apiKeyOverview?.total || 0} total keys</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Webhooks</p>
                <p className="text-3xl font-bold">{webhookOverview?.active || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 flex items-center justify-center">
                <Webhook className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {webhookOverview?.pending_deliveries ? (
                <span className="text-amber-600">
                  {webhookOverview.pending_deliveries} pending deliveries
                </span>
              ) : (
                <span>All deliveries sent</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Request volume over time</CardDescription>
            </div>
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
                <TabsTrigger value="90d">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {usageStats?.daily_usage && usageStats.daily_usage.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar visualization */}
                <div className="flex items-end justify-between h-48 gap-1 px-2">
                  {usageStats.daily_usage.slice(-14).map((day, i) => {
                    const maxRequests = Math.max(...usageStats.daily_usage.map(d => d.requests), 1);
                    const height = (day.requests / maxRequests) * 100;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${format(new Date(day.date), "MMM d")}: ${day.requests} requests`}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t transition-all hover:from-emerald-600 hover:to-teal-500"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {i % 2 === 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(day.date), "d")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {format(new Date(usageStats.daily_usage[0]?.date || new Date()), "MMM d")}
                  </span>
                  <span>
                    {format(new Date(usageStats.daily_usage[usageStats.daily_usage.length - 1]?.date || new Date()), "MMM d")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p>No usage data available</p>
                <p className="text-sm">Start making API requests to see usage statistics</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Most used API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {usageStats?.top_endpoints && usageStats.top_endpoints.length > 0 ? (
              <div className="space-y-4">
                {usageStats.top_endpoints.slice(0, 5).map((endpoint, i) => {
                  const maxCount = Math.max(...usageStats.top_endpoints.map(e => e.count), 1);
                  const percentage = (endpoint.count / maxCount) * 100;
                  return (
                    <div key={endpoint.endpoint} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[180px]">
                          {endpoint.endpoint}
                        </code>
                        <span className="font-medium">{endpoint.count.toLocaleString()}</span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FileJson className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No endpoint data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API Keys Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">API Keys</CardTitle>
                <CardDescription>Manage authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Keys</span>
              <Badge variant="outline">{apiKeyOverview?.active || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Requests</span>
              <span className="font-medium">{apiKeyOverview?.total_usage?.toLocaleString() || 0}</span>
            </div>
            {apiKeyOverview?.last_used && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last Used</span>
                <span className="text-xs">
                  {formatDistanceToNow(new Date(apiKeyOverview.last_used), { addSuffix: true })}
                </span>
              </div>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/developer/api-keys">
                Manage Keys
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Webhooks Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Webhook className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Webhooks</CardTitle>
                <CardDescription>Event notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Webhooks</span>
              <Badge variant="outline">{webhookOverview?.active || 0}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Pending Deliveries</span>
              <span className={`font-medium ${webhookOverview?.pending_deliveries ? "text-amber-600" : ""}`}>
                {webhookOverview?.pending_deliveries || 0}
              </span>
            </div>
            {webhookOverview?.recent_deliveries?.[0] && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last Delivery</span>
                <div className="flex items-center gap-1">
                  {webhookOverview.recent_deliveries[0].status === "delivered" ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : webhookOverview.recent_deliveries[0].status === "failed" ? (
                    <XCircle className="h-3 w-3 text-red-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-amber-600" />
                  )}
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(webhookOverview.recent_deliveries[0].created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/developer/webhooks">
                Manage Webhooks
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Documentation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Documentation</CardTitle>
                <CardDescription>API reference & guides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Link
                href="/dashboard/developer/docs#getting-started"
                className="flex items-center justify-between text-sm hover:text-primary transition-colors"
              >
                <span>Getting Started</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/developer/docs#authentication"
                className="flex items-center justify-between text-sm hover:text-primary transition-colors"
              >
                <span>Authentication</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/developer/docs#endpoints"
                className="flex items-center justify-between text-sm hover:text-primary transition-colors"
              >
                <span>API Endpoints</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/dashboard/developer/docs#webhooks"
                className="flex items-center justify-between text-sm hover:text-primary transition-colors"
              >
                <span>Webhook Events</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/developer/docs">
                View Full Docs
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Webhook Deliveries */}
      {webhookOverview?.recent_deliveries && webhookOverview.recent_deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Webhook Deliveries</CardTitle>
            <CardDescription>Latest webhook delivery attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {webhookOverview.recent_deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {delivery.status === "delivered" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : delivery.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                    )}
                    <div>
                      <code className="text-sm font-medium">{delivery.event_type}</code>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      delivery.status === "delivered"
                        ? "default"
                        : delivery.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {delivery.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
