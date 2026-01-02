"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Eye,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Mail,
  Hash,
  AtSign,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  title: string;
  content_type: string;
  platform?: string;
  draft_content?: string;
  final_content?: string;
  hook?: string;
  call_to_action?: string;
  hashtags?: string[];
  mentions?: string[];
  ai_prompt?: string;
  ai_generated?: boolean;
  status: string;
  scheduled_for?: string;
  published_at?: string;
  publish_url?: string;
  created_at: string;
  updated_at?: string;
}

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  email: Mail,
};

const statusOptions = [
  { value: "idea", label: "Idea" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

export default function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    draft_content: "",
    hook: "",
    call_to_action: "",
    hashtags: "",
    status: "draft",
  });

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setFormData({
          title: data.content.title || "",
          draft_content: data.content.draft_content || data.content.final_content || "",
          hook: data.content.hook || "",
          call_to_action: data.content.call_to_action || "",
          hashtags: data.content.hashtags?.join(" ") || "",
          status: data.content.status || "draft",
        });
      } else {
        router.push("/dashboard/content");
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      router.push("/dashboard/content");
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          draft_content: formData.draft_content,
          hook: formData.hook || null,
          call_to_action: formData.call_to_action || null,
          hashtags: formData.hashtags ? formData.hashtags.split(/[\s,]+/).filter(h => h.startsWith("#") || h.length > 0).map(h => h.startsWith("#") ? h : `#${h}`) : [],
          status: formData.status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setSaving(false);
    }
  };

  const scheduleContent = async () => {
    if (!scheduleDate) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "scheduled",
          scheduled_for: new Date(scheduleDate).toISOString(),
        }),
      });

      if (response.ok) {
        setShowSchedule(false);
        fetchContent();
      }
    } catch (error) {
      console.error("Failed to schedule content:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async () => {
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/content");
      }
    } catch (error) {
      console.error("Failed to delete content:", error);
    }
  };

  const approveAndPost = async (postNow: boolean = false) => {
    setApproving(true);
    try {
      // First save current changes
      await saveContent();

      // Then trigger approval webhook
      const response = await fetch("/api/webhooks/content-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: id,
          platforms: [content?.platform || "linkedin"],
          postNow,
        }),
      });

      if (response.ok) {
        setShowApprove(false);
        fetchContent();
      }
    } catch (error) {
      console.error("Failed to approve content:", error);
    } finally {
      setApproving(false);
    }
  };

  const copyToClipboard = async () => {
    const fullContent = [
      formData.hook,
      formData.draft_content,
      formData.call_to_action,
      formData.hashtags,
    ].filter(Boolean).join("\n\n");

    await navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCharCount = () => {
    const fullContent = [
      formData.hook,
      formData.draft_content,
      formData.call_to_action,
    ].filter(Boolean).join(" ");
    return fullContent.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!content) return null;

  const PlatformIcon = platformIcons[content.platform || "website"] || Globe;
  const charLimit = content.platform === "twitter" ? 280 : content.platform === "linkedin" ? 3000 : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/content")}
            className="mb-4 -ml-2 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Studio
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <PlatformIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {content.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {content.content_type?.replace("_", " ")}
                  </Badge>
                  {content.ai_generated && (
                    <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSchedule(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApprove(true)}
                className="border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Send className="h-4 w-4 mr-2" />
                Approve & Post
              </Button>
              <Button
                onClick={saveContent}
                disabled={saving}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Content title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hook / Opening</Label>
                  <Textarea
                    value={formData.hook}
                    onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
                    placeholder="Attention-grabbing opening line..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Main Content</Label>
                    {charLimit && (
                      <span className={cn(
                        "text-xs",
                        getCharCount() > charLimit ? "text-red-500" : "text-slate-500"
                      )}>
                        {getCharCount()} / {charLimit}
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={formData.draft_content}
                    onChange={(e) => setFormData({ ...formData, draft_content: e.target.value })}
                    placeholder="Write your content here..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Call to Action</Label>
                  <Textarea
                    value={formData.call_to_action}
                    onChange={(e) => setFormData({ ...formData, call_to_action: e.target.value })}
                    placeholder="What action do you want readers to take?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </Label>
                  <Input
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="#marketing #startup #growth"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {content.scheduled_for && (
                  <div className="mt-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                    <p className="text-sm text-violet-600 dark:text-violet-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Scheduled for
                    </p>
                    <p className="font-medium text-violet-700 dark:text-violet-300">
                      {new Date(content.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                )}

                {content.published_at && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm text-green-600 dark:text-green-400">Published</p>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {new Date(content.published_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform</span>
                  <span className="capitalize">{content.platform || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="capitalize">{content.content_type?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(content.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Content
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Publish Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(false)}>
              Cancel
            </Button>
            <Button onClick={scheduleContent} disabled={!scheduleDate || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this content? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteContent}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve & Post Dialog */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Post Content</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              This will save your content, mark it as approved, and trigger the automated posting workflow.
            </p>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <p className="text-sm font-medium">{formData.title || content.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {content.platform}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {content.content_type?.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApprove(false)} disabled={approving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => approveAndPost(false)}
              disabled={approving}
              className="border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
            >
              {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Approve Only
            </Button>
            <Button
              onClick={() => approveAndPost(true)}
              disabled={approving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
            >
              {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Approve & Post Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
