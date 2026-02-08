"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Inbox,
  Send,
  Wrench,
  Heart,
  Code,
  Globe,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface ActivityEvent {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface ActivityFeedProps {
  initialEvents: ActivityEvent[];
}

const EVENT_CONFIG: Record<
  string,
  { icon: typeof Activity; color: string; bgColor: string }
> = {
  message_received: {
    icon: Inbox,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-500/10",
  },
  message_sent: {
    icon: Send,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  tool_executed: {
    icon: Wrench,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-500/10",
  },
  heartbeat_completed: {
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-100 dark:bg-rose-500/10",
  },
  code_executed: {
    icon: Code,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-500/10",
  },
  browser_action: {
    icon: Globe,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100 dark:bg-cyan-500/10",
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  color: "text-slate-500",
  bgColor: "bg-slate-100 dark:bg-slate-500/10",
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export function ActivityFeed({ initialEvents }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);

  // Update events when initialEvents prop changes
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("agent-activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_activity_feed",
        },
        (payload) => {
          const row = payload.new;
          const newEvent: ActivityEvent = {
            id: row.id,
            userId: row.user_id,
            eventType: row.event_type,
            title: row.title,
            description: row.description,
            metadata: row.metadata,
            createdAt: row.created_at,
          };

          setEvents((prev) => [newEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const config = EVENT_CONFIG[event.eventType] || DEFAULT_CONFIG;
        const Icon = config.icon;

        return (
          <Card
            key={event.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                      {getRelativeTime(event.createdAt)}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {key}: {typeof value === "string" ? value : JSON.stringify(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
