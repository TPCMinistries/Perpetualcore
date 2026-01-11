"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  CheckSquare,
  Clock,
  ArrowRight,
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
  { icon: "✍️", text: "Draft email", prompt: "Help me draft a professional email" },
  { icon: "💡", text: "Brainstorm", prompt: "Help me brainstorm ideas for" },
  { icon: "📊", text: "Analyze", prompt: "Help me analyze" },
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
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  // Combine all activity items into a single list
  const activityItems: { type: string; item: any }[] = [];

  activity?.meetings?.slice(0, 2).forEach(m => activityItems.push({ type: 'meeting', item: m }));
  activity?.tasks?.slice(0, 2).forEach(t => activityItems.push({ type: 'task', item: t }));
  activity?.documents?.slice(0, 2).forEach(d => activityItems.push({ type: 'document', item: d }));

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-4 max-w-3xl mx-auto w-full">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {userName ? `Hey ${userName}, what can I help with?` : "What can I help with?"}
        </h1>
      </motion.div>

      {/* Quick Prompts - Inline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-2 mb-4"
      >
        {QUICK_PROMPTS.map((prompt, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(prompt.prompt)}
            className="text-xs gap-1 h-8 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20"
          >
            <span>{prompt.icon}</span>
            {prompt.text}
          </Button>
        ))}
      </motion.div>

      {/* Activity - Compact horizontal list */}
      {!loading && activityItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
            Or pick from your activity:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {activityItems.slice(0, 6).map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.type === 'meeting') {
                    onSuggestionClick(`Help me prepare for my meeting "${item.item.title}"`);
                  } else if (item.type === 'task') {
                    onSuggestionClick(`Help me with my task: "${item.item.title}"`);
                  } else {
                    onSuggestionClick(`Summarize my document "${item.item.title}"`);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs max-w-[200px]"
              >
                {item.type === 'meeting' && <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                {item.type === 'task' && <CheckSquare className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                {item.type === 'document' && <FileText className="h-3 w-3 text-violet-500 flex-shrink-0" />}
                <span className="truncate text-slate-700 dark:text-slate-300">
                  {item.item.title}
                </span>
                {item.type === 'meeting' && (
                  <span className="text-slate-400 flex-shrink-0">
                    {formatMeetingTime(item.item.start_time)}
                  </span>
                )}
                {item.type === 'task' && item.item.priority && ['urgent', 'high'].includes(item.item.priority) && (
                  <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${getPriorityColor(item.item.priority)}`}>
                    {item.item.priority}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-8 w-32 rounded-full" />
          ))}
        </div>
      )}
    </div>
  );
}
