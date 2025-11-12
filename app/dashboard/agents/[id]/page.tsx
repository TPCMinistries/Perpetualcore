"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  Settings as SettingsIcon,
  Trash2,
  Play,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  personality: string;
  instructions: string | null;
  enabled: boolean;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  last_active_at: string | null;
  created_at: string;
}

interface AgentAction {
  id: string;
  action_type: string;
  action_data: any;
  status: "success" | "failed" | "pending";
  error_message: string | null;
  task_id: string | null;
  created_at: string;
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchAgentData();
  }, [params.id]);

  async function fetchAgentData() {
    try {
      // Fetch agent details
      const agentRes = await fetch(`/api/agents/${params.id}`);
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgent(agentData.agent);
      }

      // Fetch agent actions
      const actionsRes = await fetch(`/api/agents/${params.id}/actions`);
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setActions(actionsData.actions || []);
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
      toast.error("Failed to load agent data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAgent() {
    if (!agent) return;

    try {
      const response = await fetch(`/api/agents/${params.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !agent.enabled }),
      });

      if (response.ok) {
        setAgent({ ...agent, enabled: !agent.enabled });
        toast.success(`Agent ${!agent.enabled ? "enabled" : "disabled"}`);
      } else {
        toast.error("Failed to update agent");
      }
    } catch (error) {
      console.error("Error toggling agent:", error);
      toast.error("Failed to update agent");
    }
  }

  async function runAgent() {
    if (!agent) return;

    setRunning(true);

    try {
      const response = await fetch(`/api/agents/${params.id}/run`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        // Refresh agent data to show updated last_active_at and stats
        fetchAgentData();
      } else {
        toast.error(data.error || data.message || "Failed to run agent");
      }
    } catch (error) {
      console.error("Error running agent:", error);
      toast.error("Failed to run agent");
    } finally {
      setRunning(false);
    }
  }

  async function deleteAgent() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/agents/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Agent deleted successfully");
        router.push("/dashboard/agents");
      } else {
        toast.error("Failed to delete agent");
        setDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
      setDeleting(false);
    }
  }

  function getSuccessRate() {
    if (!agent || agent.total_actions === 0) return 0;
    return Math.round((agent.successful_actions / agent.total_actions) * 100);
  }

  function getActionIcon(actionType: string) {
    switch (actionType) {
      case "create_task":
        return "✓";
      case "send_email":
        return "✉";
      case "create_reminder":
        return "🔔";
      case "update_document":
        return "📄";
      case "schedule_meeting":
        return "📅";
      case "analyze_sentiment":
        return "💭";
      case "send_notification":
        return "🔔";
      default:
        return "•";
    }
  }

  function formatActionType(type: string) {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Agent not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/agents">Back to Agents</Link>
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
          onClick={() => router.push("/dashboard/agents")}
          className="text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>

      {/* Agent Info Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {agent.name}
                  </h1>
                  <Badge
                    variant={agent.enabled ? "default" : "secondary"}
                    className={
                      agent.enabled
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }
                  >
                    {agent.enabled ? "Active" : "Paused"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formatActionType(agent.agent_type)}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  {agent.description || "No description provided"}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>Personality: {agent.personality}</span>
                  {agent.last_active_at && (
                    <span>Last active: {formatTimestamp(agent.last_active_at)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{agent.enabled ? "Active" : "Paused"}</span>
                <Switch checked={agent.enabled} onCheckedChange={toggleAgent} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={runAgent}
                disabled={running || !agent.enabled}
                className="border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-300 dark:border-slate-700"
              >
                <Link href={`/dashboard/agents/${params.id}/settings`}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{agent.name}"? This action cannot be
                      undone. All action history will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAgent}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Agent"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Actions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {agent.total_actions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Successful</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {agent.successful_actions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {agent.failed_actions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {getSuccessRate()}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Tab */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
          <CardDescription>Actions performed by this agent</CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No actions yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                This agent hasn't performed any actions yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="text-2xl">{getActionIcon(action.action_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatActionType(action.action_type)}
                      </span>
                      <Badge
                        variant={
                          action.status === "success"
                            ? "default"
                            : action.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {action.status}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {formatTimestamp(action.created_at)}
                      </span>
                    </div>
                    {action.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {action.error_message}
                      </p>
                    )}
                    {action.task_id && (
                      <Link
                        href={`/dashboard/tasks`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View created task →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
