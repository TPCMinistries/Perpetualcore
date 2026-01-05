"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  FileText,
  MessageSquare,
  Activity,
  Settings,
  LayoutDashboard,
  Plus,
  Trash2,
  UserPlus,
  Loader2,
  CheckCircle2,
  Circle,
  Flag,
  MoreHorizontal,
  Building2,
  FolderOpen,
  Upload,
  Calendar,
  Target,
  Clock,
  Sparkles,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TeamAssistant } from "@/components/teams/TeamAssistant";

// Interfaces
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  tags: string[];
  assigned_to?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  priority: string;
  current_stage?: string;
  current_stage_color?: string;
  tags: string[];
  emoji?: string;
  color?: string;
  entity?: { id: string; name: string };
  brand?: { id: string; name: string };
  stage?: { id: string; name: string; color: string };
  created_at: string;
  updated_at: string;
  target_date?: string;
  budget?: number;
}

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface Document {
  id: string;
  title: string;
  file_type?: string;
  file_url?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  last_message_at?: string;
  message_count?: number;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_name?: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const priorityTextColors: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Tab-specific data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // UI state
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch project data
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  // Lazy load tab data
  useEffect(() => {
    if (activeTab === "files" && documents.length === 0) {
      fetchDocuments();
    }
    if (activeTab === "chat" && conversations.length === 0) {
      fetchConversations();
    }
    if (activeTab === "activity" && activities.length === 0) {
      fetchActivities();
    }
  }, [activeTab]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/entity-projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        toast.error("Project not found");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?source_reference=entity_project:${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchDocuments = async () => {
    // TODO: Implement when documents API is ready
    setDocuments([]);
  };

  const fetchConversations = async () => {
    // TODO: Implement when project conversations API is ready
    setConversations([]);
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activity?entity_type=project&entity_id=${projectId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !project) return;

    setAddingTask(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || undefined,
          priority: newTaskPriority,
          entityId: project.entity?.id,
          source_reference: `entity_project:${projectId}`,
          tags: [project.entity?.name, project.name].filter(Boolean),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks([data.task, ...tasks]);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setAddTaskOpen(false);
        toast.success("Task added!");
      } else {
        toast.error("Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "done" || task.status === "completed" ? "todo" : "done";
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });

      if (response.ok) {
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
        toast.success("Task deleted");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/entity-projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Project deleted");
        router.push("/dashboard/projects");
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Task stats
  const todoTasks = tasks.filter(t => t.status !== "done" && t.status !== "completed");
  const doneTasks = tasks.filter(t => t.status === "done" || t.status === "completed");
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/projects")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${project.color || "#6366f1"}20` }}
            >
              {project.emoji || "📁"}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge
                  variant="secondary"
                  className="capitalize"
                  style={{
                    backgroundColor: `${project.stage?.color || project.current_stage_color || "#6366f1"}20`,
                    color: project.stage?.color || project.current_stage_color || "#6366f1"
                  }}
                >
                  {project.stage?.name || project.current_stage || "planning"}
                </Badge>
                <Badge className={cn("text-white", priorityColors[project.priority])}>
                  {project.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                {project.entity && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {project.entity.name}
                  </div>
                )}
                {project.brand && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {project.brand.name}
                  </div>
                )}
                {project.target_date && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 container mx-auto px-6 py-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{tasks.length}</div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{doneTasks.length}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{documents.length}</div>
                      <p className="text-sm text-muted-foreground">Files</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{conversations.length}</div>
                      <p className="text-sm text-muted-foreground">Conversations</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{completionRate}% complete</span>
                        <span className="text-muted-foreground">{doneTasks.length}/{tasks.length} tasks</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Project AI Assistant */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-base">Project Assistant</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      AI assistant with context about this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamAssistant
                      teamId={projectId}
                      teamName={project.name}
                      teamType="project"
                      personality={`You are an AI assistant helping with the "${project.name}" project${project.entity ? ` for ${project.entity.name}` : ""}. The project is currently in the ${project.current_stage || "planning"} stage with ${tasks.length} tasks (${doneTasks.length} completed).`}
                      className="h-[300px]"
                    />
                  </CardContent>
                </Card>

                {/* Recent Tasks */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Recent Tasks</CardTitle>
                      <CardDescription className="text-xs">
                        Latest tasks in this project
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("tasks")}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                        >
                          <button
                            onClick={() => toggleTaskStatus(task)}
                            className={cn(
                              "flex-shrink-0",
                              task.status === "done" || task.status === "completed"
                                ? "text-green-500"
                                : "text-slate-400 hover:text-green-500"
                            )}
                          >
                            {task.status === "done" || task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <span className={cn(
                            "flex-1 truncate",
                            (task.status === "done" || task.status === "completed") && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          <Flag className={cn("h-4 w-4", priorityTextColors[task.priority])} />
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tasks yet. Add one to get started!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setAddTaskOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab("files")}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => setActiveTab("chat")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                  </CardContent>
                </Card>

                {/* Project Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {project.description && (
                      <>
                        <p className="text-muted-foreground">{project.description}</p>
                        <Separator />
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stage</span>
                      <span className="capitalize">{project.stage?.name || project.current_stage || "planning"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority</span>
                      <span className="capitalize">{project.priority}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    {project.target_date && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Date</span>
                          <span>{new Date(project.target_date).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <span className="text-muted-foreground block mb-2">Tags</span>
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Manage tasks for this project
                  </CardDescription>
                </div>
                <Button onClick={() => setAddTaskOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* To Do */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Circle className="h-4 w-4 text-blue-500" />
                      To Do ({todoTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {todoTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 group"
                        >
                          <button
                            onClick={() => toggleTaskStatus(task)}
                            className="flex-shrink-0 text-slate-400 hover:text-green-500"
                          >
                            <Circle className="h-5 w-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                            )}
                          </div>
                          <Flag className={cn("h-4 w-4", priorityTextColors[task.priority])} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      {todoTasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tasks to do. Great job!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Completed */}
                  {doneTasks.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Completed ({doneTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {doneTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 group"
                          >
                            <button
                              onClick={() => toggleTaskStatus(task)}
                              className="flex-shrink-0 text-green-500 hover:text-slate-400"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate line-through text-muted-foreground">{task.title}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Files</CardTitle>
                  <CardDescription>
                    Documents and files for this project
                  </CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No files yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload documents, images, or other files for this project
                    </p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Project Chat</CardTitle>
                <CardDescription>
                  AI-powered conversations about this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamAssistant
                  teamId={projectId}
                  teamName={project.name}
                  teamType="project"
                  personality={`You are an AI assistant helping with the "${project.name}" project${project.entity ? ` for ${project.entity.name}` : ""}. The project is currently in the ${project.current_stage || "planning"} stage with ${tasks.length} tasks (${doneTasks.length} completed). Help the user with project-related questions, planning, and task management.`}
                  className="h-[500px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    People working on this project
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add team members to collaborate on this project
                    </p>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar>
                          <AvatarImage src={member.user?.avatar_url} />
                          <AvatarFallback>
                            {member.user?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.user?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                  Recent activity on this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Activity will appear here as you work on the project
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user?.avatar_url} />
                          <AvatarFallback>
                            {activity.user?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user?.full_name}</span>
                            {" "}{activity.action}{" "}
                            {activity.entity_name && <span className="font-medium">{activity.entity_name}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Create a new task for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="Task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={addingTask || !newTaskTitle.trim()}>
              {addingTask ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
