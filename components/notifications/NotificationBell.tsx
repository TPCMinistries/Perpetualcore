"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { toast } from "sonner";
import Link from "next/link";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?unread=true&limit=1");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Fallback poll every 5 minutes (was 30s)
    const interval = setInterval(fetchUnreadCount, 300_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Subscribe to real-time notification changes
  useRealtimeNotifications({
    userId: userId || "",
    enabled: !!userId,
    onNewNotification: (notification) => {
      setUnreadCount((prev) => prev + 1);
      toast(notification.title || "New Notification", {
        description: notification.message,
        action: notification.action_url
          ? {
              label: notification.action_label || "View",
              onClick: () => {
                window.location.href = notification.action_url;
              },
            }
          : undefined,
      });
    },
    onNotificationRead: () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
  });

  return (
    <Link href="/dashboard/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
