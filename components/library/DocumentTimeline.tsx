"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Flag,
  CalendarCheck,
  CalendarClock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  title: string;
  description?: string;
  date?: string;
  eventType: "milestone" | "deadline" | "meeting" | "decision" | "action" | "mention" | "other";
  sourceText?: string;
  confidence: number;
  isPast?: boolean;
}

interface DocumentTimelineProps {
  documentId: string;
  className?: string;
  compact?: boolean;
}

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  milestone: { icon: Flag, color: "text-purple-500 bg-purple-500/10", label: "Milestone" },
  deadline: { icon: AlertCircle, color: "text-red-500 bg-red-500/10", label: "Deadline" },
  meeting: { icon: CalendarCheck, color: "text-blue-500 bg-blue-500/10", label: "Meeting" },
  decision: { icon: CheckCircle2, color: "text-green-500 bg-green-500/10", label: "Decision" },
  action: { icon: CalendarClock, color: "text-amber-500 bg-amber-500/10", label: "Action" },
  mention: { icon: MessageSquare, color: "text-slate-500 bg-slate-500/10", label: "Mention" },
  other: { icon: Calendar, color: "text-slate-500 bg-slate-500/10", label: "Event" },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getRelativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return "";
}

export function DocumentTimeline({
  documentId,
  className,
  compact = false,
}: DocumentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [documentId]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/library/intelligence?documentId=${documentId}&type=timeline`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.timeline || []);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pastEvents = events.filter(e => e.isPast);
  const futureEvents = events.filter(e => !e.isPast);
  const displayedEvents = showPast ? events : futureEvents;

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No timeline events found</p>
        ) : (
          displayedEvents.slice(0, 5).map((event, i) => {
            const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={cn("h-6 w-6 rounded flex items-center justify-center", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-slate-300 truncate">{event.title}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatDate(event.date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Timeline</h3>
          <span className="text-sm text-slate-400">({events.length} events)</span>
        </div>
        {pastEvents.length > 0 && (
          <button
            onClick={() => setShowPast(!showPast)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
          >
            {showPast ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide past ({pastEvents.length})
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show past ({pastEvents.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No timeline events found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Extract intelligence to find dates and events
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <AnimatePresence>
            {displayedEvents.map((event, index) => {
              const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
              const Icon = config.icon;
              const relativeDate = getRelativeDate(event.date);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative pl-10 pb-6 last:pb-0",
                    event.isPast && "opacity-60"
                  )}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900",
                    config.color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Event card */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {event.title}
                          </h4>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            config.color
                          )}>
                            {config.label}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {event.description}
                          </p>
                        )}

                        {event.sourceText && (
                          <p className="text-xs text-slate-400 mt-2 italic border-l-2 border-slate-200 dark:border-slate-600 pl-2">
                            "{event.sourceText}"
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDate(event.date)}
                        </p>
                        {relativeDate && (
                          <p className={cn(
                            "text-xs mt-0.5",
                            event.isPast ? "text-slate-400" : "text-violet-500"
                          )}>
                            {relativeDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Confidence indicator */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${event.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {Math.round(event.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
