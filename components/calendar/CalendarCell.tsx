"use client";

import { useMemo } from "react";
import { CalendarItem } from "@/types/calendar";
import { isToday, isSameDay, format } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "./CalendarEvent";
import { useCalendarPage } from "./CalendarPageProvider";

interface CalendarCellProps {
  day: Date;
  events: CalendarItem[];
  isCurrentMonth: boolean;
  maxEventsToShow?: number;
}

export function CalendarCell({
  day,
  events,
  isCurrentMonth,
  maxEventsToShow = 3,
}: CalendarCellProps) {
  const { state, selectDate, openEventForm } = useCalendarPage();

  const isSelected = state.selectedDate
    ? isSameDay(day, state.selectedDate)
    : false;
  const isDayToday = isToday(day);

  // Sort events: all-day first, then by start time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.start.getTime() - b.start.getTime();
    });
  }, [events]);

  const visibleEvents = sortedEvents.slice(0, maxEventsToShow);
  const hiddenCount = sortedEvents.length - maxEventsToShow;

  const handleCellClick = () => {
    selectDate(day);
  };

  const handleCellDoubleClick = () => {
    selectDate(day);
    openEventForm();
  };

  return (
    <div
      className={cn(
        "min-h-[100px] p-1 border-r border-b border-slate-200 dark:border-slate-800",
        "cursor-pointer transition-colors",
        !isCurrentMonth && "bg-slate-50 dark:bg-slate-900/50",
        isSelected && "bg-violet-50 dark:bg-violet-950/30",
        !isSelected && "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
      onClick={handleCellClick}
      onDoubleClick={handleCellDoubleClick}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "inline-flex items-center justify-center h-7 w-7 text-sm rounded-full",
            isDayToday &&
              "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold",
            !isDayToday && isCurrentMonth && "text-slate-900 dark:text-slate-100",
            !isDayToday && !isCurrentMonth && "text-slate-400 dark:text-slate-600"
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <CalendarEvent
            key={event.id}
            event={event}
            variant="chip"
            showTime={true}
          />
        ))}

        {/* More events indicator */}
        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              selectDate(day);
            }}
            className="w-full text-left px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
