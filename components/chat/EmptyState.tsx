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
  MessageSquare,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
  userName?: string;
  conversations?: any[];
  onSelectConversation?: (id: string) => void;
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

export function EmptyState({
  onSuggestionClick,
  userName,
  conversations,
  onSelectConversation,
}: EmptyStateProps) {
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

  const recentConversations = conversations?.slice(0, 5) || [];

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-auto">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header - with some top spacing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 mt-8"
        >
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {userName ? `Hey ${userName}, what can I help with?` : "What can I help with?"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Start a new conversation or continue where you left off
          </p>
        </motion.div>

        {/* Quick Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(prompt.prompt)}
              className="text-xs gap-1.5 h-9 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20"
            >
              <span>{prompt.icon}</span>
              {prompt.text}
            </Button>
          ))}
        </motion.div>

        {/* Activity Items */}
        {!loading && activityItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
              From your activity:
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-xs"
                >
                  {item.type === 'meeting' && <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                  {item.type === 'task' && <CheckSquare className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                  {item.type === 'document' && <FileText className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />}
                  <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                    {item.item.title}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-9 w-36 rounded-lg" />
            ))}
          </div>
        )}

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-auto"
          >
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                Continue a conversation
              </div>
              <div className="space-y-1">
                {recentConversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation?.(conv.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {conv.title || "New conversation"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(conv.updated_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
