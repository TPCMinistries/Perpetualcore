"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Target,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { DashboardPageWrapper } from "@/components/ui/dashboard-header";
import { PlanStatusBadge } from "@/components/agent/PlanStatusBadge";
import { PlanStepTimeline } from "@/components/agent/PlanStepTimeline";
import type { AgentPlan } from "@/lib/agents/executor/types";

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/plans?status=all`);
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data = await res.json();
      const found = (data.plans || []).find((p: AgentPlan) => p.id === id);
      if (found) {
        setPlan(found);
      } else {
        toast.error("Plan not found");
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      toast.error("Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Auto-refresh every 5 seconds while plan is active
  useEffect(() => {
    if (!plan) return;
    const isActive = plan.status === "running" || plan.status === "planning";
    if (!isActive) return;

    const interval = setInterval(() => {
      loadPlan();
    }, 5000);

    return () => clearInterval(interval);
  }, [plan?.status, loadPlan]);

  async function handleApproval(action: "approve" | "reject") {
    if (!plan) return;

    const isApprove = action === "approve";
    isApprove ? setApproving(true) : setRejecting(true);

    try {
      const res = await fetch(`/api/agent/plans/${plan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process approval");
      }

      toast.success(
        isApprove ? "Step approved. Plan resuming." : "Step rejected. Plan cancelled."
      );

      // Reload plan to get updated status
      await loadPlan();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to process approval";
      toast.error(message);
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  }

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="5xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardPageWrapper>
    );
  }

  if (!plan) {
    return (
      <DashboardPageWrapper maxWidth="5xl">
        <div className="text-center py-16">
          <Target className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Plan not found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            This plan may have been deleted or you don&apos;t have access.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard/agent/plans")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
        </div>
      </DashboardPageWrapper>
    );
  }

  // Find the step awaiting approval
  const awaitingStep = plan.steps.find((s) => s.status === "awaiting_approval");
  const completedSteps = plan.steps.filter((s) => s.status === "completed").length;

  return (
    <DashboardPageWrapper maxWidth="5xl">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/agent/plans")}
          className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All Plans
        </Button>
      </div>

      {/* Plan header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <PlanStatusBadge status={plan.status} />
                {(plan.status === "running" || plan.status === "planning") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadPlan}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {plan.goal}
              </h1>
            </div>
          </div>

          {/* Meta stats */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Created {getRelativeTime(plan.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {completedSteps}/{plan.steps.length} steps
            </span>
            {plan.total_cost > 0 && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                ${plan.total_cost.toFixed(4)}
              </span>
            )}
            {plan.completed_at && (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Completed {getRelativeTime(plan.completed_at)}
              </span>
            )}
          </div>

          {plan.error_message && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                {plan.error_message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval section */}
      {plan.status === "paused" && awaitingStep && (
        <Card className="mb-6 border-amber-300 dark:border-amber-700">
          <CardHeader className="border-b border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              Step {awaitingStep.id.replace("step_", "")} requires your approval
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {awaitingStep.tool}
                </span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white">
                {awaitingStep.description}
              </p>
              {Object.keys(awaitingStep.args).length > 0 && (
                <pre className="text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto font-mono text-slate-700 dark:text-slate-300">
                  {JSON.stringify(awaitingStep.args, null, 2)}
                </pre>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => handleApproval("approve")}
                  disabled={approving || rejecting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {approving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve & Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleApproval("reject")}
                  disabled={approving || rejecting}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20 gap-2"
                >
                  {rejecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject & Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step timeline */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <CardTitle className="text-base">Execution Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {plan.steps.length > 0 ? (
            <PlanStepTimeline
              steps={plan.steps}
              stepResults={plan.step_results || {}}
            />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No steps yet. Plan is being decomposed...
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardPageWrapper>
  );
}
