"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface WorkflowAction {
  type: string;
  config: {
    title: string;
    description: string;
    priority: string;
    execution_type: string;
    estimated_duration_minutes: number;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  enabled: boolean;
  trigger_type: string;
  actions: WorkflowAction[];
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
}

interface ExecutionStep {
  step: number;
  action: string;
  title: string;
  status: "pending" | "running" | "success" | "failed";
  started_at?: string;
  completed_at?: string;
  task_id?: string;
  error?: string;
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  async function fetchWorkflow() {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
      } else {
        toast.error("Failed to load workflow");
        router.push("/dashboard/workflows");
      }
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow");
    } finally {
      setLoading(false);
    }
  }

  async function executeWorkflow() {
    if (!workflow) return;

    setExecuting(true);

    // Initialize execution steps
    const steps: ExecutionStep[] = workflow.actions.map((action, index) => ({
      step: index + 1,
      action: action.type,
      title: action.config.title,
      status: "pending",
    }));
    setExecutionSteps(steps);
    setCurrentStep(0);

    try {
      // Execute each action sequentially
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];

        // Update step to running
        setExecutionSteps(prev =>
          prev.map((step, idx) =>
            idx === i ? { ...step, status: "running", started_at: new Date().toISOString() } : step
          )
        );
        setCurrentStep(i);

        // Execute the action
        try {
          if (action.type === "create_task") {
            // Create task via API
            const taskResponse = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: action.config.title,
                description: action.config.description,
                priority: action.config.priority,
                execution_type: action.config.execution_type,
                source_type: "workflow",
                workflow_id: workflowId,
              }),
            });

            if (taskResponse.ok) {
              const taskData = await taskResponse.json();

              // Update step to success
              setExecutionSteps(prev =>
                prev.map((step, idx) =>
                  idx === i
                    ? {
                        ...step,
                        status: "success",
                        completed_at: new Date().toISOString(),
                        task_id: taskData.task?.id,
                      }
                    : step
                )
              );
            } else {
              throw new Error("Failed to create task");
            }
          }

          // Small delay between steps for better UX
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          // Update step to failed
          setExecutionSteps(prev =>
            prev.map((step, idx) =>
              idx === i
                ? {
                    ...step,
                    status: "failed",
                    completed_at: new Date().toISOString(),
                    error: error.message,
                  }
                : step
            )
          );

          toast.error(`Step ${i + 1} failed: ${action.config.title}`);
          break; // Stop execution on first failure
        }
      }

      // Check if all steps succeeded
      const allSucceeded = executionSteps.every(s => s.status === "success" || s.status === "running");
      if (allSucceeded) {
        toast.success(`Workflow "${workflow.name}" completed successfully!`);
        toast.success(`Created ${workflow.actions.length} tasks`);
      }

      // Refresh workflow data to update run counts
      await fetchWorkflow();
    } catch (error) {
      console.error("Workflow execution error:", error);
      toast.error("Workflow execution failed");
    } finally {
      setExecuting(false);
      setCurrentStep(-1);
    }
  }

  function getStepIcon(status: string) {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Workflow not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/workflows">Back to Workflows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/workflows")}
          className="text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflows
        </Button>
      </div>

      {/* Workflow Info Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{workflow.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                    {workflow.name}
                  </CardTitle>
                  <Badge
                    variant={workflow.enabled ? "default" : "secondary"}
                    className={
                      workflow.enabled
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }
                  >
                    {workflow.enabled ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{workflow.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {workflow.actions.length} steps
                  </span>
                  <span>·</span>
                  <span>{workflow.total_runs} runs</span>
                  <span>·</span>
                  <span>
                    {workflow.total_runs > 0
                      ? `${Math.round((workflow.successful_runs / workflow.total_runs) * 100)}% success rate`
                      : "No runs yet"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={executeWorkflow}
              disabled={!workflow.enabled || executing}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Workflow
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Steps */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Workflow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(executionSteps.length > 0 ? executionSteps : workflow.actions.map((action, idx) => ({
              step: idx + 1,
              action: action.type,
              title: action.config.title,
              status: "pending" as const,
            }))).map((step, index) => {
              const action = workflow.actions[index];
              const isActive = currentStep === index;

              return (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    isActive
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  } transition-colors`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        Step {step.step}: {step.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {action.config.execution_type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          action.config.priority === "high"
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {action.config.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {action.config.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{action.config.estimated_duration_minutes} min
                      </span>
                      {step.task_id && (
                        <Link
                          href={`/dashboard/tasks`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View created task →
                        </Link>
                      )}
                    </div>
                    {step.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Error: {step.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {executionSteps.length > 0 && executionSteps.every(s => s.status !== "pending" && s.status !== "running") && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setExecutionSteps([]);
              setCurrentStep(-1);
            }}
            className="border-slate-200 dark:border-slate-800"
          >
            Clear Results
          </Button>
          <Button asChild>
            <Link href="/dashboard/tasks">View Created Tasks</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
