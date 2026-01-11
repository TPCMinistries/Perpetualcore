"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  RefreshCw,
  Filter,
  CheckSquare,
  Users,
  CalendarDays,
} from "lucide-react";
import { useCalendarPage } from "./CalendarPageProvider";
import { formatHeaderDate } from "@/lib/calendar/calendar-utils";
import { CalendarView } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { useSyncCalendar, useCalendarStatus } from "@/lib/calendar/use-calendar";

const VIEW_OPTIONS: { value: CalendarView; label: string; shortcut: string }[] = [
  { value: "month", label: "Month", shortcut: "1" },
  { value: "week", label: "Week", shortcut: "2" },
  { value: "day", label: "Day", shortcut: "3" },
  { value: "agenda", label: "Agenda", shortcut: "4" },
];

interface CalendarHeaderProps {
  onConnectCalendar?: () => void;
}

export function CalendarHeader({ onConnectCalendar }: CalendarHeaderProps) {
  const {
    state,
    setView,
    navigatePrev,
    navigateNext,
    goToday,
    openEventForm,
    toggleEvents,
    toggleTasks,
    toggleFollowups,
  } = useCalendarPage();

  const { data: status } = useCalendarStatus();
  const syncCalendar = useSyncCalendar();

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Title and navigation */}
          <div className="flex items-center gap-4">
            {/* Calendar icon and title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white dark:text-slate-900" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatHeaderDate(state.currentDate, state.view)}
              </h1>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 ml-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigatePrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={goToday}
              >
                Today
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigateNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right side: View switcher and actions */}
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {VIEW_OPTIONS.map((option) => (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        state.view === option.value
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                      onClick={() => setView(option.value)}
                    >
                      {option.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {option.label} ({option.shortcut})
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                  checked={state.filters.showEvents}
                  onCheckedChange={toggleEvents}
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                  Events
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={state.filters.showTasks}
                  onCheckedChange={toggleTasks}
                >
                  <CheckSquare className="h-4 w-4 mr-2 text-amber-500" />
                  Tasks
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={state.filters.showFollowups}
                  onCheckedChange={toggleFollowups}
                >
                  <Users className="h-4 w-4 mr-2 text-violet-500" />
                  Follow-ups
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sync button */}
            {status?.connected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => syncCalendar.mutate()}
                    disabled={syncCalendar.isPending}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", syncCalendar.isPending && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync Calendar</TooltipContent>
              </Tooltip>
            )}

            {/* Connect calendar button if not connected */}
            {!status?.connected && onConnectCalendar && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onConnectCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            )}

            {/* New event button */}
            <Button
              size="sm"
              className="h-8 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              onClick={() => openEventForm()}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
