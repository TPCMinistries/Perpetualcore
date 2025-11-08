"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  ArrowLeft,
  FileText,
  Sparkles,
  Users,
  Lock,
  Globe,
  Hash,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Document } from "@/types";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Space {
  id: string;
  name: string;
  emoji: string;
  color: string;
  space_type: string;
}

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function NewConversationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    conversation_type: "channel" as "channel" | "dm" | "group_dm",
    context_type: "general" as "general" | "document" | "training" | "project",
    document_id: "",
    knowledge_space_id: "",
    project_id: "",
    is_private: false,
  });

  useEffect(() => {
    loadDocuments();
    loadTeamMembers();
    loadSpaces();
    loadProjects();
  }, []);

  async function loadDocuments() {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }

  async function loadTeamMembers() {
    try {
      const response = await fetch("/api/team/members");
      const data = await response.json();
      if (response.ok) {
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error loading team members:", error);
      // Not critical - can create conversation without inviting members
    }
  }

  async function loadSpaces() {
    try {
      const response = await fetch("/api/spaces");
      const data = await response.json();
      if (response.ok) {
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error("Error loading spaces:", error);
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a conversation title");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          conversation_type: formData.conversation_type,
          context_type: formData.context_type,
          document_id: formData.document_id || null,
          knowledge_space_id: formData.knowledge_space_id || null,
          project_id: formData.project_id || null,
          is_private: formData.is_private,
          participant_ids: selectedParticipants,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create conversation");
      }

      toast.success("Conversation created successfully!");
      router.push(`/dashboard/conversations/${data.conversation.id}`);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Failed to create conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/conversations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <MessageSquare className="h-10 w-10 text-indigo-600" />
              New Team Conversation
            </h1>
            <p className="text-muted-foreground mt-2">
              Create a collaborative AI conversation for your team
            </p>
          </div>
        </div>

        {/* Main Form */}
        <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Conversation Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Q1 Strategy Discussion, Product Launch Planning"
                className="text-lg"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What is this conversation about? (optional)"
                rows={3}
              />
            </div>

            {/* Conversation Type */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Conversation Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, conversation_type: "channel" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.conversation_type === "channel"
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Hash className="h-5 w-5 text-indigo-600" />
                    <div className="font-semibold">Channel</div>
                    <div className="text-xs text-muted-foreground">
                      Team collaboration
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, conversation_type: "dm" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.conversation_type === "dm"
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <UserCircle className="h-5 w-5 text-indigo-600" />
                    <div className="font-semibold">Direct Message</div>
                    <div className="text-xs text-muted-foreground">
                      1-on-1 chat
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, conversation_type: "group_dm" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.conversation_type === "group_dm"
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <div className="font-semibold">Group DM</div>
                    <div className="text-xs text-muted-foreground">
                      Small group
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Space Selection */}
            {spaces.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="space" className="text-base font-semibold">
                  Knowledge Space (Optional)
                </Label>
                <Select
                  value={formData.knowledge_space_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, knowledge_space_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a space to organize this conversation" />
                  </SelectTrigger>
                  <SelectContent>
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
                <p className="text-xs text-muted-foreground">
                  Organize conversations by department, project, or client
                </p>
              </div>
            )}

            {/* Project Selection */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project" className="text-base font-semibold">
                  Project (Optional)
                </Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span>{project.icon}</span>
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Group related conversations together
                </p>
              </div>
            )}

            {/* Context Type */}
            <div className="space-y-2">
              <Label htmlFor="context_type" className="text-base font-semibold">
                Context Type
              </Label>
              <Select
                value={formData.context_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, context_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      General Discussion
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document-Based
                    </div>
                  </SelectItem>
                  <SelectItem value="training">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Training Session
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Project Collaboration
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Selection (if context_type is document) */}
            {formData.context_type === "document" && (
              <div className="space-y-2">
                <Label htmlFor="document" className="text-base font-semibold">
                  Link to Document
                </Label>
                <Select
                  value={formData.document_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, document_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AI will have access to this document's content for context
                </p>
              </div>
            )}

            {/* Privacy Setting */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Privacy</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_private: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !formData.is_private
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    <div className="text-left">
                      <div className="font-semibold">Team Visible</div>
                      <div className="text-xs text-muted-foreground">
                        All team members can discover
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_private: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    formData.is_private
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-indigo-600" />
                    <div className="text-left">
                      <div className="font-semibold">Private</div>
                      <div className="text-xs text-muted-foreground">
                        Only invited participants
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Invite Participants */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Invite Team Members (Optional)
                </Label>
                <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(member.id)}
                        onChange={() => toggleParticipant(member.id)}
                        className="h-4 w-4"
                      />
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {member.full_name?.[0]?.toUpperCase() ||
                          member.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.full_name || "User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can also invite members later
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/conversations" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Conversation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
