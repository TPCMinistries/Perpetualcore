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

interface DecisionTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  created_at: string;
  completed_at?: string;
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
  onNavigate?: (target: { type: "decision" | "project" | "opportunity"; id: string }) => void;
}

export function DecisionDetailPanel({
  decision,
  open,
  onClose,
  onUpdate,
  onNavigate,
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
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<DecisionTask[]>([]);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

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

  // Link item dialog state
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkSearchResults, setLinkSearchResults] = useState<{ type: string; id: string; title: string; status?: string }[]>([]);
  const [linkSearchLoading, setLinkSearchLoading] = useState(false);
  const [selectedLinkItem, setSelectedLinkItem] = useState<{ type: string; id: string; title: string } | null>(null);
  const [linkRelationType, setLinkRelationType] = useState("relates_to");

  // Add stakeholder dialog state
  const [stakeholderType, setStakeholderType] = useState<"user" | "contact">("user");
  const [selectedStakeholderId, setSelectedStakeholderId] = useState("");
  const [stakeholderRole, setStakeholderRole] = useState("stakeholder");
  const [stakeholderNotes, setStakeholderNotes] = useState("");

  // Notify dialog state
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifySendEmail, setNotifySendEmail] = useState(false);
  const [selectedNotifyRecipients, setSelectedNotifyRecipients] = useState<string[]>([]);

  // Fetch decision details
  const fetchDecisionDetails = useCallback(async () => {
    if (!decision?.id) return;
    setLoading(true);

    try {
      const [stakeholdersRes, relatedRes, commentsRes, historyRes, tasksRes] = await Promise.all([
        fetch(`/api/decisions/${decision.id}/stakeholders`),
        fetch(`/api/decisions/${decision.id}/related`),
        fetch(`/api/decisions/${decision.id}/comments`),
        fetch(`/api/decisions/${decision.id}/history`),
        fetch(`/api/decisions/${decision.id}/tasks`),
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
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
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

  // Handle creating a task from this decision
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setCreatingTask(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
          assigned_to: newTaskAssignee || null,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success("Task created!");

        // Immediately add the new task to the list (optimistic update)
        if (data.task) {
          setTasks(prev => [{
            id: data.task.id,
            title: data.task.title,
            description: data.task.description,
            status: data.task.status || "todo",
            priority: data.task.priority || "medium",
            due_date: data.task.due_date,
            assigned_to: data.task.assigned_to,
            assigned_to_name: null,
            created_at: data.task.created_at,
          }, ...prev]);
        }

        setShowCreateTaskDialog(false);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskDueDate("");
        setNewTaskAssignee("");

        // Also refresh from server to get complete data
        fetchDecisionDetails();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create task");
      }
    } catch (error) {
      toast.error("Error creating task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSendNotification = async () => {
    if (selectedNotifyRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_ids: selectedNotifyRecipients,
          message: notifyMessage,
          send_email: notifySendEmail,
        }),
      });
      if (response.ok) {
        toast.success("Notifications sent!");
        setShowNotifyDialog(false);
        setNotifyMessage("");
        setSelectedNotifyRecipients([]);
        setNotifySendEmail(false);
      } else {
        toast.error("Failed to send notifications");
      }
    } catch (error) {
      toast.error("Error sending notifications");
    } finally {
      setProcessing(false);
    }
  };

  // Search for items to link
  const handleLinkSearch = async (query: string) => {
    setLinkSearchQuery(query);
    if (query.length < 2) {
      setLinkSearchResults([]);
      return;
    }
    setLinkSearchLoading(true);
    try {
      // Search opportunities
      const [opportunitiesRes, projectsRes, decisionsRes] = await Promise.all([
        fetch(`/api/opportunities?search=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/projects?search=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/decisions?search=${encodeURIComponent(query)}&limit=5`),
      ]);

      const results: { type: string; id: string; title: string; status?: string }[] = [];

      if (opportunitiesRes.ok) {
        const data = await opportunitiesRes.json();
        (data.opportunities || []).forEach((opp: any) => {
          if (opp.id !== decision?.id) {
            results.push({ type: "opportunity", id: opp.id, title: opp.title, status: opp.final_decision });
          }
        });
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        (data.projects || []).forEach((proj: any) => {
          results.push({ type: "project", id: proj.id, title: proj.name, status: proj.status });
        });
      }
      if (decisionsRes.ok) {
        const data = await decisionsRes.json();
        (data.decisions || []).forEach((dec: any) => {
          if (dec.id !== decision?.id) {
            results.push({ type: "decision", id: dec.id, title: dec.title, status: dec.status });
          }
        });
      }

      setLinkSearchResults(results);
    } catch (error) {
      console.error("Error searching items:", error);
    } finally {
      setLinkSearchLoading(false);
    }
  };

  // Create link to item
  const handleCreateLink = async () => {
    if (!selectedLinkItem) {
      toast.error("Please select an item to link");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/related`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: selectedLinkItem.type,
          target_id: selectedLinkItem.id,
          relationship_type: linkRelationType,
        }),
      });
      if (response.ok) {
        toast.success("Item linked!");
        setShowLinkItemDialog(false);
        setSelectedLinkItem(null);
        setLinkSearchQuery("");
        setLinkSearchResults([]);
        setLinkRelationType("relates_to");
        fetchDecisionDetails();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to link item");
      }
    } catch (error) {
      toast.error("Error linking item");
    } finally {
      setProcessing(false);
    }
  };

  // Add stakeholder
  const handleAddStakeholder = async () => {
    if (!selectedStakeholderId) {
      toast.error("Please select a person");
      return;
    }
    setProcessing(true);
    try {
      const payload: any = {
        role: stakeholderRole,
        notes: stakeholderNotes,
        notify_on_updates: true,
        notify_on_decision: true,
      };

      if (stakeholderType === "user") {
        payload.user_id = selectedStakeholderId;
      } else {
        payload.contact_id = selectedStakeholderId;
      }

      const response = await fetch(`/api/decisions/${decision?.id}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Stakeholder added!");
        setShowAddStakeholderDialog(false);
        setSelectedStakeholderId("");
        setStakeholderRole("stakeholder");
        setStakeholderNotes("");
        fetchDecisionDetails();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to add stakeholder");
      }
    } catch (error) {
      toast.error("Error adding stakeholder");
    } finally {
      setProcessing(false);
    }
  };

  // Remove relationship
  const handleRemoveRelationship = async (relationshipId: string) => {
    try {
      const response = await fetch(`/api/decisions/${decision?.id}/related`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationship_id: relationshipId }),
      });
      if (response.ok) {
        toast.success("Link removed");
        fetchDecisionDetails();
      } else {
        toast.error("Failed to remove link");
      }
    } catch (error) {
      toast.error("Error removing link");
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
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="details" className="text-xs">
                <FileCheck className="h-3 w-3 mr-1" />
                Details
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Tasks
                {tasks.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {tasks.length}
                  </Badge>
                )}
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

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Tasks ({tasks.length})</h4>
                <Button size="sm" onClick={() => setShowCreateTaskDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks created yet</p>
                  <p className="text-xs mt-1">Create tasks to track action items from this decision</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Card key={task.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            task.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300"
                          )}>
                            {task.status === "completed" && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              task.status === "completed" && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {task.assigned_to_name && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {task.assigned_to_name}
                                </span>
                              )}
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            task.priority === "urgent" && "border-red-500 text-red-600",
                            task.priority === "high" && "border-orange-500 text-orange-600",
                            task.priority === "medium" && "border-yellow-500 text-yellow-600",
                            task.priority === "low" && "border-green-500 text-green-600"
                          )}>
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
                    <Card
                      key={item.relationship_id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (onNavigate) {
                          onClose();
                          onNavigate({
                            type: item.related_type as "decision" | "project" | "opportunity",
                            id: item.related_id
                          });
                        }
                      }}
                    >
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
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

      {/* Create Task Dialog */}
      <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Create Task from Decision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Task Title *</label>
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                placeholder="Task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assign To</label>
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={creatingTask} className="bg-green-600 hover:bg-green-700">
              {creatingTask ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Item Dialog */}
      <Dialog open={showLinkItemDialog} onOpenChange={setShowLinkItemDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              Link Related Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Search for items</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search opportunities, projects, or decisions..."
                  value={linkSearchQuery}
                  onChange={(e) => handleLinkSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {linkSearchLoading && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search Results */}
            {linkSearchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {linkSearchResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedLinkItem(item)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg flex items-center gap-2 transition-colors",
                      selectedLinkItem?.id === item.id
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300"
                        : "hover:bg-muted"
                    )}
                  >
                    {item.type === "opportunity" && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {item.type === "project" && <Briefcase className="h-4 w-4 text-blue-500" />}
                    {item.type === "decision" && <FileCheck className="h-4 w-4 text-purple-500" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    </div>
                    {item.status && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.status}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Item */}
            {selectedLinkItem && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                <p className="text-sm font-medium">Selected: {selectedLinkItem.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedLinkItem.type}</p>
              </div>
            )}

            {/* Relationship Type */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Relationship Type</label>
              <Select value={linkRelationType} onValueChange={setLinkRelationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relates_to">Related to</SelectItem>
                  <SelectItem value="decides_on">Decides on</SelectItem>
                  <SelectItem value="depends_on">Depends on</SelectItem>
                  <SelectItem value="blocks">Blocks</SelectItem>
                  <SelectItem value="informs">Informs</SelectItem>
                  <SelectItem value="parent_of">Parent of</SelectItem>
                  <SelectItem value="child_of">Child of</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLinkItemDialog(false);
              setSelectedLinkItem(null);
              setLinkSearchQuery("");
              setLinkSearchResults([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateLink} disabled={processing || !selectedLinkItem}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              Link Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stakeholder Dialog */}
      <Dialog open={showAddStakeholderDialog} onOpenChange={setShowAddStakeholderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Add Stakeholder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Type Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
              <button
                onClick={() => { setStakeholderType("user"); setSelectedStakeholderId(""); }}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  stakeholderType === "user"
                    ? "bg-white dark:bg-slate-800 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Team Member
              </button>
              <button
                onClick={() => { setStakeholderType("contact"); setSelectedStakeholderId(""); }}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  stakeholderType === "contact"
                    ? "bg-white dark:bg-slate-800 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                External Contact
              </button>
            </div>

            {/* Person Select */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {stakeholderType === "user" ? "Select Team Member *" : "Select Contact *"}
              </label>
              <Select value={selectedStakeholderId} onValueChange={setSelectedStakeholderId}>
                <SelectTrigger>
                  <SelectValue placeholder={stakeholderType === "user" ? "Choose a team member" : "Choose a contact"} />
                </SelectTrigger>
                <SelectContent>
                  {stakeholderType === "user" ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))
                  ) : (
                    contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name} {contact.company && `(${contact.company})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <Select value={stakeholderRole} onValueChange={setStakeholderRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="decision_maker">Decision Maker</SelectItem>
                  <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="informed">Informed</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
              <textarea
                placeholder="Any additional context..."
                value={stakeholderNotes}
                onChange={(e) => setStakeholderNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStakeholderDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStakeholder} disabled={processing || !selectedStakeholderId}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Add Stakeholder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notify Stakeholders
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Recipients */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Recipients *</label>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {stakeholders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No stakeholders added yet. Add stakeholders first.
                  </p>
                ) : (
                  <>
                    {/* Quick select all */}
                    <button
                      onClick={() => {
                        const userIds = stakeholders
                          .filter(s => s.stakeholder_type === "user")
                          .map(s => s.stakeholder_id);
                        setSelectedNotifyRecipients(
                          selectedNotifyRecipients.length === userIds.length ? [] : userIds
                        );
                      }}
                      className="w-full text-left p-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      {selectedNotifyRecipients.length === stakeholders.filter(s => s.stakeholder_type === "user").length
                        ? "Deselect All"
                        : "Select All Team Members"}
                    </button>
                    {stakeholders.filter(s => s.stakeholder_type === "user").map((stakeholder) => (
                      <label
                        key={stakeholder.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNotifyRecipients.includes(stakeholder.stakeholder_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifyRecipients([...selectedNotifyRecipients, stakeholder.stakeholder_id]);
                            } else {
                              setSelectedNotifyRecipients(selectedNotifyRecipients.filter(id => id !== stakeholder.stakeholder_id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{stakeholder.stakeholder_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{stakeholder.role}</p>
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
              <textarea
                placeholder="Add a custom message..."
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifySendEmail}
                onChange={(e) => setNotifySendEmail(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Also send email notification</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSendNotification}
              disabled={processing || selectedNotifyRecipients.length === 0}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
