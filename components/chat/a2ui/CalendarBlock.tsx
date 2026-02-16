"use client";

import { useMemo } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { CalendarBlockData, CalendarEvent } from "@/lib/a2ui/types";
import { cn } from "@/lib/utils";

interface CalendarBlockProps {
  block: A2UIBlock;
}

const DEFAULT_EVENT_COLORS = [
  "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-l-violet-500",
  "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-l-blue-500",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-l-emerald-500",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-l-amber-500",
  "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-l-rose-500",
];

export default function CalendarBlock({ block }: CalendarBlockProps) {
  const data = block.data as CalendarBlockData;

  const sortedEvents = useMemo(() => {
    return [...data.events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [data.events]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    for (const event of sortedEvents) {
      const dateKey = new Date(event.start).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    }
    return groups;
  }, [sortedEvents]);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="space-y-4">
        {Object.entries(groupedEvents).map(([dateLabel, events]) => (
          <div key={dateLabel}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {dateLabel}
            </p>
            <div className="space-y-2">
              {events.map((event, i) => {
                const colorClass =
                  DEFAULT_EVENT_COLORS[i % DEFAULT_EVENT_COLORS.length];
                const startTime = new Date(event.start).toLocaleTimeString(
                  "en-US",
                  { hour: "numeric", minute: "2-digit" }
                );
                const endTime = event.end
                  ? new Date(event.end).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={`${event.title}-${i}`}
                    className={cn(
                      "rounded-md border-l-2 px-3 py-2",
                      colorClass
                    )}
                  >
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-[11px] opacity-70 mt-0.5">
                      {startTime}
                      {endTime && ` - ${endTime}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
