"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Building2,
  Briefcase,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Archive,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Team, TeamType, TeamTemplate } from "@/types/work";
import { TeamTemplatePickerCompact } from "@/components/teams/TeamTemplatePicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<TeamTemplate | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [createStep, setCreateStep] = useState<"template" | "details">("template");

  // Fetch teams
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams?members=true");
      const data = await response.json();
      if (data.teams) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedTemplate) return;
    const teamName = newTeamName.trim() || selectedTemplate.name;
    if (!teamName) return;

    setCreating(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          description: newTeamDescription || selectedTemplate.description,
          team_type: selectedTemplate.team_type,
          emoji: selectedTemplate.emoji,
          color: selectedTemplate.color,
          template_id: selectedTemplate.id,
          ai_context: selectedTemplate.ai_context,
          workflow_stages: selectedTemplate.workflow_stages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeams([...teams, data.team]);
        setCreateDialogOpen(false);
        resetForm();
        toast.success("Team created successfully");
        // Navigate to the new team
        router.push(`/dashboard/teams/${data.team.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create team");
      }
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleArchiveTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });

      if (response.ok) {
        setTeams(teams.filter((t) => t.id !== teamId));
      }
    } catch (error) {
      console.error("Error archiving team:", error);
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setNewTeamName("");
    setNewTeamDescription("");
    setCreateStep("template");
  };

  const handleTemplateSelect = (template: TeamTemplate) => {
    setSelectedTemplate(template);
    setNewTeamName(template.name);
    setNewTeamDescription(template.description);
  };

  // Separate departments and project teams
  const departments = teams.filter((t) => t.team_type === "department");
  const projectTeams = teams.filter((t) => t.team_type === "project_team");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage departments and project teams with context-aware AI
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {createStep === "template" ? "Choose Team Template" : "Customize Team"}
              </DialogTitle>
              <DialogDescription>
                {createStep === "template"
                  ? "Select a template to start with. BOS 2.0 teams include AI-first workflows and lifecycle stages."
                  : "Customize the team name and description, or use the template defaults."}
              </DialogDescription>
            </DialogHeader>

            {createStep === "template" ? (
              <>
                <TeamTemplatePickerCompact
                  selectedTemplateId={selectedTemplate?.id}
                  onSelect={handleTemplateSelect}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setCreateStep("details")}
                    disabled={!selectedTemplate}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  {/* Selected template preview */}
                  {selectedTemplate && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${selectedTemplate.color}20` }}
                      >
                        {selectedTemplate.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{selectedTemplate.name}</span>
                          {selectedTemplate.category === "bos_2" && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI-First
                            </Badge>
                          )}
                        </div>
                        {selectedTemplate.workflow_stages && (
                          <div className="flex items-center gap-1 mt-1">
                            <Workflow className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {selectedTemplate.workflow_stages.length} workflow stages
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreateStep("template")}
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      placeholder={selectedTemplate?.name || "e.g., Product Launch Team"}
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use template name: {selectedTemplate?.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder={selectedTemplate?.description || "What does this team focus on?"}
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {selectedTemplate?.ai_context?.suggestions_focus && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">AI Focus Areas</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTemplate.ai_context.suggestions_focus.map((focus, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateStep("template")}
                  >
                    Back
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={creating}>
                    {creating ? "Creating..." : "Create Team"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Departments Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Departments</h2>
          <span className="text-sm text-muted-foreground">
            ({departments.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => router.push(`/dashboard/teams/${team.id}`)}
              onArchive={() => handleArchiveTeam(team.id)}
            />
          ))}
          {departments.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No departments created yet. Default departments will be created
              when you run the migration.
            </p>
          )}
        </div>
      </div>

      {/* Project Teams Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Project Teams</h2>
          <span className="text-sm text-muted-foreground">
            ({projectTeams.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => router.push(`/dashboard/teams/${team.id}`)}
              onArchive={() => handleArchiveTeam(team.id)}
            />
          ))}
          {projectTeams.length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No project teams yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a project team to organize cross-functional work
                </p>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project Team
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Team Card Component
function TeamCard({
  team,
  onClick,
  onArchive,
}: {
  team: Team;
  onClick: () => void;
  onArchive: () => void;
}) {
  const memberCount = (team as any).member_count || 0;
  const workflowStages = (team as any).workflow_stages;
  const templateId = (team as any).template_id;
  const isBOS2 = templateId?.includes("-engine") || templateId?.includes("training") || templateId?.includes("research") || templateId?.includes("technology") || templateId?.includes("opportunities") || workflowStages?.length > 0;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${team.color}20` }}
            >
              {team.emoji || "👥"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {team.name}
                </h3>
                {isBOS2 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    BOS 2.0
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {team.team_type.replace("_", " ")}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
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
      </CardHeader>
      <CardContent>
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {team.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
            </div>
            {workflowStages && workflowStages.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Workflow className="h-3.5 w-3.5" />
                <span className="text-xs">{workflowStages.length} stages</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
