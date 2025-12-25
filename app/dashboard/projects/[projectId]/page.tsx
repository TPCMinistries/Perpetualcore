"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  CheckSquare,
  Target,
  Clock,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
  Flag,
  Milestone as MilestoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Project,
  ProjectWithDetails,
  ProjectMember,
  ProjectMilestone,
  ProjectStage,
  ProjectPriority,
  KANBAN_COLUMNS,
} from "@/types/work";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProjectAssistant } from "@/components/projects/ProjectAssistant";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  due_date?: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  file_url?: string;
  file_size?: number;
  status: string;
  created_at: string;
  added_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  description?: string;
  context_type: string;
  is_private: boolean;
  created_at: string;
  last_message_at?: string;
  creator_name?: string;
}

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatDescription, setNewChatDescription] = useState("");

  // Milestone form state
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newMilestoneStage, setNewMilestoneStage] = useState<ProjectStage>("planning");

  // Team assignment state
  const [changeTeamDialogOpen, setChangeTeamDialogOpen] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; emoji?: string; color?: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [changingTeam, setChangingTeam] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        router.push("/dashboard/projects");
        return;
      }
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: ProjectStage) => {
    if (!project) return;

    try {
      await fetch(`/api/projects/${projectId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      setProject({ ...project, current_stage: newStage });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) {
      toast.error("Please enter a milestone name");
      return;
    }

    setCreatingMilestone(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMilestoneName,
          description: newMilestoneDescription,
          due_date: newMilestoneDueDate || undefined,
          stage: newMilestoneStage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProject((prev) =>
          prev
            ? { ...prev, milestones: [...prev.milestones, data.milestone] }
            : null
        );
        setMilestoneDialogOpen(false);
        resetMilestoneForm();
        toast.success("Milestone created successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create milestone");
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
      toast.error("Failed to create milestone. Please try again.");
    } finally {
      setCreatingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestone: ProjectMilestone) => {
    const isCompleting = !milestone.completed_at;
    const completedAt = isCompleting ? new Date().toISOString() : null;

    try {
      const response = await fetch(`/api/projects/${projectId}/milestones?id=${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed_at: completedAt }),
      });

      if (response.ok) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                milestones: prev.milestones.map((m) =>
                  m.id === milestone.id ? { ...m, completed_at: completedAt } : m
                ),
              }
            : null
        );
        toast.success(isCompleting ? "Milestone completed" : "Milestone reopened");
      } else {
        toast.error("Failed to update milestone");
      }
    } catch (error) {
      console.error("Error toggling milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones?id=${milestoneId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                milestones: prev.milestones.filter((m) => m.id !== milestoneId),
              }
            : null
        );
        toast.success("Milestone deleted");
      } else {
        toast.error("Failed to delete milestone");
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    }
  };

  const resetMilestoneForm = () => {
    setNewMilestoneName("");
    setNewMilestoneDescription("");
    setNewMilestoneDueDate("");
    setNewMilestoneStage("planning");
  };

  // Task functions
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetch(`/api/tasks?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setCreatingTask(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || undefined,
          projectId: projectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prev) => [data.task, ...prev]);
        setTaskDialogOpen(false);
        resetTaskForm();
        toast.success("Task created successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
        toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success("Task deleted");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const resetTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
  };

  // Team functions
  const fetchAvailableTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setAvailableTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleChangeTeam = async () => {
    setChangingTeam(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeamId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update project with new team info
        if (selectedTeamId) {
          const newTeam = availableTeams.find(t => t.id === selectedTeamId);
          setProject(prev => prev ? {
            ...prev,
            team_id: selectedTeamId,
            team: newTeam ? { id: newTeam.id, name: newTeam.name, emoji: newTeam.emoji, color: newTeam.color } : null
          } : null);
        } else {
          setProject(prev => prev ? { ...prev, team_id: null, team: null } : null);
        }
        setChangeTeamDialogOpen(false);
        toast.success(selectedTeamId ? "Team assigned successfully" : "Team removed from project");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update team");
      }
    } catch (error) {
      console.error("Error changing team:", error);
      toast.error("Failed to update team");
    } finally {
      setChangingTeam(false);
    }
  };

  // Open team dialog handler
  useEffect(() => {
    if (changeTeamDialogOpen && availableTeams.length === 0) {
      fetchAvailableTeams();
    }
    if (changeTeamDialogOpen && project) {
      setSelectedTeamId(project.team_id || null);
    }
  }, [changeTeamDialogOpen]);

  // Document functions
  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents?document_id=${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        toast.success("Document removed from project");
      } else {
        toast.error("Failed to remove document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
      toast.error("Failed to remove document");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Conversation functions
  const fetchConversations = async () => {
    setConversationsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newChatTitle.trim()) {
      toast.error("Please enter a conversation title");
      return;
    }

    setCreatingChat(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChatTitle,
          description: newChatDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setChatDialogOpen(false);
        setNewChatTitle("");
        setNewChatDescription("");
        toast.success("Conversation created");
        // Navigate to the conversation
        router.push(`/dashboard/team/conversations/${data.conversation.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    } finally {
      setCreatingChat(false);
    }
  };

  // Fetch data when tabs change
  useEffect(() => {
    if (activeTab === "tasks" && tasks.length === 0) {
      fetchTasks();
    }
    if (activeTab === "files" && documents.length === 0) {
      fetchDocuments();
    }
    if (activeTab === "chat" && conversations.length === 0) {
      fetchConversations();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button onClick={() => router.push("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const stageInfo = KANBAN_COLUMNS.find((c) => c.id === project.current_stage);
  const completedMilestones = project.milestones?.filter((m) => m.completed_at).length || 0;
  const totalMilestones = project.milestones?.length || 0;

  const priorityColors: Record<ProjectPriority, string> = {
    low: "bg-slate-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/projects")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{project.emoji}</span>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-muted-foreground mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: stageInfo?.color,
                  color: stageInfo?.color,
                }}
              >
                {stageInfo?.title}
              </Badge>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  priorityColors[project.priority]
                )}
                title={`${project.priority} priority`}
              />
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="flex items-center gap-2">
            {KANBAN_COLUMNS.map((col, idx) => (
              <button
                key={col.id}
                onClick={() => handleStageChange(col.id)}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  project.current_stage === col.id
                    ? "opacity-100"
                    : "opacity-30 hover:opacity-50"
                )}
                style={{ backgroundColor: col.color }}
                title={col.title}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
              <Badge variant="secondary" className="ml-1">
                {project.member_count}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Tasks
                        </span>
                        <span className="text-sm font-medium">
                          {project.tasks_completed}/{project.tasks_total}
                        </span>
                      </div>
                      <Progress value={project.progress_percent} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Milestones
                        </span>
                        <span className="text-sm font-medium">
                          {completedMilestones}/{totalMilestones}
                        </span>
                      </div>
                      <Progress
                        value={
                          totalMilestones > 0
                            ? (completedMilestones / totalMilestones) * 100
                            : 0
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    {project.team && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Team</dt>
                        <dd className="font-medium">
                          {project.team.emoji} {project.team.name}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Priority</dt>
                      <dd className="font-medium capitalize">
                        {project.priority}
                      </dd>
                    </div>
                    {project.start_date && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Start Date</dt>
                        <dd className="font-medium">
                          {new Date(project.start_date).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {project.target_date && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Target Date</dt>
                        <dd className="font-medium">
                          {new Date(project.target_date).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-medium">
                        {new Date(project.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Activity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Activity feed coming soon
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Milestones</CardTitle>
                    <CardDescription>
                      Key checkpoints for this project
                    </CardDescription>
                  </div>
                  <Dialog
                    open={milestoneDialogOpen}
                    onOpenChange={setMilestoneDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Milestone</DialogTitle>
                        <DialogDescription>
                          Create a key checkpoint for this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            placeholder="e.g., Alpha Release"
                            value={newMilestoneName}
                            onChange={(e) => setNewMilestoneName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="What does this milestone represent?"
                            value={newMilestoneDescription}
                            onChange={(e) =>
                              setNewMilestoneDescription(e.target.value)
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                              type="date"
                              value={newMilestoneDueDate}
                              onChange={(e) =>
                                setNewMilestoneDueDate(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Stage</Label>
                            <Select
                              value={newMilestoneStage}
                              onValueChange={(v) =>
                                setNewMilestoneStage(v as ProjectStage)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {KANBAN_COLUMNS.map((col) => (
                                  <SelectItem key={col.id} value={col.id}>
                                    {col.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setMilestoneDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateMilestone}
                          disabled={creatingMilestone}
                        >
                          {creatingMilestone ? "Adding..." : "Add Milestone"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {project.milestones && project.milestones.length > 0 ? (
                    <div className="space-y-3">
                      {project.milestones.map((milestone) => {
                        const milestoneStage = KANBAN_COLUMNS.find(
                          (c) => c.id === milestone.stage
                        );
                        return (
                          <div
                            key={milestone.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              milestone.completed_at && "bg-muted/50"
                            )}
                          >
                            <button
                              onClick={() => handleToggleMilestone(milestone)}
                              className="shrink-0"
                            >
                              {milestone.completed_at ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "font-medium",
                                    milestone.completed_at &&
                                      "line-through text-muted-foreground"
                                  )}
                                >
                                  {milestone.name}
                                </span>
                                {milestoneStage && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor: milestoneStage.color,
                                      color: milestoneStage.color,
                                    }}
                                  >
                                    {milestoneStage.title}
                                  </Badge>
                                )}
                              </div>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                            {milestone.due_date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  milestone.due_date
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleDeleteMilestone(milestone.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MilestoneIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">
                        No milestones yet
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMilestoneDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Milestone
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {project.tasks_total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {project.tasks_completed}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {project.member_count}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Team Members
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Assistant */}
            <div className="mt-6">
              <ProjectAssistant
                projectId={projectId}
                projectName={project.name}
                projectStage={project.current_stage}
              />
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>
                    Tasks specific to this project
                  </CardDescription>
                </div>
                <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Task</DialogTitle>
                      <DialogDescription>
                        Add a new task to this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g., Review design mockups"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Task details..."
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={newTaskPriority}
                            onValueChange={(v) => setNewTaskPriority(v as typeof newTaskPriority)}
                          >
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
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTask} disabled={creatingTask}>
                        {creatingTask ? "Creating..." : "Create Task"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          task.status === "completed" && "bg-muted/50"
                        )}
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="shrink-0"
                        >
                          {task.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                task.status === "completed" && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                task.priority === "urgent" && "border-red-500 text-red-500",
                                task.priority === "high" && "border-orange-500 text-orange-500",
                                task.priority === "medium" && "border-blue-500 text-blue-500",
                                task.priority === "low" && "border-slate-500 text-slate-500"
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No tasks yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Files</CardTitle>
                  <CardDescription>
                    Documents linked to this project
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push("/dashboard/library")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Document
                </Button>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={`/dashboard/documents/${doc.id}`}
                            className="font-medium hover:underline block truncate"
                          >
                            {doc.name}
                          </a>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase">{doc.type}</span>
                            <span>-</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            {doc.added_at && (
                              <>
                                <span>-</span>
                                <span>Added {new Date(doc.added_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/documents/${doc.id}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Open Document
                            </DropdownMenuItem>
                            {doc.file_url && (
                              <DropdownMenuItem asChild>
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No documents linked yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/library")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Link Document from Library
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Conversations</CardTitle>
                  <CardDescription>
                    AI-assisted discussions for this project
                  </CardDescription>
                </div>
                <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Conversation</DialogTitle>
                      <DialogDescription>
                        Create a new conversation for this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g., Sprint Planning Discussion"
                          value={newChatTitle}
                          onChange={(e) => setNewChatTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                          placeholder="What is this conversation about?"
                          value={newChatDescription}
                          onChange={(e) => setNewChatDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setChatDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateConversation} disabled={creatingChat}>
                        {creatingChat ? "Creating..." : "Start Conversation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-3">
                    {conversations.map((conv) => (
                      <a
                        key={conv.id}
                        href={`/dashboard/team/conversations/${conv.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors block"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{conv.title}</div>
                          {conv.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {conv.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {conv.creator_name && <span>By {conv.creator_name}</span>}
                            <span>-</span>
                            <span>
                              {conv.last_message_at
                                ? `Last activity ${new Date(conv.last_message_at).toLocaleDateString()}`
                                : `Created ${new Date(conv.created_at).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <Badge variant={conv.is_private ? "secondary" : "outline"}>
                          {conv.is_private ? "Private" : "Team"}
                        </Badge>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No conversations yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start First Conversation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Visual timeline of milestones and key dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {project.milestones
                        .sort((a, b) => {
                          if (!a.due_date) return 1;
                          if (!b.due_date) return -1;
                          return (
                            new Date(a.due_date).getTime() -
                            new Date(b.due_date).getTime()
                          );
                        })
                        .map((milestone, idx) => {
                          const milestoneStage = KANBAN_COLUMNS.find(
                            (c) => c.id === milestone.stage
                          );
                          return (
                            <div
                              key={milestone.id}
                              className="relative flex items-start gap-4 pl-10"
                            >
                              <div
                                className={cn(
                                  "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                                  milestone.completed_at
                                    ? "bg-green-500"
                                    : "bg-muted-foreground"
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {milestone.name}
                                  </span>
                                  {milestone.completed_at && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {milestone.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {milestone.due_date && (
                                    <span>
                                      Due:{" "}
                                      {new Date(
                                        milestone.due_date
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                  {milestoneStage && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: milestoneStage.color,
                                        color: milestoneStage.color,
                                      }}
                                    >
                                      {milestoneStage.title}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Add milestones to see them on the timeline
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-0">
            <div className="space-y-6">
              {/* Associated Team Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Associated Team</CardTitle>
                    <CardDescription>
                      The team this project belongs to
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChangeTeamDialogOpen(true)}
                  >
                    {project.team ? "Change Team" : "Assign Team"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {project.team ? (
                    <div
                      className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/dashboard/teams/${project.team_id}`)}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${project.team.color}20` }}
                      >
                        {project.team.emoji || "👥"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{project.team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Click to view team details
                        </p>
                      </div>
                      <Badge variant="secondary">Team</Badge>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">
                        No team assigned to this project
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChangeTeamDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign a Team
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Members Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Individual people working on this project
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </CardHeader>
                <CardContent>
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <Avatar>
                          <AvatarImage src={member.user?.avatar_url} />
                          <AvatarFallback>
                            {member.user?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {member.user?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No team members yet
                    </p>
                  </div>
                )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Team Dialog */}
      <Dialog open={changeTeamDialogOpen} onOpenChange={setChangeTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team</DialogTitle>
            <DialogDescription>
              Choose which team this project belongs to
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Select Team</Label>
            <Select
              value={selectedTeamId || "none"}
              onValueChange={(value) => setSelectedTeamId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No team (unassigned)</span>
                </SelectItem>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <span>{team.emoji || "👥"}</span>
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTeamId && (
              <p className="text-sm text-muted-foreground mt-2">
                Team members will have access to this project
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeTeam} disabled={changingTeam}>
              {changingTeam ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
