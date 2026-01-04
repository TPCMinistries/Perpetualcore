"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Users,
} from "lucide-react";

interface Advisor {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  enabled: boolean;
  total_conversations: number;
  total_messages: number;
  team_id?: string;
  advisor_type?: string;
}

interface AttachAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  existingAdvisorIds: string[];
  onSuccess: () => void;
}

export function AttachAdvisorDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  existingAdvisorIds,
  onSuccess,
}: AttachAdvisorDialogProps) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchAdvisors();
      setSelectedAdvisor(null);
      setNotes("");
    }
  }, [open]);

  const fetchAdvisors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/assistants");
      if (response.ok) {
        const data = await response.json();
        // Filter to only standalone advisors (not already attached)
        const available = (data.assistants || []).filter(
          (a: Advisor) =>
            a.enabled &&
            !a.team_id &&
            a.advisor_type !== "dedicated" &&
            !existingAdvisorIds.includes(a.id)
        );
        setAdvisors(available);
      }
    } catch (error) {
      console.error("Error fetching advisors:", error);
      toast.error("Failed to load advisors");
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!selectedAdvisor) return;

    setAttaching(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/advisors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisor_id: selectedAdvisor.id,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        toast.success(`${selectedAdvisor.name} added as consulting advisor`);
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to attach advisor");
      }
    } catch (error) {
      console.error("Error attaching advisor:", error);
      toast.error("Failed to attach advisor");
    } finally {
      setAttaching(false);
    }
  };

  const filteredAdvisors = advisors.filter(
    (advisor) =>
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Consulting Advisor</DialogTitle>
          <DialogDescription>
            Attach a standalone advisor to {teamName} as a consultant. They'll be available to help the team while maintaining their own identity.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : advisors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No available advisors</p>
            <p className="text-sm mt-2">
              All standalone advisors are already attached to this team, or you need to create new advisors in the Executive Suite first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search advisors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Advisor List */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredAdvisors.map((advisor) => (
                  <div
                    key={advisor.id}
                    onClick={() => setSelectedAdvisor(advisor)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAdvisor?.id === advisor.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="text-3xl">{advisor.avatar_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{advisor.name}</p>
                        {selectedAdvisor?.id === advisor.id && (
                          <CheckCircle2 className="h-4 w-4 text-violet-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {advisor.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {advisor.role.replace(/_/g, " ")}
                        </Badge>
                        {advisor.total_conversations > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {advisor.total_conversations}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAdvisors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No advisors match your search</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Notes */}
            {selectedAdvisor && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Why is this advisor being added to the team?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAttach}
            disabled={!selectedAdvisor || attaching}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {attaching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add to Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttachAdvisorDialog;
