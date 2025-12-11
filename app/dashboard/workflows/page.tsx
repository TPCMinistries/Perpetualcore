"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Workflow, Plus, Search, Play, Pause, Trash2, Edit, Eye, Clock, CheckCircle2, XCircle, Zap } from "lucide-react";
import { WorkflowsPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WorkflowType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  enabled: boolean;
  trigger_type: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  created_at: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Workflows" },
    { id: "automation", label: "Automation" },
    { id: "content", label: "Content" },
    { id: "analysis", label: "Analysis" },
    { id: "support", label: "Support" },
  ];

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    let filtered = workflows;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((w) =>
        w.name.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query)
      );
    }

    setFilteredWorkflows(filtered);
  }, [selectedCategory, workflows, searchQuery]);

  async function fetchWorkflows() {
    try {
      const response = await fetch("/api/workflows");
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
        setFilteredWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }

  async function toggleWorkflow(id: string, currentState: boolean) {
    setTogglingId(id);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentState }),
      });

      if (response.ok) {
        toast.success(currentState ? "Workflow paused" : "Workflow enabled");
        fetchWorkflows();
      } else {
        toast.error("Failed to update workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteWorkflow(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Workflow deleted");
        fetchWorkflows();
      } else {
        toast.error("Failed to delete workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  }

  async function executeWorkflow(id: string, name: string) {
    try {
      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: {} }),
      });

      if (response.ok) {
        toast.success(`Executing "${name}"...`);
        fetchWorkflows();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to execute workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  function getSuccessRate(workflow: WorkflowType) {
    if (workflow.total_runs === 0) return 0;
    return Math.round((workflow.successful_runs / workflow.total_runs) * 100);
  }

  function getTriggerBadge(triggerType: string) {
    const configs: { [key: string]: { label: string; className: string } } = {
      manual: { label: "Manual", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      schedule: { label: "Scheduled", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      webhook: { label: "Webhook", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      event: { label: "Event", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    };

    const config = configs[triggerType] || configs.manual;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  }

  if (loading) {
    return <WorkflowsPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Workflow className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Workflows
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Multi-step automation recipes that orchestrate complex processes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="border-slate-200 dark:border-slate-800">
              <Link href="/dashboard/workflows/templates">
                <Zap className="mr-2 h-4 w-4" />
                Browse Templates
              </Link>
            </Button>
            <Button asChild className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
              <Link href="/dashboard/workflows/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
          >
            {category.label}
            {category.id !== "all" && (
              <Badge variant="secondary" className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {workflows.filter((w) => w.category === category.id).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <div>
          <EmptyState
            icon={Workflow}
            title={workflows.length === 0 ? "No workflows yet" : "No workflows found"}
            description={workflows.length === 0 ? "Workflows break complex processes into sequential steps (like onboarding employees or launching products). Start with a template or build your own." : "Try a different search term or category"}
          />
          {workflows.length === 0 && (
            <div className="flex gap-2 justify-center mt-6">
              <Button asChild>
                <Link href="/dashboard/workflows/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/workflows/templates">
                  Browse Templates
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{workflow.icon}</div>
                  <div className="flex gap-1">
                    {getTriggerBadge(workflow.trigger_type)}
                    <Badge variant={workflow.enabled ? "default" : "secondary"} className={workflow.enabled ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"}>
                      {workflow.enabled ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-slate-100">{workflow.name}</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {workflow.description || "No description"}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{workflow.total_runs}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Total Runs</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{getSuccessRate(workflow)}%</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Success</div>
                    </div>
                  </div>
                </div>

                {workflow.last_run_at && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last run: {new Date(workflow.last_run_at).toLocaleDateString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-4">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                    disabled={!workflow.enabled}
                    className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWorkflow(workflow.id, workflow.enabled)}
                    disabled={togglingId === workflow.id}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    {workflow.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteWorkflow(workflow.id, workflow.name)}
                    disabled={deletingId === workflow.id}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
