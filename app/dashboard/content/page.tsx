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
  Loader2,
  Clock,
  Edit,
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
  FileEdit,
  Send,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";

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

interface ContentVariation {
  content: string;
  hook?: string;
  callToAction?: string;
  hashtags?: string[];
  characterCount: number;
  platform?: string;
}

interface BrandOption {
  id: string;
  name: string;
  entity_name?: string;
}

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  youtube: 5000,
  website: 0,
  email: 0,
};

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  email: Mail,
  other: FileText,
};

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  idea: {
    label: "Idea",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
  draft: {
    label: "Draft",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  review: {
    label: "Review",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
  },
  published: {
    label: "Published",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
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
  const [generatedVariations, setGeneratedVariations] = useState<ContentVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [generationModel, setGenerationModel] = useState<string>("");
  const [generationCost, setGenerationCost] = useState<number>(0);

  const [newContent, setNewContent] = useState({
    title: "",
    content_type: "social",
    platform: "linkedin",
    ai_prompt: "",
    generate_now: true,
    tone: "professional",
    length: "medium",
    brand_id: "",
  });

  useEffect(() => {
    fetchContent();
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/entities/brands");
      if (response.ok) {
        const data = await response.json();
        setBrands(
          (data.brands || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            entity_name: b.entity?.name,
          }))
        );
      }
    } catch {
      // Brands are optional, don't block on failure
    }
  };

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
    setGeneratedVariations([]);
    setSelectedVariation(null);
    setGenerationModel("");
    setGenerationCost(0);

    try {
      if (newContent.ai_prompt && newContent.generate_now) {
        // Use the new generation API directly
        const genResponse = await fetch("/api/content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: newContent.ai_prompt,
            content_type: newContent.content_type,
            platform: newContent.platform,
            brand_id: newContent.brand_id || undefined,
            tone: newContent.tone,
            length: newContent.length,
          }),
        });

        if (genResponse.ok) {
          const genData = await genResponse.json();
          setGeneratedVariations(genData.variations || []);
          setGenerationModel(genData.model || "");
          setGenerationCost(genData.cost || 0);
          setSelectedVariation(0);
          setSubmitting(false);
          return; // Don't close dialog — show variations
        }
      }

      // No AI prompt or generation failed — create as draft
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newContent.title,
          content_type: newContent.content_type,
          platform: newContent.platform,
          ai_prompt: newContent.ai_prompt || null,
          generate_now: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        resetCreateDialog();
        fetchContent();
        router.push(`/dashboard/content/${data.content.id}`);
      }
    } catch (error) {
      console.error("Failed to create content:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const saveSelectedVariation = async () => {
    if (selectedVariation === null || !generatedVariations[selectedVariation]) return;

    setSubmitting(true);
    try {
      const variation = generatedVariations[selectedVariation];
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newContent.title,
          content_type: newContent.content_type,
          platform: newContent.platform,
          draft_content: variation.content,
          hook: variation.hook || null,
          call_to_action: variation.callToAction || null,
          hashtags: variation.hashtags || [],
          ai_prompt: newContent.ai_prompt,
          ai_generated: true,
          status: "draft",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        resetCreateDialog();
        fetchContent();
        router.push(`/dashboard/content/${data.content.id}`);
      }
    } catch (error) {
      console.error("Failed to save variation:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const regenerateContent = async () => {
    setSubmitting(true);
    setGeneratedVariations([]);
    setSelectedVariation(null);
    try {
      const genResponse = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newContent.ai_prompt,
          content_type: newContent.content_type,
          platform: newContent.platform,
          brand_id: newContent.brand_id || undefined,
          tone: newContent.tone,
          length: newContent.length,
        }),
      });

      if (genResponse.ok) {
        const genData = await genResponse.json();
        setGeneratedVariations(genData.variations || []);
        setGenerationModel(genData.model || "");
        setGenerationCost(genData.cost || 0);
        setSelectedVariation(0);
      }
    } catch (error) {
      console.error("Failed to regenerate:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateDialog = () => {
    setNewContent({
      title: "",
      content_type: "social",
      platform: "linkedin",
      ai_prompt: "",
      generate_now: true,
      tone: "professional",
      length: "medium",
      brand_id: "",
    });
    setGeneratedVariations([]);
    setSelectedVariation(null);
    setGenerationModel("");
    setGenerationCost(0);
    setShowNewContent(false);
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

  // Status filter options
  const statusFilters = [
    { id: "all", label: "All Content" },
    { id: "draft", label: "Drafts" },
    { id: "review", label: "In Review" },
    { id: "scheduled", label: "Scheduled" },
    { id: "published", label: "Published" },
  ];

  if (loading) {
    return (
      <DashboardPageWrapper>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-10 w-36 bg-violet-200 dark:bg-violet-900/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-5">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Content Studio"
          subtitle="Create, schedule, and publish content across platforms"
          icon={PenSquare}
          iconColor="violet"
          stats={
            stats
              ? [
                  { label: "total", value: stats.total },
                  { label: "scheduled", value: stats.scheduled },
                ]
              : undefined
          }
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/content/calendar")}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </Button>

              <Dialog open={showNewContent} onOpenChange={(open) => {
                if (!open) resetCreateDialog();
                else setShowNewContent(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn("max-w-lg", generatedVariations.length > 0 && "max-w-3xl")}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <PenSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      {generatedVariations.length > 0 ? "Choose a Variation" : "Create New Content"}
                    </DialogTitle>
                  </DialogHeader>

                  {generatedVariations.length > 0 ? (
                    /* Variations Display */
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          Generated by <strong>{generationModel}</strong>
                          {generationCost > 0 && ` ($${generationCost.toFixed(4)})`}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={regenerateContent}
                          disabled={submitting}
                          className="border-slate-200 dark:border-slate-700"
                        >
                          {submitting ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          Regenerate
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {generatedVariations.map((variation, idx) => {
                          const charLimit = PLATFORM_CHAR_LIMITS[newContent.platform] || 0;
                          const isOverLimit = charLimit > 0 && variation.characterCount > charLimit;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedVariation(idx)}
                              className={cn(
                                "rounded-lg border p-4 cursor-pointer transition-all",
                                selectedVariation === idx
                                  ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-500"
                                  : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Variation {idx + 1}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    isOverLimit
                                      ? "text-rose-500 font-medium"
                                      : "text-slate-400"
                                  )}
                                >
                                  {variation.characterCount}
                                  {charLimit > 0 && ` / ${charLimit}`} chars
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap line-clamp-6">
                                {variation.content}
                              </p>
                              {(variation.hashtags?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {variation.hashtags!.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="text-xs text-violet-600 dark:text-violet-400"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={resetCreateDialog}
                          className="border-slate-200 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveSelectedVariation}
                          disabled={submitting || selectedVariation === null}
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Use This Variation
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    /* Create Form */
                    <>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            placeholder="e.g., Q4 Product Launch Announcement"
                            value={newContent.title}
                            onChange={(e) =>
                              setNewContent({ ...newContent, title: e.target.value })
                            }
                            className="border-slate-200 dark:border-slate-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Content Type</Label>
                            <Select
                              value={newContent.content_type}
                              onValueChange={(value) =>
                                setNewContent({ ...newContent, content_type: value })
                              }
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-700">
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
                              onValueChange={(value) =>
                                setNewContent({ ...newContent, platform: value })
                              }
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-700">
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select
                              value={newContent.tone}
                              onValueChange={(value) =>
                                setNewContent({ ...newContent, tone: value })
                              }
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                                <SelectItem value="thought-leader">Thought Leader</SelectItem>
                                <SelectItem value="pastoral">Pastoral</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Length</Label>
                            <Select
                              value={newContent.length}
                              onValueChange={(value) =>
                                setNewContent({ ...newContent, length: value })
                              }
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short">Short</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {brands.length > 0 && (
                          <div className="space-y-2">
                            <Label>Brand (optional)</Label>
                            <Select
                              value={newContent.brand_id}
                              onValueChange={(value) =>
                                setNewContent({ ...newContent, brand_id: value })
                              }
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Select a brand for voice matching" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No brand</SelectItem>
                                {brands.map((brand) => (
                                  <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                    {brand.entity_name && ` (${brand.entity_name})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>AI Prompt (optional)</Label>
                          <Textarea
                            placeholder="Describe what you want to create. E.g., Write a LinkedIn post about our new AI feature..."
                            value={newContent.ai_prompt}
                            onChange={(e) =>
                              setNewContent({
                                ...newContent,
                                ai_prompt: e.target.value,
                              })
                            }
                            rows={4}
                            className="border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={resetCreateDialog}
                          className="border-slate-200 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createContent}
                          disabled={submitting || !newContent.title.trim()}
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
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
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </>
          }
        />

        {/* Stats Cards */}
        {stats && (
          <motion.div
            className="grid gap-4 grid-cols-2 md:grid-cols-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <FileEdit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Drafts
                    </p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {stats.draft}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      In Review
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats.review}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-violet-600 dark:text-violet-400">
                      Scheduled
                    </p>
                    <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {stats.scheduled}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Published
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {stats.published}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                {/* Status Filter Pills */}
                <FilterPills
                  filters={statusFilters}
                  activeFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                />

                {/* Platform & View Toggle */}
                <div className="flex gap-2">
                  <Select
                    value={platformFilter}
                    onValueChange={setPlatformFilter}
                  >
                    <SelectTrigger className="w-[140px] border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content List */}
        {filteredContent.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
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
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item, idx) => {
              const statusConf = statusConfig[item.status] || statusConfig.draft;
              const PlatformIcon =
                platformIcons[item.platform || "other"] || Globe;

              return (
                <motion.div
                  key={item.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card
                    onClick={() => router.push(`/dashboard/content/${item.id}`)}
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <PlatformIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <Badge
                            className={cn(
                              "text-xs border",
                              statusConf.bg,
                              statusConf.text,
                              statusConf.border
                            )}
                          >
                            {statusConf.label}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/content/${item.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteContent(item.id);
                              }}
                              className="text-rose-600 dark:text-rose-400"
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
                        <span>
                          {contentTypeLabels[item.content_type] ||
                            item.content_type}
                        </span>
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
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item, idx) => {
              const statusConf = statusConfig[item.status] || statusConfig.draft;
              const PlatformIcon =
                platformIcons[item.platform || "other"] || Globe;

              return (
                <motion.div
                  key={item.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card
                    onClick={() => router.push(`/dashboard/content/${item.id}`)}
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <PlatformIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {contentTypeLabels[item.content_type] ||
                              item.content_type}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs border",
                            statusConf.bg,
                            statusConf.text,
                            statusConf.border
                          )}
                        >
                          {statusConf.label}
                        </Badge>
                        {item.ai_generated && (
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  );
}
