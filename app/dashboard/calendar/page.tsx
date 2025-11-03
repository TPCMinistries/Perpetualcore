"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  attendees?: any[];
  organizer_email?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if calendar is connected and load events
    fetchEvents();

    // Check URL params for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setConnected(true);
      // Reload events after connection
      setTimeout(() => fetchEvents(), 2000);
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/calendar/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setConnected(data.connected);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12">
            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-6 w-6 text-slate-600 dark:text-slate-400 animate-pulse" />
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-medium">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 mb-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Calendar</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your meetings and events with AI-powered intelligence
              </p>
            </div>
          </div>
          {!connected && (
            <Button
              onClick={connectGoogleCalendar}
              className="h-11 px-6 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>

      {!connected && (
        <Card className="mb-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-slate-100">Connect Your Calendar</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Connect Google Calendar to see your upcoming events, get meeting briefings, and
              extract action items automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={connectGoogleCalendar}
              className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}

      {connected && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Upcoming Events</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {events.length} event{events.length !== 1 ? "s" : ""} in the next 30 days
            </p>
          </div>

          {events.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="py-12 text-center">
                <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="h-10 w-10 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">No upcoming events</h3>
                <p className="text-slate-600 dark:text-slate-400">Your calendar is clear for the next 30 days</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatDate(event.start_time)}
                        </div>
                        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                          {new Date(event.start_time).getDate()}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
                          {event.title}
                        </h3>

                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}

                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                              <Users className="h-4 w-4" />
                              <span>{event.attendees.length} attendee(s)</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {event.meeting_url && (
                          <div className="mt-4">
                            <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800" asChild>
                              <a href={event.meeting_url} target="_blank" rel="noopener noreferrer">
                                Join Meeting
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
