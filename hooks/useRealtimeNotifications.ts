"use client";

import { useRealtimeSubscription } from "./useRealtimeSubscription";

/**
 * Hook to subscribe to real-time notifications for the current user.
 *
 * Uses Supabase Realtime to get instant notification updates
 * instead of polling.
 */
export function useRealtimeNotifications({
  userId,
  onNewNotification,
  onNotificationRead,
  enabled = true,
}: {
  userId: string;
  onNewNotification?: (notification: any) => void;
  onNotificationRead?: (notification: any) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription({
    table: "notifications",
    filter: `user_id=eq.${userId}`,
    onInsert: (payload) => onNewNotification?.(payload.new),
    onUpdate: (payload) => {
      // Detect read state change
      if (payload.new?.is_read && !payload.old?.is_read) {
        onNotificationRead?.(payload.new);
      }
    },
    enabled: enabled && !!userId,
  });
}
