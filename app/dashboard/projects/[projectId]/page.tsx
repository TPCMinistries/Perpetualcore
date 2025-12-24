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

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  // Milestone form state
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newMilestoneStage, setNewMilestoneStage] = useState<ProjectStage>("planning");

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
    if (!newMilestoneName.trim()) return;

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
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
    } finally {
      setCreatingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestone: ProjectMilestone) => {
    const isCompleting = !milestone.completed_at;
    const completedAt = isCompleting ? new Date().toISOString() : null;

    try {
      await fetch(`/api/projects/${projectId}/milestones?id=${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed_at: completedAt }),
      });

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
    } catch (error) {
      console.error("Error toggling milestone:", error);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/milestones?id=${milestoneId}`, {
        method: "DELETE",
      });

      setProject((prev) =>
        prev
          ? {
              ...prev,
              milestones: prev.milestones.filter((m) => m.id !== milestoneId),
            }
          : null
      );
    } catch (error) {
      console.error("Error deleting milestone:", error);
    }
  };

  const resetMilestoneForm = () => {
    setNewMilestoneName("");
    setNewMilestoneDescription("");
    setNewMilestoneDueDate("");
    setNewMilestoneStage("planning");
  };

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
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-0">
            <Card>
              <CardContent className="p-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Project Task Board</h3>
                <p className="text-muted-foreground mb-4">
                  Manage tasks specific to this project. Coming soon.
                </p>
                <Button variant="outline" onClick={() => router.push("/dashboard/tasks")}>
                  View Global Tasks
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-0">
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Project Files</h3>
                <p className="text-muted-foreground mb-4">
                  Documents and files scoped to this project. Coming soon.
                </p>
                <Button variant="outline" onClick={() => router.push("/dashboard/library")}>
                  View Library
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-0">
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Project Conversations</h3>
                <p className="text-muted-foreground mb-4">
                  AI-assisted discussions specific to this project. Coming soon.
                </p>
                <Button variant="outline" onClick={() => router.push("/dashboard/chat")}>
                  Go to Chat
                </Button>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    People working on this project
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
