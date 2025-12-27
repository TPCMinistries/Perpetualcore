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
  ChevronLeft,
  Calendar,
  Users,
  MoreHorizontal,
  Archive,
  Trash2,
  Clock,
  Target,
  Settings,
  X,
  GripVertical,
  Sparkles,
  Tag,
  Building2,
  Check,
  MapPin,
  DollarSign,
  UserPlus,
  Milestone,
  Flag,
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
import { toast } from "sonner";

// Dynamic stage type from API
interface DynamicStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string;
  sort_order: number;
  is_default: boolean;
  is_complete: boolean;
}

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

  // Stage management state
  const [stages, setStages] = useState<DynamicStage[]>([]);
  const [stageSettingsOpen, setStageSettingsOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [addingStage, setAddingStage] = useState(false);

  // Drag & drop state
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStage | null>(null);

  // Form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTeams, setNewProjectTeams] = useState<string[]>([]);
  const [newProjectEmoji, setNewProjectEmoji] = useState("📁");
  const [newProjectColor, setNewProjectColor] = useState("#6366f1");
  const [newProjectPriority, setNewProjectPriority] =
    useState<ProjectPriority>("medium");
  const [newProjectTargetDate, setNewProjectTargetDate] = useState("");
  const [newProjectType, setNewProjectType] = useState<string>("general");
  const [newProjectClient, setNewProjectClient] = useState("");
  const [newProjectTags, setNewProjectTags] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);

  // Advanced setup state (Step 3)
  const [newProjectStartDate, setNewProjectStartDate] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [newProjectVolunteers, setNewProjectVolunteers] = useState("");
  const [newProjectMilestones, setNewProjectMilestones] = useState<string[]>([]);
  const [newMilestoneInput, setNewMilestoneInput] = useState("");
  const [newProjectMembers, setNewProjectMembers] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, full_name: string, avatar_url?: string}>>([]);

  // Project types with suggested emojis - organized by category
  const projectTypeCategories = [
    {
      category: "Business & Sales",
      types: [
        { id: "client", label: "Client Project", emoji: "💼", description: "Work for external clients" },
        { id: "sales_deal", label: "Sales Opportunity", emoji: "🎯", description: "Track deals through your pipeline" },
        { id: "rfp_proposal", label: "RFP / Proposal", emoji: "📝", description: "Respond to RFPs and create proposals" },
        { id: "product", label: "Product Launch", emoji: "🚀", description: "New product or feature release" },
        { id: "campaign", label: "Marketing Campaign", emoji: "📢", description: "Launch campaigns and track results" },
      ]
    },
    {
      category: "Operations & Planning",
      types: [
        { id: "event", label: "Event Planning", emoji: "🎉", description: "Conferences, webinars, retreats" },
        { id: "content", label: "Content Creation", emoji: "✍️", description: "Articles, videos, social media" },
        { id: "research", label: "Research & Analysis", emoji: "🔬", description: "Market research, competitive analysis" },
        { id: "internal", label: "Internal Initiative", emoji: "⚙️", description: "Internal improvements and processes" },
        { id: "general", label: "General Project", emoji: "📁", description: "Standard project workspace" },
      ]
    },
    {
      category: "Ministry & Non-Profit",
      types: [
        { id: "mission_trip", label: "Mission Trip", emoji: "✈️", description: "Short-term missions, trips, and outreach" },
        { id: "ministry_campaign", label: "Ministry Campaign", emoji: "⛪", description: "Evangelism, discipleship, or awareness campaigns" },
        { id: "partnership", label: "Partnership", emoji: "🤝", description: "Non-profit partnerships and collaborations" },
        { id: "fundraising", label: "Fundraising", emoji: "💰", description: "Donation campaigns and fundraising efforts" },
        { id: "outreach", label: "Outreach Program", emoji: "🌍", description: "Community outreach and service programs" },
        { id: "grant_rfp", label: "Grant / RFP", emoji: "📋", description: "Grant applications and proposals" },
      ]
    },
  ];

  // Flatten for easy lookup
  const projectTypes = projectTypeCategories.flatMap(cat => cat.types);

  // AI setup state
  const [aiSetupMode, setAiSetupMode] = useState(false);
  const [aiProjectDescription, setAiProjectDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFileContent, setAiFileContent] = useState<string | null>(null);
  const [aiFileName, setAiFileName] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    name?: string;
    description?: string;
    type?: string;
    milestones?: string[];
    tasks?: string[];
  } | null>(null);

  // Quick emoji picker
  const quickEmojis = ["📁", "🚀", "📢", "🤝", "✍️", "🎉", "🔬", "⚙️", "💡", "🎯", "📊", "🎨", "💼", "🌟", "⚡", "🔥"];

  // Predefined tags - organized for various project types
  const availableTags = [
    // Timing
    "urgent", "q1", "q2", "q3", "q4", "2025", "2026",
    // Ministry
    "missions", "outreach", "discipleship", "youth", "worship", "community",
    // Business
    "marketing", "sales", "product", "design", "development",
    // Non-profit
    "fundraising", "grant", "partnership", "volunteer",
  ];

  // Fetch stages from API
  const fetchStages = useCallback(async () => {
    try {
      const response = await fetch("/api/project-stages");
      const data = await response.json();
      if (data.stages && data.stages.length > 0) {
        setStages(data.stages);
      } else {
        // Fallback to KANBAN_COLUMNS
        setStages(
          KANBAN_COLUMNS.map((col, idx) => ({
            id: col.id,
            name: col.title,
            slug: col.id,
            color: col.color,
            icon: col.icon,
            description: col.description,
            sort_order: idx,
            is_default: col.id === "ideation",
            is_complete: col.id === "complete",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
      // Fallback to KANBAN_COLUMNS
      setStages(
        KANBAN_COLUMNS.map((col, idx) => ({
          id: col.id,
          name: col.title,
          slug: col.id,
          color: col.color,
          icon: col.icon,
          description: col.description,
          sort_order: idx,
          is_default: col.id === "ideation",
          is_complete: col.id === "complete",
        }))
      );
    }
  }, []);

  // Fetch data
  useEffect(() => {
    Promise.all([fetchStages(), fetchProjects(), fetchTeams()]).finally(() =>
      setLoading(false)
    );
  }, [filterTeam, fetchStages]);

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
          team_id: newProjectTeams.length > 0 ? newProjectTeams[0] : undefined, // Primary team
          team_ids: newProjectTeams.length > 0 ? newProjectTeams : undefined, // All teams
          emoji: newProjectEmoji,
          color: newProjectColor,
          priority: newProjectPriority,
          start_date: newProjectStartDate || undefined,
          target_date: newProjectTargetDate || undefined,
          project_type: newProjectType,
          client_name: newProjectClient || undefined,
          tags: newProjectTags.length > 0 ? newProjectTags : undefined,
          // Advanced setup fields
          budget: newProjectBudget ? parseFloat(newProjectBudget) : undefined,
          location: newProjectLocation || undefined,
          expected_participants: newProjectVolunteers ? parseInt(newProjectVolunteers) : undefined,
          milestones: newProjectMilestones.length > 0 ? newProjectMilestones : undefined,
          initial_members: newProjectMembers.length > 0 ? newProjectMembers : undefined,
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
        toast.success("Project created successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
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
    setNewProjectTeams([]);
    setNewProjectEmoji("📁");
    setNewProjectColor("#6366f1");
    setNewProjectPriority("medium");
    setNewProjectTargetDate("");
    setNewProjectType("general");
    setNewProjectClient("");
    setNewProjectTags([]);
    setCreateStep(1);
    setAiSetupMode(false);
    setAiProjectDescription("");
    setAiSuggestions(null);
    setAiFileContent(null);
    // Reset advanced setup
    setNewProjectStartDate("");
    setNewProjectBudget("");
    setNewProjectLocation("");
    setNewProjectVolunteers("");
    setNewProjectMilestones([]);
    setNewMilestoneInput("");
    setNewProjectMembers([]);
    setTeamMembers([]);
  };

  // Toggle team selection
  const toggleTeam = (teamId: string) => {
    setNewProjectTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // Fetch team members when team is selected
  const fetchTeamMembers = useCallback(async (teamId: string) => {
    if (!teamId || teamId === "none") {
      setTeamMembers([]);
      return;
    }
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }, []);

  // Add milestone helper
  const addMilestone = () => {
    if (newMilestoneInput.trim()) {
      setNewProjectMilestones(prev => [...prev, newMilestoneInput.trim()]);
      setNewMilestoneInput("");
    }
  };

  const removeMilestone = (index: number) => {
    setNewProjectMilestones(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle team member selection
  const toggleMember = (memberId: string) => {
    setNewProjectMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Get type-specific fields to show
  const getTypeSpecificFields = () => {
    switch (newProjectType) {
      case "mission_trip":
        return { showLocation: true, showVolunteers: true, showBudget: true, budgetLabel: "Fundraising Goal", showStartDate: true };
      case "fundraising":
        return { showBudget: true, budgetLabel: "Fundraising Goal", showStartDate: true };
      case "grant_rfp":
        return { showBudget: true, budgetLabel: "Grant Amount", showDeadline: true };
      case "rfp_proposal":
        return { showBudget: true, budgetLabel: "Proposal Value", showClient: true, showDeadline: true };
      case "client":
      case "sales_deal":
        return { showBudget: true, budgetLabel: "Contract Value", showClient: true };
      case "event":
        return { showLocation: true, showVolunteers: true, showBudget: true, budgetLabel: "Event Budget", showStartDate: true };
      case "outreach":
        return { showLocation: true, showVolunteers: true, showStartDate: true };
      case "partnership":
        return { showClient: true };
      default:
        return {};
    }
  };

  const handleProjectTypeSelect = (typeId: string) => {
    const type = projectTypes.find(t => t.id === typeId);
    if (type) {
      setNewProjectType(typeId);
      setNewProjectEmoji(type.emoji);
    }
  };

  const toggleTag = (tag: string) => {
    setNewProjectTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // AI Project Setup
  const handleAiSetup = async () => {
    if (!aiProjectDescription.trim() && !aiFileContent) {
      toast.error("Please describe your project or upload a file");
      return;
    }

    setAiGenerating(true);
    try {
      // Build the user message with description and/or file content
      let userContent = "";
      if (aiProjectDescription.trim()) {
        userContent += `Project Description: ${aiProjectDescription}\n\n`;
      }
      if (aiFileContent) {
        userContent += `Document Content (${aiFileName}):\n${aiFileContent.substring(0, 8000)}`; // Limit file content
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a project setup assistant. Based on the user's project description and/or uploaded document, suggest a structured project setup. Analyze the content carefully to extract key information.

Return a JSON object with:
- name: A concise project name (max 50 chars)
- description: A clear project description (2-3 sentences summarizing goals)
- type: One of these exact values: client, sales_deal, rfp_proposal, product, campaign, event, content, research, internal, general, mission_trip, ministry_campaign, partnership, fundraising, outreach, grant_rfp
- milestones: Array of 4-6 key milestone names for this project
- tasks: Array of 6-10 initial tasks to get started
- budget: Estimated budget if mentioned (number only, or null)
- deadline: Target deadline if mentioned (YYYY-MM-DD format, or null)
- client_name: Client or organization name if mentioned (or null)

Respond ONLY with valid JSON, no other text.`
            },
            {
              role: "user",
              content: userContent
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          // Parse the AI response as JSON
          const suggestions = JSON.parse(data.response);
          setAiSuggestions(suggestions);

          // Apply suggestions to form
          if (suggestions.name) setNewProjectName(suggestions.name);
          if (suggestions.description) setNewProjectDescription(suggestions.description);
          if (suggestions.type) {
            const type = projectTypes.find(t => t.id === suggestions.type);
            if (type) {
              setNewProjectType(suggestions.type);
              setNewProjectEmoji(type.emoji);
            }
          }
          if (suggestions.deadline) setNewProjectTargetDate(suggestions.deadline);
          if (suggestions.budget) setNewProjectBudget(suggestions.budget.toString());
          if (suggestions.client_name) setNewProjectClient(suggestions.client_name);

          setCreateStep(2);
          toast.success("AI analyzed and generated project setup!");
        } catch {
          // If JSON parsing fails, just move to step 2
          setCreateStep(2);
          toast.info("Couldn't parse AI suggestions, please fill in details manually");
        }
      }
    } catch (error) {
      console.error("AI setup error:", error);
      toast.error("Failed to get AI suggestions");
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiSuggestions = () => {
    if (aiSuggestions) {
      if (aiSuggestions.name) setNewProjectName(aiSuggestions.name);
      if (aiSuggestions.description) setNewProjectDescription(aiSuggestions.description);
    }
  };

  // Stage management handlers
  const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    setAddingStage(true);
    try {
      const response = await fetch("/api/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStageName,
          color: newStageColor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStages((prev) => [...prev, data.stage]);
        setNewStageName("");
        setNewStageColor("#6366f1");
        toast.success("Stage added");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add stage");
      }
    } catch (error) {
      console.error("Error adding stage:", error);
      toast.error("Failed to add stage");
    } finally {
      setAddingStage(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const response = await fetch(`/api/project-stages/${stageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStages((prev) => prev.filter((s) => s.id !== stageId));
        toast.success("Stage deleted");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete stage");
      }
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Failed to delete stage");
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
  };

  const handleDragOver = (e: React.DragEvent, stage: ProjectStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(stage);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, destStage: ProjectStage) => {
    e.preventDefault();
    setDragOverColumn(null);

    const projectId = e.dataTransfer.getData("text/plain") || draggedProject;
    if (!projectId) return;

    // Find source stage
    let sourceStage: ProjectStage | null = null;
    for (const stage of Object.keys(projects) as ProjectStage[]) {
      if (projects[stage].find((p) => p.id === projectId)) {
        sourceStage = stage;
        break;
      }
    }

    if (!sourceStage || sourceStage === destStage) {
      setDraggedProject(null);
      return;
    }

    // Move project
    handleMoveProject(projectId, sourceStage, destStage);
    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverColumn(null);
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

          {/* Pipeline Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStageSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Pipeline
          </Button>

          {/* Create Button */}
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Create New Project</DialogTitle>
                    <DialogDescription>
                      {createStep === 1 && "Choose a project type to get started"}
                      {createStep === 2 && "Configure your project details"}
                      {createStep === 3 && "Set up team, milestones & goals (optional)"}
                    </DialogDescription>
                  </div>
                </div>
                {/* Progress indicator - 3 steps */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      "flex-1 h-1.5 rounded-full transition-colors",
                      createStep >= 1 ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-700"
                    )} />
                    <span className="text-[10px] text-muted-foreground">Type</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      "flex-1 h-1.5 rounded-full transition-colors",
                      createStep >= 2 ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-700"
                    )} />
                    <span className="text-[10px] text-muted-foreground">Details</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      "flex-1 h-1.5 rounded-full transition-colors",
                      createStep >= 3 ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-700"
                    )} />
                    <span className="text-[10px] text-muted-foreground">Setup</span>
                  </div>
                </div>
              </DialogHeader>

              {createStep === 1 ? (
                /* Step 1: Project Type Selection or AI Setup */
                <div className="py-4">
                  {/* AI Setup Option */}
                  <div className="mb-6">
                    <button
                      onClick={() => setAiSetupMode(!aiSetupMode)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        aiSetupMode
                          ? "border-violet-500 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30"
                          : "border-dashed border-slate-300 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700"
                      )}
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Let AI Help Set Up Your Project</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Describe what you're working on and AI will suggest the structure, tasks, and milestones
                        </p>
                      </div>
                      {aiSetupMode && <Check className="h-5 w-5 text-violet-500 flex-shrink-0" />}
                    </button>

                    {aiSetupMode && (
                      <div className="mt-4 space-y-4">
                        <Textarea
                          placeholder="Describe your project... e.g., 'We're planning a 2-week mission trip to Guatemala in March. Need to coordinate 20 volunteers, fundraise $50k, handle logistics, and partner with local churches.'"
                          value={aiProjectDescription}
                          onChange={(e) => setAiProjectDescription(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />

                        {/* File Upload Option */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Or upload a document (RFP, brief, proposal)</Label>
                          <div className="flex items-center gap-2">
                            <label className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                              aiFileContent
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                : "border-slate-300 dark:border-slate-600 hover:border-violet-400"
                            )}>
                              <input
                                type="file"
                                accept=".txt,.md,.doc,.docx,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setAiFileName(file.name);
                                    // Read text files directly
                                    if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
                                      const text = await file.text();
                                      setAiFileContent(text);
                                    } else {
                                      // For other files, just note that it was uploaded
                                      setAiFileContent(`[File uploaded: ${file.name}]`);
                                    }
                                  }
                                }}
                              />
                              {aiFileContent ? (
                                <>
                                  <Check className="h-4 w-4 text-violet-500" />
                                  <span className="text-sm text-violet-700 dark:text-violet-300">{aiFileName}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAiFileContent(null);
                                      setAiFileName(null);
                                    }}
                                    className="ml-2 text-slate-400 hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Upload file</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        <Button
                          onClick={handleAiSetup}
                          disabled={aiGenerating || (!aiProjectDescription.trim() && !aiFileContent)}
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              AI is analyzing and setting up your project...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Project Setup
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!aiSetupMode && (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-background px-2 text-muted-foreground">Or choose a project type</span>
                        </div>
                      </div>

                      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                        {projectTypeCategories.map((category) => (
                          <div key={category.category}>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                              {category.category}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {category.types.map((type) => (
                                <button
                                  key={type.id}
                                  onClick={() => handleProjectTypeSelect(type.id)}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:border-violet-300 dark:hover:border-violet-700",
                                    newProjectType === type.id
                                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                      : "border-slate-200 dark:border-slate-700"
                                  )}
                                >
                                  <span className="text-xl">{type.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{type.label}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{type.description}</p>
                                  </div>
                                  {newProjectType === type.id && (
                                    <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : createStep === 2 ? (
                /* Step 2: Project Details */
                <div className="py-4 space-y-5 max-h-[500px] overflow-y-auto pr-2">
                  {/* AI Suggestions Banner */}
                  {aiSuggestions && (aiSuggestions.milestones?.length || aiSuggestions.tasks?.length) && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-medium">AI Suggested Structure</span>
                      </div>
                      {aiSuggestions.milestones && aiSuggestions.milestones.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Milestones:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiSuggestions.milestones.map((m, i) => (
                              <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md text-xs">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiSuggestions.tasks && aiSuggestions.tasks.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Initial Tasks:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiSuggestions.tasks.slice(0, 5).map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md text-xs">{t}</span>
                            ))}
                            {aiSuggestions.tasks.length > 5 && (
                              <span className="px-2 py-1 text-xs text-muted-foreground">+{aiSuggestions.tasks.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 italic">These will be created when you create the project.</p>
                    </div>
                  )}

                  {/* Project Name & Emoji */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Input
                          value={newProjectEmoji}
                          onChange={(e) => setNewProjectEmoji(e.target.value)}
                          className="w-14 h-10 text-center text-xl p-0"
                          maxLength={2}
                        />
                      </div>
                      <Input
                        id="name"
                        placeholder="e.g., Q1 Product Launch"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                    </div>
                    {/* Quick emoji picker */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewProjectEmoji(emoji)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                            newProjectEmoji === emoji && "bg-violet-100 dark:bg-violet-900/30"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this project about? What are the goals?"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Client (for client projects) */}
                  {newProjectType === "client" && (
                    <div className="space-y-2">
                      <Label htmlFor="client" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Client Name
                      </Label>
                      <Input
                        id="client"
                        placeholder="e.g., Acme Corporation"
                        value={newProjectClient}
                        onChange={(e) => setNewProjectClient(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Teams Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Teams {newProjectTeams.length > 0 && <span className="text-xs text-muted-foreground">({newProjectTeams.length} selected)</span>}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {teams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => toggleTeam(team.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border",
                            newProjectTeams.includes(team.id)
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                              : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600"
                          )}
                        >
                          <span>{team.emoji}</span>
                          <span>{team.name}</span>
                          {newProjectTeams.includes(team.id) && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                      {teams.length === 0 && (
                        <p className="text-xs text-muted-foreground">No teams available</p>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
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
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🔵 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="urgent">🔴 Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Date & Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Target Date
                      </Label>
                      <Input
                        type="date"
                        value={newProjectTargetDate}
                        onChange={(e) => setNewProjectTargetDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color Theme</Label>
                      <div className="flex gap-2">
                        {["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#3b82f6", "#64748b"].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewProjectColor(color)}
                            className={cn(
                              "w-8 h-8 rounded-lg transition-all",
                              newProjectColor === color && "ring-2 ring-offset-2 ring-slate-900 dark:ring-white"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            newProjectTags.includes(tag)
                              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : createStep === 3 ? (
                /* Step 3: Advanced Setup */
                <div className="py-4 space-y-5 max-h-[500px] overflow-y-auto pr-2">
                  {/* Type-specific fields */}
                  {(() => {
                    const fields = getTypeSpecificFields();
                    return (
                      <>
                        {/* Budget/Goal */}
                        {fields.showBudget && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {fields.budgetLabel || "Budget"}
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g., 50000"
                              value={newProjectBudget}
                              onChange={(e) => setNewProjectBudget(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Location */}
                        {fields.showLocation && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Location
                            </Label>
                            <Input
                              placeholder="e.g., Guatemala City, Guatemala"
                              value={newProjectLocation}
                              onChange={(e) => setNewProjectLocation(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Dates */}
                        {fields.showStartDate && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Start Date
                              </Label>
                              <Input
                                type="date"
                                value={newProjectStartDate}
                                onChange={(e) => setNewProjectStartDate(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                End Date
                              </Label>
                              <Input
                                type="date"
                                value={newProjectTargetDate}
                                onChange={(e) => setNewProjectTargetDate(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Volunteers/Team Size */}
                        {fields.showVolunteers && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Expected Participants/Volunteers
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g., 20"
                              value={newProjectVolunteers}
                              onChange={(e) => setNewProjectVolunteers(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Client/Partner Name */}
                        {fields.showClient && !newProjectClient && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {newProjectType === "partnership" ? "Partner Organization" : "Client Name"}
                            </Label>
                            <Input
                              placeholder={newProjectType === "partnership" ? "e.g., Local Church Network" : "e.g., Acme Corp"}
                              value={newProjectClient}
                              onChange={(e) => setNewProjectClient(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Milestones */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Milestone className="h-4 w-4" />
                      Key Milestones
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a milestone..."
                        value={newMilestoneInput}
                        onChange={(e) => setNewMilestoneInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addMilestone}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {newProjectMilestones.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newProjectMilestones.map((milestone, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs"
                          >
                            {milestone}
                            <button
                              type="button"
                              onClick={() => removeMilestone(i)}
                              className="hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* AI suggested milestones */}
                    {aiSuggestions?.milestones && aiSuggestions.milestones.length > 0 && newProjectMilestones.length === 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">AI Suggested:</p>
                        <div className="flex flex-wrap gap-1">
                          {aiSuggestions.milestones.map((m, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setNewProjectMilestones(prev => [...prev, m])}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded text-xs transition-colors"
                            >
                              + {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Members (if teams selected) */}
                  {newProjectTeams.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Invite Team Members
                      </Label>
                      <p className="text-xs text-muted-foreground">Select members from your team to add to this project</p>
                      {teamMembers.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {teamMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleMember(member.id)}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-left transition-colors",
                                newProjectMembers.includes(member.id)
                                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                                  : "border-slate-200 dark:border-slate-700 hover:border-violet-300"
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                {member.full_name?.charAt(0) || "?"}
                              </div>
                              <span className="text-sm truncate">{member.full_name}</span>
                              {newProjectMembers.includes(member.id) && (
                                <Check className="h-4 w-4 text-violet-500 ml-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Loading team members...</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              <DialogFooter className="flex items-center justify-between sm:justify-between">
                {createStep > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setCreateStep((createStep - 1) as 1 | 2 | 3)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  {createStep === 1 ? (
                    <Button
                      onClick={() => setCreateStep(2)}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : createStep === 2 ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Fetch team members when going to step 3
                          if (newProjectTeams.length > 0) {
                            // Fetch members from the first selected team
                            fetchTeamMembers(newProjectTeams[0]);
                          }
                          setCreateStep(3);
                        }}
                      >
                        Advanced Setup
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={creating || !newProjectName.trim()}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                      >
                        {creating ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateProject}
                      disabled={creating || !newProjectName.trim()}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                    >
                      {creating ? "Creating..." : "Create Project"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Settings Dialog */}
      <Dialog open={stageSettingsOpen} onOpenChange={setStageSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pipeline Stages</DialogTitle>
            <DialogDescription>
              Customize your project pipeline by adding, removing, or reordering stages.
            </DialogDescription>
          </DialogHeader>

          {/* Current Stages */}
          <div className="space-y-2 py-4">
            <Label className="text-sm font-medium">Current Stages</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="flex-1 font-medium">{stage.name}</span>
                  {stage.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  {stage.is_complete && (
                    <Badge variant="outline" className="text-xs text-green-600">Complete</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteStage(stage.id)}
                    disabled={stages.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Stage */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Add New Stage</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="color"
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                placeholder="Stage name (e.g., On Hold)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddStage();
                }}
              />
              <Button onClick={handleAddStage} disabled={addingStage || !newStageName.trim()}>
                {addingStage ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setStageSettingsOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                column={{
                  id: stage.slug as ProjectStage,
                  title: stage.name,
                  color: stage.color,
                  icon: stage.icon,
                  description: stage.description || "",
                }}
                projects={projects[stage.slug as ProjectStage] || []}
                allStages={stages}
                onProjectClick={(id) =>
                  router.push(`/dashboard/projects/${id}`)
                }
                onMoveProject={handleMoveProject}
                onArchiveProject={(id) =>
                  handleArchiveProject(id, stage.slug as ProjectStage)
                }
                draggedProject={draggedProject}
                dragOverColumn={dragOverColumn}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
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
  allStages,
  onProjectClick,
  onMoveProject,
  onArchiveProject,
  draggedProject,
  dragOverColumn,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  column: (typeof KANBAN_COLUMNS)[0];
  projects: Project[];
  allStages: DynamicStage[];
  onProjectClick: (id: string) => void;
  onMoveProject: (
    id: string,
    from: ProjectStage,
    to: ProjectStage
  ) => void;
  onArchiveProject: (id: string) => void;
  draggedProject: string | null;
  dragOverColumn: ProjectStage | null;
  onDragStart: (e: React.DragEvent, projectId: string) => void;
  onDragOver: (e: React.DragEvent, stage: ProjectStage) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stage: ProjectStage) => void;
  onDragEnd: () => void;
}) {
  const isOver = dragOverColumn === column.id;

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
      <div
        className={cn(
          "flex-1 overflow-y-auto bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px] transition-colors",
          isOver && "bg-accent/50 ring-2 ring-primary/50"
        )}
        onDragOver={(e) => onDragOver(e, column.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, column.id)}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            draggable
            onDragStart={(e) => onDragStart(e, project.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "cursor-grab active:cursor-grabbing",
              draggedProject === project.id && "opacity-50"
            )}
          >
            <ProjectCard
              project={project}
              column={column}
              allStages={allStages}
              onClick={() => onProjectClick(project.id)}
              onMove={(toStage) =>
                onMoveProject(project.id, column.id, toStage)
              }
              onArchive={() => onArchiveProject(project.id)}
            />
          </div>
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
  allStages,
  onClick,
  onMove,
  onArchive,
}: {
  project: Project;
  column: (typeof KANBAN_COLUMNS)[0];
  allStages: DynamicStage[];
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
              {allStages.filter((s) => s.slug !== column.id).map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(s.slug as ProjectStage);
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: s.color }}
                  />
                  Move to {s.name}
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
