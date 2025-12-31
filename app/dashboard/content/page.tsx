"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PenSquare,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  Send,
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Mail,
  FileText,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  title: string;
  content_type: string;
  platform?: string;
  draft_content?: string;
  status: string;
  scheduled_for?: string;
  published_at?: string;
  ai_generated?: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  draft: number;
  review: number;
  scheduled: number;
  published: number;
}

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  email: Mail,
  other: FileText,
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  idea: { label: "Idea", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  draft: { label: "Draft", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  review: { label: "Review", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  approved: { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
  published: { label: "Published", bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
  failed: { label: "Failed", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
};

const contentTypeLabels: Record<string, string> = {
  social: "Social Post",
  blog: "Blog Post",
  newsletter: "Newsletter",
  video_script: "Video Script",
  email: "Email",
  linkedin_post: "LinkedIn Post",
  twitter_thread: "Twitter Thread",
  instagram_caption: "Instagram",
  youtube_script: "YouTube Script",
  podcast_outline: "Podcast",
  press_release: "Press Release",
  case_study: "Case Study",
};

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewContent, setShowNewContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newContent, setNewContent] = useState({
    title: "",
    content_type: "social",
    platform: "linkedin",
    ai_prompt: "",
    generate_now: true,
  });

  useEffect(() => {
    fetchContent();
  }, [statusFilter, platformFilter]);

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (platformFilter !== "all") {
        params.append("platform", platformFilter);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  const createContent = async () => {
    if (!newContent.title.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newContent.title,
          content_type: newContent.content_type,
          platform: newContent.platform,
          ai_prompt: newContent.ai_prompt || null,
          generate_now: newContent.generate_now && !!newContent.ai_prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewContent({
          title: "",
          content_type: "social",
          platform: "linkedin",
          ai_prompt: "",
          generate_now: true,
        });
        setShowNewContent(false);
        fetchContent();
        // Navigate to editor
        router.push(`/dashboard/content/${data.content.id}`);
      }
    } catch (error) {
      console.error("Failed to create content:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteContent = async (contentId: string) => {
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error("Failed to delete content:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredContent = content.filter((c) =>
    searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.draft_content?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Group by status for kanban-style view
  const groupedContent = {
    draft: filteredContent.filter(c => c.status === "draft" || c.status === "idea"),
    review: filteredContent.filter(c => c.status === "review" || c.status === "approved"),
    scheduled: filteredContent.filter(c => c.status === "scheduled"),
    published: filteredContent.filter(c => c.status === "published"),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <PenSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Studio</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Create, schedule, and publish content
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/content/calendar")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </Button>

              <Dialog open={showNewContent} onOpenChange={setShowNewContent}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 border-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        placeholder="e.g., Q4 Product Launch Announcement"
                        value={newContent.title}
                        onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                          value={newContent.content_type}
                          onValueChange={(value) => setNewContent({ ...newContent, content_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social">Social Post</SelectItem>
                            <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                            <SelectItem value="twitter_thread">Twitter Thread</SelectItem>
                            <SelectItem value="blog">Blog Post</SelectItem>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                            <SelectItem value="video_script">Video Script</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select
                          value={newContent.platform}
                          onValueChange={(value) => setNewContent({ ...newContent, platform: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="twitter">Twitter/X</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>AI Prompt (optional - for AI generation)</Label>
                      <Textarea
                        placeholder="Describe what you want to create. E.g., Write a LinkedIn post about our new AI feature that helps users save time..."
                        value={newContent.ai_prompt}
                        onChange={(e) => setNewContent({ ...newContent, ai_prompt: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewContent(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={createContent}
                      disabled={submitting || !newContent.title.trim()}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : newContent.ai_prompt ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create & Generate
                        </>
                      ) : (
                        "Create Draft"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-slate-800/50">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400">Drafts</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.draft}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">In Review</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.review}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-violet-50 dark:bg-violet-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-violet-600 dark:text-violet-400">Scheduled</p>
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.scheduled}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">Published</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.published}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800/50">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800/50">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <PenSquare className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No content yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Create your first piece of content
            </p>
            <Button
              onClick={() => setShowNewContent(true)}
              variant="outline"
              className="border-slate-200 dark:border-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => {
              const statusConf = statusConfig[item.status] || statusConfig.draft;
              const PlatformIcon = platformIcons[item.platform || "other"] || Globe;

              return (
                <Card
                  key={item.id}
                  onClick={() => router.push(`/dashboard/content/${item.id}`)}
                  className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <PlatformIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <Badge className={cn("text-xs", statusConf.bg, statusConf.text, "border-0")}>
                          {statusConf.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/content/${item.id}`); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {item.title}
                    </h3>

                    {item.draft_content && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {item.draft_content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{contentTypeLabels[item.content_type] || item.content_type}</span>
                      <div className="flex items-center gap-2">
                        {item.ai_generated && (
                          <Sparkles className="h-3 w-3 text-amber-500" />
                        )}
                        {item.scheduled_for ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatScheduledDate(item.scheduled_for)}
                          </span>
                        ) : (
                          <span>{formatDate(item.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item) => {
              const statusConf = statusConfig[item.status] || statusConfig.draft;
              const PlatformIcon = platformIcons[item.platform || "other"] || Globe;

              return (
                <Card
                  key={item.id}
                  onClick={() => router.push(`/dashboard/content/${item.id}`)}
                  className="border-0 shadow-sm bg-white dark:bg-slate-800/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <PlatformIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {contentTypeLabels[item.content_type] || item.content_type}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", statusConf.bg, statusConf.text, "border-0")}>
                        {statusConf.label}
                      </Badge>
                      {item.ai_generated && <Sparkles className="h-4 w-4 text-amber-500" />}
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
