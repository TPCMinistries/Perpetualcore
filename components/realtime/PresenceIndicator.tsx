"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Eye, Edit3, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
  status: "viewing" | "editing" | "commenting" | "idle";
  last_active_at: string;
}

interface PresenceIndicatorProps {
  entityType: string;
  entityId: string;
  currentUserId?: string;
}

export function PresenceIndicator({
  entityType,
  entityId,
  currentUserId,
}: PresenceIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;

    // Track current user's presence
    trackPresence("viewing");
    setIsTracking(true);

    // Fetch initial presence data
    fetchPresence();

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence:${entityType}:${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "realtime_presence",
          filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`,
        },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    // Update presence periodically (every 30 seconds)
    const interval = setInterval(() => {
      updatePresence();
    }, 30000);

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
      clearInterval(interval);
      removePresence();
    };
  }, [entityType, entityId, currentUserId]);

  async function trackPresence(status: "viewing" | "editing" | "commenting") {
    if (!currentUserId) return;

    try {
      const response = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          status,
        }),
      });

      if (!response.ok) {
        console.error("Failed to track presence");
      }
    } catch (error) {
      console.error("Error tracking presence:", error);
    }
  }

  async function updatePresence() {
    if (!currentUserId) return;

    try {
      await fetch("/api/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
        }),
      });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }

  async function removePresence() {
    if (!currentUserId) return;

    try {
      await fetch(
        `/api/presence?entityType=${entityType}&entityId=${entityId}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Error removing presence:", error);
    }
  }

  async function fetchPresence() {
    try {
      const response = await fetch(
        `/api/presence?entityType=${entityType}&entityId=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Filter out current user and only show active users (within last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const active = data.presence.filter(
          (user: any) =>
            user.id !== currentUserId &&
            new Date(user.last_active_at) > twoMinutesAgo
        );
        setActiveUsers(active);
      }
    } catch (error) {
      console.error("Error fetching presence:", error);
    }
  }

  function changeStatus(status: "viewing" | "editing" | "commenting") {
    trackPresence(status);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "editing":
        return <Edit3 className="h-3 w-3" />;
      case "commenting":
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "editing":
        return "bg-blue-500";
      case "commenting":
        return "bg-purple-500";
      default:
        return "bg-green-500";
    }
  };

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {activeUsers.length} {activeUsers.length === 1 ? "person" : "people"} here
          </span>
        </div>

        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium border-2 border-background">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
                      user.status
                    )} flex items-center justify-center`}
                  >
                    {getStatusIcon(user.status)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.status}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}

          {activeUsers.length > 5 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
              +{activeUsers.length - 5}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Status Controls for Current User */}
      {isTracking && (
        <div className="flex gap-1 ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => changeStatus("viewing")}
                className="p-1.5 rounded hover:bg-accent transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Viewing</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => changeStatus("editing")}
                className="p-1.5 rounded hover:bg-accent transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Editing</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => changeStatus("commenting")}
                className="p-1.5 rounded hover:bg-accent transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Commenting</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
