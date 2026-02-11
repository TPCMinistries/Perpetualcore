"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  UserPlus,
  AlertTriangle,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface RevenueData {
  summary: {
    mrr: number;
    arr: number;
    total_customers: number;
    paid_customers: number;
    trial_customers: number;
    trial_conversion_rate: number;
    churn_rate: number;
    growth_rate: number;
    estimated_ltv: number;
    avg_subscription_age_days: number;
  };
  plan_distribution: Record<string, number>;
  revenue_by_plan: Array<{
    plan: string;
    monthly_revenue: number;
    annual_revenue: number;
    customer_count: number;
  }>;
  recent_activity: Array<{
    id: string;
    user_email: string;
    user_name: string;
    plan: string;
    status: string;
    created_at: string;
  }>;
  top_customers: Array<{
    user_email: string;
    user_name: string;
    plan: string;
    monthly_revenue: number;
  }>;
  invoices: {
    total_invoices: number;
    paid_invoices: number;
    open_invoices: number;
    total_revenue: number;
  };
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Failed to load analytics. You may not have admin access.
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-gray-600 mt-1">
          Revenue, growth, and platform health metrics
        </p>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/overview"
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-medium"
        >
          Overview
        </Link>
        <Link
          href="/dashboard/admin/usage"
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          AI Usage
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Users
        </Link>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={`$${summary.mrr.toLocaleString()}`}
          subtitle={`$${summary.arr.toLocaleString()} ARR`}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <MetricCard
          title="Paid Customers"
          value={summary.paid_customers.toString()}
          subtitle={`${summary.trial_customers} trialing`}
          icon={CreditCard}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MetricCard
          title="Growth Rate"
          value={`${summary.growth_rate > 0 ? "+" : ""}${summary.growth_rate.toFixed(1)}%`}
          subtitle="vs. last month"
          icon={summary.growth_rate >= 0 ? TrendingUp : TrendingDown}
          iconColor={summary.growth_rate >= 0 ? "text-green-600" : "text-red-600"}
          iconBg={summary.growth_rate >= 0 ? "bg-green-50" : "bg-red-50"}
        />
        <MetricCard
          title="Churn Rate"
          value={`${summary.churn_rate.toFixed(1)}%`}
          subtitle="last 30 days"
          icon={summary.churn_rate > 5 ? AlertTriangle : Users}
          iconColor={summary.churn_rate > 5 ? "text-amber-600" : "text-slate-600"}
          iconBg={summary.churn_rate > 5 ? "bg-amber-50" : "bg-slate-50"}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Trial Conversion"
          value={`${summary.trial_conversion_rate.toFixed(1)}%`}
          subtitle="of trials convert"
          icon={UserPlus}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <MetricCard
          title="Estimated LTV"
          value={`$${summary.estimated_ltv.toLocaleString()}`}
          subtitle={`avg ${summary.avg_subscription_age_days}d tenure`}
          icon={Crown}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <MetricCard
          title="Invoice Revenue"
          value={`$${data.invoices.total_revenue.toLocaleString()}`}
          subtitle={`${data.invoices.paid_invoices} paid / ${data.invoices.open_invoices} open`}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenue_by_plan.length === 0 ? (
              <p className="text-sm text-gray-500">No revenue data yet</p>
            ) : (
              <div className="space-y-3">
                {data.revenue_by_plan.map((plan) => (
                  <div
                    key={plan.plan}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium capitalize">{plan.plan}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({plan.customer_count} customers)
                      </span>
                    </div>
                    <span className="font-semibold">
                      ${plan.monthly_revenue.toLocaleString()}/mo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_customers.length === 0 ? (
              <p className="text-sm text-gray-500">No customers yet</p>
            ) : (
              <div className="space-y-3">
                {data.top_customers.slice(0, 5).map((customer, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {customer.user_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {customer.user_email}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-semibold">
                        ${customer.monthly_revenue.toLocaleString()}/mo
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {customer.plan}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Subscription Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Customer</th>
                    <th className="pb-2 font-medium text-gray-600">Plan</th>
                    <th className="pb-2 font-medium text-gray-600">Status</th>
                    <th className="pb-2 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_activity.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="font-medium">{item.user_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{item.user_email}</div>
                      </td>
                      <td className="py-2 capitalize">{item.plan}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "active"
                              ? "bg-green-100 text-green-700"
                              : item.status === "trialing"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "canceled"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof DollarSign;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
