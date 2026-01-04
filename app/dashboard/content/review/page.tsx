"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Loader2,
  ArrowLeft,
  Eye,
  Edit,
  Send,
  MoreHorizontal,
  Building2,
  Palette,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentEntityIds, useEntityContext } from "@/components/entities/EntityProvider";
import { ContentItem, ContentStatus } from "@/types/entities";

interface ContentWithBrand extends ContentItem {
  brand?: {
    id: string;
    name: string;
    entity?: {
      id: string;
      name: string;
    };
  };
}

const statusConfig: Record<ContentStatus, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Edit },
  pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  changes_requested: { label: "Changes Requested", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: MessageSquare },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: Calendar },
  published: { label: "Published", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Send },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: FileText },
};

export default function ContentReviewPage() {
  const router = useRouter();
  const { currentEntity } = useEntityContext();
  const { entityId, brandId } = useCurrentEntityIds();
  const [content, setContent] = useState<ContentWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [stats, setStats] = useState<Record<string, number>>({});

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentWithBrand | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [entityId, brandId, activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityId) params.append("entity_id", entityId);
      if (brandId) params.append("brand_id", brandId);
      if (activeTab === "pending") {
        params.append("status", "pending_review");
      }

      const response = await fetch(`/api/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, contentId: string, data?: Record<string, any>) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          action,
          ...data,
        }),
      });

      if (response.ok) {
        await fetchContent();
        setReviewDialogOpen(false);
        setSelectedContent(null);
        setReviewNotes("");
        setScheduledFor("");
      } else {
        const error = await response.json();
        console.error("Action failed:", error);
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewDialog = (item: ContentWithBrand) => {
    setSelectedContent(item);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Content Review
              </h1>
              {currentEntity && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {currentEntity.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Review and approve content before publishing
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending_review || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Changes Requested</p>
                <p className="text-2xl font-bold text-orange-600">{stats.changes_requested || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-violet-600">{stats.scheduled || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-violet-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "all")}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Review
            {(stats.pending_review || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.pending_review}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Content</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {content.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  No content pending review right now
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <ContentReviewCard
                  key={item.id}
                  item={item}
                  onReview={() => openReviewDialog(item)}
                  onQuickApprove={() => handleAction("approve", item.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {content.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No content yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create content from your brands to see it here
                </p>
                <Link href="/dashboard/brands">
                  <Button variant="outline">
                    <Palette className="h-4 w-4 mr-2" />
                    Manage Brands
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <ContentReviewCard
                  key={item.id}
                  item={item}
                  onReview={() => openReviewDialog(item)}
                  onQuickApprove={() => handleAction("approve", item.id)}
                  formatDate={formatDate}
                  showStatus
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>
              Review and take action on this content
            </DialogDescription>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-4">
              {/* Content Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                {selectedContent.title && (
                  <h4 className="font-medium mb-2">{selectedContent.title}</h4>
                )}
                <p className="whitespace-pre-wrap text-sm">{selectedContent.body}</p>

                {selectedContent.media_urls && selectedContent.media_urls.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {selectedContent.media_urls.map((url, i) => (
                      <div key={i} className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {selectedContent.brand && (
                    <Badge variant="outline" className="text-xs">
                      <Palette className="h-3 w-3 mr-1" />
                      {selectedContent.brand.name}
                    </Badge>
                  )}
                  {selectedContent.ai_generated && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                  <span>Submitted {formatDate(selectedContent.submitted_at)}</span>
                </div>
              </div>

              {/* Previous Review Notes */}
              {selectedContent.review_notes && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Previous Feedback</p>
                  <p className="text-sm text-orange-700 dark:text-orange-400">{selectedContent.review_notes}</p>
                </div>
              )}

              {/* Review Notes Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes (optional for approval)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add feedback or notes about this content..."
                  rows={3}
                />
              </div>

              {/* Schedule Input (for approved content) */}
              {selectedContent.status === "approved" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule For</label>
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedContent?.status === "pending_review" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction("request_changes", selectedContent.id, { review_notes: reviewNotes })}
                  disabled={actionLoading || !reviewNotes}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => handleAction("approve", selectedContent.id, { review_notes: reviewNotes })}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}

            {selectedContent?.status === "approved" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction("publish", selectedContent.id)}
                  disabled={actionLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
                <Button
                  onClick={() => handleAction("schedule", selectedContent.id, { scheduled_for: scheduledFor })}
                  disabled={actionLoading || !scheduledFor}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Content Review Card Component
function ContentReviewCard({
  item,
  onReview,
  onQuickApprove,
  formatDate,
  showStatus = false,
}: {
  item: ContentWithBrand;
  onReview: () => void;
  onQuickApprove: () => void;
  formatDate: (date?: string) => string | null;
  showStatus?: boolean;
}) {
  const statusInfo = statusConfig[item.status as ContentStatus] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {showStatus && (
                <Badge className={statusInfo.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              )}
              {item.brand && (
                <Badge variant="outline" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  {item.brand.name}
                </Badge>
              )}
              {item.ai_generated && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3" />
                </Badge>
              )}
            </div>

            {item.title && (
              <h4 className="font-medium mb-1">{item.title}</h4>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.body}
            </p>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {item.submitted_at && (
                <span>Submitted {formatDate(item.submitted_at)}</span>
              )}
              {item.scheduled_for && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Scheduled for {formatDate(item.scheduled_for)}
                </span>
              )}
            </div>

            {item.review_notes && item.status === "changes_requested" && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {item.review_notes}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item.status === "pending_review" && (
              <>
                <Button size="sm" variant="outline" onClick={onReview}>
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
                <Button size="sm" onClick={onQuickApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {item.status !== "pending_review" && (
              <Button size="sm" variant="outline" onClick={onReview}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
