"use client";

import { CalendarItem } from "@/types/calendar";
import { formatEventTime } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import { useCalendarPage } from "./CalendarPageProvider";
import {
  Video,
  MapPin,
  CheckSquare,
  UserCircle,
  Clock,
} from "lucide-react";

interface CalendarEventProps {
  event: CalendarItem;
  variant?: "chip" | "block" | "compact";
  showTime?: boolean;
  className?: string;
}

export function CalendarEvent({
  event,
  variant = "chip",
  showTime = true,
  className,
}: CalendarEventProps) {
  const { openEventDetail } = useCalendarPage();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEventDetail(event.id);
  };

  // Get the icon based on event type
  const getIcon = () => {
    switch (event.type) {
      case "task":
        return <CheckSquare className="h-3 w-3 flex-shrink-0" />;
      case "followup":
        return <UserCircle className="h-3 w-3 flex-shrink-0" />;
      case "event":
        if (event.meetingUrl) {
          return <Video className="h-3 w-3 flex-shrink-0" />;
        }
        if (event.location) {
          return <MapPin className="h-3 w-3 flex-shrink-0" />;
        }
        return <Clock className="h-3 w-3 flex-shrink-0" />;
      default:
        return null;
    }
  };

  // Chip variant - for month view (compact)
  if (variant === "chip") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate",
          "transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1",
          event.color,
          "text-white",
          className
        )}
        title={`${event.title}${!event.allDay && showTime ? ` - ${formatEventTime(event.start)}` : ""}`}
      >
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className="truncate">
            {!event.allDay && showTime && (
              <span className="opacity-80 mr-1">
                {formatEventTime(event.start).replace(":00", "").toLowerCase()}
              </span>
            )}
            {event.title}
          </span>
        </div>
      </button>
    );
  }

  // Compact variant - for agenda view
  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left p-2 rounded-lg border",
          "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-1 h-full min-h-[2.5rem] rounded-full", event.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {event.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {!event.allDay && showTime && (
                <span>{formatEventTime(event.start)}</span>
              )}
              {event.allDay && <span>All day</span>}
              {event.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Block variant - for week/day view (full height blocks)
  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-2 rounded-lg",
        "transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1",
        event.color,
        "text-white",
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className="font-medium text-sm truncate">{event.title}</span>
        </div>
        {!event.allDay && showTime && (
          <span className="text-xs opacity-80 mt-0.5">
            {formatEventTime(event.start)}
            {event.end && ` - ${formatEventTime(event.end)}`}
          </span>
        )}
        {event.location && (
          <span className="text-xs opacity-80 mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        )}
      </div>
    </button>
  );
}
