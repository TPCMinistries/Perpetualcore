"use client";

import { useMemo } from "react";
import { CalendarItem } from "@/types/calendar";
import {
  groupEventsByDate,
  format,
  isToday,
  addDays,
} from "@/lib/calendar/calendar-utils";
import { CalendarEvent } from "../CalendarEvent";
import { useCalendarPage } from "../CalendarPageProvider";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface AgendaViewProps {
  events: CalendarItem[];
}

export function AgendaView({ events }: AgendaViewProps) {
  const { state } = useCalendarPage();

  // Group events by date
  const groupedEvents = useMemo(() => {
    return groupEventsByDate(events);
  }, [events]);

  // Sort date keys
  const sortedDates = useMemo(() => {
    return Array.from(groupedEvents.keys()).sort();
  }, [groupedEvents]);

  if (sortedDates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-8">
        <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No upcoming events
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
          Your calendar is clear. Click the &quot;New Event&quot; button to create an event.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {sortedDates.map((dateKey) => {
          const date = new Date(dateKey);
          const dayEvents = groupedEvents.get(dateKey) || [];
          const isDayToday = isToday(date);
          const isTomorrow =
            format(date, "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd");

          return (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-4 mb-3">
                <div
                  className={cn(
                    "h-12 w-12 rounded-lg flex flex-col items-center justify-center",
                    isDayToday
                      ? "bg-slate-900 dark:bg-slate-100"
                      : "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isDayToday
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {format(date, "EEE")}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold leading-none",
                      isDayToday
                        ? "text-white dark:text-slate-900"
                        : "text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {format(date, "d")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {isDayToday
                      ? "Today"
                      : isTomorrow
                      ? "Tomorrow"
                      : format(date, "EEEE, MMMM d")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Events for this day */}
              <div className="ml-16 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                {dayEvents.map((event) => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
