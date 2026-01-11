"use client";

import { useMemo } from "react";
import { CalendarItem } from "@/types/calendar";
import {
  getHourSlots,
  format,
  isToday,
  getEventsForDay,
  getEventPosition,
} from "@/lib/calendar/calendar-utils";
import { CalendarEvent } from "../CalendarEvent";
import { useCalendarPage } from "../CalendarPageProvider";
import { cn } from "@/lib/utils";

interface DayViewProps {
  events: CalendarItem[];
}

export function DayView({ events }: DayViewProps) {
  const { state } = useCalendarPage();

  const hours = useMemo(() => getHourSlots(6, 22), []);

  // Get events for the current day
  const dayEvents = useMemo(() => {
    return getEventsForDay(events, state.currentDate);
  }, [events, state.currentDate]);

  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  const isDayToday = isToday(state.currentDate);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Day header */}
      <div className="border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "h-16 w-16 rounded-xl flex flex-col items-center justify-center",
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
              {format(state.currentDate, "EEE")}
            </span>
            <span
              className={cn(
                "text-2xl font-bold",
                isDayToday
                  ? "text-white dark:text-slate-900"
                  : "text-slate-900 dark:text-slate-100"
              )}
            >
              {format(state.currentDate, "d")}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {format(state.currentDate, "EEEE, MMMM d, yyyy")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            All Day
          </span>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <CalendarEvent
                key={event.id}
                event={event}
                variant="compact"
              />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-h-full">
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex h-16 border-b border-slate-100 dark:border-slate-800"
            >
              {/* Time label */}
              <div className="w-20 px-4 py-1 text-right flex-shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date().setHours(hour, 0), "h a")}
                </span>
              </div>

              {/* Content area */}
              <div className="flex-1 border-l border-slate-200 dark:border-slate-800" />
            </div>
          ))}

          {/* Positioned events overlay */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-20 flex-shrink-0" /> {/* Time column spacer */}
            <div className="flex-1 relative">
              {timedEvents.map((event) => {
                const { top, height } = getEventPosition(event, 6);
                return (
                  <div
                    key={event.id}
                    className="absolute left-2 right-4 pointer-events-auto"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <CalendarEvent
                      event={event}
                      variant="block"
                      className="h-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current time indicator */}
          {isDayToday && (
            <CurrentTimeIndicator startHour={6} />
          )}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ startHour }: { startHour: number }) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const gridStartMinutes = startHour * 60;
  const top = ((minutes - gridStartMinutes) / 60) * 64; // 64px per hour

  if (top < 0) return null;

  return (
    <div
      className="absolute left-20 right-0 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5" />
      <div className="flex-1 h-0.5 bg-red-500" />
    </div>
  );
}
