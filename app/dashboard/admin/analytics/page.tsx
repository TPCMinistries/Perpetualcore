"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { ConversionMetrics } from "@/components/admin/ConversionMetrics";
import { AttributionTable } from "@/components/admin/AttributionTable";
import { TrendChart } from "@/components/admin/TrendChart";
import { Funnel, TrendingUp, Globe } from "lucide-react";

interface FunnelStep {
  event_type: string;
  label: string;
  count: number;
  unique_users: number;
  conversion_rate: number;
}

interface TrendPoint {
  day: string;
  page_views: number;
  signups: number;
  conversions: number;
}

interface FunnelData {
  steps: FunnelStep[];
  trend: TrendPoint[];
  period: { start: string; end: string; days: number };
  total_visitors: number;
}

interface AttributionRow {
  key: string;
  visitors: number;
  signups: number;
  activations: number;
  conversions: number;
  signup_rate: number;
  activation_rate: number;
  conversion_rate: number;
}

interface AttributionData {
  rows: AttributionRow[];
  group_by: string;
}

export default function AnalyticsPage() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [attributionData, setAttributionData] = useState<AttributionData | null>(null);
  const [days, setDays] = useState("30");
  const [groupBy, setGroupBy] = useState("source");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/analytics/funnel?days=${days}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/attribution?days=${days}&group_by=${groupBy}`).then((r) =>
        r.json()
      ),
    ])
      .then(([funnel, attribution]) => {
        setFunnelData(funnel);
        setAttributionData(attribution);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days, groupBy]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Conversion Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Full-funnel tracking from page view to paid conversion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Conversion Metrics */}
      {funnelData && (
        <ConversionMetrics
          steps={funnelData.steps}
          totalVisitors={funnelData.total_visitors}
        />
      )}

      {/* Daily Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-lg">Daily Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart data={funnelData?.trend ?? []} />
        </CardContent>
      </Card>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Funnel className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={funnelData?.steps ?? []} />
        </CardContent>
      </Card>

      {/* UTM Attribution */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">UTM Attribution</CardTitle>
            </div>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="source">By Source</SelectItem>
                <SelectItem value="medium">By Medium</SelectItem>
                <SelectItem value="campaign">By Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <AttributionTable
            rows={attributionData?.rows ?? []}
            groupBy={attributionData?.group_by ?? groupBy}
          />
        </CardContent>
      </Card>
    </div>
  );
}
