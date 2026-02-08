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
import { Target, ArrowLeft, RefreshCw } from "lucide-react";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { PlanCard } from "@/components/agent/PlanCard";
import type { AgentPlan, PlanStatus } from "@/lib/agents/executor/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "running", label: "Running" },
  { value: "paused", label: "Needs Approval" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AgentPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<AgentPlan[]>([]);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/agent/plans"
          : `/api/agent/plans?status=${filter}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true);
    loadPlans();
  }, [filter, loadPlans]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadPlans();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadPlans]);

  function handleRefresh() {
    setRefreshing(true);
    loadPlans();
  }

  // Compute stats
  const stats = [
    { label: "total", value: plans.length },
    { label: "running", value: plans.filter((p) => p.status === "running").length },
    { label: "needs approval", value: plans.filter((p) => p.status === "paused").length },
    { label: "completed", value: plans.filter((p) => p.status === "completed").length },
  ];

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="5xl">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        title="Agent Plans"
        subtitle="Multi-step plans your AI agent is executing autonomously"
        icon={Target}
        iconColor="indigo"
        stats={stats}
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
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
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

      {/* Plan list */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="text-center py-16">
          <Target className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No agent plans yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Ask your AI to delegate a complex task and it will create a multi-step
            plan that executes autonomously.
          </p>
        </div>
      )}
    </DashboardPageWrapper>
  );
}
