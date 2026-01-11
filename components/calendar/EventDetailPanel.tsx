"use client";

import { useState, useEffect } from "react";
import { CalendarItem, Attendee } from "@/types/calendar";
import { useCalendarPage } from "./CalendarPageProvider";
import { format } from "@/lib/calendar/calendar-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  X,
  Clock,
  MapPin,
  Video,
  Users,
  Mail,
  CheckSquare,
  Sparkles,
  ExternalLink,
  UserCircle,
  MessageSquare,
  Loader2,
  Calendar,
  Brain,
  Lightbulb,
  FileText,
  ArrowRight,
} from "lucide-react";

interface MeetingPrepData {
  attendees: AttendeeContext[];
  talkingPoints: string[];
  context: string;
  relatedEmails: { id: string; subject: string; date: string }[];
  relatedNotes: { id: string; title: string }[];
  suggestedActions: string[];
}

interface AttendeeContext {
  email: string;
  name?: string;
  contactId?: string;
  relationshipStrength?: number;
  lastInteraction?: string;
  company?: string;
  jobTitle?: string;
  tags?: string[];
}

interface EventDetailPanelProps {
  event: CalendarItem | null;
  onClose: () => void;
}

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const [prepData, setPrepData] = useState<MeetingPrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch meeting prep when event changes
  useEffect(() => {
    if (event && event.type === "event" && event.attendees?.length) {
      fetchMeetingPrep(event);
    } else {
      setPrepData(null);
    }
  }, [event?.id]);

  const fetchMeetingPrep = async (event: CalendarItem) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calendar/events/${event.id}/prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          attendees: event.attendees,
          description: event.description,
          start: event.start.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrepData(data);
      } else {
        // If endpoint doesn't exist yet, generate mock data
        setPrepData(generateMockPrep(event));
      }
    } catch (err) {
      // Fallback to mock data for now
      setPrepData(generateMockPrep(event));
    } finally {
      setLoading(false);
    }
  };

  const generateMockPrep = (event: CalendarItem): MeetingPrepData => {
    return {
      attendees: (event.attendees || []).map((a) => ({
        email: a.email,
        name: a.displayName,
        relationshipStrength: Math.floor(Math.random() * 40) + 60,
        lastInteraction: "3 days ago",
      })),
      talkingPoints: [
        "Review progress on current initiatives",
        "Discuss upcoming deadlines and priorities",
        "Address any blockers or concerns",
      ],
      context: `This appears to be a ${event.attendees?.length || 0 > 3 ? "group" : "1:1"} meeting. Based on the title "${event.title}", this may be a regular check-in or status update.`,
      relatedEmails: [],
      relatedNotes: [],
      suggestedActions: [
        "Prepare status update",
        "Review previous meeting notes",
        "List questions to discuss",
      ],
    };
  };

  if (!event) return null;

  const isUpcoming = event.start > new Date();
  const hoursUntil = Math.round(
    (event.start.getTime() - Date.now()) / (1000 * 60 * 60)
  );

  return (
    <Sheet open={!!event} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn("p-6 border-b", event.color, "bg-opacity-10")}>
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        event.type === "event" && "bg-blue-100 text-blue-700",
                        event.type === "task" && "bg-amber-100 text-amber-700",
                        event.type === "followup" && "bg-violet-100 text-violet-700"
                      )}
                    >
                      {event.type === "event"
                        ? "Meeting"
                        : event.type === "task"
                        ? "Task"
                        : "Follow-up"}
                    </Badge>
                    {isUpcoming && hoursUntil <= 24 && hoursUntil > 0 && (
                      <Badge variant="outline" className="text-xs">
                        In {hoursUntil}h
                      </Badge>
                    )}
                  </div>
                  <SheetTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {event.title}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

            {/* Time & Location */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                <span>
                  {format(event.start, "EEEE, MMMM d, yyyy")}
                  {!event.allDay && (
                    <>
                      {" "}
                      at {format(event.start, "h:mm a")}
                      {event.end && ` - ${format(event.end, "h:mm a")}`}
                    </>
                  )}
                  {event.allDay && " (All day)"}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {event.meetingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  asChild
                >
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Attendees */}
              {event.attendees && event.attendees.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Attendees ({event.attendees.length})
                  </h3>
                  <div className="space-y-2">
                    {event.attendees.map((attendee, idx) => {
                      const attendeeContext = prepData?.attendees.find(
                        (a) => a.email === attendee.email
                      );
                      return (
                        <AttendeeCard
                          key={idx}
                          attendee={attendee}
                          context={attendeeContext}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Meeting Prep */}
              {event.type === "event" && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    AI Meeting Prep
                  </h3>

                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : prepData ? (
                    <div className="space-y-4">
                      {/* Context */}
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {prepData.context}
                        </p>
                      </div>

                      {/* Talking Points */}
                      {prepData.talkingPoints.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            Talking Points
                          </h4>
                          <ul className="space-y-1">
                            {prepData.talkingPoints.map((point, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                              >
                                <ArrowRight className="h-3 w-3 mt-1 text-violet-500 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggested Actions */}
                      {prepData.suggestedActions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            Prep Actions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {prepData.suggestedActions.map((action, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900"
                              >
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Add attendees to get AI-powered meeting prep
                    </p>
                  )}
                </div>
              )}

              {/* Task-specific content */}
              {event.type === "task" && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Task Details
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        event.priority === "urgent" && "border-red-500 text-red-600",
                        event.priority === "high" && "border-orange-500 text-orange-600",
                        event.priority === "medium" && "border-amber-500 text-amber-600",
                        event.priority === "low" && "border-green-500 text-green-600"
                      )}
                    >
                      {event.priority || "medium"} priority
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {event.taskStatus || "pending"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Follow-up specific content */}
              {event.type === "followup" && (
                <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-2 flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Contact Follow-up
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Time to reconnect with {event.contactName}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Log Interaction
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="border-t p-4 bg-slate-50 dark:bg-slate-900">
            <div className="flex gap-2">
              {event.type === "event" && event.attendees?.length > 0 && (
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Attendees
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1">
                <CheckSquare className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              {event.type === "event" && (
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Notes
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Attendee Card Component
function AttendeeCard({
  attendee,
  context,
}: {
  attendee: Attendee;
  context?: AttendeeContext;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {(attendee.displayName || attendee.email)
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {attendee.displayName || attendee.email}
        </p>
        <div className="flex items-center gap-2">
          {context?.company && (
            <span className="text-xs text-slate-500 truncate">
              {context.company}
            </span>
          )}
          {context?.relationshipStrength && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                context.relationshipStrength >= 80 && "border-green-500 text-green-600",
                context.relationshipStrength >= 60 &&
                  context.relationshipStrength < 80 &&
                  "border-blue-500 text-blue-600",
                context.relationshipStrength < 60 && "border-slate-400 text-slate-500"
              )}
            >
              {context.relationshipStrength}%
            </Badge>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          attendee.responseStatus === "accepted" && "border-green-500 text-green-600",
          attendee.responseStatus === "declined" && "border-red-500 text-red-600",
          attendee.responseStatus === "tentative" && "border-amber-500 text-amber-600"
        )}
      >
        {attendee.responseStatus || "pending"}
      </Badge>
    </div>
  );
}
