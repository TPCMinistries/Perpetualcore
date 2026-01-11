import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  differenceInMinutes,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  isWithinInterval,
  isBefore,
  isAfter,
} from "date-fns";
import { CalendarItem, CalendarView } from "@/types/calendar";

/**
 * Get all days to display in a month view (including padding days from prev/next months)
 */
export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 }); // Sunday start
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * Get all days in a week
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * Get hour slots for day/week view (e.g., 6am - 10pm)
 */
export function getHourSlots(startHour = 6, endHour = 22): number[] {
  const hours: number[] = [];
  for (let i = startHour; i <= endHour; i++) {
    hours.push(i);
  }
  return hours;
}

/**
 * Format date for display in header
 */
export function formatHeaderDate(date: Date, view: CalendarView): string {
  switch (view) {
    case "month":
      return format(date, "MMMM yyyy");
    case "week":
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "agenda":
      return format(date, "MMMM yyyy");
    default:
      return format(date, "MMMM yyyy");
  }
}

/**
 * Navigate to previous period based on view
 */
export function navigatePrev(date: Date, view: CalendarView): Date {
  switch (view) {
    case "month":
      return subMonths(date, 1);
    case "week":
      return subWeeks(date, 1);
    case "day":
      return subDays(date, 1);
    case "agenda":
      return subMonths(date, 1);
    default:
      return subMonths(date, 1);
  }
}

/**
 * Navigate to next period based on view
 */
export function navigateNext(date: Date, view: CalendarView): Date {
  switch (view) {
    case "month":
      return addMonths(date, 1);
    case "week":
      return addWeeks(date, 1);
    case "day":
      return addDays(date, 1);
    case "agenda":
      return addMonths(date, 1);
    default:
      return addMonths(date, 1);
  }
}

/**
 * Check if a day is in the current month
 */
export function isCurrentMonth(day: Date, currentDate: Date): boolean {
  return isSameMonth(day, currentDate);
}

/**
 * Check if a day is selected
 */
export function isSelected(day: Date, selectedDate: Date | null): boolean {
  if (!selectedDate) return false;
  return isSameDay(day, selectedDate);
}

/**
 * Get events for a specific day
 */
export function getEventsForDay(events: CalendarItem[], day: Date): CalendarItem[] {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  return events.filter((event) => {
    const eventStart = event.start;
    const eventEnd = event.end || event.start;

    // All-day events
    if (event.allDay) {
      return (
        isSameDay(eventStart, day) ||
        isWithinInterval(day, { start: eventStart, end: eventEnd })
      );
    }

    // Timed events - check if event overlaps with day
    return (
      isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
      (isBefore(eventStart, dayStart) && isAfter(eventEnd, dayEnd))
    );
  });
}

/**
 * Calculate position of event in time grid (for week/day view)
 */
export function getEventPosition(
  event: CalendarItem,
  startHour: number = 6
): { top: number; height: number } {
  const eventStart = event.start;
  const eventEnd = event.end || new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour

  const startMinutes = getHours(eventStart) * 60 + getMinutes(eventStart);
  const endMinutes = getHours(eventEnd) * 60 + getMinutes(eventEnd);
  const gridStartMinutes = startHour * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * 64; // 64px per hour
  const height = Math.max(((endMinutes - startMinutes) / 60) * 64, 24); // Min 24px

  return { top: Math.max(0, top), height };
}

/**
 * Format time for display
 */
export function formatEventTime(date: Date): string {
  return format(date, "h:mm a");
}

/**
 * Format time range
 */
export function formatTimeRange(start: Date, end?: Date): string {
  if (!end || isSameDay(start, end)) {
    return `${format(start, "h:mm a")}${end ? ` - ${format(end, "h:mm a")}` : ""}`;
  }
  return `${format(start, "MMM d, h:mm a")} - ${format(end, "MMM d, h:mm a")}`;
}

/**
 * Get color class for calendar item type
 */
export function getItemColor(type: CalendarItem["type"], priority?: CalendarItem["priority"]): string {
  switch (type) {
    case "event":
      return "bg-blue-500";
    case "task":
      switch (priority) {
        case "urgent":
          return "bg-red-500";
        case "high":
          return "bg-orange-500";
        case "medium":
          return "bg-amber-500";
        case "low":
          return "bg-green-500";
        default:
          return "bg-amber-500";
      }
    case "followup":
      return "bg-violet-500";
    default:
      return "bg-slate-500";
  }
}

/**
 * Parse ISO date string to Date
 */
export function parseEventDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Group events by date for agenda view
 */
export function groupEventsByDate(events: CalendarItem[]): Map<string, CalendarItem[]> {
  const grouped = new Map<string, CalendarItem[]>();

  events.forEach((event) => {
    const dateKey = format(event.start, "yyyy-MM-dd");
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });

  // Sort events within each day
  grouped.forEach((dayEvents, key) => {
    grouped.set(
      key,
      dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
    );
  });

  return grouped;
}

export { isToday, isSameDay, format, startOfDay, endOfDay, addDays, subDays };
