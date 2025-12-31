"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Copy,
  Pencil,
  Trash2,
  Check,
  X,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  FileText,
  Mail,
  Share2,
  Clock,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TaskDeliverable,
  PLATFORM_CONFIG,
  CONTENT_TYPE_CONFIG,
} from "@/types/task-deliverables";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AICompanion } from "@/components/tasks/AICompanion";
import { RelatedItems } from "@/components/cross-linking/RelatedItems";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  tags?: string[];
}

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [deliverables, setDeliverables] = useState<TaskDeliverable[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [editingDeliverable, setEditingDeliverable] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "linkedin", "instagram"]);

  const availablePlatforms = [
    { id: "twitter", label: "Twitter/X", icon: Twitter },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "youtube", label: "YouTube", icon: Youtube },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const fetchTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setDeliverables(data.deliverables || []);
        setSubtasks(data.subtasks || []);
      } else {
        toast.error("Task not found");
        router.push("/dashboard/tasks");
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId, fetchTask]);

  const handleStatusToggle = async () => {
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        toast.success(newStatus === "done" ? "Task completed!" : "Task reopened");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const startEditing = (deliverable: TaskDeliverable) => {
    setEditingDeliverable(deliverable.id);
    setEditContent(deliverable.content);
  };

  const cancelEditing = () => {
    setEditingDeliverable(null);
    setEditContent("");
  };

  const saveDeliverable = async (deliverableId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/deliverables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          content: editContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDeliverables((prev) =>
          prev.map((d) => (d.id === deliverableId ? data.deliverable : d))
        );
        setEditingDeliverable(null);
        setEditContent("");
        toast.success("Saved!");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteDeliverable = async (deliverableId: string) => {
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/deliverables?id=${deliverableId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== deliverableId));
        toast.success("Deleted!");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    }
  };

  const handleApplySuggestion = async (deliverableId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/deliverables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          content: newContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDeliverables((prev) =>
          prev.map((d) => (d.id === deliverableId ? data.deliverable : d))
        );
      } else {
        toast.error("Failed to apply suggestion");
      }
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      toast.error("Failed to apply suggestion");
    }
  };

  const generateMore = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setGenerating(true);
    setGenerateDialogOpen(false);
    try {
      const response = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          platforms: selectedPlatforms,
        }),
      });

      if (response.ok) {
        await fetchTask();
        toast.success("Generated new content!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to generate");
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      toast.error("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const getPlatformIcon = (platform?: string | null) => {
    switch (platform?.toLowerCase()) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform?: string | null) => {
    switch (platform?.toLowerCase()) {
      case "twitter":
        return "bg-sky-500";
      case "linkedin":
        return "bg-blue-600";
      case "instagram":
        return "bg-gradient-to-br from-purple-500 to-pink-500";
      case "facebook":
        return "bg-blue-500";
      case "youtube":
        return "bg-red-600";
      default:
        return "bg-slate-500";
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "social_post":
        return <Share2 className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Overdue", urgent: true };
    if (days === 0) return { text: "Due Today", urgent: true };
    if (days === 1) return { text: "Due Tomorrow", urgent: false };
    return { text: `Due ${formatDate(dateString)}`, urgent: false };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 dark:text-slate-400">Task not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/tasks")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const dueInfo = formatDueDate(task.due_date);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/tasks")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </button>

        {/* Task Header Card */}
        <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-6">
          {/* Priority indicator */}
          <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-full ${getPriorityIndicator(task.priority)}`} />

          <div className="pl-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={handleStatusToggle}
                    className="flex-shrink-0 focus:outline-none group"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-7 w-7 text-green-500" />
                    ) : (
                      <Circle className="h-7 w-7 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition-colors" />
                    )}
                  </button>
                  <h1
                    className={cn(
                      "text-2xl font-bold",
                      task.status === "done"
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    {task.title}
                  </h1>
                </div>

                {task.description && (
                  <p className="text-slate-600 dark:text-slate-400 mb-4 pl-11">
                    {task.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 pl-11">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full capitalize
                    ${task.priority === "urgent" ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" :
                      task.priority === "high" ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" :
                      task.priority === "medium" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" :
                      "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50"
                    }`}
                  >
                    <Flag className="h-3 w-3" />
                    {task.priority}
                  </span>

                  {dueInfo && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
                      ${dueInfo.urgent
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
                        : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50"
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {dueInfo.text}
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full
                    ${task.status === "done"
                      ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                    }`}
                  >
                    {task.status === "done" ? (
                      <>
                        <Check className="h-3 w-3" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        {task.status === "in_progress" ? "In Progress" : "To Do"}
                      </>
                    )}
                  </span>
                </div>

                {/* Timestamps */}
                <div className="flex gap-4 mt-4 pl-11 text-xs text-slate-400 dark:text-slate-500">
                  <span>Created {formatDate(task.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <Button
                variant={task.status === "done" ? "outline" : "default"}
                size="sm"
                onClick={handleStatusToggle}
                className={task.status !== "done" ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0" : ""}
              >
                {task.status === "done" ? (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Reopen
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Deliverables
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {deliverables.length} item{deliverables.length !== 1 ? "s" : ""} generated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AICompanion
                taskTitle={task.title}
                taskDescription={task.description}
                deliverables={deliverables.map((d) => ({
                  id: d.id,
                  platform: d.platform,
                  content: d.content,
                }))}
                onApplySuggestion={handleApplySuggestion}
              />
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generating || task.status === "done"}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Generate More
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Content</DialogTitle>
                  <DialogDescription>
                    Select which platforms you want to generate content for.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {availablePlatforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <div
                        key={platform.id}
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => togglePlatform(platform.id)}
                      >
                        <Checkbox
                          id={platform.id}
                          checked={selectedPlatforms.includes(platform.id)}
                          onCheckedChange={() => togglePlatform(platform.id)}
                        />
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center text-white",
                          platform.id === "twitter" ? "bg-sky-500" :
                          platform.id === "linkedin" ? "bg-blue-600" :
                          platform.id === "instagram" ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                          platform.id === "youtube" ? "bg-red-600" :
                          "bg-blue-500"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Label htmlFor={platform.id} className="cursor-pointer flex-1">
                          {platform.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={generateMore}
                    disabled={generating || selectedPlatforms.length === 0}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate ({selectedPlatforms.length})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {deliverables.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No deliverables yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Run AI to generate content for this task
              </p>
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                disabled={generating}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
                >
                  {/* Platform color bar */}
                  {deliverable.platform && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPlatformColor(deliverable.platform)}`} />
                  )}

                  <div className={cn("p-4", deliverable.platform && "pl-5")}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center text-white",
                          deliverable.platform ? getPlatformColor(deliverable.platform) : "bg-slate-500"
                        )}>
                          {deliverable.platform
                            ? getPlatformIcon(deliverable.platform)
                            : getContentTypeIcon(deliverable.content_type)
                          }
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {deliverable.title ||
                              (deliverable.platform
                                ? PLATFORM_CONFIG[deliverable.platform as keyof typeof PLATFORM_CONFIG]?.label || deliverable.platform
                                : CONTENT_TYPE_CONFIG[deliverable.content_type]?.label || deliverable.content_type
                              )
                            }
                          </span>
                          {deliverable.ai_generated && (
                            <span className="ml-2 text-xs text-violet-600 dark:text-violet-400">AI Generated</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {editingDeliverable === deliverable.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveDeliverable(deliverable.id)}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(deliverable.content)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditing(deliverable)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyToClipboard(deliverable.content)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this deliverable? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteDeliverable(deliverable.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content - Click to edit */}
                    {editingDeliverable === deliverable.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              cancelEditing();
                            } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                              e.preventDefault();
                              saveDeliverable(deliverable.id);
                            }
                          }}
                          className="min-h-[120px] font-mono text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          placeholder="Enter content..."
                          autoFocus
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">⌘+Enter</kbd> to save · <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> to cancel
                        </p>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditing(deliverable)}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-text hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-sm transition-all group/content"
                      >
                        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                          {deliverable.content}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 opacity-0 group-hover/content:opacity-100 transition-opacity">
                          Click to edit
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>v{deliverable.version}</span>
                        <span className="capitalize">{deliverable.status}</span>
                      </div>
                      {deliverable.content_type === "social_post" &&
                        deliverable.platform &&
                        PLATFORM_CONFIG[deliverable.platform as keyof typeof PLATFORM_CONFIG] && (
                          <span className={cn(
                            (editingDeliverable === deliverable.id ? editContent : deliverable.content).length >
                              PLATFORM_CONFIG[deliverable.platform as keyof typeof PLATFORM_CONFIG].maxChars
                              ? "text-red-500"
                              : ""
                          )}>
                            {(editingDeliverable === deliverable.id ? editContent : deliverable.content).length}/
                            {PLATFORM_CONFIG[deliverable.platform as keyof typeof PLATFORM_CONFIG].maxChars} chars
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subtasks Section */}
        {subtasks.length > 0 && (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Subtasks ({subtasks.length})
            </h2>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-500/50 cursor-pointer transition-all"
                  onClick={() => router.push(`/dashboard/tasks/${subtask.id}`)}
                >
                  {subtask.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "flex-1 text-sm",
                    subtask.status === "done" && "line-through text-slate-400 dark:text-slate-500"
                  )}>
                    {subtask.title}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize",
                    subtask.priority === "urgent" ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" :
                    subtask.priority === "high" ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" :
                    subtask.priority === "medium" ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" :
                    "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50"
                  )}>
                    {subtask.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Items Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm">🔗</span>
            </span>
            Related Items
          </h2>
          <RelatedItems
            sourceType="task"
            sourceId={taskId}
            excludeTypes={["task"]}
            showHeader={false}
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </button>

          <Button
            variant={task.status === "done" ? "outline" : "default"}
            onClick={handleStatusToggle}
            className={task.status !== "done" ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0" : ""}
          >
            {task.status === "done" ? (
              <>
                <Circle className="h-4 w-4 mr-2" />
                Reopen Task
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
