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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <MessageSquare className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Team Collaboration</span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Team Conversations
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Collaborate with your team using AI-powered conversations. Create channels, share ideas, and work together seamlessly.
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="lg"
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Conversation
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] h-11 border-slate-300 dark:border-slate-700">
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
              <SelectTrigger className="w-[200px] h-11 border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Conversations</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All Conversations</SelectItem>
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
          <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shadow-sm mb-6">
              <MessageSquare className="h-10 w-10 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              No conversations yet
            </h3>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Get started by creating your first team conversation and start collaborating with AI assistance
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="lg"
              className="mt-6 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
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
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-left transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-slate-200 truncate mb-2">
                      {conversation.title}
                    </h3>
                    {conversation.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {conversation.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    {conversation.is_private && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                    {conversation.is_archived && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium px-3 py-1",
                      getContextTypeColor(conversation.context_type)
                    )}
                  >
                    {conversation.context_type}
                  </Badge>
                  {conversation.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-medium px-3 py-1 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <Tag className="mr-1.5 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{conversation.message_count?.[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{conversation.participant_count?.[0]?.count || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                <Plus className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Create New Conversation</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Start collaborating with your team using AI assistance
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Conversation Title *
              </Label>
              <Input
                id="title"
                placeholder="E.g., Q1 Strategy Planning, Product Launch Discussion..."
                value={newConversation.title}
                onChange={(e) =>
                  setNewConversation({ ...newConversation, title: e.target.value })
                }
                className="h-12 text-base border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and goals of this conversation..."
                value={newConversation.description}
                onChange={(e) =>
                  setNewConversation({
                    ...newConversation,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="resize-none text-base border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="context_type" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Conversation Type
              </Label>
              <Select
                value={newConversation.context_type}
                onValueChange={(value: any) =>
                  setNewConversation({ ...newConversation, context_type: value })
                }
              >
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2 py-1">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <div className="font-medium">General Discussion</div>
                        <div className="text-xs text-slate-500">Open-ended team conversation</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2 py-1">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Document Review</div>
                        <div className="text-xs text-slate-500">Collaborate on documents</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="training">
                    <div className="flex items-center gap-2 py-1">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Training Session</div>
                        <div className="text-xs text-slate-500">Learning and development</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2 py-1">
                      <MessageSquare className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Project Planning</div>
                        <div className="text-xs text-slate-500">Plan and execute projects</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="tags" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tags
              </Label>
              <Input
                id="tags"
                placeholder="Add tags separated by commas (e.g., planning, marketing, urgent)"
                value={newConversation.tags}
                onChange={(e) =>
                  setNewConversation({ ...newConversation, tags: e.target.value })
                }
                className="h-12 text-base border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div className="flex-1">
                <Label htmlFor="is_private" className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private Conversation
                </Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Only invited members can view and participate in this conversation
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              disabled={creating}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={creating || !newConversation.title.trim()}
              size="lg"
              className="min-w-[180px] bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
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
