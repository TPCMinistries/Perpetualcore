"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Circle, Users } from "lucide-react";
import { toast } from "sonner";

interface OnlineUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_online: boolean;
  last_active_at: string | null;
}

export default function OnlineIndicator() {
  const [loading, setLoading] = useState(true);
  const [onlineMembers, setOnlineMembers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    loadOnlineMembers();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      updatePresence(true);
      loadOnlineMembers();
    }, 30000);

    // Set user as online on mount
    updatePresence(true);

    // Set user as offline on unmount
    return () => {
      clearInterval(presenceInterval);
      updatePresence(false);
    };
  }, []);

  async function loadOnlineMembers() {
    try {
      const response = await fetch("/api/team/presence");
      if (!response.ok) throw new Error("Failed to load online members");

      const data = await response.json();
      setOnlineMembers(data.online_members || []);
    } catch (error) {
      console.error("Error loading online members:", error);
      // Don't show error toast for presence updates
    } finally {
      setLoading(false);
    }
  }

  async function updatePresence(isOnline: boolean) {
    try {
      await fetch("/api/team/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: isOnline })
      });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
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
            <CardTitle className="text-lg">Online Now</CardTitle>
            <CardDescription>
              {onlineMembers.length} {onlineMembers.length === 1 ? "member" : "members"} online
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30">
            <Circle className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
            {onlineMembers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {onlineMembers.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No other members online
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                      {getInitials(member.full_name || member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center">
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.full_name || member.email}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Online now
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
