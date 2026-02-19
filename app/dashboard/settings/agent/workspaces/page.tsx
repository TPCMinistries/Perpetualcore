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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Hash,
  Star,
  MessageSquare,
  Mail,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

/** Types matching lib/agent-workspace/workspace-types.ts */
interface AgentPersona {
  display_name?: string;
  tone?: "professional" | "casual" | "pastoral" | "technical" | "friendly";
  system_prompt_override?: string;
  greeting_message?: string;
  signature?: string;
}

interface ChannelBinding {
  channel_type: string;
  channel_identifier?: string;
  match_all?: boolean;
}

interface ContextFilter {
  include_tags?: string[];
  exclude_tags?: string[];
  document_folders?: string[];
  contact_groups?: string[];
  max_memory_items?: number;
}

interface AgentWorkspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  persona: AgentPersona;
  channel_bindings: ChannelBinding[];
  context_filter: ContextFilter;
  skill_overrides: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CHANNEL_TYPES = [
  { value: "telegram", label: "Telegram", icon: Send },
  { value: "slack", label: "Slack", icon: Hash },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "discord", label: "Discord", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "pastoral", label: "Pastoral" },
  { value: "technical", label: "Technical" },
  { value: "friendly", label: "Friendly" },
];

const emptyWorkspace: Omit<AgentWorkspace, "id" | "user_id" | "created_at" | "updated_at"> = {
  name: "",
  description: "",
  persona: {
    display_name: "",
    tone: "professional",
    system_prompt_override: "",
    greeting_message: "",
    signature: "",
  },
  channel_bindings: [],
  context_filter: {},
  skill_overrides: [],
  is_default: false,
  is_active: true,
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<AgentWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<AgentWorkspace | null>(null);
  const [formData, setFormData] = useState(emptyWorkspace);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  function openCreateDialog() {
    setEditingWorkspace(null);
    setFormData({ ...emptyWorkspace, persona: { ...emptyWorkspace.persona } });
    setDialogOpen(true);
  }

  function openEditDialog(ws: AgentWorkspace) {
    setEditingWorkspace(ws);
    setFormData({
      name: ws.name,
      description: ws.description || "",
      persona: { ...ws.persona },
      channel_bindings: [...ws.channel_bindings],
      context_filter: { ...ws.context_filter },
      skill_overrides: [...ws.skill_overrides],
      is_default: ws.is_default,
      is_active: ws.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingWorkspace) {
        const res = await fetch(`/api/agent/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to update workspace");
        toast.success("Workspace updated");
      } else {
        const res = await fetch("/api/agent/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create workspace");
        toast.success("Workspace created");
      }

      setDialogOpen(false);
      fetchWorkspaces();
    } catch (error: any) {
      console.error("Failed to save workspace:", error);
      toast.error(error.message || "Failed to save workspace");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/agent/workspaces/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workspace");
      toast.success("Workspace deleted");
      setDeleteConfirmId(null);
      fetchWorkspaces();
    } catch (error: any) {
      console.error("Failed to delete workspace:", error);
      toast.error(error.message || "Failed to delete workspace");
    }
  }

  async function handleToggleActive(ws: AgentWorkspace) {
    try {
      const res = await fetch(`/api/agent/workspaces/${ws.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ws.is_active }),
      });
      if (!res.ok) throw new Error("Failed to toggle workspace");
      fetchWorkspaces();
    } catch (error) {
      toast.error("Failed to toggle workspace");
    }
  }

  function addChannelBinding() {
    setFormData({
      ...formData,
      channel_bindings: [
        ...formData.channel_bindings,
        { channel_type: "telegram", channel_identifier: "", match_all: false },
      ],
    });
  }

  function updateChannelBinding(index: number, updates: Partial<ChannelBinding>) {
    const bindings = [...formData.channel_bindings];
    bindings[index] = { ...bindings[index], ...updates };
    setFormData({ ...formData, channel_bindings: bindings });
  }

  function removeChannelBinding(index: number) {
    const bindings = formData.channel_bindings.filter((_, i) => i !== index);
    setFormData({ ...formData, channel_bindings: bindings });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-violet-900 dark:from-indigo-100 dark:via-purple-100 dark:to-violet-100 bg-clip-text text-transparent">
                Agent Workspaces
              </h1>
              <p className="text-indigo-700 dark:text-indigo-300 mt-1">
                Route channels to isolated agent personas
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      </div>

      {/* Workspaces List */}
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
              No workspaces yet
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground mb-6">
              Create your first workspace to route channel messages to different agent personas.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className={`hover:shadow-lg transition-all duration-300 ${
                !ws.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{ws.name}</CardTitle>
                    {ws.is_default && (
                      <Badge className="bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={ws.is_active}
                    onCheckedChange={() => handleToggleActive(ws)}
                  />
                </div>
                {ws.description && (
                  <CardDescription>{ws.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {/* Persona info */}
                <div className="space-y-3 mb-4">
                  {ws.persona.display_name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Display name:{" "}
                      </span>
                      <span className="font-medium">
                        {ws.persona.display_name}
                      </span>
                    </div>
                  )}
                  {ws.persona.tone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        Tone:{" "}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {ws.persona.tone}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Channel bindings */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide mb-2">
                    Channel Bindings
                  </p>
                  {ws.channel_bindings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No channels bound</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ws.channel_bindings.map((binding, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {binding.channel_type}
                          {binding.match_all
                            ? " (all)"
                            : binding.channel_identifier
                              ? `: ${binding.channel_identifier.substring(0, 12)}...`
                              : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(ws)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {deleteConfirmId === ws.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Delete?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(ws.id)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(ws.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingWorkspace(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkspace ? "Edit Workspace" : "Create Workspace"}
            </DialogTitle>
            <DialogDescription>
              Configure an agent workspace with its own persona and channel bindings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground dark:text-white uppercase tracking-wide">
                Basic Info
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Name *</Label>
                  <Input
                    id="ws-name"
                    placeholder="e.g., Work Agent"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-display-name">Display Name</Label>
                  <Input
                    id="ws-display-name"
                    placeholder="e.g., Atlas"
                    value={formData.persona.display_name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        persona: {
                          ...formData.persona,
                          display_name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-desc">Description</Label>
                <Input
                  id="ws-desc"
                  placeholder="What is this workspace for?"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked })
                  }
                />
                <Label>Set as default workspace (fallback for unmatched channels)</Label>
              </div>
            </div>

            {/* Persona */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground dark:text-white uppercase tracking-wide">
                Persona
              </h3>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={formData.persona.tone || "professional"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      persona: {
                        ...formData.persona,
                        tone: value as AgentPersona["tone"],
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-greeting">Greeting Message</Label>
                <Input
                  id="ws-greeting"
                  placeholder="e.g., Good morning! How can I help today?"
                  value={formData.persona.greeting_message || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      persona: {
                        ...formData.persona,
                        greeting_message: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-signature">Signature</Label>
                <Input
                  id="ws-signature"
                  placeholder="e.g., - Atlas, your AI assistant"
                  value={formData.persona.signature || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      persona: {
                        ...formData.persona,
                        signature: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-prompt">Custom System Prompt (Advanced)</Label>
                <Textarea
                  id="ws-prompt"
                  placeholder="Additional instructions for the AI in this workspace..."
                  rows={4}
                  value={formData.persona.system_prompt_override || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      persona: {
                        ...formData.persona,
                        system_prompt_override: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Channel Bindings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground dark:text-white uppercase tracking-wide">
                  Channel Bindings
                </h3>
                <Button variant="outline" size="sm" onClick={addChannelBinding}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Channel
                </Button>
              </div>

              {formData.channel_bindings.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  No channels bound. Messages will only route here if this is the default workspace.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.channel_bindings.map((binding, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border dark:border-border bg-muted dark:bg-card"
                    >
                      <Select
                        value={binding.channel_type}
                        onValueChange={(value) =>
                          updateChannelBinding(index, { channel_type: value })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNEL_TYPES.map((ct) => (
                            <SelectItem key={ct.value} value={ct.value}>
                              {ct.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex-1">
                        <Input
                          placeholder="Channel ID (optional for match all)"
                          value={binding.channel_identifier || ""}
                          onChange={(e) =>
                            updateChannelBinding(index, {
                              channel_identifier: e.target.value || undefined,
                            })
                          }
                          disabled={binding.match_all}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={binding.match_all || false}
                          onCheckedChange={(checked) =>
                            updateChannelBinding(index, {
                              match_all: checked,
                              channel_identifier: checked
                                ? undefined
                                : binding.channel_identifier,
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          All
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChannelBinding(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Context Filter */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground dark:text-white uppercase tracking-wide">
                Context Filter
              </h3>
              <div className="space-y-2">
                <Label htmlFor="ws-include-tags">Include Tags (comma-separated)</Label>
                <Input
                  id="ws-include-tags"
                  placeholder="e.g., work, projects, clients"
                  value={(formData.context_filter.include_tags || []).join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context_filter: {
                        ...formData.context_filter,
                        include_tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-exclude-tags">Exclude Tags (comma-separated)</Label>
                <Input
                  id="ws-exclude-tags"
                  placeholder="e.g., personal, finance"
                  value={(formData.context_filter.exclude_tags || []).join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context_filter: {
                        ...formData.context_filter,
                        exclude_tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-max-memory">Max Memory Items</Label>
                <Input
                  id="ws-max-memory"
                  type="number"
                  placeholder="10"
                  min={1}
                  max={50}
                  value={formData.context_filter.max_memory_items || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      context_filter: {
                        ...formData.context_filter,
                        max_memory_items: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingWorkspace ? "Save Changes" : "Create Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
