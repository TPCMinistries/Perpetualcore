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
  Building2,
  Users,
  ListTodo,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AITaskRunner } from "@/components/tasks/AITaskRunner";
import {
  useCurrentEntityIds,
  useEntityContext,
} from "@/components/entities/EntityProvider";
import { motion } from "framer-motion";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";

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
  execution_status:
    | "pending"
    | "queued"
    | "in_progress"
    | "paused"
    | "blocked"
    | "completed"
    | "failed";
  execution_log: ExecutionLogEntry[];
  parent_task_id?: string;
  blocked_reason?: string;
  failure_reason?: string;
  agent_id?: string | null;
  deliverable_count?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const priorityConfig: Record<
  string,
  { color: string; label: string; bg: string; text: string }
> = {
  urgent: {
    color: "bg-rose-500",
    label: "Urgent",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
  },
  high: {
    color: "bg-orange-500",
    label: "High",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  medium: {
    color: "bg-blue-500",
    label: "Medium",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  low: {
    color: "bg-slate-400",
    label: "Low",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  },
};

export default function TasksPage() {
  const router = useRouter();
  const { currentEntity } = useEntityContext();
  const { entityId, brandId } = useCurrentEntityIds();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
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
  }, [filter, entityId, brandId]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }
      if (entityId) {
        params.append("entity_id", entityId);
      }
      if (brandId) {
        params.append("brand_id", brandId);
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
          entityId: entityId || undefined,
          brandId: brandId || undefined,
        }),
      });

      if (response.ok) {
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
        });
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
    return {
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      urgent: false,
    };
  };

  const getExecutionStatusBadge = (task: Task) => {
    if (task.execution_status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </span>
      );
    }
    if (task.execution_status === "completed" && task.status !== "done") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          AI Done
        </span>
      );
    }
    if (task.execution_status === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">
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

  const todoTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "done");
  const displayTasks =
    filter === "all" ? tasks : filter === "todo" ? todoTasks : completedTasks;

  // Filter options
  const filterOptions = [
    { id: "all", label: "All Tasks" },
    { id: "todo", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="4xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-32 bg-violet-200 dark:bg-violet-900/50 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Tasks Skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper maxWidth="4xl">
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="Tasks"
          subtitle={
            currentEntity ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {currentEntity.name}
              </span>
            ) : (
              `${todoTasks.length} active · ${completedTasks.length} completed`
            )
          }
          icon={CheckSquare}
          iconColor="violet"
          stats={[
            { label: "active", value: todoTasks.length },
            { label: "done", value: completedTasks.length },
          ]}
          actions={
            <Button
              onClick={() => setShowNewTask(!showNewTask)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          }
        />

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StatCardGrid columns={3}>
            <StatCard
              label="Total Tasks"
              value={tasks.length}
              icon={ListTodo}
              iconColor="violet"
            />
            <StatCard
              label="Active"
              value={todoTasks.length}
              icon={Target}
              iconColor="amber"
            />
            <StatCard
              label="Completed"
              value={completedTasks.length}
              icon={CheckCircle2}
              iconColor="emerald"
            />
          </StatCardGrid>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FilterPills
            filters={filterOptions}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </motion.div>

        {/* New Task Form */}
        {showNewTask && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Plus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    New Task
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    placeholder="What needs to be done?"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && createTask()
                    }
                    className="border-slate-200 dark:border-slate-700 text-lg h-12"
                    autoFocus
                  />
                  <Textarea
                    placeholder="Add details (optional)..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="border-slate-200 dark:border-slate-700 resize-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-4 pt-2">
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, priority: value })
                      }
                    >
                      <SelectTrigger className="w-[140px] border-slate-200 dark:border-slate-700">
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
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      className="w-[160px] border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTask(false)}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createTask}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Task List */}
        {displayTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
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
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task, idx) => {
              const dueInfo = formatDate(task.due_date);
              const priority = priorityConfig[task.priority] || priorityConfig.medium;

              return (
                <motion.div
                  key={task.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                  className={`group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all cursor-pointer ${
                    task.status === "done" || task.status === "completed"
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  {/* Priority indicator bar */}
                  <div
                    className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${priority.color}`}
                  />

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
                        {task.status === "done" || task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                                task.status === "done" ||
                                task.status === "completed"
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
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
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
                                  className="text-rose-600 dark:text-rose-400"
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
                                  ? "text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30"
                                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
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
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">
                              <FileText className="h-3 w-3" />
                              {task.deliverable_count} deliverable
                              {task.deliverable_count > 1 ? "s" : ""}
                            </span>
                          )}

                          {/* AI extracted badge */}
                          {task.ai_extracted && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              AI extracted
                            </span>
                          )}

                          {/* Agent created badge */}
                          {task.agent_id && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-2.5 py-1 rounded-full">
                              <Bot className="h-3 w-3" />
                              Agent
                            </span>
                          )}
                        </div>

                        {/* Blocked/Failed Reason */}
                        {(task.blocked_reason || task.failure_reason) && (
                          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                            <p className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              {task.blocked_reason || task.failure_reason}
                            </p>
                          </div>
                        )}

                        {/* AI Runner and Execution Log */}
                        {task.status !== "done" && task.status !== "completed" && (
                          <div
                            className="mt-3 flex items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                {task.execution_log.length} log
                                {task.execution_log.length > 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Execution Log Expanded */}
                        {expandedLogs[task.id] && task.execution_log && (
                          <div
                            className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.execution_log.map((log, logIdx) => (
                              <div key={logIdx} className="text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                  <span className="font-medium">{log.event}</span>
                                  <span className="text-slate-400 dark:text-slate-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                {log.result && (
                                  <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-slate-600 dark:text-slate-400">
                                    {typeof log.result === "string"
                                      ? log.result
                                      : JSON.stringify(log.result, null, 2)}
                                  </div>
                                )}
                                {log.error && (
                                  <div className="mt-1 p-2 bg-rose-50 dark:bg-rose-900/20 rounded text-rose-700 dark:text-rose-300">
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  );
}
