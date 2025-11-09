"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  MessageSquare,
  FolderPlus,
  UserPlus,
  Settings,
  Shield,
  Eye,
  Upload,
  Edit,
  Trash,
  Activity,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { TeamActivityWithUser } from "@/types/team";

interface ActivityFeedProps {
  limit?: number;
  showFilters?: boolean;
}

export default function ActivityFeed({ limit = 50, showFilters = true }: ActivityFeedProps) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<TeamActivityWithUser[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<TeamActivityWithUser[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, activityTypeFilter, searchQuery]);

  async function loadActivities() {
    try {
      const response = await fetch(`/api/team/activity?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to load activities");

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      toast.error("Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
    toast.success("Activity feed refreshed");
  }

  function filterActivities() {
    let filtered = activities;

    if (activityTypeFilter !== "all") {
      filtered = filtered.filter(a => a.activity_type === activityTypeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.resource_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }

  function getActivityIcon(activityType: string) {
    const iconMap: Record<string, any> = {
      document_view: Eye,
      document_upload: Upload,
      document_edit: Edit,
      document_delete: Trash,
      conversation_create: MessageSquare,
      conversation_message: MessageSquare,
      project_create: FolderPlus,
      project_update: Edit,
      team_invite: UserPlus,
      team_join: UserPlus,
      permission_grant: Shield,
      permission_revoke: Shield,
      settings_update: Settings,
    };

    const Icon = iconMap[activityType] || Activity;
    return <Icon className="h-4 w-4" />;
  }

  function getActivityColor(activityType: string) {
    const colorMap: Record<string, string> = {
      document_upload: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      document_delete: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      permission_grant: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      permission_revoke: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      team_join: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    };

    return colorMap[activityType] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  function getActivityDescription(activity: TeamActivityWithUser) {
    const name = activity.user.full_name || activity.user.email;

    const descriptionMap: Record<string, string> = {
      document_view: `viewed ${activity.resource_title}`,
      document_upload: `uploaded ${activity.resource_title}`,
      document_edit: `edited ${activity.resource_title}`,
      document_delete: `deleted ${activity.resource_title}`,
      conversation_create: `started a conversation`,
      conversation_message: `sent a message`,
      project_create: `created ${activity.resource_title}`,
      project_update: `updated ${activity.resource_title}`,
      team_invite: `invited a team member`,
      team_join: `joined the team`,
      permission_grant: `granted a permission`,
      permission_revoke: `revoked a permission`,
      settings_update: `updated settings`,
    };

    return descriptionMap[activity.activity_type] || activity.activity_type;
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>
              Real-time team activity across your organization
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="document_upload">Document Uploads</SelectItem>
                <SelectItem value="document_view">Document Views</SelectItem>
                <SelectItem value="document_edit">Document Edits</SelectItem>
                <SelectItem value="conversation_create">Conversations</SelectItem>
                <SelectItem value="project_create">Project Creates</SelectItem>
                <SelectItem value="team_join">Team Joins</SelectItem>
                <SelectItem value="permission_grant">Permission Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No activities found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activityTypeFilter !== "all"
                ? "Try adjusting your filters"
                : "Team activity will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    {getInitials(activity.user.full_name || activity.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {activity.user.full_name || activity.user.email}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getActivityDescription(activity)}
                    </span>
                    <Badge variant="outline" className={getActivityColor(activity.activity_type)}>
                      <span className="flex items-center gap-1">
                        {getActivityIcon(activity.activity_type)}
                        {activity.activity_type.replace(/_/g, " ")}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
