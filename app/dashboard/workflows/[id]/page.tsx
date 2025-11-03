"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Play, Settings, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  nodes: any[];
  edges: any[];
  trigger_type: string;
  enabled: boolean;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_data: any;
  output_data: any;
  error_message: string | null;
  error_node_id: string | null;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputData, setInputData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  useEffect(() => {
    if (activeTab === "executions") {
      fetchExecutions();
    }
  }, [activeTab, workflowId]);

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
      toast.error("An error occurred");
      router.push("/dashboard/workflows");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExecutions() {
    try {
      setExecutionsLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}/execute`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setExecutionsLoading(false);
    }
  }

  // Get input fields from workflow nodes
  function getInputFields() {
    if (!workflow || !workflow.nodes) return [];
    const inputNode = workflow.nodes.find((node: any) => node.type === "input");

    // Debug logging
    console.log("=== WORKFLOW NODES DEBUG ===");
    console.log("All nodes:", workflow.nodes);
    console.log("Input node found:", inputNode);
    console.log("Input node data:", inputNode?.data);
    console.log("Fields:", inputNode?.data?.fields);
    console.log("=========================");

    return inputNode?.data?.fields || [];
  }

  // Handle Run Workflow button click - open dialog if there are input fields
  function handleRunWorkflow() {
    const fields = getInputFields();
    if (fields.length > 0) {
      // Initialize input data with empty values
      const initialData: Record<string, any> = {};
      fields.forEach((field: any) => {
        initialData[field.name] = "";
      });
      setInputData(initialData);
      setShowInputDialog(true);
    } else {
      // No input fields, run directly
      executeWorkflow({});
    }
  }

  // Execute the workflow with given input data
  async function executeWorkflow(data: Record<string, any>) {
    try {
      toast.loading("Starting workflow execution...", { id: "workflow-execution" });

      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputData: data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Workflow execution started successfully!", { id: "workflow-execution" });

        // Close dialog
        setShowInputDialog(false);

        // Refresh workflow data and executions to show updated data
        setTimeout(() => {
          fetchWorkflow();
          if (activeTab === "executions") {
            fetchExecutions();
          }
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to start workflow execution", {
          id: "workflow-execution",
        });
      }
    } catch (error) {
      toast.error("An error occurred while starting the workflow", {
        id: "workflow-execution",
      });
    }
  }

  // Handle form submission
  function handleSubmitInput() {
    const fields = getInputFields();

    // Validate required fields
    for (const field of fields) {
      if (field.required && !inputData[field.name]) {
        toast.error(`${field.label || field.name} is required`);
        return;
      }
    }

    // Execute workflow with input data
    executeWorkflow(inputData);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function formatDuration(ms: number | null) {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 border border-purple-100 dark:border-purple-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/workflows">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workflows
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{workflow.icon}</div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-pink-800 to-orange-900 dark:from-purple-100 dark:via-pink-100 dark:to-orange-100 bg-clip-text text-transparent">
                    {workflow.name}
                  </div>
                  <Badge variant={workflow.enabled ? "default" : "secondary"}>
                    {workflow.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  {workflow.category && <Badge variant="outline">{workflow.category}</Badge>}
                </div>
                {workflow.description && (
                  <p className="text-purple-700 dark:text-purple-300 text-sm max-w-2xl">{workflow.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRunWorkflow} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Play className="mr-2 h-4 w-4" />
                Run Workflow
              </Button>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Input Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Input</DialogTitle>
            <DialogDescription>
              Please provide the required information to run this workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {getInputFields().map((field: any) => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                  {field.label || field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={inputData[field.name] || ""}
                    onChange={(e) =>
                      setInputData({ ...inputData, [field.name]: e.target.value })
                    }
                    rows={4}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={inputData[field.name] || ""}
                    onValueChange={(value) =>
                      setInputData({ ...inputData, [field.name]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "number" ? (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    value={inputData[field.name] || ""}
                    onChange={(e) =>
                      setInputData({ ...inputData, [field.name]: e.target.value })
                    }
                  />
                ) : (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={inputData[field.name] || ""}
                    onChange={(e) =>
                      setInputData({ ...inputData, [field.name]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInputDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitInput} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Play className="mr-2 h-4 w-4" />
              Run Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{workflow.total_runs}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{workflow.successful_runs}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{workflow.failed_runs}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Last Run</CardTitle></CardHeader><CardContent><div className="text-sm">{workflow.last_run_at ? new Date(workflow.last_run_at).toLocaleString() : "Never"}</div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Workflow Structure</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎨</div>
                  <div className="text-xl font-semibold">Visual Workflow Builder</div>
                  <p className="text-muted-foreground max-w-md">The drag-and-drop visual workflow builder is coming soon!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              {executionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No executions yet. Run the workflow to see execution history.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(execution.status)}
                            <span className="text-xs text-muted-foreground">
                              {execution.id.substring(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Started {new Date(execution.started_at).toLocaleString()}
                          </div>
                          {execution.error_message && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {execution.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDuration(execution.duration_ms)}
                        </div>
                        {execution.completed_at && (
                          <div className="text-xs text-muted-foreground">
                            Completed {new Date(execution.completed_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
