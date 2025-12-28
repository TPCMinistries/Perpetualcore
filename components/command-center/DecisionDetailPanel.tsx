"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileCheck,
  CheckCircle2,
  Users,
  Clock,
  Calendar,
  Link2,
  MessageSquare,
  History,
  Send,
  Mail,
  Bell,
  Plus,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  Briefcase,
  TrendingUp,
  UserPlus,
  ExternalLink,
  Target,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Decision, DecisionStatus, Priority } from "@/types/executive-center";

interface Stakeholder {
  id: string;
  role: string;
  notes?: string;
  stakeholder_type: "user" | "contact";
  stakeholder_id: string;
  stakeholder_name: string;
  stakeholder_email?: string;
  stakeholder_avatar?: string;
  notify_on_updates: boolean;
  notify_on_decision: boolean;
  created_at: string;
}

interface RelatedItem {
  relationship_id: string;
  relationship_type: string;
  direction: "incoming" | "outgoing";
  related_type: string;
  related_id: string;
  related_title: string;
  related_status?: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  comment_type: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  created_at: string;
  is_edited: boolean;
  parent_comment_id?: string;
}

interface HistoryEvent {
  id: string;
  event_type: string;
  from_status?: string;
  to_status?: string;
  comment?: string;
  performed_by?: string;
  performer_name?: string;
  created_at: string;
}

interface DecisionDetailPanelProps {
  decision: Decision | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function DecisionDetailPanel({
  decision,
  open,
  onClose,
  onUpdate,
}: DecisionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Action dialogs
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showAddStakeholderDialog, setShowAddStakeholderDialog] = useState(false);
  const [showLinkItemDialog, setShowLinkItemDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  // Form states
  const [decisionOutcome, setDecisionOutcome] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [delegateTo, setDelegateTo] = useState("");
  const [delegateNotes, setDelegateNotes] = useState("");
  const [deferUntil, setDeferUntil] = useState("");
  const [deferReason, setDeferReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Project creation
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTargetDate, setProjectTargetDate] = useState("");

  // Users for delegation/stakeholders
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string; avatar_url?: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; full_name: string; email?: string; company?: string }[]>([]);

  // Fetch decision details
  const fetchDecisionDetails = useCallback(async () => {
    if (!decision?.id) return;
    setLoading(true);

    try {
      const [stakeholdersRes, relatedRes, commentsRes, historyRes] = await Promise.all([
        fetch(`/api/decisions/${decision.id}/stakeholders`),
        fetch(`/api/decisions/${decision.id}/related`),
        fetch(`/api/decisions/${decision.id}/comments`),
        fetch(`/api/decisions/${decision.id}/history`),
      ]);

      if (stakeholdersRes.ok) {
        const data = await stakeholdersRes.json();
        setStakeholders(data.stakeholders || []);
      }
      if (relatedRes.ok) {
        const data = await relatedRes.json();
        setRelatedItems(data.items || []);
      }
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching decision details:", error);
    } finally {
      setLoading(false);
    }
  }, [decision?.id]);

  // Fetch users and contacts for assignment
  const fetchUsersAndContacts = useCallback(async () => {
    try {
      const [usersRes, contactsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/contacts?limit=100"),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Error fetching users/contacts:", error);
    }
  }, []);

  useEffect(() => {
    if (open && decision) {
      fetchDecisionDetails();
      fetchUsersAndContacts();
    }
  }, [open, decision, fetchDecisionDetails, fetchUsersAndContacts]);

  // Reset form when decision changes
  useEffect(() => {
    if (decision) {
      setDecisionOutcome(decision.decision_made || "");
      setDecisionRationale(decision.decision_rationale || "");
      setProjectName(`Project: ${decision.title}`);
      setProjectDescription(decision.decision_rationale || decision.description || "");
    }
  }, [decision]);

  const handleDecide = async () => {
    if (!decisionOutcome.trim()) {
      toast.error("Please enter the decision outcome");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_made: decisionOutcome,
          decision_rationale: decisionRationale,
        }),
      });
      if (response.ok) {
        toast.success("Decision recorded!");
        setShowDecideDialog(false);
        onUpdate();
        fetchDecisionDetails();
      } else {
        toast.error("Failed to record decision");
      }
    } catch (error) {
      toast.error("Error recording decision");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelegate = async () => {
    if (!delegateTo) {
      toast.error("Please select someone to delegate to");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegated_to: delegateTo,
          delegation_notes: delegateNotes,
        }),
      });
      if (response.ok) {
        toast.success("Decision delegated!");
        setShowDelegateDialog(false);
        onUpdate();
        fetchDecisionDetails();
      } else {
        toast.error("Failed to delegate decision");
      }
    } catch (error) {
      toast.error("Error delegating decision");
    } finally {
      setProcessing(false);
    }
  };

  const handleDefer = async () => {
    if (!deferUntil) {
      toast.error("Please select a date to defer until");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deferred_until: deferUntil,
          defer_reason: deferReason,
        }),
      });
      if (response.ok) {
        toast.success("Decision deferred!");
        setShowDeferDialog(false);
        onUpdate();
        fetchDecisionDetails();
      } else {
        toast.error("Failed to defer decision");
      }
    } catch (error) {
      toast.error("Error deferring decision");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (response.ok) {
        setNewComment("");
        fetchDecisionDetails();
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error("Error adding comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/create-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          target_date: projectTargetDate || null,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success("Project created!");
        setShowCreateProjectDialog(false);
        fetchDecisionDetails();
        onUpdate();
      } else {
        toast.error("Failed to create project");
      }
    } catch (error) {
      toast.error("Error creating project");
    } finally {
      setProcessing(false);
    }
  };

  const handleSendNotification = async (recipientIds: string[], message: string, sendEmail: boolean) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_ids: recipientIds,
          message,
          send_email: sendEmail,
        }),
      });
      if (response.ok) {
        toast.success("Notifications sent!");
        setShowNotifyDialog(false);
      } else {
        toast.error("Failed to send notifications");
      }
    } catch (error) {
      toast.error("Error sending notifications");
    } finally {
      setProcessing(false);
    }
  };

  if (!decision) return null;

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  const statusColors: Record<string, string> = {
    pending: "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    decided: "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20",
    delegated: "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    deferred: "border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-900/20",
    cancelled: "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20",
  };

  const relationshipLabels: Record<string, string> = {
    decides_on: "Decides on",
    spawns: "Creates",
    blocks: "Blocks",
    relates_to: "Related to",
    parent_of: "Parent of",
    child_of: "Child of",
    depends_on: "Depends on",
    informs: "Informs",
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn("text-xs", statusColors[decision.status])}>
                    {decision.status}
                  </Badge>
                  <Badge className={cn("text-xs", priorityColors[decision.priority])}>
                    {decision.priority}
                  </Badge>
                </div>
                <SheetTitle className="text-xl">{decision.title}</SheetTitle>
                {decision.due_date && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(decision.due_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          {decision.status === "pending" && (
            <div className="py-4 border-b">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setShowDecideDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Decide
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDelegateDialog(true)}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Delegate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeferDialog(true)}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Defer
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifyDialog(true)}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Decided Actions */}
          {decision.status === "decided" && (
            <div className="py-4 border-b">
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={() => setShowCreateProjectDialog(true)}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
                <Button variant="outline" onClick={() => setShowNotifyDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Notify Stakeholders
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="details" className="text-xs">
                <FileCheck className="h-3 w-3 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="stakeholders" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                People
              </TabsTrigger>
              <TabsTrigger value="related" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" />
                Related
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Discussion
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-4">
              {decision.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {decision.description}
                  </p>
                </div>
              )}

              {decision.context && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Context</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {decision.context}
                  </p>
                </div>
              )}

              {decision.options && decision.options.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Options</h4>
                  <div className="space-y-2">
                    {decision.options.map((option, idx) => (
                      <Card key={idx} className={cn(
                        "p-3",
                        option.selected && "border-green-500 bg-green-50 dark:bg-green-900/20"
                      )}>
                        <div className="flex items-start gap-2">
                          {option.selected && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{option.title}</p>
                            {option.pros && option.pros.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs text-green-600">Pros: </span>
                                <span className="text-xs text-muted-foreground">{option.pros.join(", ")}</span>
                              </div>
                            )}
                            {option.cons && option.cons.length > 0 && (
                              <div>
                                <span className="text-xs text-red-600">Cons: </span>
                                <span className="text-xs text-muted-foreground">{option.cons.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Outcome (if decided) */}
              {decision.status === "decided" && decision.decision_made && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="py-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Decision Made
                    </h4>
                    <p className="text-sm font-medium">{decision.decision_made}</p>
                    {decision.decision_rationale && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {decision.decision_rationale}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Decided on {new Date(decision.decided_at!).toLocaleDateString()}
                      {decision.decided_by_user?.full_name && ` by ${decision.decided_by_user.full_name}`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Delegated Info */}
              {decision.status === "delegated" && decision.delegated_to_user && (
                <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                  <CardContent className="py-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Users className="h-4 w-4" />
                      Delegated
                    </h4>
                    <p className="text-sm">
                      Delegated to <span className="font-medium">{decision.delegated_to_user.full_name}</span>
                    </p>
                    {decision.delegation_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{decision.delegation_notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Deferred Info */}
              {decision.status === "deferred" && decision.deferred_until && (
                <Card className="border-gray-200 bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="py-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      Deferred
                    </h4>
                    <p className="text-sm">
                      Deferred until{" "}
                      <span className="font-medium">
                        {new Date(decision.deferred_until).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                    {decision.defer_reason && (
                      <p className="text-sm text-muted-foreground mt-1">{decision.defer_reason}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Source</span>
                    <p className="font-medium capitalize">{decision.source_type || "Manual"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="font-medium">
                      {new Date(decision.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {decision.user?.full_name && (
                    <div>
                      <span className="text-muted-foreground">Created by</span>
                      <p className="font-medium">{decision.user.full_name}</p>
                    </div>
                  )}
                  {decision.tags && decision.tags.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {decision.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Stakeholders Tab */}
            <TabsContent value="stakeholders" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Stakeholders ({stakeholders.length})</h4>
                <Button size="sm" onClick={() => setShowAddStakeholderDialog(true)}>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {stakeholders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No stakeholders added yet</p>
                  <p className="text-xs mt-1">Add people who should be involved in this decision</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stakeholders.map((stakeholder) => (
                    <Card key={stakeholder.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {stakeholder.stakeholder_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stakeholder.stakeholder_name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {stakeholder.role.replace("_", " ")}
                            </Badge>
                            {stakeholder.stakeholder_type === "contact" && (
                              <Badge variant="secondary" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                External
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {stakeholder.notify_on_decision && (
                            <Bell className="h-4 w-4 text-muted-foreground" title="Notified on decision" />
                          )}
                          {stakeholder.stakeholder_email && (
                            <Mail className="h-4 w-4 text-muted-foreground" title={stakeholder.stakeholder_email} />
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Related Items Tab */}
            <TabsContent value="related" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Related Items ({relatedItems.length})</h4>
                <Button size="sm" onClick={() => setShowLinkItemDialog(true)}>
                  <Link2 className="h-3 w-3 mr-1" />
                  Link
                </Button>
              </div>

              {relatedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No related items</p>
                  <p className="text-xs mt-1">Link opportunities, projects, or other decisions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedItems.map((item) => (
                    <Card key={item.relationship_id} className="p-3 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {item.related_type === "project" && (
                          <Briefcase className="h-5 w-5 text-blue-500" />
                        )}
                        {item.related_type === "opportunity" && (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        )}
                        {item.related_type === "decision" && (
                          <FileCheck className="h-5 w-5 text-purple-500" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.related_title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{item.related_type}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{relationshipLabels[item.relationship_type] || item.relationship_type}</span>
                          </div>
                        </div>
                        {item.related_status && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.related_status}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Start the discussion</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {comment.author_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author_name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                          {comment.is_edited && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No history yet</p>
                </div>
              ) : (
                <div className="space-y-0 relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {history.map((event, idx) => (
                    <div key={event.id} className="relative pl-10 pb-4">
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-background border-2 border-blue-500" />
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">
                          {event.event_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {event.comment && (
                        <p className="text-sm text-muted-foreground mt-1">{event.comment}</p>
                      )}
                      {event.performer_name && (
                        <p className="text-xs text-muted-foreground">by {event.performer_name}</p>
                      )}
                      {event.from_status && event.to_status && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{event.from_status}</Badge>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">{event.to_status}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Decide Dialog */}
      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Record Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Decision Outcome *</label>
              <input
                type="text"
                placeholder="What was decided?"
                value={decisionOutcome}
                onChange={(e) => setDecisionOutcome(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Rationale</label>
              <textarea
                placeholder="Why was this decision made?"
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecideDialog(false)}>Cancel</Button>
            <Button
              onClick={handleDecide}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Record Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Delegate Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Delegate to *</label>
              <Select value={delegateTo} onValueChange={setDelegateTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <textarea
                placeholder="Any instructions or context..."
                value={delegateNotes}
                onChange={(e) => setDelegateNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelegateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleDelegate}
              disabled={processing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
              Delegate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Defer Dialog */}
      <Dialog open={showDeferDialog} onOpenChange={setShowDeferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Defer Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Defer until *</label>
              <input
                type="date"
                value={deferUntil}
                onChange={(e) => setDeferUntil(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reason</label>
              <textarea
                placeholder="Why is this being deferred?"
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeferDialog(false)}>Cancel</Button>
            <Button onClick={handleDefer} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
              Defer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Create Project from Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Project Name *</label>
              <input
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                placeholder="Project description..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Date</label>
              <input
                type="date"
                value={projectTargetDate}
                onChange={(e) => setProjectTargetDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Briefcase className="h-4 w-4 mr-2" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
