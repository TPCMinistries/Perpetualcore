"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, FolderPlus, MoreVertical, Folder, Search, Trash2, Edit2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

interface Space {
  id: string;
  name: string;
  emoji: string;
  color: string;
  space_type: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model: string;
  project_id?: string;
  knowledge_space_id?: string;
}

interface ConversationSidebarProps {
  currentConversationId?: string;
  onConversationSelect: (id: string | undefined) => void;
  onNewConversation: () => void;
  mode?: "personal" | "team"; // Add mode prop to differentiate between personal AI chats and team conversations
}

export function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  mode = "team", // Default to team for backwards compatibility
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(["all"]));
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Use different endpoint based on mode
      const conversationsEndpoint = mode === "personal"
        ? "/api/chat/conversations"  // Personal AI chats
        : "/api/conversations";       // Team conversations

      // Fetch conversations - this is the main one
      try {
        const conversationsRes = await fetch(conversationsEndpoint);
        if (conversationsRes.ok) {
          const convData = await conversationsRes.json();
          setConversations(convData.conversations || convData || []);
        }
      } catch (e) {
        console.error("Failed to fetch conversations:", e);
      }

      // Fetch projects - optional, don't crash if fails
      try {
        const projectsRes = await fetch("/api/projects");
        if (projectsRes.ok) {
          const projData = await projectsRes.json();
          setProjects(Array.isArray(projData) ? projData : projData.projects || []);
        }
      } catch (e) {
        console.error("Failed to fetch projects:", e);
      }

      // Fetch spaces - optional, don't crash if fails
      try {
        const spacesRes = await fetch("/api/spaces");
        if (spacesRes.ok) {
          const spacesData = await spacesRes.json();
          setSpaces(spacesData.spaces || []);
        }
      } catch (e) {
        console.error("Failed to fetch spaces:", e);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          color: "#6366f1",
          icon: "📁",
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setNewProjectName("");
        setIsCreatingProject(false);
        toast.success("Project created!");
      } else {
        toast.error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const moveToProject = async (conversationId: string, projectId: string | null) => {
    try {
      // Use correct endpoint based on mode
      const endpoint = mode === "personal"
        ? `/api/chat/conversations/${conversationId}`
        : `/api/conversations/${conversationId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (response.ok) {
        // Update local state
        setConversations(conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, project_id: projectId || undefined }
            : conv
        ));
        toast.success(projectId ? "Moved to project" : "Removed from project");
      } else {
        toast.error("Failed to move conversation");
      }
    } catch (error) {
      console.error("Error moving conversation:", error);
      toast.error("Failed to move conversation");
    }
  };

  const openDeleteDialog = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const deleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      const response = await fetch(`/api/chat/conversations/${conversationToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConversations(conversations.filter(conv => conv.id !== conversationToDelete));
        toast.success("Conversation deleted");
        // If this was the current conversation, clear the chat
        if (currentConversationId === conversationToDelete) {
          onConversationSelect(undefined);
        }
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const startRenaming = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle);
  };

  const saveRename = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      setEditingConversationId(null);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (response.ok) {
        setConversations(conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: editingTitle.trim() }
            : conv
        ));
        setEditingConversationId(null);
        toast.success("Conversation renamed");
      } else {
        toast.error("Failed to rename conversation");
      }
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast.error("Failed to rename conversation");
    }
  };

  const cancelRenaming = () => {
    setEditingConversationId(null);
    setEditingTitle("");
  };

  // Filter conversations by search query and selected space
  const filteredConversations = (conversations || []).filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpace = selectedSpaceId === "all" || c.knowledge_space_id === selectedSpaceId;
    return matchesSearch && matchesSpace;
  });

  // Group conversations by project
  const unassignedConversations = filteredConversations.filter((c) => !c.project_id);
  const conversationsByProject = projects.reduce((acc, project) => {
    acc[project.id] = filteredConversations.filter((c) => c.project_id === project.id);
    return acc;
  }, {} as Record<string, Conversation[]>);

  if (isCollapsed) {
    return (
      <div className="w-12 h-full backdrop-blur-2xl bg-card/80 border border-border rounded-2xl p-2 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-60 h-full backdrop-blur-2xl bg-card/80 border border-border rounded-2xl p-4 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <Button
        onClick={onNewConversation}
        className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* Spaces Selector */}
      {spaces.length > 0 && (
        <div className="mb-4">
          <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
            <SelectTrigger className="w-full text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="All Spaces" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>All Spaces</span>
                </div>
              </SelectItem>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  <div className="flex items-center gap-2">
                    <span>{space.emoji}</span>
                    <span>{space.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({space.space_type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* New Project Button - Moved higher for visibility */}
      {!isCreatingProject ? (
        <Button
          variant="outline"
          onClick={() => setIsCreatingProject(true)}
          className="w-full justify-start text-sm mb-4"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      ) : (
        <div className="space-y-2 mb-4">
          <Input
            placeholder="Project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createProject();
              if (e.key === "Escape") {
                setIsCreatingProject(false);
                setNewProjectName("");
              }
            }}
            autoFocus
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={createProject} className="flex-1">
              Create
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreatingProject(false);
                setNewProjectName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </p>
        ) : (
          <>
            {/* All Conversations */}
            <div>
              <button
                onClick={() => toggleProject("all")}
                className="w-full flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors"
              >
                {expandedProjects.has("all") ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  All Conversations ({conversations.length})
                </span>
              </button>

              {expandedProjects.has("all") && (
                <div className="ml-2 mt-1 space-y-1">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        No conversations yet
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Start a new chat or organize with projects
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <FolderPlus className="h-3 w-3" />
                        <span>Create projects to organize your chats</span>
                      </div>
                    </div>
                  ) : unassignedConversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      All conversations are in projects
                    </p>
                  ) : (
                    unassignedConversations.map((conv) => (
                      <Card
                        key={conv.id}
                        className={`p-3 transition-all duration-200 hover:bg-accent/50 ${
                          currentConversationId === conv.id
                            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
                            : "bg-card/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {editingConversationId === conv.id ? (
                            <div className="flex-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveRename(conv.id);
                                  if (e.key === "Escape") cancelRenaming();
                                }}
                                onBlur={() => saveRename(conv.id)}
                                autoFocus
                                className="text-sm h-7 mb-1"
                              />
                            </div>
                          ) : (
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => onConversationSelect(conv.id)}
                            >
                              <p className="text-sm font-medium text-foreground truncate">
                                {conv.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.updated_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => startRenaming(conv.id, conv.title)}
                              >
                                <Edit2 className="h-3 w-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Move to Project</DropdownMenuLabel>
                              {projects.map((project) => (
                                <DropdownMenuItem
                                  key={project.id}
                                  onClick={() => moveToProject(conv.id, project.id)}
                                >
                                  <span className="mr-2">{project.icon}</span>
                                  {project.name}
                                </DropdownMenuItem>
                              ))}
                              {projects.length === 0 && (
                                <DropdownMenuItem disabled>
                                  <span className="text-xs">No projects yet</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(conv.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Projects */}
            {projects.map((project) => (
              <div key={project.id}>
                <button
                  onClick={() => toggleProject(project.id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors"
                  style={{ borderLeft: `3px solid ${project.color}` }}
                >
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-base">{project.icon}</span>
                  <span className="text-sm font-medium flex-1 truncate">
                    {project.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({conversationsByProject[project.id]?.length || 0})
                  </span>
                </button>

                {expandedProjects.has(project.id) && (
                  <div className="ml-2 mt-1 space-y-1">
                    {(conversationsByProject[project.id] || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2 px-3">
                        No conversations
                      </p>
                    ) : (
                      conversationsByProject[project.id].map((conv) => (
                        <Card
                          key={conv.id}
                          className={`p-3 transition-all duration-200 hover:bg-accent/50 ${
                            currentConversationId === conv.id
                              ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
                              : "bg-card/50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-1">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {editingConversationId === conv.id ? (
                              <div className="flex-1">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveRename(conv.id);
                                    if (e.key === "Escape") cancelRenaming();
                                  }}
                                  onBlur={() => saveRename(conv.id)}
                                  autoFocus
                                  className="text-sm h-7 mb-1"
                                />
                              </div>
                            ) : (
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onConversationSelect(conv.id)}
                              >
                                <p className="text-sm font-medium text-foreground truncate">
                                  {conv.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conv.updated_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => startRenaming(conv.id, conv.title)}
                                >
                                  <Edit2 className="h-3 w-3 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Move to Project</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => moveToProject(conv.id, null)}
                                >
                                  <Folder className="h-3 w-3 mr-2" />
                                  None (Remove from project)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {projects
                                  .filter((p) => p.id !== project.id)
                                  .map((p) => (
                                    <DropdownMenuItem
                                      key={p.id}
                                      onClick={() => moveToProject(conv.id, p.id)}
                                    >
                                      <span className="mr-2">{p.icon}</span>
                                      {p.name}
                                    </DropdownMenuItem>
                                  ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(conv.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setConversationToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
