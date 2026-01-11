"use client";

import { useEffect, useMemo } from "react";
import { CalendarPageProvider, useCalendarPage } from "@/components/calendar/CalendarPageProvider";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarViewContainer } from "@/components/calendar/CalendarViewContainer";
import { EventDetailPanel } from "@/components/calendar/EventDetailPanel";
import { useUnifiedCalendar, useCalendarStatus } from "@/lib/calendar/use-calendar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

function CalendarContent() {
  const { state, closeEventDetail } = useCalendarPage();
  const { data: status, isLoading: statusLoading } = useCalendarStatus();

  const {
    data: events,
    isLoading: eventsLoading,
    error,
  } = useUnifiedCalendar(state.currentDate, state.filters);

  // Find the selected event from events list
  const selectedEvent = useMemo(() => {
    if (!state.selectedEventId || !events) return null;
    return events.find((e) => e.id === state.selectedEventId) || null;
  }, [state.selectedEventId, events]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const { setView, navigatePrev, navigateNext, goToday, openEventForm } =
        (window as any).__calendarActions || {};

      if (!setView) return;

      switch (e.key) {
        case "1":
          setView("month");
          break;
        case "2":
          setView("week");
          break;
        case "3":
          setView("day");
          break;
        case "4":
          setView("agenda");
          break;
        case "ArrowLeft":
          if (!e.metaKey && !e.ctrlKey) navigatePrev();
          break;
        case "ArrowRight":
          if (!e.metaKey && !e.ctrlKey) navigateNext();
          break;
        case "t":
          if (!e.metaKey && !e.ctrlKey) goToday();
          break;
        case "n":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            openEventForm();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch("/api/calendar/google/connect");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to connect calendar:", error);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Show connect prompt if not connected
  if (!status?.connected) {
    return (
      <div className="flex-1 flex flex-col">
        <CalendarHeader onConnectCalendar={connectGoogleCalendar} />
        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
          <Card className="max-w-md border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-4">
                <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Connect Your Calendar
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Connect Google Calendar to see your upcoming events, get meeting
                briefings, and sync your schedule with AI-powered insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={connectGoogleCalendar}
                className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              >
                Connect Google Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CalendarHeader onConnectCalendar={connectGoogleCalendar} />
      <CalendarViewContainer
        events={events || []}
        isLoading={eventsLoading}
      />
      {/* Event Detail Panel */}
      <EventDetailPanel
        event={selectedEvent}
        onClose={closeEventDetail}
      />
    </div>
  );
}

// Wrapper to expose actions for keyboard shortcuts
function CalendarWithActions() {
  const actions = useCalendarPage();

  useEffect(() => {
    (window as any).__calendarActions = {
      setView: actions.setView,
      navigatePrev: actions.navigatePrev,
      navigateNext: actions.navigateNext,
      goToday: actions.goToday,
      openEventForm: actions.openEventForm,
    };

    return () => {
      delete (window as any).__calendarActions;
    };
  }, [actions]);

  return <CalendarContent />;
}

export default function CalendarPage() {
  return (
    <TooltipProvider>
      <CalendarPageProvider defaultView="month">
        <CalendarWithActions />
      </CalendarPageProvider>
    </TooltipProvider>
  );
}
