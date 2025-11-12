"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Flag,
  Sparkles,
  CheckSquare,
  Play,
  Zap,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Ban,
  User,
  Bot,
  Workflow,
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

interface ExecutionLogEntry {
  event: string;
  timestamp: string;
  executor_id?: string;
  executor_type?: string;
  result?: Record<string, any>;
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
  // Execution tracking fields
  execution_type: "manual" | "semi_automated" | "fully_automated";
  execution_status: "pending" | "queued" | "in_progress" | "paused" | "blocked" | "completed" | "failed";
  execution_log: ExecutionLogEntry[];
  parent_task_id?: string;
  blocked_reason?: string;
  failure_reason?: string;
  // Source tracking
  agent_id?: string | null;
  assigned_to_type?: "user" | "agent" | "workflow" | null;
  assigned_to_id?: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "todo" | "completed">("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [executingTasks, setExecutingTasks] = useState<Record<string, boolean>>({});
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
    const newStatus = task.status === "completed" ? "todo" : "completed";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 border-red-500/30";
      case "high":
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30";
      case "medium":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30";
      case "low":
        return "text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/30";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border-green-500/30";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30";
      case "queued":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30";
      case "blocked":
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30";
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 border-red-500/30";
      case "paused":
        return "text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/30";
      default: // pending
        return "text-slate-600 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/30";
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "in_progress":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "queued":
        return <Clock className="h-3 w-3" />;
      case "blocked":
        return <Ban className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      case "paused":
        return <Pause className="h-3 w-3" />;
      default: // pending
        return <Circle className="h-3 w-3" />;
    }
  };

  const getExecutionTypeColor = (type: string) => {
    switch (type) {
      case "fully_automated":
        return "text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30";
      case "semi_automated":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30";
      default: // manual
        return "text-slate-600 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/30";
    }
  };

  const getExecutionTypeIcon = (type: string) => {
    switch (type) {
      case "fully_automated":
        return <Zap className="h-3 w-3" />;
      case "semi_automated":
        return <Bot className="h-3 w-3" />;
      default: // manual
        return <User className="h-3 w-3" />;
    }
  };

  const canExecuteTask = (task: Task) => {
    return (
      (task.execution_type === "semi_automated" || task.execution_type === "fully_automated") &&
      (task.execution_status === "pending" || task.execution_status === "queued") &&
      task.status !== "completed"
    );
  };

  const executeTask = async (taskId: string) => {
    setExecutingTasks({ ...executingTasks, [taskId]: true });

    try {
      const response = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh tasks to show updated status
        fetchTasks();

        // Show result message based on strategy
        if (result.strategy === "immediate") {
          alert(`Task executed successfully!\n\nResult:\n${result.result}`);
        } else if (result.strategy === "decompose") {
          alert(`Task decomposed into ${result.subtasks.length} subtasks. Check the task list to see them!`);
        } else if (result.strategy === "blocked") {
          alert(`Task blocked: ${result.reason}`);
        }
      } else {
        alert(`Execution failed: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to execute task:", error);
      alert("Failed to execute task. Check console for details.");
    } finally {
      setExecutingTasks({ ...executingTasks, [taskId]: false });
    }
  };

  const toggleExecutionLog = (taskId: string) => {
    setExpandedLogs({ ...expandedLogs, [taskId]: !expandedLogs[taskId] });
  };

  const todoTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const displayTasks = filter === "all" ? tasks : filter === "todo" ? todoTasks : completedTasks;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12">
            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-6 w-6 text-slate-600 dark:text-slate-400 animate-pulse" />
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-medium">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 mb-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {todoTasks.length} active • {completedTasks.length} completed
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewTask(!showNewTask)}
            className="h-11 px-6 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
          className={filter === "all" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          All
        </Button>
        <Button
          variant={filter === "todo" ? "default" : "outline"}
          onClick={() => setFilter("todo")}
          size="sm"
          className={filter === "todo" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          To Do
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
          className={filter === "completed" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          Completed
        </Button>
      </div>

      {/* New task form */}
      {showNewTask && (
        <Card className="mb-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                className="border-slate-200 dark:border-slate-800"
                autoFocus
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="border-slate-200 dark:border-slate-800"
                rows={2}
              />
              <div className="flex gap-4">
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="w-[140px] border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-[180px] border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTask} className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                  Create Task
                </Button>
                <Button variant="ghost" onClick={() => setShowNewTask(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      {displayTasks.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="py-12 text-center">
            <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {filter === "completed" ? "No completed tasks" : "No tasks yet"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === "completed" ? "Complete some tasks to see them here" : "Create your first task to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayTasks.map((task) => (
            <Card
              key={task.id}
              className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${
                task.status === "completed" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="flex-shrink-0 mt-1"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-400 dark:text-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium ${
                        task.status === "completed" ? "line-through text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        <Flag className="h-3 w-3" />
                        {task.priority}
                      </span>

                      {/* Execution Type Badge */}
                      {task.execution_type && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${getExecutionTypeColor(
                            task.execution_type
                          )}`}
                        >
                          {getExecutionTypeIcon(task.execution_type)}
                          {task.execution_type.replace("_", " ")}
                        </span>
                      )}

                      {/* Execution Status Badge */}
                      {task.execution_status && task.execution_status !== "pending" && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${getExecutionStatusColor(
                            task.execution_status
                          )}`}
                        >
                          {getExecutionStatusIcon(task.execution_status)}
                          {task.execution_status.replace("_", " ")}
                        </span>
                      )}

                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}

                      {task.ai_extracted && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded-lg">
                          <Sparkles className="h-3 w-3" />
                          AI extracted
                        </span>
                      )}

                      {/* Task Source Badge */}
                      {task.agent_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 px-2 py-1 rounded-lg">
                          <Bot className="h-3 w-3" />
                          Agent Created
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-lg">
                          <User className="h-3 w-3" />
                          Manual
                        </span>
                      )}
                    </div>

                    {/* Blocked/Failed Reason */}
                    {(task.blocked_reason || task.failure_reason) && (
                      <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <p className="text-xs text-orange-800 dark:text-orange-200 flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          {task.blocked_reason || task.failure_reason}
                        </p>
                      </div>
                    )}

                    {/* Execute Task Button */}
                    {canExecuteTask(task) && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => executeTask(task.id)}
                          disabled={executingTasks[task.id]}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          {executingTasks[task.id] ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-2" />
                              Execute Task
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Execution Log Viewer */}
                    {task.execution_log && task.execution_log.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExecutionLog(task.id)}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                          {expandedLogs[task.id] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          Execution Log ({task.execution_log.length} events)
                        </button>

                        {expandedLogs[task.id] && (
                          <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                            {task.execution_log.map((log, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                  <span className="font-medium">{log.event}</span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                {log.result && (
                                  <div className="mt-1 p-2 bg-green-50 dark:bg-green-950/20 rounded text-slate-600 dark:text-slate-300">
                                    {typeof log.result === "string"
                                      ? log.result
                                      : JSON.stringify(log.result, null, 2)}
                                  </div>
                                )}
                                {log.error && (
                                  <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 rounded text-red-800 dark:text-red-200">
                                    {log.error}
                                  </div>
                                )}
                                {log.reason && (
                                  <div className="mt-1 text-slate-600 dark:text-slate-400">
                                    Reason: {log.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtasks Indicator */}
                    {task.parent_task_id && (
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Workflow className="h-3 w-3" />
                        Subtask of parent task
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
