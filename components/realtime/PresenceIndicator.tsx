"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Circle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Viewer {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  lastSeen: string;
}

interface PresenceIndicatorProps {
  documentId: string;
  className?: string;
  showCount?: boolean;
  maxAvatars?: number;
}

const PRESENCE_COLORS = [
  "#22C55E", // green
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EF4444", // red
  "#14B8A6", // teal
];

export function PresenceIndicator({
  documentId,
  className,
  showCount = true,
  maxAvatars = 3,
}: PresenceIndicatorProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPresence = useCallback(async () => {
    const supabase = supabaseRef.current;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    // Update our presence
    await supabase
      .from("document_presence")
      .upsert({
        document_id: documentId,
        user_id: user.id,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "document_id,user_id",
      });

    // Fetch others viewing this document (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: presenceData } = await supabase
      .from("document_presence")
      .select(`
        id,
        user_id,
        last_seen,
        profiles!inner(id, full_name, avatar_url)
      `)
      .eq("document_id", documentId)
      .gte("last_seen", fiveMinutesAgo);

    if (presenceData) {
      const viewerList: Viewer[] = presenceData.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.profiles?.full_name || "Unknown",
        avatarUrl: p.profiles?.avatar_url,
        lastSeen: p.last_seen,
      }));

      setViewers(viewerList);
    }
  }, [documentId]);

  useEffect(() => {
    fetchPresence();

    // Update presence every 30 seconds
    intervalRef.current = setInterval(fetchPresence, 30000);

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Remove our presence
      const supabase = supabaseRef.current;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("document_presence")
            .delete()
            .eq("document_id", documentId)
            .eq("user_id", user.id);
        }
      });
    };
  }, [documentId, fetchPresence]);

  // Set up realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`presence:${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_presence",
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, fetchPresence]);

  // Filter out current user for display
  const otherViewers = viewers.filter(v => v.userId !== currentUserId);
  const visibleViewers = otherViewers.slice(0, maxAvatars);
  const remainingCount = otherViewers.length - maxAvatars;

  if (otherViewers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex items-center gap-2", className)}
      >
        {/* Viewer Avatars */}
        <div className="flex -space-x-2">
          <AnimatePresence>
            {visibleViewers.map((viewer, index) => (
              <Tooltip key={viewer.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div
                      className="h-7 w-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: PRESENCE_COLORS[index % PRESENCE_COLORS.length] }}
                    >
                      {viewer.avatarUrl ? (
                        <img
                          src={viewer.avatarUrl}
                          alt={viewer.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        viewer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-slate-900" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900 border-slate-700">
                  <p className="text-sm">{viewer.name}</p>
                  <p className="text-xs text-slate-400">Viewing now</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>

          {/* +N more indicator */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-7 w-7 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border-slate-700">
                <p className="text-sm">{remainingCount} more viewing</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Text label */}
        {showCount && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="h-3.5 w-3.5" />
            <span>
              {otherViewers.length} {otherViewers.length === 1 ? "person" : "people"} viewing
            </span>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export function LibraryPresence({ className }: { className?: string }) {
  const [activeViewers, setActiveViewers] = useState<number>(0);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const supabase = supabaseRef.current;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Count unique users active in the library (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: activity } = await supabase
        .from("document_activity")
        .select("user_id")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", fiveMinutesAgo);

      if (activity) {
        const uniqueUsers = new Set(activity.map(a => a.user_id));
        setActiveViewers(uniqueUsers.size);
      }
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 60000);

    return () => clearInterval(interval);
  }, []);

  if (activeViewers <= 1) return null;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-slate-400", className)}>
      <div className="relative">
        <Users className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      <span>{activeViewers} team members active</span>
    </div>
  );
}
