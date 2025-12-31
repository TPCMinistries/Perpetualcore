"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Webhook,
  Clock,
  Zap,
  Calendar,
  Mail,
  Globe,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Trigger {
  id: string;
  name: string;
  type: "webhook" | "schedule" | "event" | "email" | "api";
  automationId: string;
  automationName: string;
  isActive: boolean;
  config: Record<string, any>;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

const typeConfig = {
  webhook: { icon: Webhook, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  schedule: { icon: Clock, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  event: { icon: Zap, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  email: { icon: Mail, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  api: { icon: Globe, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
};

export function TriggerManager() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/automation/triggers");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setTriggers(data.triggers || []);
    } catch (error) {
      console.error("Error fetching triggers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleToggle = async (trigger: Trigger) => {
    try {
      await fetch(`/api/automation/triggers/${trigger.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !trigger.isActive }),
      });
      toast.success(`Trigger ${trigger.isActive ? "disabled" : "enabled"}`);
      fetchTriggers();
    } catch (error) {
      toast.error("Failed to update trigger");
    }
  };

  const handleDelete = async (trigger: Trigger) => {
    if (!confirm(`Delete trigger "${trigger.name}"?`)) return;

    try {
      await fetch(`/api/automation/triggers/${trigger.id}`, { method: "DELETE" });
      toast.success("Trigger deleted");
      fetchTriggers();
    } catch (error) {
      toast.error("Failed to delete trigger");
    }
  };

  const copyWebhookUrl = (trigger: Trigger) => {
    if (trigger.type !== "webhook") return;
    const url = trigger.config.webhookUrl || `${window.location.origin}/api/webhooks/${trigger.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg border flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {triggers.length} trigger{triggers.length !== 1 ? "s" : ""} configured
        </p>
        <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>
      </div>

      {/* Trigger List */}
      {triggers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No triggers configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add triggers to automatically run your automations
            </p>
            <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Create Trigger
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => {
            const config = typeConfig[trigger.type];
            const Icon = config.icon;

            return (
              <Card key={trigger.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{trigger.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {trigger.type}
                        </Badge>
                        {!trigger.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        Triggers: {trigger.automationName}
                      </p>

                      {/* Config details */}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        {trigger.type === "schedule" && trigger.config.cron && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {trigger.config.cronDescription || trigger.config.cron}
                          </span>
                        )}
                        {trigger.type === "webhook" && (
                          <button
                            onClick={() => copyWebhookUrl(trigger)}
                            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Copy className="h-3 w-3" />
                            Copy webhook URL
                          </button>
                        )}
                        {trigger.lastTriggered && (
                          <span>
                            Last: {formatDistanceToNow(new Date(trigger.lastTriggered), { addSuffix: true })}
                          </span>
                        )}
                        <span>{trigger.triggerCount} triggers</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={trigger.isActive}
                        onCheckedChange={() => handleToggle(trigger)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(trigger)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
