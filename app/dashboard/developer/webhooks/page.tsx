"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  MoreVertical,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Code,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  events: string[];
  is_active: boolean;
  secret: string;
  created_at: string;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: "success" | "failed" | "pending";
  response_code: number | null;
  response_time: number | null;
  attempts: number;
  created_at: string;
}

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);

  const [newWebhook, setNewWebhook] = useState({
    url: "",
    description: "",
    events: [] as string[],
  });

  const availableEvents = [
    { id: "agent.created", label: "Agent Created", description: "When a new AI agent is created" },
    { id: "agent.updated", label: "Agent Updated", description: "When an agent is modified" },
    { id: "agent.deleted", label: "Agent Deleted", description: "When an agent is removed" },
    { id: "workflow.started", label: "Workflow Started", description: "When a workflow execution begins" },
    { id: "workflow.completed", label: "Workflow Completed", description: "When a workflow finishes successfully" },
    { id: "workflow.failed", label: "Workflow Failed", description: "When a workflow execution fails" },
    { id: "knowledge.added", label: "Knowledge Added", description: "When new knowledge is uploaded" },
    { id: "knowledge.indexed", label: "Knowledge Indexed", description: "When knowledge indexing completes" },
    { id: "training.completed", label: "Training Completed", description: "When a training module is completed" },
    { id: "user.invited", label: "User Invited", description: "When a new team member is invited" },
  ];

  useEffect(() => {
    loadWebhooks();
    loadDeliveries();
  }, []);

  async function loadWebhooks() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWebhooks(data || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliveries() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setDeliveries(data || []);
    } catch (error) {
      console.error("Error loading deliveries:", error);
    }
  }

  async function handleCreateWebhook() {
    if (!newWebhook.url || !newWebhook.description || newWebhook.events.length === 0) {
      toast.error("Please fill in all required fields and select at least one event");
      return;
    }

    if (!newWebhook.url.startsWith("http://") && !newWebhook.url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create webhook");
      }

      const data = await response.json();
      toast.success("Webhook created successfully");
      setShowSecret(data.secret);
      loadWebhooks();
      setNewWebhook({ url: "", description: "", events: [] });
    } catch (error: any) {
      console.error("Error creating webhook:", error);
      toast.error(error.message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteWebhook(webhookId: string) {
    try {
      const response = await fetch(`/api/developer/webhooks/${webhookId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook");

      toast.success("Webhook deleted successfully");
      loadWebhooks();
      setDeleteWebhookId(null);
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Failed to delete webhook");
    }
  }

  async function handleTestWebhook(webhookId: string) {
    try {
      const response = await fetch(`/api/developer/webhooks/${webhookId}/test`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to send test webhook");

      toast.success("Test webhook sent! Check your endpoint.");
      loadDeliveries();
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast.error("Failed to send test webhook");
    }
  }

  function toggleEvent(eventId: string) {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((id) => id !== eventId)
        : [...prev.events, eventId],
    }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function getStatusBadge(status: string) {
    const variants = {
      success: { icon: CheckCircle2, className: "bg-green-50 border-green-300 text-green-700" },
      failed: { icon: XCircle, className: "bg-red-50 border-red-300 text-red-700" },
      pending: { icon: Clock, className: "bg-yellow-50 border-yellow-300 text-yellow-700" },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-sky-950/20 border border-teal-100 dark:border-teal-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Webhook className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-900 via-cyan-800 to-sky-900 dark:from-teal-100 dark:via-cyan-100 dark:to-sky-100 bg-clip-text text-transparent">
                Webhooks
              </h1>
              <p className="text-teal-700 dark:text-teal-300 mt-1">
                Receive real-time event notifications
              </p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              {showSecret ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Webhook Created
                    </DialogTitle>
                    <DialogDescription>
                      Save your signing secret - it won't be shown again!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                            Important: Save Your Signing Secret
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Use this secret to verify webhook signatures and ensure requests are from Perpetual Core Platform.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Signing Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          value={showSecret}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(showSecret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setShowSecret(null); setCreateDialogOpen(false); }}>
                      I've Saved My Secret
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Add Webhook Endpoint</DialogTitle>
                    <DialogDescription>
                      Configure a webhook to receive real-time event notifications
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Endpoint URL *</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://your-domain.com/webhooks"
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook-description">Description *</Label>
                      <Input
                        id="webhook-description"
                        placeholder="Production webhook for agent events"
                        value={newWebhook.description}
                        onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Events to Subscribe *</Label>
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {availableEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => toggleEvent(event.id)}
                          >
                            <Checkbox
                              id={event.id}
                              checked={newWebhook.events.includes(event.id)}
                              onCheckedChange={() => toggleEvent(event.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={event.id} className="font-medium cursor-pointer">
                                {event.label}
                              </Label>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWebhook} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Webhook className="mr-2 h-4 w-4" />
                          Create Webhook
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>
            {webhooks.length === 0
              ? "You haven't created any webhooks yet"
              : `You have ${webhooks.length} webhook endpoint${webhooks.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No webhooks yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first webhook to start receiving event notifications
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{webhook.description}</p>
                        {webhook.is_active ? (
                          <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{webhook.url}</span>
                        <span>•</span>
                        <span>{webhook.events.length} events</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {webhook.success_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          {webhook.failure_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteWebhookId(webhook.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Latest webhook delivery attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries.slice(0, 10).map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg border text-sm"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium font-mono">{delivery.event_type}</span>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}</span>
                        {delivery.response_code && (
                          <>
                            <span>•</span>
                            <span>HTTP {delivery.response_code}</span>
                          </>
                        )}
                        {delivery.response_time && (
                          <>
                            <span>•</span>
                            <span>{delivery.response_time}ms</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{delivery.attempts} attempt{delivery.attempts !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Setup Guide</CardTitle>
          <CardDescription>How to verify and handle webhook requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Signature Verification</h4>
            <p className="text-sm text-muted-foreground mb-3">
              All webhook requests include a signature in the X-Webhook-Signature header. Verify it using your signing secret:
            </p>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}`}</code>
            </pre>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" asChild>
              <a href="/docs/webhooks" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Webhook Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone and you will stop receiving event notifications at this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWebhookId && handleDeleteWebhook(deleteWebhookId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
