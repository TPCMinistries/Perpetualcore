"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Mail,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  title: string;
  content_type: string;
  platform?: string;
  status: string;
  scheduled_for?: string;
  published_at?: string;
  created_at: string;
}

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  email: Mail,
};

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-500",
  twitter: "bg-sky-500",
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  website: "bg-slate-500",
  email: "bg-amber-500",
};

const statusColors: Record<string, string> = {
  idea: "bg-slate-400",
  draft: "bg-yellow-400",
  review: "bg-blue-400",
  approved: "bg-green-400",
  scheduled: "bg-violet-400",
  published: "bg-emerald-500",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ContentCalendarPage() {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  useEffect(() => {
    fetchContent();
  }, [currentDate, platformFilter]);

  const fetchContent = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Get first and last day of month with buffer for week view
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Extend range to include partial weeks
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      let url = `/api/content?scheduled_from=${startDate.toISOString()}&scheduled_to=${endDate.toISOString()}&limit=200`;
      if (platformFilter !== "all") {
        url += `&platform=${platformFilter}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];

    // Add days from previous month to fill first week
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    return days;
  };

  const getContentForDate = (date: Date) => {
    return content.filter(item => {
      if (!item.scheduled_for) return false;
      const itemDate = new Date(item.scheduled_for);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const calendarDays = getCalendarDays();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Content Calendar
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Schedule and visualize your content pipeline
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/content")}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button
                onClick={() => router.push("/dashboard/content?create=true")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <Card className="mb-6 border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white min-w-[200px] text-center">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-6 text-sm">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Platforms:</span>
          {Object.entries(platformColors).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", color)} />
              <span className="capitalize text-slate-600 dark:text-slate-400">{platform}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {DAYS.map(day => (
              <div
                key={day}
                className="py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayContent = getContentForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDay = isToday(date);

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] border-b border-r border-slate-200 dark:border-slate-700 p-2",
                    !isCurrentMonthDay && "bg-slate-50/50 dark:bg-slate-900/50",
                    index % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isTodayDay && "bg-violet-600 text-white",
                        !isTodayDay && isCurrentMonthDay && "text-slate-900 dark:text-white",
                        !isTodayDay && !isCurrentMonthDay && "text-slate-400 dark:text-slate-600"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayContent.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayContent.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayContent.slice(0, 3).map(item => {
                      const PlatformIcon = platformIcons[item.platform || "website"] || Globe;
                      return (
                        <button
                          key={item.id}
                          onClick={() => router.push(`/dashboard/content/${item.id}`)}
                          className={cn(
                            "w-full text-left px-2 py-1 rounded text-xs truncate flex items-center gap-1.5",
                            "hover:opacity-80 transition-opacity",
                            platformColors[item.platform || "website"] || "bg-slate-500",
                            "text-white"
                          )}
                        >
                          <PlatformIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                    {dayContent.length > 3 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">
                        +{dayContent.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Schedule */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-violet-500" />
                Scheduled This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const now = new Date();
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() + 7);

                const thisWeekContent = content.filter(item => {
                  if (!item.scheduled_for) return false;
                  const date = new Date(item.scheduled_for);
                  return date >= now && date <= weekEnd;
                }).sort((a, b) =>
                  new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime()
                );

                if (thisWeekContent.length === 0) {
                  return (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No content scheduled this week
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {thisWeekContent.slice(0, 5).map(item => {
                      const PlatformIcon = platformIcons[item.platform || "website"] || Globe;
                      const scheduleDate = new Date(item.scheduled_for!);
                      return (
                        <button
                          key={item.id}
                          onClick={() => router.push(`/dashboard/content/${item.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            platformColors[item.platform || "website"] || "bg-slate-500"
                          )}>
                            <PlatformIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {scheduleDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              item.status === "scheduled" && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                            )}
                          >
                            {item.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-amber-500" />
                Content by Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const byPlatform = content.reduce((acc, item) => {
                  const platform = item.platform || "other";
                  acc[platform] = (acc[platform] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const platforms = Object.entries(byPlatform).sort((a, b) => b[1] - a[1]);

                if (platforms.length === 0) {
                  return (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No scheduled content this month
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {platforms.map(([platform, count]) => {
                      const PlatformIcon = platformIcons[platform] || Globe;
                      const total = content.length;
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={platform} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <PlatformIcon className="h-4 w-4 text-slate-500" />
                              <span className="capitalize text-slate-700 dark:text-slate-300">{platform}</span>
                            </div>
                            <span className="text-slate-500">{count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                platformColors[platform] || "bg-slate-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
