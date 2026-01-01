"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight,
  Users,
  Briefcase,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

interface ActivityFeedWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
  filterTypes?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
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
  created: "bg-green-500/10 text-green-500",
  updated: "bg-blue-500/10 text-blue-500",
  deleted: "bg-red-500/10 text-red-500",
  commented: "bg-purple-500/10 text-purple-500",
  mentioned: "bg-yellow-500/10 text-yellow-500",
  completed: "bg-emerald-500/10 text-emerald-600",
  assigned: "bg-indigo-500/10 text-indigo-500",
  shared: "bg-cyan-500/10 text-cyan-500",
  archived: "bg-gray-500/10 text-gray-500",
  restored: "bg-emerald-500/10 text-emerald-500",
  uploaded: "bg-blue-400/10 text-blue-400",
  downloaded: "bg-teal-500/10 text-teal-500",
};

const entityIcons: Record<string, any> = {
  document: FileText,
  task: CheckSquare,
  workflow: Zap,
  automation: Zap,
  email: Mail,
  meeting: Calendar,
  project: Briefcase,
  contact: Users,
  comment: MessageSquare,
  file: Upload,
  folder: Archive,
};

export function ActivityFeedWidget({
  limit = 5,
  showHeader = true,
  compact = true,
  className,
  filterTypes,
  autoRefresh = false,
  refreshInterval = 60000,
}: ActivityFeedWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      let url = `/api/activity?limit=${limit}`;
      if (filterTypes?.length) {
        // API would need to support this filter
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch activities");

      const data = await response.json();
      setActivities(data.activities || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh, refreshInterval]);

  const getActionText = (action: string): string => {
    const actions: Record<string, string> = {
      created: "created",
      updated: "updated",
      deleted: "deleted",
      commented: "commented on",
      mentioned: "mentioned in",
      completed: "completed",
      assigned: "assigned",
      shared: "shared",
      archived: "archived",
      restored: "restored",
      uploaded: "uploaded",
      downloaded: "downloaded",
    };
    return actions[action] || action;
  };

  const getEntityUrl = (activity: ActivityItem): string => {
    const urls: Record<string, string> = {
      document: `/dashboard/documents/${activity.entity_id}`,
      task: `/dashboard/tasks/${activity.entity_id}`,
      project: `/dashboard/projects/${activity.entity_id}`,
      contact: `/dashboard/contacts/${activity.entity_id}`,
      workflow: `/dashboard/automation/${activity.entity_id}`,
      automation: `/dashboard/automation/${activity.entity_id}`,
      email: `/dashboard/inbox?id=${activity.entity_id}`,
      meeting: `/dashboard/calendar?event=${activity.entity_id}`,
    };
    return urls[activity.entity_type] || "#";
  };

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className={compact ? "pt-0" : ""}>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </div>
            <Link href="/dashboard/activity">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                View All
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "pt-0" : ""}>
        {activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[200px]" : "h-[300px]"}>
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 pr-4">
                {activities.map((activity, index) => {
                  const ActionIcon = actionIcons[activity.action_type] || Activity;
                  const EntityIcon = entityIcons[activity.entity_type] || FileText;
                  const colorClasses = actionColors[activity.action_type] || "bg-gray-500/10 text-gray-500";

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-2 group"
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
                          colorClasses
                        )}
                      >
                        <ActionIcon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-tight">
                          <span className="font-medium">{activity.actor_name}</span>
                          {" "}
                          <span className="text-muted-foreground">
                            {getActionText(activity.action_type)}
                          </span>
                          {" "}
                          <Link
                            href={getEntityUrl(activity)}
                            className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            <EntityIcon className="h-3 w-3" />
                            <span className="truncate max-w-[120px] inline-block align-bottom">
                              {activity.entity_name || activity.entity_type}
                            </span>
                          </Link>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
