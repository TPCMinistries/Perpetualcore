"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  FileText,
  MessageSquare,
  Upload,
  Eye,
  Download,
  Share2,
  Sparkles,
  CheckCircle,
  FolderPlus,
  Briefcase,
  Clock,
  RefreshCw,
  ChevronDown,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  documentId?: string;
  documentTitle?: string;
  activityType: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ActivityFeedProps {
  documentId?: string;
  projectId?: string;
  spaceId?: string;
  limit?: number;
  className?: string;
  compact?: boolean;
}

const activityIcons: Record<string, { icon: React.ElementType; color: string }> = {
  upload: { icon: Upload, color: "text-blue-500" },
  view: { icon: Eye, color: "text-slate-500" },
  download: { icon: Download, color: "text-green-500" },
  share: { icon: Share2, color: "text-purple-500" },
  comment: { icon: MessageSquare, color: "text-amber-500" },
  highlight: { icon: FileText, color: "text-yellow-500" },
  action_item: { icon: CheckCircle, color: "text-emerald-500" },
  resolve: { icon: CheckCircle, color: "text-green-500" },
  update: { icon: FileText, color: "text-blue-500" },
  delete: { icon: FileText, color: "text-red-500" },
  generate_summary: { icon: Sparkles, color: "text-violet-500" },
  add_to_collection: { icon: FolderPlus, color: "text-indigo-500" },
  add_to_project: { icon: Briefcase, color: "text-teal-500" },
  add_to_space: { icon: Users, color: "text-cyan-500" },
};

function getActivityDescription(activity: ActivityItem): string {
  const docName = activity.documentTitle || "a document";
  switch (activity.activityType) {
    case "upload":
      return `uploaded "${docName}"`;
    case "view":
      return `viewed "${docName}"`;
    case "download":
      return `downloaded "${docName}"`;
    case "share":
      return `shared "${docName}"`;
    case "comment":
      return `commented on "${docName}"`;
    case "highlight":
      return `highlighted text in "${docName}"`;
    case "action_item":
      return `created an action item in "${docName}"`;
    case "resolve":
      return `resolved a comment on "${docName}"`;
    case "update":
      return `updated "${docName}"`;
    case "delete":
      return `deleted a document`;
    case "generate_summary":
      return `generated AI summary for "${docName}"`;
    case "add_to_collection":
      return `added "${docName}" to a collection`;
    case "add_to_project":
      return `added "${docName}" to a project`;
    case "add_to_space":
      return `added "${docName}" to a space`;
    default:
      return `performed an action on "${docName}"`;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({
  documentId,
  projectId,
  spaceId,
  limit = 20,
  className,
  compact = false,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, [documentId, projectId, spaceId]);

  const fetchActivities = async (loadMore = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (documentId) params.set("documentId", documentId);
      if (projectId) params.set("projectId", projectId);
      if (spaceId) params.set("spaceId", spaceId);
      params.set("limit", String(limit));
      params.set("offset", String(loadMore ? (page + 1) * limit : 0));

      const response = await fetch(`/api/library/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (loadMore) {
          setActivities(prev => [...prev, ...(data.activities || [])]);
          setPage(p => p + 1);
        } else {
          setActivities(data.activities || []);
          setPage(0);
        }
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {isLoading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
        ) : (
          activities.slice(0, 5).map((activity) => {
            const { icon: Icon, color } = activityIcons[activity.activityType] || activityIcons.view;
            return (
              <div key={activity.id} className="flex items-center gap-2 text-sm">
                <Icon className={cn("h-4 w-4 flex-shrink-0", color)} />
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {activity.userName}
                  </span>{" "}
                  {getActivityDescription(activity).split('"')[0]}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Activity</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchActivities()}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const { icon: Icon, color } = activityIcons[activity.activityType] || activityIcons.view;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white">
                          {activity.userAvatar ? (
                            <img
                              src={activity.userAvatar}
                              alt={activity.userName}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            activity.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center",
                          "bg-white dark:bg-slate-900"
                        )}>
                          <Icon className={cn("h-2.5 w-2.5", color)} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {activity.userName}
                          </span>{" "}
                          {getActivityDescription(activity)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => fetchActivities(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
