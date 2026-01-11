"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  File,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
  userName?: string;
}

interface RecentDocument {
  id: string;
  title: string;
  type: string;
  created_at: string;
  status: string;
}

interface RecentTask {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
}

interface UpcomingMeeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface RecentActivity {
  documents: RecentDocument[];
  tasks: RecentTask[];
  meetings: UpcomingMeeting[];
}

const QUICK_PROMPTS = [
  { icon: "📝", text: "Plan my day", prompt: "Help me plan my day based on my tasks and meetings" },
  { icon: "✍️", text: "Draft something", prompt: "Help me draft a professional message" },
  { icon: "💡", text: "Brainstorm", prompt: "Help me brainstorm ideas for" },
  { icon: "📊", text: "Analyze data", prompt: "Help me analyze" },
];

export function EmptyState({ onSuggestionClick, userName }: EmptyStateProps) {
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const res = await fetch("/api/chat/activity");
      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const formatMeetingTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const hasActivity =
    activity &&
    (activity.documents.length > 0 ||
      activity.tasks.length > 0 ||
      activity.meetings.length > 0);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {userName ? `Hey ${userName}, what can I help with?` : "What can I help with today?"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ask anything or pick from your recent activity below
          </p>
        </motion.div>

        {/* Quick Prompts Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(prompt.prompt)}
              className="text-sm gap-1.5 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20 dark:hover:border-violet-700"
            >
              <span>{prompt.icon}</span>
              {prompt.text}
            </Button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : hasActivity ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Today's Meetings */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Today's Meetings
                </h3>
              </div>
              {activity?.meetings && activity.meetings.length > 0 ? (
                <div className="space-y-2">
                  {activity.meetings.slice(0, 3).map((meeting) => (
                    <button
                      key={meeting.id}
                      onClick={() =>
                        onSuggestionClick(`Help me prepare for my meeting "${meeting.title}"`)
                      }
                      className="w-full text-left p-2 rounded-lg bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {meeting.title}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatMeetingTime(meeting.start_time)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No meetings scheduled for today
                </p>
              )}
            </Card>

            {/* Priority Tasks */}
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="h-4 w-4 text-amber-600" />
                <h3 className="font-medium text-sm text-amber-900 dark:text-amber-100">
                  Priority Tasks
                </h3>
              </div>
              {activity?.tasks && activity.tasks.length > 0 ? (
                <div className="space-y-2">
                  {activity.tasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() =>
                        onSuggestionClick(`Help me work on my task: "${task.title}"`)
                      }
                      className="w-full text-left p-2 rounded-lg bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate flex-1">
                          {task.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Due {formatTime(task.due_date)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No pending tasks
                </p>
              )}
            </Card>

            {/* Recent Documents */}
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-violet-600" />
                <h3 className="font-medium text-sm text-violet-900 dark:text-violet-100">
                  Recent Documents
                </h3>
              </div>
              {activity?.documents && activity.documents.length > 0 ? (
                <div className="space-y-2">
                  {activity.documents.slice(0, 3).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() =>
                        onSuggestionClick(`Summarize my document "${doc.title}"`)
                      }
                      className="w-full text-left p-2 rounded-lg bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <File className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 ml-5">
                        Added {formatTime(doc.created_at)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No recent documents
                </p>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Ready to help!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Start a conversation by typing below or use one of the quick prompts above.
              I can help with tasks, documents, meetings, and more.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
