"use client";

import { CalendarItem } from "@/types/calendar";
import { useCalendarPage } from "./CalendarPageProvider";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { AgendaView } from "./views/AgendaView";
import { Loader2 } from "lucide-react";

interface CalendarViewContainerProps {
  events: CalendarItem[];
  isLoading?: boolean;
}

export function CalendarViewContainer({
  events,
  isLoading = false,
}: CalendarViewContainerProps) {
  const { state } = useCalendarPage();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  switch (state.view) {
    case "month":
      return <MonthView events={events} />;
    case "week":
      return <WeekView events={events} />;
    case "day":
      return <DayView events={events} />;
    case "agenda":
      return <AgendaView events={events} />;
    default:
      return <MonthView events={events} />;
  }
}
