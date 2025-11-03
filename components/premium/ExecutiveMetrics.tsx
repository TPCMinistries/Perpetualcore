"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Zap } from "lucide-react";

// Sample data - in production, this would come from your analytics API
const revenueData = [
  { month: "Jan", revenue: 45000, target: 40000 },
  { month: "Feb", revenue: 52000, target: 45000 },
  { month: "Mar", revenue: 48000, target: 50000 },
  { month: "Apr", revenue: 61000, target: 55000 },
  { month: "May", revenue: 68000, target: 60000 },
  { month: "Jun", revenue: 75000, target: 65000 },
];

const userGrowthData = [
  { week: "Week 1", users: 1240 },
  { week: "Week 2", users: 1380 },
  { week: "Week 3", users: 1520 },
  { week: "Week 4", users: 1890 },
];

const usageBreakdownData = [
  { name: "AI Chat", value: 45, color: "#3b82f6" },
  { name: "Documents", value: 25, color: "#a855f7" },
  { name: "Search", value: 15, color: "#22c55e" },
  { name: "Workflows", value: 10, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#6b7280" },
];

const performanceData = [
  { metric: "Response Time", value: 245, unit: "ms" },
  { metric: "Uptime", value: 99.98, unit: "%" },
  { metric: "API Calls", value: 847250, unit: "" },
  { metric: "Data Processed", value: 12.4, unit: "TB" },
];

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  trend: "up" | "down";
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  const isPositive = trend === "up";

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ExecutiveMetrics() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Revenue"
          value="$75,000"
          change={15.3}
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Active Users"
          value="1,890"
          change={24.1}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Engagement Rate"
          value="87%"
          change={8.2}
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="AI Queries/Day"
          value="12,450"
          change={31.5}
          icon={Zap}
          trend="up"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Revenue Performance</CardTitle>
          <CardDescription>Monthly revenue vs target over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                stroke="#888888"
              />
              <YAxis
                className="text-xs"
                stroke="#888888"
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorTarget)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Active users over the past 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  stroke="#888888"
                />
                <YAxis
                  className="text-xs"
                  stroke="#888888"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [value.toLocaleString(), "Users"]}
                />
                <Bar
                  dataKey="users"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Breakdown */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>Distribution of platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={usageBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {usageBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {usageBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
          <CardDescription>Real-time system metrics and health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {performanceData.map((metric, index) => (
              <div key={index} className="p-4 rounded-lg bg-background border-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {metric.metric}
                </p>
                <p className="text-2xl font-bold">
                  {metric.value.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
