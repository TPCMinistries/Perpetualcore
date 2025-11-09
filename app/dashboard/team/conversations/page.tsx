"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import {
  Plus,
  MessageSquare,
  Users,
  Clock,
  Loader2,
  Tag,
  Lock,
  Globe,
  Archive,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  description: string | null;
  context_type: "document" | "general" | "training" | "project";
  is_private: boolean;
  is_archived: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  created_by: string;
  message_count?: number;
  participant_count?: number;
  creator_name?: string;
}

export default function TeamConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");

  // Create conversation form state
  const [newConversation, setNewConversation] = useState({
    title: "",
    description: "",
    context_type: "general" as const,
    is_private: false,
    tags: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, filterType, filterStatus]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("No organization found");
        return;
      }

      // Build query
      let query = supabase
        .from("shared_conversations")
        .select(
          `
          *,
          message_count:conversation_messages(count),
          participant_count:conversation_participants(count)
        `
        )
        .eq("organization_id", profile.organization_id);

      // Apply filters
      if (filterType !== "all") {
        query = query.eq("context_type", filterType);
      }

      if (filterStatus === "active") {
        query = query.eq("is_archived", false);
      } else if (filterStatus === "archived") {
        query = query.eq("is_archived", true);
      }

      query = query.order("last_message_at", { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;

      setConversations(data || []);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newConversation.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setCreating(true);
      const supabase = createClient();

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("No organization found");
        return;
      }

      // Parse tags
      const tags = newConversation.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Create conversation
      const { data: conversation, error } = await supabase
        .from("shared_conversations")
        .insert({
          organization_id: profile.organization_id,
          created_by: user?.id,
          title: newConversation.title,
          description: newConversation.description || null,
          context_type: newConversation.context_type,
          is_private: newConversation.is_private,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner participant
      await supabase.from("conversation_participants").insert({
        conversation_id: conversation.id,
        user_id: user?.id,
        role: "owner",
        can_send_messages: true,
        can_invite_others: true,
        can_edit_conversation: true,
      });

      toast.success("Conversation created successfully");
      setCreateModalOpen(false);
      resetForm();
      loadConversations();

      // Navigate to the conversation
      router.push(`/dashboard/team/conversations/${conversation.id}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Failed to create conversation");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewConversation({
      title: "",
      description: "",
      context_type: "general",
      is_private: false,
      tags: "",
    });
  };

  const getContextTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "training":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      case "project":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">
          Please log in to view team conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Team Conversations
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Collaborate with your team using AI-powered conversations
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              No conversations yet
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Get started by creating your first team conversation
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Conversation
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() =>
                  router.push(`/dashboard/team/conversations/${conversation.id}`)
                }
                className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-left transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 truncate">
                      {conversation.title}
                    </h3>
                    {conversation.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {conversation.description}
                      </p>
                    )}
                  </div>
                  {conversation.is_private && (
                    <Lock className="ml-2 h-4 w-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                  {conversation.is_archived && (
                    <Archive className="ml-2 h-4 w-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      getContextTypeColor(conversation.context_type)
                    )}
                  >
                    {conversation.context_type}
                  </Badge>
                  {conversation.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs text-slate-600 dark:text-slate-400"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{conversation.message_count?.[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{conversation.participant_count?.[0]?.count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(conversation.last_message_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Conversation Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
            <DialogDescription>
              Start a new team conversation to collaborate with AI assistance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="E.g., Q1 Planning, Product Launch, etc."
                value={newConversation.title}
                onChange={(e) =>
                  setNewConversation({ ...newConversation, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this conversation about?"
                value={newConversation.description}
                onChange={(e) =>
                  setNewConversation({
                    ...newConversation,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context_type">Type</Label>
              <Select
                value={newConversation.context_type}
                onValueChange={(value: any) =>
                  setNewConversation({ ...newConversation, context_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="document">Document Review</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="project">Project Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., planning, marketing, urgent"
                value={newConversation.tags}
                onChange={(e) =>
                  setNewConversation({ ...newConversation, tags: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={newConversation.is_private}
                onChange={(e) =>
                  setNewConversation({
                    ...newConversation,
                    is_private: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <Label htmlFor="is_private" className="cursor-pointer font-normal">
                Make this conversation private
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={creating || !newConversation.title.trim()}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Conversation
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
