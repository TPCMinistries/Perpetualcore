"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Workflow,
  Plus,
  Link2,
  Unlink,
  RefreshCw,
  Play,
  ExternalLink,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

interface N8nIntegration {
  id: string;
  n8n_instance_url: string;
  is_active: boolean;
  created_at: string;
  last_sync_at: string | null;
}

interface N8nWorkflow {
  id: string;
  n8n_workflow_id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  last_executed_at: string | null;
  execution_count: number;
}

interface N8nTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  install_count: number;
  tags: string[];
}

interface N8nExecution {
  id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  execution_time_ms: number;
}

export default function N8nPage() {
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState<N8nIntegration | null>(null);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [templates, setTemplates] = useState<N8nTemplate[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([
        loadIntegration(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadIntegration() {
    try {
      const response = await fetch("/api/n8n/connect");
      if (!response.ok) return;
      const data = await response.json();

      if (data.integrations && data.integrations.length > 0) {
        setIntegration(data.integrations[0]);
        await loadWorkflows();
        await loadExecutions();
      }
    } catch (error) {
      console.error("Error loading integration:", error);
    }
  }

  async function loadWorkflows() {
    try {
      const response = await fetch("/api/n8n/workflows");
      if (!response.ok) return;
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("Error loading workflows:", error);
    }
  }

  async function loadExecutions() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data } = await supabase
        .from("n8n_workflow_executions")
        .select(`
          id,
          status,
          started_at,
          execution_time_ms,
          n8n_workflows (name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("started_at", { ascending: false })
        .limit(10);

      setExecutions(
        (data || []).map((e: any) => ({
          id: e.id,
          workflow_name: e.n8n_workflows?.name || "Unknown",
          status: e.status,
          started_at: e.started_at,
          execution_time_ms: e.execution_time_ms,
        }))
      );
    } catch (error) {
      console.error("Error loading executions:", error);
    }
  }

  async function loadTemplates() {
    try {
      const response = await fetch("/api/n8n/templates");
      if (!response.ok) return;
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }

  async function handleConnect() {
    if (!instanceUrl.trim() || !apiKey.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch("/api/n8n/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n8n_instance_url: instanceUrl,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to connect");
      }

      toast.success("n8n instance connected successfully!");
      setConnectDialogOpen(false);
      setInstanceUrl("");
      setApiKey("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!integration) return;

    try {
      const response = await fetch(`/api/n8n/connect?integration_id=${integration.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      toast.success("n8n instance disconnected");
      setDisconnectDialogOpen(false);
      setIntegration(null);
      setWorkflows([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleSyncWorkflows() {
    setSyncing(true);
    try {
      const response = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync");
      }

      const data = await response.json();
      toast.success(`Synced ${data.synced || 0} workflows`);
      loadWorkflows();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleInstallTemplate(templateId: string) {
    try {
      const response = await fetch("/api/n8n/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to install template");
      }

      toast.success("Template installed successfully!");
      loadWorkflows();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-rose-950/20 border border-orange-100 dark:border-orange-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Workflow className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-900 via-red-800 to-rose-900 dark:from-orange-100 dark:via-red-100 dark:to-rose-100 bg-clip-text text-transparent">
                n8n Integration
              </h1>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Connect and manage your n8n workflows
              </p>
            </div>
          </div>
          {integration ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSyncWorkflows}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                Sync Workflows
              </Button>
              <Button
                variant="outline"
                onClick={() => setDisconnectDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-md">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect n8n
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect n8n Instance</DialogTitle>
                  <DialogDescription>
                    Enter your n8n instance URL and API key to enable workflow automation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="instance-url">Instance URL</Label>
                    <Input
                      id="instance-url"
                      placeholder="https://your-instance.n8n.cloud"
                      value={instanceUrl}
                      onChange={(e) => setInstanceUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your n8n cloud or self-hosted instance URL
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="n8n_api_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate an API key in n8n Settings → API
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {integration ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Connected to n8n</h3>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {integration.n8n_instance_url}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Connected {formatDistanceToNow(new Date(integration.created_at), { addSuffix: true })}</p>
                {integration.last_sync_at && (
                  <p className="text-xs">
                    Last synced {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  No n8n Instance Connected
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Connect your n8n instance to sync workflows and enable automation triggers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={integration ? "workflows" : "templates"}>
        <TabsList>
          <TabsTrigger value="workflows" className="gap-2" disabled={!integration}>
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="executions" className="gap-2" disabled={!integration}>
            <Activity className="h-4 w-4" />
            Executions
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Download className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4 mt-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No workflows synced</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Sync Workflows" to import your n8n workflows
                  </p>
                  <Button onClick={handleSyncWorkflows} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    Sync Workflows
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{workflow.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {workflow.trigger_type || "Manual trigger"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={workflow.is_active ? "default" : "secondary"}>
                        {workflow.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {workflow.execution_count || 0} runs
                      </span>
                      {workflow.last_executed_at && (
                        <span className="text-xs">
                          Last: {formatDistanceToNow(new Date(workflow.last_executed_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4 mt-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No executions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Workflow executions will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {execution.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : execution.status === "error" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                        )}
                        <div>
                          <p className="font-medium">{execution.workflow_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(execution.started_at), "MMM d, yyyy HH:mm:ss")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {execution.execution_time_ms && (
                          <span className="text-sm text-muted-foreground">
                            {(execution.execution_time_ms / 1000).toFixed(2)}s
                          </span>
                        )}
                        <Badge
                          variant={
                            execution.status === "success"
                              ? "default"
                              : execution.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Pre-built workflow templates to get started quickly
          </p>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No templates available</h3>
                  <p className="text-sm text-muted-foreground">
                    Templates will be available soon
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {template.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.install_count} installs
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleInstallTemplate(template.id)}
                        disabled={!integration}
                      >
                        Install
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Disconnect Confirmation */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect n8n Instance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this n8n instance? Synced workflows will remain but will no longer receive updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
