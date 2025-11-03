"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Clock,
  Play,
  Save,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Settings,
  Terminal,
  History,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ScheduledJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const [config, setConfig] = useState({
    name: "",
    description: "",
    job_type: "script",
    cron_expression: "0 0 * * *",
    script_content: "",
    enabled: true,
    timeout_seconds: 300,
    max_retries: 3,
    retry_delay_seconds: 60,
    notify_on_failure: true,
    notify_on_success: false,
  });

  const [history, setHistory] = useState([
    {
      id: "1",
      started_at: "2024-01-15T10:00:00Z",
      completed_at: "2024-01-15T10:05:32Z",
      status: "success",
      duration_seconds: 332,
      error_message: null,
    },
    {
      id: "2",
      started_at: "2024-01-14T10:00:00Z",
      completed_at: "2024-01-14T10:04:12Z",
      status: "success",
      duration_seconds: 252,
      error_message: null,
    },
    {
      id: "3",
      started_at: "2024-01-13T10:00:00Z",
      completed_at: "2024-01-13T10:00:45Z",
      status: "failed",
      duration_seconds: 45,
      error_message: "Connection timeout to external API",
    },
  ]);

  const [logs, setLogs] = useState([
    { timestamp: "2024-01-15T10:00:00Z", level: "info", message: "Job started" },
    { timestamp: "2024-01-15T10:00:01Z", level: "info", message: "Connecting to database..." },
    { timestamp: "2024-01-15T10:00:02Z", level: "info", message: "Database connected successfully" },
    { timestamp: "2024-01-15T10:05:30Z", level: "info", message: "Processing completed" },
    { timestamp: "2024-01-15T10:05:32Z", level: "info", message: "Job completed successfully" },
  ]);

  const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every 30 minutes", value: "*/30 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every day at 9 AM", value: "0 9 * * *" },
    { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
    { label: "Custom", value: "custom" },
  ];

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function loadJob() {
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig({
          name: data.name || "",
          description: data.description || "",
          job_type: data.job_type || "script",
          cron_expression: data.cron_expression || "0 0 * * *",
          script_content: data.config?.script_content || "",
          enabled: data.enabled ?? true,
          timeout_seconds: data.config?.timeout_seconds || 300,
          max_retries: data.config?.max_retries || 3,
          retry_delay_seconds: data.config?.retry_delay_seconds || 60,
          notify_on_failure: data.config?.notify_on_failure ?? true,
          notify_on_success: data.config?.notify_on_success ?? false,
        });
      }
    } catch (error) {
      console.error("Error loading job:", error);
      toast.error("Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          job_type: config.job_type,
          cron_expression: config.cron_expression,
          enabled: config.enabled,
          config: {
            script_content: config.script_content,
            timeout_seconds: config.timeout_seconds,
            max_retries: config.max_retries,
            retry_delay_seconds: config.retry_delay_seconds,
            notify_on_failure: config.notify_on_failure,
            notify_on_success: config.notify_on_success,
          },
        }),
      });

      if (response.ok) {
        toast.success("Job updated successfully");
        loadJob();
      } else {
        toast.error("Failed to update job");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}/run`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Job started successfully");
        // Refresh history after a delay
        setTimeout(() => loadJob(), 2000);
      } else {
        toast.error("Failed to start job");
      }
    } catch (error) {
      console.error("Error running job:", error);
      toast.error("An error occurred");
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Job deleted successfully");
        router.push("/dashboard/scheduled-jobs");
      } else {
        toast.error("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("An error occurred");
    }
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  function getStatusBadge(status: string) {
    const variants = {
      success: { icon: CheckCircle, className: "bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
      failed: { icon: XCircle, className: "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
      running: { icon: Loader2, className: "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" },
    };
    const config = variants[status as keyof typeof variants] || variants.running;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className={`h-3 w-3 mr-1 ${status === "running" ? "animate-spin" : ""}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/scheduled-jobs">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-900 via-yellow-800 to-orange-900 dark:from-amber-100 dark:via-yellow-100 dark:to-orange-100 bg-clip-text text-transparent">
                  {config.name || "Scheduled Job"}
                </h1>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  {config.description || "No description"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunNow}
                disabled={running}
                variant="outline"
                className="gap-2"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-md gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Scheduled Job</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this job? This action cannot be undone
                      and all execution history will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Job
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Execution History
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Terminal className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <AlertCircle className="h-4 w-4 mr-2" />
            Advanced Settings
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name *</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="Daily Backup Job"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={config.job_type}
                    onValueChange={(value) => setConfig({ ...config, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="api_call">API Call</SelectItem>
                      <SelectItem value="database_query">Database Query</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Describe what this job does..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium">Enable Job</p>
                  <p className="text-sm text-muted-foreground">
                    Job will run automatically based on the schedule
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Schedule Preset</Label>
                <Select
                  value={cronPresets.find(p => p.value === config.cron_expression)?.value || "custom"}
                  onValueChange={(value) => {
                    if (value !== "custom") {
                      setConfig({ ...config, cron_expression: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cronPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  value={config.cron_expression}
                  onChange={(e) => setConfig({ ...config, cron_expression: e.target.value })}
                  placeholder="0 0 * * *"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Format: minute hour day month weekday
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Next Run
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This job will run next at approximately 12:00 AM tomorrow
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script">Script / Code</Label>
                <Textarea
                  id="script"
                  value={config.script_content}
                  onChange={(e) => setConfig({ ...config, script_content: e.target.value })}
                  placeholder="// Enter your script code here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                      </div>
                      {getStatusBadge(run.status)}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(run.duration_seconds)}
                        </span>
                      </div>
                    </div>
                    {run.error_message && (
                      <div className="text-sm text-red-600 dark:text-red-400 max-w-md truncate">
                        {run.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution Logs</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={
                      log.level === "error" ? "text-red-400" :
                      log.level === "warn" ? "text-yellow-400" :
                      "text-green-400"
                    }>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retry & Timeout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.timeout_seconds}
                    onChange={(e) => setConfig({ ...config, timeout_seconds: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Max Retries</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={config.max_retries}
                    onChange={(e) => setConfig({ ...config, max_retries: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry_delay">Retry Delay (seconds)</Label>
                  <Input
                    id="retry_delay"
                    type="number"
                    value={config.retry_delay_seconds}
                    onChange={(e) => setConfig({ ...config, retry_delay_seconds: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Notify on Failure</p>
                  <p className="text-sm text-muted-foreground">
                    Send notification when job fails
                  </p>
                </div>
                <Switch
                  checked={config.notify_on_failure}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_failure: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Notify on Success</p>
                  <p className="text-sm text-muted-foreground">
                    Send notification when job completes successfully
                  </p>
                </div>
                <Switch
                  checked={config.notify_on_success}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, notify_on_success: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
