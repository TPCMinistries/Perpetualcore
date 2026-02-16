"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  Calendar,
  Bell,
  BarChart3,
  Users,
  Lock,
  RefreshCw,
  Zap,
} from "lucide-react";

interface BehaviorTemplate {
  id: string;
  name: string;
  description: string;
  behavior_type: string;
  default_schedule: string;
  schedule_description: string;
  config_schema: Record<
    string,
    {
      type: string;
      label: string;
      description?: string;
      options?: Array<{ value: string; label: string }>;
      min?: number;
      max?: number;
    }
  >;
  default_config: Record<string, unknown>;
  min_plan: string | null;
  locked: boolean;
}

interface Behavior {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  behavior_type: string;
  schedule: string;
  config: Record<string, unknown>;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

/** Map behavior types to icons */
const BEHAVIOR_ICONS: Record<string, typeof Clock> = {
  morning_briefing: Calendar,
  email_summary: Mail,
  follow_up_reminder: Users,
  daily_digest: Bell,
  weekly_report: BarChart3,
  custom_check: Zap,
};

/** Map delivery channels to display labels */
const CHANNEL_LABELS: Record<string, string> = {
  telegram: "Telegram",
  email: "Email",
  in_app: "In-App",
  slack: "Slack",
};

export default function ProactiveBehaviorsPage() {
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [templates, setTemplates] = useState<BehaviorTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<BehaviorTemplate | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBehaviors = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/behaviors");
      if (!res.ok) throw new Error("Failed to fetch behaviors");
      const data = await res.json();
      setBehaviors(data.behaviors || []);
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Error fetching behaviors:", err);
      toast.error("Failed to load proactive behaviors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBehaviors();
  }, [fetchBehaviors]);

  /** Toggle a behavior's active state */
  const toggleBehavior = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch("/api/agent/behaviors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update behavior");
      setBehaviors((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: !isActive } : b))
      );
      toast.success(isActive ? "Behavior paused" : "Behavior activated");
    } catch {
      toast.error("Failed to update behavior");
    } finally {
      setTogglingId(null);
    }
  };

  /** Delete a behavior */
  const removeBehavior = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/agent/behaviors?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete behavior");
      setBehaviors((prev) => prev.filter((b) => b.id !== id));
      toast.success("Behavior removed");
    } catch {
      toast.error("Failed to remove behavior");
    } finally {
      setDeletingId(null);
    }
  };

  /** Open the add dialog with a template selected */
  const openAddDialog = (template: BehaviorTemplate) => {
    if (template.locked) {
      toast.error(
        `This behavior requires the ${template.min_plan} plan or higher.`
      );
      return;
    }
    setSelectedTemplate(template);
    setConfigValues({ ...template.default_config });
    setAddDialogOpen(true);
  };

  /** Create a new behavior from the selected template */
  const createBehavior = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/agent/behaviors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          config: configValues,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create behavior");
      }
      const data = await res.json();
      setBehaviors((prev) => [data.behavior, ...prev]);
      setAddDialogOpen(false);
      setSelectedTemplate(null);
      toast.success(`"${selectedTemplate.name}" activated`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create behavior"
      );
    } finally {
      setCreating(false);
    }
  };

  /** Format a date string for display */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  /** Get a human-readable schedule description */
  const getScheduleDescription = (schedule: string): string => {
    // Try to match the template's schedule_description
    const matchingTemplate = templates.find(
      (t) => t.default_schedule === schedule
    );
    if (matchingTemplate) return matchingTemplate.schedule_description;

    // Basic cron-to-human conversion
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;

    const [minute, hour, , , dow] = parts;

    let timeStr = "";
    if (hour !== "*" && minute !== "*") {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      timeStr = `${displayHour}:${m.toString().padStart(2, "0")} ${ampm}`;
    } else if (hour.startsWith("*/")) {
      return `Every ${hour.slice(2)} hours`;
    }

    if (dow === "1-5") return `Weekdays at ${timeStr}`;
    if (dow === "5") return `Fridays at ${timeStr}`;
    if (dow === "*") return `Daily at ${timeStr}`;

    return `${timeStr} (${schedule})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Proactive Behaviors
          </h2>
          <p className="text-muted-foreground">
            Configure automated agent actions that run on a schedule — briefings,
            reminders, digests, and more.
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Behavior
        </Button>
      </div>

      {/* Active Behaviors */}
      {behaviors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Active Behaviors
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Set up proactive behaviors so your AI agent can automatically send
              you briefings, reminders, and summaries on a schedule.
            </p>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Behavior
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {behaviors.map((behavior) => {
            const Icon =
              BEHAVIOR_ICONS[behavior.behavior_type] || Zap;
            const deliveryChannel =
              (behavior.config?.delivery_channel as string) || "in_app";

            return (
              <Card key={behavior.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {behavior.name}
                      </h3>
                      <Badge
                        variant={behavior.is_active ? "default" : "secondary"}
                      >
                        {behavior.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {getScheduleDescription(behavior.schedule)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {CHANNEL_LABELS[deliveryChannel] || deliveryChannel}
                      </span>
                      {behavior.next_run_at && behavior.is_active && (
                        <span>Next: {formatDate(behavior.next_run_at)}</span>
                      )}
                      {behavior.last_run_at && (
                        <span>Last: {formatDate(behavior.last_run_at)}</span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={behavior.is_active}
                      onCheckedChange={() =>
                        toggleBehavior(behavior.id, behavior.is_active)
                      }
                      disabled={togglingId === behavior.id}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBehavior(behavior.id)}
                      disabled={deletingId === behavior.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === behavior.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Behavior Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate
                ? `Configure: ${selectedTemplate.name}`
                : "Add Proactive Behavior"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? selectedTemplate.description
                : "Choose a behavior template to configure and activate."}
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            /* Template Selection */
            <div className="grid gap-3 py-4">
              {templates.map((template) => {
                const Icon =
                  BEHAVIOR_ICONS[template.behavior_type] || Zap;
                const alreadyActive = behaviors.some(
                  (b) =>
                    (b.config as Record<string, unknown>)?.template_id ===
                    template.id
                );

                return (
                  <button
                    key={template.id}
                    onClick={() => openAddDialog(template)}
                    disabled={alreadyActive}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      template.locked
                        ? "opacity-60 cursor-not-allowed border-dashed"
                        : alreadyActive
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent cursor-pointer"
                    }`}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {template.name}
                        </span>
                        {template.locked && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Lock className="h-3 w-3" />
                            {template.min_plan}
                          </Badge>
                        )}
                        {alreadyActive && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {template.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Default: {template.schedule_description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Config Form */
            <div className="grid gap-4 py-4">
              {Object.entries(selectedTemplate.config_schema).map(
                ([key, schema]) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={key}>{schema.label}</Label>
                    {schema.description && (
                      <p className="text-xs text-muted-foreground -mt-1">
                        {schema.description}
                      </p>
                    )}

                    {schema.type === "select" && schema.options && (
                      <Select
                        value={String(configValues[key] || "")}
                        onValueChange={(val) =>
                          setConfigValues((prev) => ({ ...prev, [key]: val }))
                        }
                      >
                        <SelectTrigger id={key}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schema.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {schema.type === "boolean" && (
                      <Switch
                        id={key}
                        checked={Boolean(configValues[key])}
                        onCheckedChange={(val) =>
                          setConfigValues((prev) => ({ ...prev, [key]: val }))
                        }
                      />
                    )}

                    {schema.type === "number" && (
                      <input
                        id={key}
                        type="number"
                        min={schema.min}
                        max={schema.max}
                        value={Number(configValues[key] || 0)}
                        onChange={(e) =>
                          setConfigValues((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value, 10),
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                )
              )}

              <div className="grid gap-2">
                <Label>Schedule</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  {selectedTemplate.schedule_description}
                </p>
                <input
                  type="text"
                  defaultValue={selectedTemplate.default_schedule}
                  readOnly
                  className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono"
                  title="Cron schedule (editable via API)"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedTemplate ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Back
                </Button>
                <Button
                  onClick={createBehavior}
                  disabled={creating}
                  className="gap-2"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Activate
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
