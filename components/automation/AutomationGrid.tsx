"use client";

import { AutomationCard } from "./AutomationCard";
import { Automation } from "./AutomationHub";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Workflow, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AutomationGridProps {
  automations: Automation[];
  loading: boolean;
  onRefresh: () => void;
}

export function AutomationGrid({ automations, loading, onRefresh }: AutomationGridProps) {
  const handleToggle = async (automation: Automation) => {
    try {
      const newStatus = automation.status === "active" ? "inactive" : "active";
      await fetch(`/api/automation/${automation.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Automation ${newStatus === "active" ? "enabled" : "disabled"}`);
      onRefresh();
    } catch (error) {
      toast.error("Failed to update automation");
    }
  };

  const handleDelete = async (automation: Automation) => {
    if (!confirm(`Delete "${automation.name}"? This cannot be undone.`)) return;

    try {
      await fetch(`/api/automation/${automation.id}`, { method: "DELETE" });
      toast.success("Automation deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete automation");
    }
  };

  const handleDuplicate = async (automation: Automation) => {
    try {
      await fetch(`/api/automation/${automation.id}/duplicate`, { method: "POST" });
      toast.success("Automation duplicated");
      onRefresh();
    } catch (error) {
      toast.error("Failed to duplicate automation");
    }
  };

  const handleRun = async (automation: Automation) => {
    try {
      await fetch(`/api/automation/${automation.id}/run`, { method: "POST" });
      toast.success("Automation started");
    } catch (error) {
      toast.error("Failed to run automation");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (automations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Workflow className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No automations found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Create your first automation to get started
        </p>
        <Link href="/dashboard/bots/new">
          <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {automations.map((automation) => (
        <AutomationCard
          key={automation.id}
          automation={automation}
          onToggle={() => handleToggle(automation)}
          onDelete={() => handleDelete(automation)}
          onDuplicate={() => handleDuplicate(automation)}
          onRun={() => handleRun(automation)}
        />
      ))}
    </div>
  );
}
