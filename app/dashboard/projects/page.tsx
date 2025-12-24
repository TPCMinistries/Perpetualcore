"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderKanban,
  List,
  LayoutGrid,
  Filter,
  ChevronRight,
  Calendar,
  Users,
  MoreHorizontal,
  Archive,
  Trash2,
  Clock,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Project,
  ProjectStage,
  ProjectPriority,
  KANBAN_COLUMNS,
  Team,
} from "@/types/work";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Record<ProjectStage, Project[]>>({
    ideation: [],
    planning: [],
    in_progress: [],
    review: [],
    complete: [],
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTeam, setNewProjectTeam] = useState<string>("");
  const [newProjectEmoji, setNewProjectEmoji] = useState("📁");
  const [newProjectColor, setNewProjectColor] = useState("#6366f1");
  const [newProjectPriority, setNewProjectPriority] =
    useState<ProjectPriority>("medium");
  const [newProjectTargetDate, setNewProjectTargetDate] = useState("");

  // Fetch data
  useEffect(() => {
    Promise.all([fetchProjects(), fetchTeams()]).finally(() =>
      setLoading(false)
    );
  }, [filterTeam]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams({ group_by_stage: "true" });
      if (filterTeam && filterTeam !== "all") {
        params.set("team_id", filterTeam);
      }

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (data.grouped && data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      if (data.teams) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          team_id: newProjectTeam || undefined,
          emoji: newProjectEmoji,
          color: newProjectColor,
          priority: newProjectPriority,
          target_date: newProjectTargetDate || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add to ideation column
        setProjects((prev) => ({
          ...prev,
          ideation: [...prev.ideation, data.project],
        }));
        setCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleMoveProject = async (
    projectId: string,
    fromStage: ProjectStage,
    toStage: ProjectStage
  ) => {
    // Optimistic update
    const project = projects[fromStage].find((p) => p.id === projectId);
    if (!project) return;

    setProjects((prev) => ({
      ...prev,
      [fromStage]: prev[fromStage].filter((p) => p.id !== projectId),
      [toStage]: [...prev[toStage], { ...project, current_stage: toStage }],
    }));

    // API call
    try {
      await fetch(`/api/projects/${projectId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: toStage }),
      });
    } catch (error) {
      console.error("Error moving project:", error);
      // Revert on error
      fetchProjects();
    }
  };

  const handleArchiveProject = async (
    projectId: string,
    stage: ProjectStage
  ) => {
    setProjects((prev) => ({
      ...prev,
      [stage]: prev[stage].filter((p) => p.id !== projectId),
    }));

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });
    } catch (error) {
      console.error("Error archiving project:", error);
      fetchProjects();
    }
  };

  const resetForm = () => {
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectTeam("");
    setNewProjectEmoji("📁");
    setNewProjectColor("#6366f1");
    setNewProjectPriority("medium");
    setNewProjectTargetDate("");
  };

  const allProjects = Object.values(projects).flat();
  const totalCount = allProjects.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount} project{totalCount !== 1 ? "s" : ""} across all stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Team Filter */}
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.emoji} {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Button */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project workspace. Projects track from ideation to
                  completion with their own tasks, files, and conversations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q1 Product Launch"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this project about?"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team (Optional)</Label>
                    <Select
                      value={newProjectTeam}
                      onValueChange={setNewProjectTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.emoji} {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newProjectPriority}
                      onValueChange={(v) =>
                        setNewProjectPriority(v as ProjectPriority)
                      }
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Date (Optional)</Label>
                    <Input
                      type="date"
                      value={newProjectTargetDate}
                      onChange={(e) => setNewProjectTargetDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Appearance</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={newProjectEmoji}
                        onChange={(e) => setNewProjectEmoji(e.target.value)}
                        placeholder="Emoji"
                        className="w-16"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                projects={projects[column.id]}
                onProjectClick={(id) =>
                  router.push(`/dashboard/projects/${id}`)
                }
                onMoveProject={handleMoveProject}
                onArchiveProject={(id) =>
                  handleArchiveProject(id, column.id)
                }
              />
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              allProjects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  onClick={() =>
                    router.push(`/dashboard/projects/${project.id}`)
                  }
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  projects,
  onProjectClick,
  onMoveProject,
  onArchiveProject,
}: {
  column: (typeof KANBAN_COLUMNS)[0];
  projects: Project[];
  onProjectClick: (id: string) => void;
  onMoveProject: (
    id: string,
    from: ProjectStage,
    to: ProjectStage
  ) => void;
  onArchiveProject: (id: string) => void;
}) {
  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ backgroundColor: `${column.color}15` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {projects.length}
        </Badge>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px]">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            column={column}
            onClick={() => onProjectClick(project.id)}
            onMove={(toStage) =>
              onMoveProject(project.id, column.id, toStage)
            }
            onArchive={() => onArchiveProject(project.id)}
          />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No projects in {column.title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  column,
  onClick,
  onMove,
  onArchive,
}: {
  project: Project;
  column: (typeof KANBAN_COLUMNS)[0];
  onClick: () => void;
  onMove: (toStage: ProjectStage) => void;
  onArchive: () => void;
}) {
  const priorityColors: Record<ProjectPriority, string> = {
    low: "bg-slate-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{project.emoji}</span>
            <h4 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {KANBAN_COLUMNS.filter((c) => c.id !== column.id).map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(c.id);
                  }}
                >
                  Move to {c.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {project.description}
          </p>
        )}

        {/* Progress */}
        {project.tasks_total > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>
                {project.tasks_completed}/{project.tasks_total}
              </span>
            </div>
            <Progress value={project.progress_percent} className="h-1" />
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className={cn("w-2 h-2 rounded-full", priorityColors[project.priority])}
              title={`${project.priority} priority`}
            />
            {(project as any).team && (
              <span>
                {(project as any).team.emoji} {(project as any).team.name}
              </span>
            )}
          </div>
          {project.target_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(project.target_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// List View Item
function ProjectListItem({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const stageInfo = KANBAN_COLUMNS.find((c) => c.id === project.current_stage);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <span className="text-2xl">{project.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{project.name}</h4>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          style={{
            borderColor: stageInfo?.color,
            color: stageInfo?.color,
          }}
        >
          {stageInfo?.title}
        </Badge>
        {project.target_date && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>
              {new Date(project.target_date).toLocaleDateString()}
            </span>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
