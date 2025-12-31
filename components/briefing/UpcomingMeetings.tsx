"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { format, isToday, isTomorrow, differenceInMinutes } from "date-fns";

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  aiPrep?: string;
}

interface UpcomingMeetingsProps {
  meetings: Meeting[];
}

function getTimeLabel(startTime: string): { label: string; urgent: boolean } {
  const start = new Date(startTime);
  const now = new Date();
  const diffMins = differenceInMinutes(start, now);

  if (diffMins < 0) {
    return { label: "In progress", urgent: true };
  }
  if (diffMins <= 15) {
    return { label: `In ${diffMins} min`, urgent: true };
  }
  if (diffMins <= 60) {
    return { label: `In ${diffMins} min`, urgent: false };
  }

  if (isToday(start)) {
    return { label: format(start, "h:mm a"), urgent: false };
  }
  if (isTomorrow(start)) {
    return { label: `Tomorrow ${format(start, "h:mm a")}`, urgent: false };
  }

  return { label: format(start, "EEE h:mm a"), urgent: false };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  const upcomingMeetings = meetings.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Upcoming
          </CardTitle>
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingMeetings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming meetings today
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => {
              const timeInfo = getTimeLabel(meeting.startTime);

              return (
                <div
                  key={meeting.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meeting.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${timeInfo.urgent ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {timeInfo.label}
                        </span>
                      </div>
                    </div>
                    {timeInfo.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>

                  {/* Attendees */}
                  {meeting.attendees.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {meeting.attendees.slice(0, 3).map((attendee, i) => (
                          <Avatar key={i} className="h-5 w-5 border-2 border-white dark:border-slate-800">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(attendee)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {meeting.attendees.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            +{meeting.attendees.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Prep */}
                  {meeting.aiPrep && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="h-3 w-3 text-violet-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {meeting.aiPrep}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
