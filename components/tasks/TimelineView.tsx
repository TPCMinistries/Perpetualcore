"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, isWithinInterval } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  project_name?: string;
}

interface Dependency {
  task_id: string;
  depends_on_task_id: string;
}

type ZoomLevel = "day" | "week" | "month";

interface TimelineViewProps {
  organizationId?: string;
  projectFilter?: string;
}

export function TimelineView({ organizationId, projectFilter }: TimelineViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [organizationId, projectFilter]);

  const fetchTasks = async () => {
    try {
      let url = "/api/tasks";
      const params = new URLSearchParams();
      if (organizationId) params.append("organization_id", organizationId);
      if (projectFilter) params.append("project", projectFilter);
      if (params.toString()) url += `?${params}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTimelineRange = () => {
    const start = startOfWeek(viewDate);
    const end = endOfWeek(addDays(viewDate, zoomLevel === "day" ? 7 : zoomLevel === "week" ? 28 : 90));
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getTimelineRange();
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const getTaskPosition = (task: Task) => {
    const taskStart = task.created_at ? new Date(task.created_at) : new Date();
    const taskEnd = task.due_date ? new Date(task.due_date) : addDays(taskStart, 3);

    const startOffset = differenceInDays(taskStart, rangeStart);
    const duration = differenceInDays(taskEnd, taskStart) || 1;

    const totalDays = differenceInDays(rangeEnd, rangeStart);
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(2, widthPercent)}%`,
      isVisible: isWithinInterval(taskStart, { start: rangeStart, end: rangeEnd }) ||
                 isWithinInterval(taskEnd, { start: rangeStart, end: rangeEnd }),
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "in_progress":
        return "bg-blue-600";
      case "todo":
        return "bg-gray-600";
      default:
        return "bg-gray-400";
    }
  };

  const goToPrevious = () => {
    setViewDate(addDays(viewDate, zoomLevel === "day" ? -7 : zoomLevel === "week" ? -28 : -90));
  };

  const goToNext = () => {
    setViewDate(addDays(viewDate, zoomLevel === "day" ? 7 : zoomLevel === "week" ? 28 : 90));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const visibleTasks = tasks.filter((task) => getTaskPosition(task).isVisible);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Timeline Controls */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Timeline View</CardTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setZoomLevel("day")}
                  disabled={zoomLevel === "day"}
                >
                  Day
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setZoomLevel("week")}
                  disabled={zoomLevel === "week"}
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setZoomLevel("month")}
                  disabled={zoomLevel === "month"}
                >
                  Month
                </Button>
              </div>

              {/* Navigation */}
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Grid */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div ref={containerRef} className="overflow-auto h-full">
            {/* Timeline Header */}
            <div className="sticky top-0 bg-background border-b z-10">
              <div className="flex min-w-max">
                <div className="w-48 flex-shrink-0 p-4 border-r font-medium">
                  Task
                </div>
                <div className="flex-1 flex">
                  {zoomLevel === "day" && days.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[80px] p-2 text-center border-r text-xs"
                    >
                      <div className="font-medium">{format(day, "EEE")}</div>
                      <div className="text-muted-foreground">{format(day, "MMM d")}</div>
                    </div>
                  ))}
                  {zoomLevel === "week" && Array.from({ length: Math.ceil(days.length / 7) }).map((_, idx) => {
                    const weekStart = days[idx * 7];
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[100px] p-2 text-center border-r text-xs"
                      >
                        <div className="font-medium">Week {format(weekStart, "w")}</div>
                        <div className="text-muted-foreground">{format(weekStart, "MMM d")}</div>
                      </div>
                    );
                  })}
                  {zoomLevel === "month" && Array.from({ length: 3 }).map((_, idx) => {
                    const monthDate = addDays(rangeStart, idx * 30);
                    return (
                      <div
                        key={idx}
                        className="flex-1 min-w-[120px] p-2 text-center border-r text-xs"
                      >
                        <div className="font-medium">{format(monthDate, "MMMM")}</div>
                        <div className="text-muted-foreground">{format(monthDate, "yyyy")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline Body */}
            <div className="min-w-max">
              {visibleTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No tasks in this time range
                </div>
              ) : (
                visibleTasks.map((task, taskIdx) => {
                  const position = getTaskPosition(task);
                  return (
                    <div key={task.id} className="flex border-b hover:bg-accent">
                      {/* Task Name */}
                      <div className="w-48 flex-shrink-0 p-4 border-r">
                        <div className="text-sm font-medium line-clamp-2">{task.title}</div>
                        {task.project_name && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {task.project_name}
                          </Badge>
                        )}
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex-1 relative h-16">
                        {position.isVisible && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                              left: position.left,
                              width: position.width,
                            }}
                            title={task.title}
                          >
                            <div
                              className={`absolute inset-0 rounded-md ${getStatusColor(
                                task.status
                              )}`}
                              style={{
                                opacity: task.status === "completed" ? 0.6 : 1,
                              }}
                            />
                            <div className="relative z-10 truncate">{task.title}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
