"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  FolderKanban,
  FileText,
  MessageSquare,
  Activity,
  Settings,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Crown,
  Eye,
  Loader2,
  Save,
  Archive,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Team,
  TeamMember,
  TeamMemberRole,
  TeamWithMembers,
  Project,
  TeamAIContext,
  WorkflowStage,
} from "@/types/work";
import { TeamAssistant } from "@/components/teams/TeamAssistant";
import { WorkflowStageCards } from "@/components/teams/WorkflowPipeline";
import { WorkItemKanban, WorkItemForm } from "@/components/work-items";
import { WorkItem, getItemTypeForTeam, getItemTypeLabel } from "@/types/work";

// Document and Conversation interfaces
interface Document {
  id: string;
  title: string;
  file_type?: string;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  title: string;
  last_message_at?: string;
  message_count?: number;
  created_at: string;
}

// Role icons
const roleIcons: Record<TeamMemberRole, React.ReactNode> = {
  lead: <Crown className="h-3 w-3" />,
  manager: <Shield className="h-3 w-3" />,
  member: <Users className="h-3 w-3" />,
  viewer: <Eye className="h-3 w-3" />,
};

const roleColors: Record<TeamMemberRole, string> = {
  lead: "bg-yellow-100 text-yellow-800",
  manager: "bg-blue-100 text-blue-800",
  member: "bg-gray-100 text-gray-800",
  viewer: "bg-gray-100 text-gray-600",
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  // Core state
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Tab-specific data
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Work items state (for BOS 2.0 teams)
  const [workItemFormOpen, setWorkItemFormOpen] = useState(false);
  const [workItemInitialStage, setWorkItemInitialStage] = useState<string | undefined>();
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | undefined>();
  const [workItemCounts, setWorkItemCounts] = useState<Record<string, number>>({});

  // UI state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editSettingsOpen, setEditSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for settings
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    emoji: "",
    color: "",
    personality: "",
    tone: "",
  });

  // Add member form
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberRole>("member");
  const [addingMember, setAddingMember] = useState(false);
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; full_name: string; email: string; avatar_url?: string }>>([]);

  // Fetch team data
  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  // Lazy load tab data
  useEffect(() => {
    if (activeTab === "projects" && projects.length === 0) {
      fetchProjects();
    }
    if (activeTab === "documents" && documents.length === 0) {
      fetchDocuments();
    }
    if (activeTab === "conversations" && conversations.length === 0) {
      fetchConversations();
    }
  }, [activeTab]);

  // Fetch work item counts for BOS 2.0 teams
  useEffect(() => {
    if (team && (team as any).workflow_stages?.length > 0) {
      fetchWorkItemCounts();
    }
  }, [team, teamId]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Team not found");
          router.push("/dashboard/teams");
          return;
        }
        throw new Error("Failed to fetch team");
      }
      const data = await response.json();
      setTeam(data.team);
      // Initialize edit form
      setEditForm({
        name: data.team.name || "",
        description: data.team.description || "",
        emoji: data.team.emoji || "",
        color: data.team.color || "#6366f1",
        personality: data.team.ai_context?.personality || "professional",
        tone: data.team.ai_context?.prompts?.tone || "",
      });
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects?team_id=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchWorkItemCounts = async () => {
    try {
      const response = await fetch(`/api/work-items/stats?team_id=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkItemCounts(data.stage_counts || {});
      }
    } catch (error) {
      console.error("Error fetching work item counts:", error);
    }
  };

  const fetchOrgMembers = async () => {
    try {
      const response = await fetch("/api/team/members");
      if (response.ok) {
        const data = await response.json();
        setOrgMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching org members:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!team) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          emoji: editForm.emoji,
          color: editForm.color,
          ai_context: {
            personality: editForm.personality,
            prompts: { tone: editForm.tone },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeam({ ...team, ...data.team });
        toast.success("Team settings saved");
        setEditSettingsOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail) return;
    setAddingMember(true);
    try {
      // Find user by email from org members
      const member = orgMembers.find(m => m.email === newMemberEmail);
      if (!member) {
        toast.error("User not found in organization");
        return;
      }

      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: member.id,
          role: newMemberRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeam(prev => prev ? {
          ...prev,
          members: [...(prev.members || []), data.member],
          member_count: (prev.member_count || 0) + 1,
        } : null);
        toast.success("Member added successfully");
        setAddMemberOpen(false);
        setNewMemberEmail("");
        setNewMemberRole("member");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const response = await fetch(
        `/api/teams/${teamId}/members?userId=${memberToRemove.user_id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setTeam(prev => prev ? {
          ...prev,
          members: prev.members?.filter(m => m.id !== memberToRemove.id) || [],
          member_count: Math.max(0, (prev.member_count || 0) - 1),
        } : null);
        toast.success("Member removed");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    } finally {
      setRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleArchiveTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });

      if (response.ok) {
        toast.success("Team archived");
        router.push("/dashboard/teams");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to archive team");
      }
    } catch (error) {
      console.error("Error archiving team:", error);
      toast.error("Failed to archive team");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Team deleted");
        router.push("/dashboard/teams");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete team");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${team?.name} Conversation` }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/chat?conversation=${data.conversation.id}`);
      } else {
        toast.error("Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Team not found</p>
        <Button onClick={() => router.push("/dashboard/teams")}>
          Back to Teams
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
              onClick={() => router.push("/dashboard/teams")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${team.color}20` }}
            >
              {team.emoji || "👥"}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{team.name}</h1>
                <Badge variant="secondary" className="capitalize">
                  {team.team_type.replace("_", " ")}
                </Badge>
                {(team as any).workflow_stages && (team as any).workflow_stages.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    BOS 2.0
                  </Badge>
                )}
              </div>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {team.description}
                </p>
              )}
            </div>

            <Button variant="outline" onClick={() => {
              setEditSettingsOpen(true);
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members ({team.member_count || 0})
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects ({team.project_count || 0})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            {(team as any).workflow_stages && (team as any).workflow_stages.length > 0 && (
              <TabsTrigger value="items" className="gap-2">
                <Workflow className="h-4 w-4" />
                {getItemTypeLabel(getItemTypeForTeam((team as any).template_id))}s
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{team.member_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{team.project_count || 0}</div>
                      <p className="text-sm text-muted-foreground">Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{documents.length}</div>
                      <p className="text-sm text-muted-foreground">Documents</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{conversations.length}</div>
                      <p className="text-sm text-muted-foreground">Conversations</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow Pipeline (for BOS 2.0 teams) */}
                {(team as any).workflow_stages && (team as any).workflow_stages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Workflow Pipeline</CardTitle>
                          <Badge variant="secondary" className="text-[10px]">
                            <Sparkles className="h-3 w-3 mr-1" />
                            BOS 2.0
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(team as any).workflow_stages.length} lifecycle stages
                        </span>
                      </div>
                      <CardDescription className="text-xs">
                        Track items through the lifecycle stages of this team
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WorkflowStageCards
                        stages={(team as any).workflow_stages as WorkflowStage[]}
                        counts={workItemCounts}
                        onStageClick={(stage) => {
                          setActiveTab("items");
                          toast.info(`Viewing ${stage.name} stage`);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Team AI Assistant */}
                <TeamAssistant
                  teamId={teamId}
                  teamName={team.name}
                  teamType={team.team_type}
                  personality={team.ai_context?.personality}
                  className="h-[400px]"
                />

                {/* Recent Members */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Team Members</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("members")}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {team.members?.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user?.avatar_url} />
                            <AvatarFallback>
                              {member.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.user?.full_name || member.user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.user?.email}
                            </p>
                          </div>
                          <Badge className={cn("text-xs", roleColors[member.role])}>
                            {roleIcons[member.role]}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                        </div>
                      ))}
                      {(!team.members || team.members.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => {
                        fetchOrgMembers();
                        setAddMemberOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={handleCreateConversation}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/projects?team=${teamId}`)}
                    >
                      <FolderKanban className="h-4 w-4 mr-2" />
                      View Projects
                    </Button>
                  </CardContent>
                </Card>

                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">{team.team_type.replace("_", " ")}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(team.created_at).toLocaleDateString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Color</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: team.color }}
                        />
                        <span>{team.color}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to this team
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  fetchOrgMembers();
                  setAddMemberOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback>
                          {member.user?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {member.user?.full_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", roleColors[member.role])}>
                        {roleIcons[member.role]}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setMemberToRemove(member);
                              setRemoveMemberDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {(!team.members || team.members.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team members yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          fetchOrgMembers();
                          setAddMemberOpen(true);
                        }}
                      >
                        Add First Member
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Projects</CardTitle>
                  <CardDescription>
                    Projects assigned to this team
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/dashboard/projects?team=${teamId}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${project.color}20` }}
                      >
                        {project.emoji || "📁"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {project.current_stage.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No projects assigned to this team</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push(`/dashboard/projects?team=${teamId}`)}
                      >
                        Create First Project
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Documents</CardTitle>
                  <CardDescription>
                    Documents shared with this team (included in AI context)
                  </CardDescription>
                </div>
                <Button onClick={() => router.push("/dashboard/library")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    >
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.file_type?.toUpperCase()} • Updated {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents assigned to this team</p>
                      <p className="text-sm mt-2">
                        Documents assigned to this team will be included in AI context
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Conversations</CardTitle>
                  <CardDescription>
                    AI conversations using this team's context
                  </CardDescription>
                </div>
                <Button onClick={handleCreateConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/dashboard/chat?conversation=${conv.id}`)}
                    >
                      <MessageSquare className="h-10 w-10 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{conv.title || "Untitled Conversation"}</p>
                        <p className="text-sm text-muted-foreground">
                          {conv.message_count || 0} messages • {new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleCreateConversation}
                      >
                        Start First Conversation
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
                <CardDescription>
                  Recent activity across the team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Activity tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab (for BOS 2.0 teams with workflow stages) */}
          {(team as any).workflow_stages && (team as any).workflow_stages.length > 0 && (
            <TabsContent value="items">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getItemTypeLabel(getItemTypeForTeam((team as any).template_id))} Pipeline
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Drag items between stages to update their status
                    </p>
                  </div>
                  <Button onClick={() => {
                    setWorkItemInitialStage(undefined);
                    setSelectedWorkItem(undefined);
                    setWorkItemFormOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {getItemTypeLabel(getItemTypeForTeam((team as any).template_id))}
                  </Button>
                </div>
                <WorkItemKanban
                  teamId={teamId}
                  stages={(team as any).workflow_stages as WorkflowStage[]}
                  itemType={getItemTypeForTeam((team as any).template_id)}
                  onItemClick={(item) => {
                    setSelectedWorkItem(item);
                    setWorkItemFormOpen(true);
                  }}
                  onCreateClick={(stageId) => {
                    setWorkItemInitialStage(stageId);
                    setSelectedWorkItem(undefined);
                    setWorkItemFormOpen(true);
                  }}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Work Item Form Dialog */}
      {(team as any).workflow_stages && (team as any).workflow_stages.length > 0 && (
        <WorkItemForm
          open={workItemFormOpen}
          onOpenChange={setWorkItemFormOpen}
          teamId={teamId}
          itemType={getItemTypeForTeam((team as any).template_id)}
          stages={(team as any).workflow_stages as WorkflowStage[]}
          initialStageId={workItemInitialStage}
          editItem={selectedWorkItem}
          onSuccess={() => {
            // Refresh the kanban
            setWorkItemFormOpen(false);
          }}
        />
      )}

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add an organization member to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Member</Label>
              <Select value={newMemberEmail} onValueChange={setNewMemberEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {orgMembers
                    .filter(m => !team?.members?.some(tm => tm.user_id === m.id))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.email}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as TeamMemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberEmail || addingMember}>
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={editSettingsOpen} onOpenChange={setEditSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
            <DialogDescription>
              Update team profile and AI configuration
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-4 pr-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Information</h4>
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <Input
                      value={editForm.emoji}
                      onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Personality
                </h4>
                <div className="space-y-2">
                  <Label>Personality Style</Label>
                  <Select
                    value={editForm.personality}
                    onValueChange={(v) => setEditForm({ ...editForm, personality: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="creative and engaging">Creative & Engaging</SelectItem>
                      <SelectItem value="technical and precise">Technical & Precise</SelectItem>
                      <SelectItem value="analytical and thorough">Analytical & Thorough</SelectItem>
                      <SelectItem value="empathetic and supportive">Empathetic & Supportive</SelectItem>
                      <SelectItem value="efficient and process-oriented">Efficient & Process-Oriented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Communication Tone</Label>
                  <Input
                    value={editForm.tone}
                    onChange={(e) => setEditForm({ ...editForm, tone: e.target.value })}
                    placeholder="e.g., confident and solution-oriented"
                  />
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleArchiveTeam}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Team
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setEditSettingsOpen(false);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              and remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user?.full_name || "this member"} from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
