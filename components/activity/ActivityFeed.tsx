"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FileText,
  CheckSquare,
  Mail,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  Archive,
  RotateCcw,
  Trash2,
  Share2,
  UserPlus,
  Edit,
  Plus,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ActivityItem {
  id: string;
  actor_user_id: string | null;
  actor_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  metadata: Record<string, any>;
  is_public: boolean;
  created_at: string;
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  entityType?: string;
  entityId?: string;
}

const actionIcons: Record<string, any> = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  commented: MessageSquare,
  mentioned: UserPlus,
  completed: CheckSquare,
  assigned: UserPlus,
  shared: Share2,
  archived: Archive,
  restored: RotateCcw,
  uploaded: Upload,
  downloaded: Download,
};

const actionColors: Record<string, string> = {
  created: "text-green-500",
  updated: "text-blue-500",
  deleted: "text-red-500",
  commented: "text-purple-500",
  mentioned: "text-yellow-500",
  completed: "text-green-600",
  assigned: "text-indigo-500",
  shared: "text-cyan-500",
  archived: "text-gray-500",
  restored: "text-emerald-500",
  uploaded: "text-blue-400",
  downloaded: "text-teal-500",
};

const entityIcons: Record<string, any> = {
  document: FileText,
  task: CheckSquare,
  workflow: Activity,
  email: Mail,
  meeting: Calendar,
  agent: Activity,
  comment: MessageSquare,
  file: Upload,
  folder: Archive,
};

export function ActivityFeed({
  limit = 10,
  showHeader = true,
  entityType,
  entityId,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId, page]);

  async function fetchActivities() {
    try {
      setLoading(true);
      let url = `/api/activity?limit=${limit}&page=${page}`;

      if (entityType && entityId) {
        url += `&entityType=${entityType}&entityId=${entityId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setActivities((prev) =>
          page === 1 ? data.activities : [...prev, ...data.activities]
        );
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }

  function getActionText(activity: ActivityItem): string {
    const actions: Record<string, string> = {
      created: "created",
      updated: "updated",
      deleted: "deleted",
      commented: "commented on",
      mentioned: "mentioned someone in",
      completed: "completed",
      assigned: "assigned",
      shared: "shared",
      archived: "archived",
      restored: "restored",
      uploaded: "uploaded",
      downloaded: "downloaded",
    };

    return actions[activity.action_type] || activity.action_type;
  }

  function getEntityUrl(activity: ActivityItem): string {
    const urls: Record<string, string> = {
      document: `/dashboard/documents/${activity.entity_id}`,
      task: `/dashboard/tasks/${activity.entity_id}`,
      workflow: `/dashboard/workflows/${activity.entity_id}`,
      email: `/dashboard/email?id=${activity.entity_id}`,
      meeting: `/dashboard/calendar?event=${activity.entity_id}`,
      agent: `/dashboard/agents/${activity.entity_id}`,
      comment: activity.metadata?.url || "#",
      file: `/dashboard/documents?file=${activity.entity_id}`,
      folder: `/dashboard/documents?folder=${activity.entity_id}`,
    };

    return urls[activity.entity_type] || "#";
  }

  if (loading && page === 1) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Activity Feed</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Activity Feed</CardTitle>
            </div>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm">
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here as your team works</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity) => {
                const ActionIcon = actionIcons[activity.action_type] || Activity;
                const EntityIcon = entityIcons[activity.entity_type] || FileText;
                const actionColor = actionColors[activity.action_type] || "text-gray-500";

                return (
                  <div key={activity.id} className="flex gap-3 group">
                    {/* Action Icon */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center ${actionColor}`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.actor_name}</span>
                            {" "}
                            <span className="text-muted-foreground">
                              {getActionText(activity)}
                            </span>
                            {" "}
                            <Link
                              href={getEntityUrl(activity)}
                              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <EntityIcon className="h-3 w-3 inline" />
                              {activity.entity_name || `${activity.entity_type}`}
                            </Link>
                          </p>

                          {/* Metadata */}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {activity.metadata.description && (
                                <p className="text-xs text-muted-foreground">
                                  {activity.metadata.description}
                                </p>
                              )}
                              {activity.metadata.tags && Array.isArray(activity.metadata.tags) && (
                                <div className="flex gap-1">
                                  {activity.metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
