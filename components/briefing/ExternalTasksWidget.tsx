"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  ListTodo,
  Boxes,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ExternalTask {
  id: string;
  external_id: string;
  source: "todoist" | "linear";
  title: string;
  description?: string;
  status: string;
  priority?: number;
  due_date?: string;
  project_name?: string;
  external_url?: string;
}

interface ExternalTasksWidgetProps {
  limit?: number;
  compact?: boolean;
}

export function ExternalTasksWidget({ limit = 5, compact = false }: ExternalTasksWidgetProps) {
  const [tasks, setTasks] = useState<ExternalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSkillsEnabled, setHasSkillsEnabled] = useState(true);

  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/external-tasks?limit=${limit}&status=open`);

      if (response.status === 404) {
        // No skills enabled or no tasks table
        setHasSkillsEnabled(false);
        setTasks([]);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch external tasks");

      const data = await response.json();
      setTasks(data.tasks || []);
      setHasSkillsEnabled(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [limit]);

  const getPriorityColor = (priority?: number) => {
    if (!priority) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (priority === 4 || priority === 1) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (priority === 3 || priority === 2) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    if (priority === 2 || priority === 3) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const getSourceIcon = (source: string) => {
    if (source === "todoist") return <ListTodo className="h-3.5 w-3.5" />;
    if (source === "linear") return <Boxes className="h-3.5 w-3.5" />;
    return <Circle className="h-3.5 w-3.5" />;
  };

  const getSourceColor = (source: string) => {
    if (source === "todoist") return "text-red-500";
    if (source === "linear") return "text-violet-500";
    return "text-gray-500";
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date < today) {
      return { text: "Overdue", className: "text-red-600 dark:text-red-400 font-medium" };
    }
    if (date.toDateString() === today.toDateString()) {
      return { text: "Today", className: "text-orange-600 dark:text-orange-400 font-medium" };
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return { text: "Tomorrow", className: "text-yellow-600 dark:text-yellow-400" };
    }
    return {
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      className: "text-muted-foreground",
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // If no skills enabled, show prompt to enable
  if (!hasSkillsEnabled || (tasks.length === 0 && !error)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Connect Your Task Apps</p>
              <p className="text-sm text-muted-foreground">
                Enable Todoist or Linear skills to see your tasks here
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings/skills">
                <Boxes className="h-4 w-4 mr-2" />
                Enable Skills
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center text-muted-foreground gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={`${compact ? "pb-2" : "pb-3"} flex flex-row items-center justify-between`}>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Boxes className="h-4 w-4 text-violet-500" />
          External Tasks
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {tasks.length} open
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => fetchTasks(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-0" : ""}>
        <div className="space-y-2">
          {tasks.map((task, index) => {
            const dueInfo = formatDueDate(task.due_date);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={`mt-0.5 ${getSourceColor(task.source)}`}>
                  {getSourceIcon(task.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.external_url && (
                      <a
                        href={task.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.project_name && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {task.project_name}
                      </span>
                    )}
                    {dueInfo && (
                      <span className={`text-xs ${dueInfo.className}`}>
                        {dueInfo.text}
                      </span>
                    )}
                    {task.priority && task.priority <= 2 && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)}`}
                      >
                        P{task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {tasks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href="/dashboard/tasks?source=external">
                View all external tasks
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
