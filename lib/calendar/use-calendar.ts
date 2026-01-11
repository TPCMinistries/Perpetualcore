"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarEvent, CalendarItem, CalendarFilters } from "@/types/calendar";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { getItemColor } from "./calendar-utils";

// Query keys
export const calendarKeys = {
  all: ["calendar"] as const,
  events: () => [...calendarKeys.all, "events"] as const,
  eventsByRange: (start: string, end: string) => [...calendarKeys.events(), start, end] as const,
  unified: () => [...calendarKeys.all, "unified"] as const,
  unifiedByRange: (start: string, end: string, filters: CalendarFilters) =>
    [...calendarKeys.unified(), start, end, filters] as const,
  event: (id: string) => [...calendarKeys.all, "event", id] as const,
  status: () => [...calendarKeys.all, "status"] as const,
};

// Types
export interface CalendarEventsResponse {
  connected: boolean;
  events: CalendarEvent[];
  count?: number;
}

export interface UnifiedCalendarResponse {
  events: CalendarItem[];
  tasks: CalendarItem[];
  followups: CalendarItem[];
  total: number;
}

// Fetch calendar events for a date range
async function fetchCalendarEvents(
  start: string,
  end: string
): Promise<CalendarEventsResponse> {
  const params = new URLSearchParams();
  params.set("start", start);
  params.set("end", end);

  const response = await fetch(`/api/calendar/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch calendar events");
  }

  return response.json();
}

// Fetch unified calendar items (events + tasks + followups)
async function fetchUnifiedCalendar(
  start: string,
  end: string,
  filters: CalendarFilters
): Promise<CalendarItem[]> {
  const params = new URLSearchParams();
  params.set("start", start);
  params.set("end", end);
  if (!filters.showEvents) params.set("hideEvents", "true");
  if (!filters.showTasks) params.set("hideTasks", "true");
  if (!filters.showFollowups) params.set("hideFollowups", "true");

  // First fetch events from the existing API
  const eventsResponse = await fetch(`/api/calendar/events`);
  const eventsData = await eventsResponse.json();

  const items: CalendarItem[] = [];

  // Convert events to CalendarItems
  if (filters.showEvents && eventsData.events) {
    eventsData.events.forEach((event: CalendarEvent) => {
      items.push({
        id: event.id,
        type: "event",
        title: event.title,
        start: parseISO(event.start_time),
        end: event.end_time ? parseISO(event.end_time) : undefined,
        allDay: event.all_day,
        color: getItemColor("event"),
        attendees: event.attendees,
        location: event.location || undefined,
        meetingUrl: event.meeting_url || undefined,
        description: event.description || undefined,
        originalData: event,
      });
    });
  }

  // Fetch tasks with due dates
  if (filters.showTasks) {
    try {
      const tasksResponse = await fetch(`/api/tasks?start=${start}&end=${end}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        if (tasksData.tasks) {
          tasksData.tasks.forEach((task: any) => {
            if (task.due_date) {
              items.push({
                id: task.id,
                type: "task",
                title: task.title,
                start: parseISO(task.due_date),
                allDay: true,
                color: getItemColor("task", task.priority),
                taskStatus: task.status,
                priority: task.priority,
                originalData: task,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }

  // Fetch contact follow-ups
  if (filters.showFollowups) {
    try {
      const contactsResponse = await fetch(`/api/contacts?quick_filter=needs_followup`);
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        if (contactsData.contacts) {
          contactsData.contacts.forEach((contact: any) => {
            if (contact.next_followup_date) {
              const name = `${contact.first_name}${contact.last_name ? " " + contact.last_name : ""}`;
              items.push({
                id: `followup-${contact.id}`,
                type: "followup",
                title: `Follow up: ${name}`,
                start: parseISO(contact.next_followup_date),
                allDay: true,
                color: getItemColor("followup"),
                contactId: contact.id,
                contactName: name,
                originalData: contact,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch followups:", error);
    }
  }

  // Sort by start date
  items.sort((a, b) => a.start.getTime() - b.start.getTime());

  return items;
}

// Check connection status
async function fetchCalendarStatus(): Promise<{ connected: boolean }> {
  const response = await fetch("/api/calendar/events");
  if (!response.ok) {
    return { connected: false };
  }
  const data = await response.json();
  return { connected: data.connected || false };
}

// Sync calendar
async function syncCalendar(): Promise<{ success: boolean; eventsCount: number }> {
  const response = await fetch("/api/calendar/sync", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to sync calendar");
  }
  return response.json();
}

// Hooks

/**
 * Hook to get calendar connection status
 */
export function useCalendarStatus() {
  return useQuery({
    queryKey: calendarKeys.status(),
    queryFn: fetchCalendarStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get calendar events for a date range
 */
export function useCalendarEvents(date: Date) {
  const start = format(startOfWeek(startOfMonth(date)), "yyyy-MM-dd");
  const end = format(endOfWeek(endOfMonth(date)), "yyyy-MM-dd");

  return useQuery({
    queryKey: calendarKeys.eventsByRange(start, end),
    queryFn: () => fetchCalendarEvents(start, end),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get unified calendar items (events + tasks + followups)
 */
export function useUnifiedCalendar(date: Date, filters: CalendarFilters) {
  const start = format(startOfWeek(startOfMonth(date)), "yyyy-MM-dd");
  const end = format(endOfWeek(endOfMonth(date)), "yyyy-MM-dd");

  return useQuery({
    queryKey: calendarKeys.unifiedByRange(start, end, filters),
    queryFn: () => fetchUnifiedCalendar(start, end, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to sync calendar with Google
 */
export function useSyncCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCalendar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast.success(`Synced ${data.eventsCount} events`);
    },
    onError: (error) => {
      toast.error("Failed to sync calendar");
      console.error("Sync error:", error);
    },
  });
}

/**
 * Hook to create a calendar event
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) {
        throw new Error("Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast.success("Event created");
    },
    onError: (error) => {
      toast.error("Failed to create event");
      console.error("Create event error:", error);
    },
  });
}

/**
 * Hook to update a calendar event
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CalendarEvent> }) => {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast.success("Event updated");
    },
    onError: (error) => {
      toast.error("Failed to update event");
      console.error("Update event error:", error);
    },
  });
}

/**
 * Hook to delete a calendar event
 */
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      toast.success("Event deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete event");
      console.error("Delete event error:", error);
    },
  });
}
