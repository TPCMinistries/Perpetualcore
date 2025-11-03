"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeSubscriptionOptions {
  table: "comments" | "mentions" | "activity_feed" | "realtime_presence";
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time changes in Supabase tables
 *
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   table: "comments",
 *   filter: `entity_type=eq.document,entity_id=eq.${documentId}`,
 *   onInsert: (payload) => {
 *     setComments(prev => [...prev, payload.new]);
 *   },
 *   onDelete: (payload) => {
 *     setComments(prev => prev.filter(c => c.id !== payload.old.id));
 *   },
 * });
 * ```
 */
export function useRealtimeSubscription({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    // Create unique channel name
    const channelName = `realtime:${table}${filter ? `:${filter}` : ""}`;

    // Subscribe to changes
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload);
              break;
            case "UPDATE":
              onUpdate?.(payload);
              break;
            case "DELETE":
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [table, filter, enabled]);

  return {
    channel: channelRef.current,
  };
}

/**
 * Hook to subscribe to comments changes for a specific entity
 */
export function useRealtimeComments({
  entityType,
  entityId,
  onNewComment,
  onCommentUpdated,
  onCommentDeleted,
  enabled = true,
}: {
  entityType: string;
  entityId: string;
  onNewComment?: (comment: any) => void;
  onCommentUpdated?: (comment: any) => void;
  onCommentDeleted?: (commentId: string) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription({
    table: "comments",
    filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`,
    onInsert: (payload) => onNewComment?.(payload.new),
    onUpdate: (payload) => onCommentUpdated?.(payload.new),
    onDelete: (payload) => onCommentDeleted?.(payload.old.id),
    enabled,
  });
}

/**
 * Hook to subscribe to mentions for the current user
 */
export function useRealtimeMentions({
  userId,
  onNewMention,
  enabled = true,
}: {
  userId: string;
  onNewMention?: (mention: any) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription({
    table: "mentions",
    filter: `mentioned_user_id=eq.${userId}`,
    onInsert: (payload) => onNewMention?.(payload.new),
    enabled,
  });
}

/**
 * Hook to subscribe to activity feed changes
 */
export function useRealtimeActivity({
  organizationId,
  onNewActivity,
  enabled = true,
}: {
  organizationId: string;
  onNewActivity?: (activity: any) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription({
    table: "activity_feed",
    filter: `organization_id=eq.${organizationId}`,
    onInsert: (payload) => onNewActivity?.(payload.new),
    enabled,
  });
}

/**
 * Hook to subscribe to presence changes for a specific entity
 */
export function useRealtimePresence({
  entityType,
  entityId,
  onPresenceChange,
  enabled = true,
}: {
  entityType: string;
  entityId: string;
  onPresenceChange?: () => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription({
    table: "realtime_presence",
    filter: `entity_type=eq.${entityType},entity_id=eq.${entityId}`,
    onInsert: () => onPresenceChange?.(),
    onUpdate: () => onPresenceChange?.(),
    onDelete: () => onPresenceChange?.(),
    enabled,
  });
}
