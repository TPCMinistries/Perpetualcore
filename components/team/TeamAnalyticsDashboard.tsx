"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Activity,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  summary: {
    total_members: number;
    active_members: number;
    total_activities: number;
    activity_by_type: Record<string, number>;
  };
  most_active_members: Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    activity_count: number;
  }>;
  activity_trend: Array<{
    date: string;
    count: number;
  }>;
}

export default function TeamAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/analytics?days=${timeRange}`);
      if (!response.ok) throw new Error("Failed to load analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getTrendIcon(current: number, previous: number) {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-500" />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No analytics data available</h3>
            <p className="text-sm text-muted-foreground">
              Analytics will appear as your team becomes more active
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activityRate = analytics.summary.total_members > 0
    ? Math.round((analytics.summary.active_members / analytics.summary.total_members) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Team Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Insights into your team's activity and performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_members}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.active_members} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityRate}%</div>
            <p className="text-xs text-muted-foreground">
              of members active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_activities}</div>
            <p className="text-xs text-muted-foreground">
              in last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.activity_by_type.document_upload || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
            <CardDescription>Activities by type in the last {timeRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.summary.activity_by_type)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm capitalize">
                        {type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              {Object.keys(analytics.summary.activity_by_type).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activities yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Active Members</CardTitle>
            <CardDescription>Top contributors in the last {timeRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.most_active_members.length > 0 ? (
                analytics.most_active_members.map((member, index) => (
                  <div key={member.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-4">
                        #{index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs">
                          {getInitials(member.full_name || member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.full_name || member.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.activity_count} activities</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend */}
      {analytics.activity_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>Daily activity over the last {timeRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-32">
                {analytics.activity_trend.map((day, index) => {
                  const maxCount = Math.max(...analytics.activity_trend.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute -top-8 hidden group-hover:block bg-popover border rounded px-2 py-1 text-xs">
                        {day.count} activities
                        <div className="text-muted-foreground">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(analytics.activity_trend[0]?.date).toLocaleDateString()}
                </span>
                <span>
                  {new Date(analytics.activity_trend[analytics.activity_trend.length - 1]?.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
