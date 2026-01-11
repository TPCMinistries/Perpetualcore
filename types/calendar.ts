// Calendar Types

export type CalendarView = "month" | "week" | "day" | "agenda";

export type CalendarItemType = "event" | "task" | "followup";

export interface CalendarEvent {
  id: string;
  calendar_account_id: string;
  organization_id: string;
  user_id: string;
  provider_event_id: string;
  provider: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  timezone?: string | null;
  organizer_email?: string | null;
  organizer_name?: string | null;
  attendees?: Attendee[];
  meeting_url?: string | null;
  conference_data?: any;
  status: string;
  response_status: string;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
  self?: boolean;
  organizer?: boolean;
}

// Unified calendar item that combines events, tasks, and follow-ups
export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  color: string;
  // Event-specific
  attendees?: Attendee[];
  location?: string;
  meetingUrl?: string;
  description?: string;
  aiPrep?: string;
  // Task-specific
  taskStatus?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high" | "urgent";
  // Follow-up specific
  contactId?: string;
  contactName?: string;
  // Original data
  originalData?: CalendarEvent | any;
}

export interface CalendarFilters {
  showEvents: boolean;
  showTasks: boolean;
  showFollowups: boolean;
}

export interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  thisWeekEvents: number;
  upcomingMeetings: number;
  tasksDueToday: number;
  followupsDue: number;
}
