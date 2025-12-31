"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Sparkles,
  Tag,
  Link2,
  FileText,
  Archive,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  Edit,
  Trash2,
  MessageSquare,
  ExternalLink,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface Idea {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  raw_input?: string;
  category?: string;
  tags?: string[];
  priority: string;
  status: string;
  ai_expanded?: string;
  ai_suggestions?: any;
  ai_related_topics?: string[];
  ai_potential_score?: number;
  ai_processed_at?: string;
  source_type?: string;
  linked_project_id?: string;
  linked_decision_id?: string;
  linked_opportunity_id?: string;
  linked_project?: { id: string; name: string; status: string };
  linked_decision?: { id: string; title: string; status: string };
  linked_opportunity?: { id: string; name: string; status: string };
  created_at: string;
  updated_at: string;
  implemented_at?: string;
}

interface IdeaNote {
  id: string;
  idea_id: string;
  content: string;
  note_type: string;
  created_at: string;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  captured: { label: "Captured", color: "bg-blue-100 text-blue-700", icon: Lightbulb },
  developing: { label: "Developing", color: "bg-purple-100 text-purple-700", icon: Edit },
  ready: { label: "Ready", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  implemented: { label: "Implemented", color: "bg-emerald-100 text-emerald-700", icon: Zap },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-700", icon: Archive },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const CATEGORY_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "product", label: "Product" },
  { value: "content", label: "Content" },
  { value: "marketing", label: "Marketing" },
  { value: "ministry", label: "Ministry" },
  { value: "personal", label: "Personal" },
  { value: "process", label: "Process" },
  { value: "other", label: "Other" },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<{ byStatus: Record<string, number>; byCategory: Record<string, number> }>({
    byStatus: {},
    byCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Quick capture
  const [quickCaptureText, setQuickCaptureText] = useState("");
  const [capturing, setCapturing] = useState(false);
  const quickCaptureRef = useRef<HTMLTextAreaElement>(null);

  // Dialogs
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [ideaNotes, setIdeaNotes] = useState<IdeaNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/ideas?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ideas");

      const data = await res.json();
      setIdeas(data.ideas || []);
      setStats(data.stats || { byStatus: {}, byCategory: {} });
    } catch (error) {
      console.error("Error fetching ideas:", error);
      toast.error("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Quick capture
  const handleQuickCapture = async () => {
    if (!quickCaptureText.trim()) return;

    try {
      setCapturing(true);
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_input: quickCaptureText,
          source_type: "manual",
        }),
      });

      if (!res.ok) throw new Error("Failed to capture idea");

      toast.success("Idea captured!");
      setQuickCaptureText("");
      fetchIdeas();
    } catch (error) {
      console.error("Error capturing idea:", error);
      toast.error("Failed to capture idea");
    } finally {
      setCapturing(false);
    }
  };

  // Fetch idea details
  const fetchIdeaDetails = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`);
      if (!res.ok) throw new Error("Failed to fetch idea");

      const data = await res.json();
      setSelectedIdea(data.idea);
      setIdeaNotes(data.notes || []);
      setShowDetailSheet(true);
    } catch (error) {
      console.error("Error fetching idea details:", error);
      toast.error("Failed to load idea details");
    }
  };

  // Update idea
  const handleUpdateIdea = async (ideaId: string, updates: Partial<Idea>) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update idea");

      toast.success("Idea updated");
      fetchIdeas();

      if (selectedIdea?.id === ideaId) {
        const data = await res.json();
        setSelectedIdea(data.idea);
      }
    } catch (error) {
      console.error("Error updating idea:", error);
      toast.error("Failed to update idea");
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!selectedIdea || !newNote.trim()) return;

    try {
      setAddingNote(true);
      const res = await fetch(`/api/ideas/${selectedIdea.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!res.ok) throw new Error("Failed to add note");

      const data = await res.json();
      setIdeaNotes([data.note, ...ideaNotes]);
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  // Delete idea
  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete idea");

      toast.success("Idea deleted");
      setShowDetailSheet(false);
      setSelectedIdea(null);
      fetchIdeas();
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast.error("Failed to delete idea");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  // Calculate totals
  const totalIdeas = ideas.length;
  const activeIdeas = ideas.filter(i => !["implemented", "archived"].includes(i.status)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Ideas</h1>
          <p className="text-muted-foreground">
            Capture, develop, and implement your ideas
          </p>
        </div>
      </div>

      {/* Quick Capture */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900">Quick Capture</span>
          </div>
          <div className="flex gap-2">
            <Textarea
              ref={quickCaptureRef}
              placeholder="What's on your mind? Capture your idea here..."
              value={quickCaptureText}
              onChange={(e) => setQuickCaptureText(e.target.value)}
              className="resize-none bg-white"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleQuickCapture();
                }
              }}
            />
            <Button
              onClick={handleQuickCapture}
              disabled={capturing || !quickCaptureText.trim()}
              className="self-end"
            >
              {capturing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Capture
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press ⌘+Enter to quickly capture
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const StatusIcon = config.icon;
          const count = stats.byStatus[status] || 0;
          return (
            <Card
              key={status}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                statusFilter === status && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg", config.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== "all" || categoryFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : ideas.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
            <p className="text-muted-foreground mb-4">
              Start capturing your ideas using the quick capture above
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => {
              const statusConfig = STATUS_CONFIG[idea.status] || STATUS_CONFIG.captured;
              const priorityConfig = PRIORITY_CONFIG[idea.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = statusConfig.icon;

              return (
                <Card
                  key={idea.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => fetchIdeaDetails(idea.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={cn("text-xs", statusConfig.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            fetchIdeaDetails(idea.id);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {idea.status !== "archived" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateIdea(idea.id, { status: "archived" });
                            }}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteIdea(idea.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-medium mb-2 line-clamp-2">{idea.title}</h3>

                    {idea.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {idea.category && (
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_OPTIONS.find(c => c.value === idea.category)?.label || idea.category}
                        </Badge>
                      )}
                      <Badge className={cn("text-xs", priorityConfig.color)}>
                        {priorityConfig.label}
                      </Badge>
                      {idea.ai_potential_score && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {idea.ai_potential_score}%
                        </Badge>
                      )}
                    </div>

                    {/* Linked items */}
                    {(idea.linked_project || idea.linked_decision || idea.linked_opportunity) && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {idea.linked_project && (
                          <Badge variant="secondary" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            {idea.linked_project.name}
                          </Badge>
                        )}
                        {idea.linked_decision && (
                          <Badge variant="secondary" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            {idea.linked_decision.title}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRelativeTime(idea.created_at)}</span>
                      {idea.tags && idea.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {idea.tags.length}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Idea Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          {selectedIdea && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="pr-8">{selectedIdea.title}</SheetTitle>
                    <SheetDescription>
                      Created {formatDate(selectedIdea.created_at)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6">
                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                    {selectedIdea.ai_expanded && (
                      <TabsTrigger value="ai" className="flex-1">AI Insights</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-6">
                    {/* Status */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                          const StatusIcon = config.icon;
                          const isActive = selectedIdea.status === status;
                          return (
                            <Button
                              key={status}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className={cn(isActive && config.color)}
                              onClick={() => handleUpdateIdea(selectedIdea.id, { status })}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Priority</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
                          const isActive = selectedIdea.priority === priority;
                          return (
                            <Button
                              key={priority}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className={cn(isActive && config.color)}
                              onClick={() => handleUpdateIdea(selectedIdea.id, { priority })}
                            >
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Category</Label>
                      <Select
                        value={selectedIdea.category || ""}
                        onValueChange={(value) => handleUpdateIdea(selectedIdea.id, { category: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <p className="mt-2 text-sm whitespace-pre-wrap">
                        {selectedIdea.description || selectedIdea.raw_input || "No description"}
                      </p>
                    </div>

                    {/* Tags */}
                    {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedIdea.tags.map((tag, i) => (
                            <Badge key={i} variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Items */}
                    {(selectedIdea.linked_project || selectedIdea.linked_decision || selectedIdea.linked_opportunity) && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Linked Items</Label>
                        <div className="space-y-2 mt-2">
                          {selectedIdea.linked_project && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1">{selectedIdea.linked_project.name}</span>
                              <Badge variant="outline">{selectedIdea.linked_project.status}</Badge>
                            </div>
                          )}
                          {selectedIdea.linked_decision && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1">{selectedIdea.linked_decision.title}</span>
                              <Badge variant="outline">{selectedIdea.linked_decision.status}</Badge>
                            </div>
                          )}
                          {selectedIdea.linked_opportunity && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1">{selectedIdea.linked_opportunity.name}</span>
                              <Badge variant="outline">{selectedIdea.linked_opportunity.status}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeleteIdea(selectedIdea.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Idea
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4 space-y-4">
                    {/* Add note */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note to develop this idea..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={addingNote || !newNote.trim()}
                        size="sm"
                      >
                        {addingNote ? "Adding..." : "Add Note"}
                      </Button>
                    </div>

                    {/* Notes list */}
                    {ideaNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notes yet</p>
                        <p className="text-sm">Add notes to develop this idea</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ideaNotes.map((note) => (
                          <div key={note.id} className="p-3 rounded-lg bg-muted">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <Badge variant="outline">{note.note_type}</Badge>
                              <span>{formatRelativeTime(note.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {selectedIdea.ai_expanded && (
                    <TabsContent value="ai" className="mt-4 space-y-4">
                      {/* AI Score */}
                      {selectedIdea.ai_potential_score && (
                        <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Potential Score</span>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">
                              {selectedIdea.ai_potential_score}%
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* AI Expanded */}
                      <div>
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Expanded Version
                        </Label>
                        <p className="mt-2 text-sm whitespace-pre-wrap p-3 rounded-lg bg-muted">
                          {selectedIdea.ai_expanded}
                        </p>
                      </div>

                      {/* AI Suggestions */}
                      {selectedIdea.ai_suggestions && (
                        <div>
                          <Label className="text-sm text-muted-foreground">AI Suggestions</Label>
                          <div className="mt-2 p-3 rounded-lg bg-muted text-sm">
                            {typeof selectedIdea.ai_suggestions === "string"
                              ? selectedIdea.ai_suggestions
                              : JSON.stringify(selectedIdea.ai_suggestions, null, 2)}
                          </div>
                        </div>
                      )}

                      {/* Related Topics */}
                      {selectedIdea.ai_related_topics && selectedIdea.ai_related_topics.length > 0 && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Related Topics</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedIdea.ai_related_topics.map((topic, i) => (
                              <Badge key={i} variant="secondary">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
