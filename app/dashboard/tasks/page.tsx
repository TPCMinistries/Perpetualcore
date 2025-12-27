"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Flag,
  Sparkles,
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bot,
  FileText,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TasksPageSkeleton } from "@/components/ui/skeletons";
import { AITaskRunner } from "@/components/tasks/AITaskRunner";

interface ExecutionLogEntry {
  event: string;
  timestamp: string;
  executor_id?: string;
  executor_type?: string;
  result?: Record<string, unknown>;
  error?: string;
  reason?: string;
  subtask_id?: string;
  subtask_title?: string;
  retry_count?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  ai_extracted: boolean;
  ai_confidence?: number;
  created_at: string;
  execution_type: "manual" | "semi_automated" | "fully_automated";
  execution_status: "pending" | "queued" | "in_progress" | "paused" | "blocked" | "completed" | "failed";
  execution_log: ExecutionLogEntry[];
  parent_task_id?: string;
  blocked_reason?: string;
  failure_reason?: string;
  agent_id?: string | null;
  deliverable_count?: number;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "todo" | "completed">("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
        }),
      });

      if (response.ok) {
        setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
        setShowNewTask(false);
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const getPriorityIndicator = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-blue-500",
      low: "bg-slate-400",
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Overdue", urgent: true };
    if (days === 0) return { text: "Today", urgent: true };
    if (days === 1) return { text: "Tomorrow", urgent: false };
    if (days <= 7) return { text: `${days} days`, urgent: false };
    return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), urgent: false };
  };

  const getExecutionStatusBadge = (task: Task) => {
    if (task.execution_status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </span>
      );
    }
    if (task.execution_status === "completed" && task.status !== "done") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          AI Done
        </span>
      );
    }
    if (task.execution_status === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      );
    }
    return null;
  };

  const toggleExecutionLog = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLogs({ ...expandedLogs, [taskId]: !expandedLogs[taskId] });
  };

  const todoTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const displayTasks = filter === "all" ? tasks : filter === "todo" ? todoTasks : completedTasks;

  if (loading) {
    return <TasksPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <CheckSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tasks</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {todoTasks.length} active · {completedTasks.length} completed
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowNewTask(!showNewTask)}
              className="h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
            {[
              { key: "all", label: "All" },
              { key: "todo", label: "Active" },
              { key: "completed", label: "Done" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === tab.key
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* New Task Form */}
        {showNewTask && (
          <Card className="mb-6 border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && createTask()}
                  className="border-slate-200 dark:border-slate-700 text-lg h-12 bg-transparent"
                  autoFocus
                />
                <Textarea
                  placeholder="Add details (optional)..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="border-slate-200 dark:border-slate-700 bg-transparent resize-none"
                  rows={2}
                />
                <div className="flex items-center gap-4 pt-2">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger className="w-[140px] border-slate-200 dark:border-slate-700 bg-transparent">
                      <Flag className="h-4 w-4 mr-2 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-[160px] border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <div className="flex-1" />
                  <Button variant="ghost" onClick={() => setShowNewTask(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createTask}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task List */}
        {displayTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {filter === "completed" ? "No completed tasks" : "No tasks yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {filter === "completed"
                ? "Complete some tasks to see them here"
                : "Create your first task to get started"}
            </p>
            {filter !== "completed" && (
              <Button
                onClick={() => setShowNewTask(true)}
                variant="outline"
                className="border-slate-200 dark:border-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task) => {
              const dueInfo = formatDate(task.due_date);

              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                  className={`group relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all cursor-pointer ${
                    task.status === "done" ? "opacity-60" : ""
                  }`}
                >
                  {/* Priority indicator bar */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${getPriorityIndicator(task.priority)}`} />

                  <div className="p-4 pl-5">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(task);
                        }}
                        className="flex-shrink-0 mt-0.5 group/check"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover/check:text-violet-500 transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-medium text-base leading-snug ${
                                task.status === "done"
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </h3>

                            {task.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/tasks/${task.id}`);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Meta info row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {/* Due date */}
                          {dueInfo && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                dueInfo.urgent
                                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
                                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {dueInfo.text}
                            </span>
                          )}

                          {/* Execution status badge */}
                          {getExecutionStatusBadge(task)}

                          {/* Deliverables count */}
                          {task.deliverable_count && task.deliverable_count > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
                              <FileText className="h-3 w-3" />
                              {task.deliverable_count} deliverable{task.deliverable_count > 1 ? "s" : ""}
                            </span>
                          )}

                          {/* AI extracted badge */}
                          {task.ai_extracted && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              AI extracted
                            </span>
                          )}

                          {/* Agent created badge */}
                          {task.agent_id && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-full">
                              <Bot className="h-3 w-3" />
                              Agent
                            </span>
                          )}
                        </div>

                        {/* Blocked/Failed Reason */}
                        {(task.blocked_reason || task.failure_reason) && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              {task.blocked_reason || task.failure_reason}
                            </p>
                          </div>
                        )}

                        {/* AI Runner and Execution Log */}
                        {task.status !== "done" && (
                          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <AITaskRunner
                              taskId={task.id}
                              taskTitle={task.title}
                              onComplete={fetchTasks}
                              variant="button"
                              size="sm"
                            />

                            {task.execution_log && task.execution_log.length > 0 && (
                              <button
                                onClick={(e) => toggleExecutionLog(task.id, e)}
                                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                              >
                                {expandedLogs[task.id] ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                {task.execution_log.length} log{task.execution_log.length > 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Execution Log Expanded */}
                        {expandedLogs[task.id] && task.execution_log && (
                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                            {task.execution_log.map((log, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                  <span className="font-medium">{log.event}</span>
                                  <span className="text-slate-400 dark:text-slate-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                {log.result && (
                                  <div className="mt-1 p-2 bg-green-50 dark:bg-green-500/10 rounded text-slate-600 dark:text-slate-400">
                                    {typeof log.result === "string"
                                      ? log.result
                                      : JSON.stringify(log.result, null, 2)}
                                  </div>
                                )}
                                {log.error && (
                                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-500/10 rounded text-red-700 dark:text-red-300">
                                    {log.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
