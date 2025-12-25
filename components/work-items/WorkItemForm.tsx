"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WorkItem,
  WorkflowStage,
  WorkItemPriority,
  CreateWorkItemRequest,
  getItemTypeLabel,
} from "@/types/work";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WorkItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  itemType: string;
  stages: WorkflowStage[];
  initialStageId?: string;
  editItem?: WorkItem;
  onSuccess: (item: WorkItem) => void;
}

export function WorkItemForm({
  open,
  onOpenChange,
  teamId,
  itemType,
  stages,
  initialStageId,
  editItem,
  onSuccess,
}: WorkItemFormProps) {
  const isEditing = !!editItem;
  const itemTypeLabel = getItemTypeLabel(itemType);
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const defaultStageId =
    initialStageId || editItem?.current_stage_id || sortedStages[0]?.id || "";

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(editItem?.title || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [priority, setPriority] = useState<WorkItemPriority>(
    editItem?.priority || "medium"
  );
  const [stageId, setStageId] = useState(defaultStageId);
  const [dueDate, setDueDate] = useState(
    editItem?.due_date ? editItem.due_date.split("T")[0] : ""
  );
  const [externalId, setExternalId] = useState(editItem?.external_id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/work-items/${editItem.id}`
        : "/api/work-items";
      const method = isEditing ? "PUT" : "POST";

      const body: CreateWorkItemRequest = {
        team_id: teamId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        current_stage_id: stageId,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        external_id: externalId.trim() || undefined,
        item_type: itemType,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await response.json();
      toast.success(
        isEditing
          ? `${itemTypeLabel} updated successfully`
          : `${itemTypeLabel} created successfully`
      );
      onSuccess(data.item);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving work item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (!isEditing) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStageId(defaultStageId);
      setDueDate("");
      setExternalId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${itemTypeLabel}` : `New ${itemTypeLabel}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the ${itemTypeLabel.toLowerCase()} details below.`
              : `Add a new ${itemTypeLabel.toLowerCase()} to your pipeline.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder={`${itemTypeLabel} name or title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as WorkItemPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input
                id="externalId"
                placeholder="CRM ID, ATS ID, etc."
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : `Create ${itemTypeLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
