"use client";

import { useMemo } from "react";
import { CalendarItem } from "@/types/calendar";
import {
  getMonthDays,
  isCurrentMonth as checkCurrentMonth,
  getEventsForDay,
} from "@/lib/calendar/calendar-utils";
import { CalendarCell } from "../CalendarCell";
import { useCalendarPage } from "../CalendarPageProvider";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthViewProps {
  events: CalendarItem[];
}

export function MonthView({ events }: MonthViewProps) {
  const { state } = useCalendarPage();

  // Get all days to display in the month grid
  const days = useMemo(() => {
    return getMonthDays(state.currentDate);
  }, [state.currentDate]);

  // Pre-compute events for each day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    days.forEach((day) => {
      const dayEvents = getEventsForDay(events, day);
      map.set(day.toISOString(), dayEvents);
    });
    return map;
  }, [days, events]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 px-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {days.map((day) => (
          <CalendarCell
            key={day.toISOString()}
            day={day}
            events={eventsByDay.get(day.toISOString()) || []}
            isCurrentMonth={checkCurrentMonth(day, state.currentDate)}
          />
        ))}
      </div>
    </div>
  );
}
