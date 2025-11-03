"use client";

import { useState, useEffect } from "react";
import { GripVertical, Plus, MoreVertical, Calendar, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  assigned_user?: {
    full_name: string;
  };
  project_name?: string;
  tags?: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", status: "todo", color: "bg-gray-100 border-gray-300" },
  { id: "in_progress", title: "In Progress", status: "in_progress", color: "bg-blue-100 border-blue-300" },
  { id: "completed", title: "Completed", status: "completed", color: "bg-green-100 border-green-300" },
  { id: "cancelled", title: "Cancelled", status: "cancelled", color: "bg-red-100 border-red-300" },
];

interface KanbanBoardProps {
  organizationId?: string;
  projectFilter?: string;
}

export function KanbanBoard({ organizationId, projectFilter }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

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

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistic update
    setTasks(tasks.map((t) => (t.id === draggedTask ? { ...t, status: newStatus } : t)));
    setDraggedTask(null);

    // Update on server
    try {
      const response = await fetch(`/api/tasks/${draggedTask}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success("Task moved successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to move task");
      // Revert optimistic update
      fetchTasks();
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading Kanban board...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 min-w-max p-4">
        {DEFAULT_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.status);

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              <Card className={`h-full ${column.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {column.title}
                      <Badge variant="secondary" className="ml-2">
                        {columnTasks.length}
                      </Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className="cursor-move hover:shadow-md transition-shadow bg-white"
                      >
                        <CardContent className="p-4">
                          {/* Drag Handle */}
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1 line-clamp-2">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Task Metadata */}
                          <div className="space-y-2">
                            {/* Priority & Project */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              {task.project_name && (
                                <Badge variant="outline" className="text-xs">
                                  {task.project_name}
                                </Badge>
                              )}
                            </div>

                            {/* Due Date */}
                            {task.due_date && (
                              <div
                                className={`flex items-center gap-1 text-xs ${
                                  isOverdue(task.due_date)
                                    ? "text-red-600 font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isOverdue(task.due_date) && (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(task.due_date), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            )}

                            {/* Assigned User */}
                            {task.assigned_user && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{task.assigned_user.full_name}</span>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{task.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
