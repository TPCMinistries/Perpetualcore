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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  WorkItem,
  WorkflowStage,
  WorkItemPriority,
  CreateWorkItemRequest,
  getItemTypeLabel,
} from "@/types/work";
import { Loader2, ChevronDown, Linkedin, Globe, Mail, Phone, FileText } from "lucide-react";
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

  // Get existing custom fields
  const existingCustomFields = (editItem?.custom_fields as Record<string, string>) || {};

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

  // Extended fields for candidates/leads
  const [email, setEmail] = useState(existingCustomFields.email || "");
  const [phone, setPhone] = useState(existingCustomFields.phone || "");
  const [linkedinUrl, setLinkedinUrl] = useState(existingCustomFields.linkedin_url || "");
  const [websiteUrl, setWebsiteUrl] = useState(existingCustomFields.website_url || "");
  const [resumeUrl, setResumeUrl] = useState(existingCustomFields.resume_url || "");
  const [notes, setNotes] = useState(existingCustomFields.notes || "");
  const [showExtendedFields, setShowExtendedFields] = useState(false);

  // Determine which extra fields to show based on item type
  const showCandidateFields = ["candidate", "lead", "partner"].includes(itemType);

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

      // Build custom fields
      const customFields: Record<string, string> = {};
      if (email.trim()) customFields.email = email.trim();
      if (phone.trim()) customFields.phone = phone.trim();
      if (linkedinUrl.trim()) customFields.linkedin_url = linkedinUrl.trim();
      if (websiteUrl.trim()) customFields.website_url = websiteUrl.trim();
      if (resumeUrl.trim()) customFields.resume_url = resumeUrl.trim();
      if (notes.trim()) customFields.notes = notes.trim();

      const body: CreateWorkItemRequest = {
        team_id: teamId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        current_stage_id: stageId,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        external_id: externalId.trim() || undefined,
        item_type: itemType,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
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
      setEmail("");
      setPhone("");
      setLinkedinUrl("");
      setWebsiteUrl("");
      setResumeUrl("");
      setNotes("");
      setShowExtendedFields(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

          {/* Extended fields for candidates/leads/partners */}
          {showCandidateFields && (
            <Collapsible open={showExtendedFields} onOpenChange={setShowExtendedFields}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" type="button" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">
                    Contact & Links {(email || phone || linkedinUrl || websiteUrl || resumeUrl || notes) && "(filled)"}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showExtendedFields ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-1.5">
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Website / Portfolio
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Resume / Document URL
                  </Label>
                  <Input
                    id="resume"
                    type="url"
                    placeholder="Link to resume, portfolio, or document"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI can analyze linked documents for insights
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes, context, or information for AI..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

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
