"use client";

import { useMemo } from "react";
import { CalendarItem } from "@/types/calendar";
import {
  getWeekDays,
  getHourSlots,
  format,
  isToday,
  getEventsForDay,
  getEventPosition,
} from "@/lib/calendar/calendar-utils";
import { CalendarEvent } from "../CalendarEvent";
import { useCalendarPage } from "../CalendarPageProvider";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  events: CalendarItem[];
}

export function WeekView({ events }: WeekViewProps) {
  const { state, selectDate } = useCalendarPage();

  const days = useMemo(() => getWeekDays(state.currentDate), [state.currentDate]);
  const hours = useMemo(() => getHourSlots(6, 22), []);

  // Get all-day events
  const allDayEvents = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    days.forEach((day) => {
      const dayEvents = getEventsForDay(events, day).filter((e) => e.allDay);
      map.set(day.toISOString(), dayEvents);
    });
    return map;
  }, [days, events]);

  // Get timed events
  const timedEvents = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    days.forEach((day) => {
      const dayEvents = getEventsForDay(events, day).filter((e) => !e.allDay);
      map.set(day.toISOString(), dayEvents);
    });
    return map;
  }, [days, events]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Header with day names */}
      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800">
        {/* Time column header */}
        <div className="w-16 py-2 border-r border-slate-200 dark:border-slate-800" />

        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {format(day, "EEE")}
            </div>
            <button
              onClick={() => selectDate(day)}
              className={cn(
                "mt-1 inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors",
                isToday(day)
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {format(day, "d")}
            </button>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 min-h-[3rem]">
        <div className="w-16 py-1 px-2 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
          All day
        </div>
        {days.map((day) => {
          const dayEvents = allDayEvents.get(day.toISOString()) || [];
          return (
            <div
              key={day.toISOString()}
              className="py-1 px-1 border-r border-slate-200 dark:border-slate-800 last:border-r-0 space-y-0.5"
            >
              {dayEvents.slice(0, 2).map((event) => (
                <CalendarEvent
                  key={event.id}
                  event={event}
                  variant="chip"
                  showTime={false}
                />
              ))}
              {dayEvents.length > 2 && (
                <span className="text-xs text-slate-500 px-1">
                  +{dayEvents.length - 2} more
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-h-full">
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 h-16 border-b border-slate-100 dark:border-slate-800"
            >
              {/* Time label */}
              <div className="w-16 px-2 py-1 text-right border-r border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date().setHours(hour, 0), "h a")}
                </span>
              </div>

              {/* Day columns */}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="relative border-r border-slate-100 dark:border-slate-800 last:border-r-0"
                />
              ))}
            </div>
          ))}

          {/* Positioned events overlay */}
          <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
            <div className="w-16" /> {/* Time column spacer */}
            {days.map((day) => {
              const dayEvents = timedEvents.get(day.toISOString()) || [];
              return (
                <div key={day.toISOString()} className="relative">
                  {dayEvents.map((event) => {
                    const { top, height } = getEventPosition(event, 6);
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 pointer-events-auto"
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
