"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tag,
  X,
  Plus,
  Loader2,
  Check,
  Trash2,
  Mail,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactsPage } from "./ContactsPageProvider";
import { useBulkTagContacts, exportContactsToCSV, useDeleteContacts } from "@/lib/contacts/use-contacts";
import { Contact } from "@/types/contacts";
import { toast } from "sonner";
import { EmailComposer } from "@/components/email/EmailComposer";

interface BulkActionsDialogProps {
  contacts: Contact[];
}

// Common tags for quick selection
const SUGGESTED_TAGS = [
  "VIP",
  "Priority",
  "Active",
  "Inactive",
  "Partner",
  "Prospect",
  "Follow-up",
  "Nurture",
  "Cold",
  "Warm",
  "Hot",
  "Tech",
  "Marketing",
  "Sales",
  "Executive",
];

export function BulkActionsDialog({ contacts }: BulkActionsDialogProps) {
  const {
    state,
    closeBulkAction,
    clearSelection,
    selectedCount,
  } = useContactsPage();

  const bulkTagContacts = useBulkTagContacts();
  const deleteContacts = useDeleteContacts();

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Get selected contacts
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => state.selectedIds.has(c.id));
  }, [contacts, state.selectedIds]);

  // Get all existing tags from selected contacts
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    selectedContacts.forEach((c) => {
      (c.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [selectedContacts]);

  // Reset state when dialog opens
  useEffect(() => {
    if (state.isBulkActionDialogOpen) {
      setSelectedTags(new Set());
      setNewTag("");
      setReplaceExisting(false);
    }
  }, [state.isBulkActionDialogOpen]);

  const handleClose = () => {
    closeBulkAction();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.has(newTag.trim())) {
      setSelectedTags((prev) => new Set([...prev, newTag.trim()]));
      setNewTag("");
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleApplyTags = async () => {
    const ids = Array.from(state.selectedIds);
    const tags = Array.from(selectedTags);

    if (tags.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }

    await bulkTagContacts.mutateAsync({
      ids,
      tags,
      mode: replaceExisting ? "replace" : "add",
    });

    handleClose();
    clearSelection();
  };

  const handleExport = () => {
    exportContactsToCSV(selectedContacts);
    handleClose();
    clearSelection();
    toast.success(`Exported ${selectedCount} contacts to CSV`);
  };

  const handleDelete = async () => {
    const ids = Array.from(state.selectedIds);
    await deleteContacts.mutateAsync(ids);
    handleClose();
    clearSelection();
  };

  // Render based on action type
  const renderContent = () => {
    switch (state.bulkActionType) {
      case "tag":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tag {selectedCount} Contact{selectedCount > 1 ? "s" : ""}
              </DialogTitle>
              <DialogDescription>
                Add or replace tags on selected contacts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* New tag input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected tags */}
              {selectedTags.size > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Tags to apply
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedTags).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 pr-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleToggleTag(tag)}
                          className="ml-1 hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested tags */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Suggested tags
                </Label>
                <ScrollArea className="h-32">
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.filter((t) => !selectedTags.has(t)).map(
                      (tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-accent transition-colors",
                            selectedTags.has(tag) &&
                              "bg-violet-100 text-violet-700 border-violet-300"
                          )}
                          onClick={() => handleToggleTag(tag)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      )
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Existing tags on selected contacts */}
              {existingTags.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Existing tags on selected contacts
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {existingTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          "cursor-pointer hover:bg-accent transition-colors",
                          selectedTags.has(tag) &&
                            "bg-violet-100 text-violet-700 border-violet-300"
                        )}
                        onClick={() => handleToggleTag(tag)}
                      >
                        {selectedTags.has(tag) && (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Replace option */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Checkbox
                  id="replace-tags"
                  checked={replaceExisting}
                  onCheckedChange={(checked) =>
                    setReplaceExisting(checked as boolean)
                  }
                />
                <Label
                  htmlFor="replace-tags"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Replace existing tags (instead of adding)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyTags}
                disabled={selectedTags.size === 0 || bulkTagContacts.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {bulkTagContacts.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Apply Tags
              </Button>
            </DialogFooter>
          </>
        );

      case "delete":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete {selectedCount} Contact{selectedCount > 1 ? "s" : ""}?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                selected contacts and all their data.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-700 dark:text-red-300">
                  You are about to delete {selectedCount} contact
                  {selectedCount > 1 ? "s" : ""}. This includes all their
                  interactions, notes, and associated data.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteContacts.isPending}
              >
                {deleteContacts.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete {selectedCount} Contact{selectedCount > 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        );

      case "export":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export {selectedCount} Contact{selectedCount > 1 ? "s" : ""}
              </DialogTitle>
              <DialogDescription>
                Export selected contacts to a CSV file
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  The export will include: Name, Email, Phone, Company, Job
                  Title, Contact Type, Relationship Strength, Tags, and Notes.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </DialogFooter>
          </>
        );

      case "email":
        const contactsWithEmail = selectedContacts.filter((c) => c.email);
        const contactsWithoutEmail = selectedContacts.filter((c) => !c.email);

        // Prepare data for EmailComposer
        const recipientEmails = contactsWithEmail.map((c) => c.email).join(", ");
        const contactIds = contactsWithEmail.map((c) => c.id);
        const contactNames = contactsWithEmail.map((c) =>
          `${c.first_name}${c.last_name ? " " + c.last_name : ""}`
        );

        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-violet-600" />
                Compose Email
              </DialogTitle>
              <DialogDescription>
                Send an email to {contactsWithEmail.length} contact{contactsWithEmail.length !== 1 ? "s" : ""}
                {contactsWithoutEmail.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {" "}({contactsWithoutEmail.length} without email will be skipped)
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <EmailComposer
                initialTo={recipientEmails}
                contactIds={contactIds}
                contactContext={{
                  names: contactNames,
                  count: contactsWithEmail.length,
                }}
                compact={true}
                onSent={() => {
                  handleClose();
                  clearSelection();
                }}
                onClose={handleClose}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={state.isBulkActionDialogOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        state.bulkActionType === "email" ? "max-w-2xl" : "max-w-md"
      )}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
