"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { WorkspaceConfig, BUILT_IN_WORKSPACES } from "@/config/workspaces";

interface WorkspaceEditorProps {
  open: boolean;
  onClose: () => void;
  workspace?: WorkspaceConfig;
  onSave: (workspace: WorkspaceConfig) => Promise<void>;
}

const AVAILABLE_SECTIONS = [
  { id: "WORK", label: "Work" },
  { id: "AUTOMATE", label: "Automate" },
  { id: "GROW", label: "Grow" },
  { id: "SETTINGS", label: "Settings" },
];

const AVAILABLE_ITEMS = [
  { id: "projects", label: "Projects", section: "WORK" },
  { id: "tasks", label: "Tasks", section: "WORK" },
  { id: "documents", label: "Documents", section: "WORK" },
  { id: "contacts", label: "Contacts", section: "WORK" },
  { id: "calendar", label: "Calendar", section: "WORK" },
  { id: "automation", label: "Automation Hub", section: "AUTOMATE" },
  { id: "agents", label: "AI Agents", section: "AUTOMATE" },
  { id: "triggers", label: "Triggers", section: "AUTOMATE" },
  { id: "leads", label: "Leads", section: "GROW" },
  { id: "outreach", label: "Outreach", section: "GROW" },
  { id: "analytics", label: "Analytics", section: "GROW" },
];

const ICONS = ["🎯", "💰", "🔬", "⚙️", "📊", "🚀", "💡", "🎨", "📝", "🔒"];

export function WorkspaceEditor({ open, onClose, workspace, onSave }: WorkspaceEditorProps) {
  const isEditing = !!workspace;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [icon, setIcon] = useState(workspace?.icon || "🎯");
  const [prioritizedSections, setPrioritizedSections] = useState<string[]>(
    workspace?.prioritizedSections || []
  );
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    workspace?.hiddenSections || []
  );
  const [hiddenItems, setHiddenItems] = useState<string[]>(
    workspace?.hiddenItems || []
  );
  const [silentNotifications, setSilentNotifications] = useState(
    workspace?.silentNotifications || false
  );
  const [aiMode, setAiMode] = useState(workspace?.aiMode || "");

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    setSaving(true);
    try {
      const newWorkspace: WorkspaceConfig = {
        id: workspace?.id || `custom-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        isBuiltIn: false,
        prioritizedSections,
        hiddenSections,
        hiddenItems,
        silentNotifications,
        aiMode: aiMode || undefined,
      };

      await onSave(newWorkspace);
      toast.success(isEditing ? "Workspace updated" : "Workspace created");
      onClose();
    } catch (error) {
      toast.error("Failed to save workspace");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId: string, type: "prioritized" | "hidden") => {
    if (type === "prioritized") {
      setPrioritizedSections((prev) =>
        prev.includes(sectionId)
          ? prev.filter((s) => s !== sectionId)
          : [...prev, sectionId]
      );
      // Remove from hidden if adding to prioritized
      setHiddenSections((prev) => prev.filter((s) => s !== sectionId));
    } else {
      setHiddenSections((prev) =>
        prev.includes(sectionId)
          ? prev.filter((s) => s !== sectionId)
          : [...prev, sectionId]
      );
      // Remove from prioritized if adding to hidden
      setPrioritizedSections((prev) => prev.filter((s) => s !== sectionId));
    }
  };

  const toggleItem = (itemId: string) => {
    setHiddenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((i) => i !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Workspace" : "Create Workspace"}
          </DialogTitle>
          <DialogDescription>
            Configure your workspace to focus on what matters most
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
            <div>
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-20 h-12 text-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => (
                    <SelectItem key={i} value={i} className="text-2xl">
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Deep Work Mode"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workspace is for..."
            />
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <Label>Sections</Label>
            <p className="text-sm text-muted-foreground">
              Choose which sections to prioritize, hide, or show normally
            </p>
            <div className="border rounded-lg divide-y">
              {AVAILABLE_SECTIONS.map((section) => {
                const isPrioritized = prioritizedSections.includes(section.id);
                const isHidden = hiddenSections.includes(section.id);

                return (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3"
                  >
                    <span className="font-medium">{section.label}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={isPrioritized}
                          onCheckedChange={() => toggleSection(section.id, "prioritized")}
                        />
                        Prioritize
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={isHidden}
                          onCheckedChange={() => toggleSection(section.id, "hidden")}
                        />
                        Hide
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <Label>Navigation Items</Label>
            <p className="text-sm text-muted-foreground">
              Hide specific items you don&apos;t need in this workspace
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Checkbox
                    checked={!hiddenItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                  <span className="text-xs text-muted-foreground">({item.section})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label>Options</Label>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Silent Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Suppress non-critical notifications in this mode
                </p>
              </div>
              <Switch
                checked={silentNotifications}
                onCheckedChange={setSilentNotifications}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiMode">AI Mode (optional)</Label>
              <Select value={aiMode} onValueChange={setAiMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Default AI behavior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  <SelectItem value="research-focused">Research Focused</SelectItem>
                  <SelectItem value="action-oriented">Action Oriented</SelectItem>
                  <SelectItem value="minimal-suggestions">Minimal Suggestions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
