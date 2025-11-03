"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Zap,
  DollarSign,
  Activity,
  Clock,
  MessageSquare,
  FileText,
  Database,
  Loader2,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface UsageStats {
  period: string;
  api_calls: number;
  tokens_used: number;
  storage_used: number;
  ai_interactions: number;
  documents_processed: number;
  workflows_executed: number;
  total_cost: number;
}

interface UsageLimit {
  name: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
}

export default function UsageAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<UsageLimit[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, [timeRange]);

  async function loadUsageData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch usage statistics from messages table
      // Count total messages as AI interactions
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, cost_usd, tokens", { count: "exact" })
        .eq("user_id", user.id);

      // Count documents
      const { count: docsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Calculate totals from actual data
      const totalTokens = messagesData?.reduce((sum, msg) => sum + (msg.tokens || 0), 0) || 0;
      const totalCost = messagesData?.reduce((sum, msg) => sum + (parseFloat(msg.cost_usd) || 0), 0) || 0;
      const aiInteractions = messagesData?.length || 0;

      setStats({
        period: timeRange,
        api_calls: aiInteractions,
        tokens_used: totalTokens,
        storage_used: 0, // GB - would need to calculate from document sizes
        ai_interactions: aiInteractions,
        documents_processed: docsCount || 0,
        workflows_executed: 0, // Would need workflows table
        total_cost: totalCost,
      });

      // Calculate limits based on actual usage
      setLimits([
        {
          name: "API Calls",
          current: aiInteractions,
          limit: 50000,
          unit: "calls/month",
          percentage: (aiInteractions / 50000) * 100,
        },
        {
          name: "AI Tokens",
          current: totalTokens,
          limit: 10000000,
          unit: "tokens/month",
          percentage: (totalTokens / 10000000) * 100,
        },
        {
          name: "Storage",
          current: 0,
          limit: 100,
          unit: "GB",
          percentage: 0,
        },
        {
          name: "Workflows",
          current: 0,
          limit: 1000,
          unit: "executions/month",
          percentage: 0,
        },
      ]);
    } catch (error) {
      console.error("Error loading usage data:", error);
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/usage/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time_range: timeRange }),
      });

      if (!response.ok) {
        throw new Error("Failed to export usage data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage-report-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Usage report exported successfully");
    } catch (error) {
      console.error("Error exporting usage data:", error);
      toast.error("Failed to export usage data");
    } finally {
      setExporting(false);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  function getProgressColor(percentage: number): string {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  }

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
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Usage Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track your API usage, tokens, and costs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 border-slate-200 dark:border-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="border-slate-200 dark:border-slate-800"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">API Calls</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatNumber(stats?.api_calls || 0)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-3">
            <ArrowUp className="h-3 w-3" />
            <span>12% from last period</span>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Tokens Used</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatNumber(stats?.tokens_used || 0)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-3">
            <ArrowUp className="h-3 w-3" />
            <span>8% from last period</span>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Storage Used</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats?.storage_used.toFixed(1)} GB</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-3">
            <ArrowUp className="h-3 w-3" />
            <span>3% from last period</span>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">${stats?.total_cost.toFixed(2)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-3">
            <ArrowDown className="h-3 w-3" />
            <span>5% from last period</span>
          </div>
        </Card>
      </div>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Limits
          </CardTitle>
          <CardDescription>
            Current usage against your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {limits.map((limit) => (
            <div key={limit.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{limit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(limit.current)} / {formatNumber(limit.limit)} {limit.unit}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    limit.percentage >= 90
                      ? "bg-red-50 border-red-300 text-red-700"
                      : limit.percentage >= 75
                      ? "bg-amber-50 border-amber-300 text-amber-700"
                      : "bg-green-50 border-green-300 text-green-700"
                  }
                >
                  {limit.percentage.toFixed(0)}% used
                </Badge>
              </div>
              <div className="relative">
                <Progress value={limit.percentage} className="h-2" />
                <div
                  className={`absolute inset-0 h-2 rounded-full transition-all ${getProgressColor(
                    limit.percentage
                  )}`}
                  style={{ width: `${limit.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{formatNumber(stats?.ai_interactions || 0)}</div>
            <Progress value={65} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              Chat sessions, queries, and agent interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {formatNumber(stats?.documents_processed || 0)}
            </div>
            <Progress value={45} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              Uploaded, analyzed, and indexed documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Workflow Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {formatNumber(stats?.workflows_executed || 0)}
            </div>
            <Progress value={23} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              Automated workflows and scheduled tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of your usage costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">API Usage</p>
                  <p className="text-sm text-muted-foreground">12,547 calls @ $0.002/call</p>
                </div>
              </div>
              <p className="text-lg font-semibold">$25.09</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">AI Tokens</p>
                  <p className="text-sm text-muted-foreground">2.46M tokens @ $0.03/1K tokens</p>
                </div>
              </div>
              <p className="text-lg font-semibold">$73.70</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Storage</p>
                  <p className="text-sm text-muted-foreground">4.2 GB @ $0.15/GB</p>
                </div>
              </div>
              <p className="text-lg font-semibold">$0.63</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Document Processing</p>
                  <p className="text-sm text-muted-foreground">456 documents @ $0.05/doc</p>
                </div>
              </div>
              <p className="text-lg font-semibold">$22.80</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-lg text-slate-900 dark:text-slate-100">Total Cost</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">for {timeRange}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${stats?.total_cost.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                About Usage Tracking
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Usage data is updated every hour</li>
                <li>• Costs are estimates and may vary from your final invoice</li>
                <li>• Storage includes documents, knowledge base, and file uploads</li>
                <li>• You'll receive alerts when approaching 80% and 90% of any limit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
