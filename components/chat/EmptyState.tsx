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
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { buildFirstChatPrompt, getFirstChatSuggestions } from "@/lib/onboarding/guided-chat";

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
  userName?: string;
  conversations?: any[];
  onSelectConversation?: (id: string) => void;
  isGuidedFirstChat?: boolean;
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

interface OnboardingProfile {
  preferred_name?: string;
  user_role?: string;
  primary_goals?: string[];
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
  isGuidedFirstChat = false,
}: EmptyStateProps) {
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConversations, setShowConversations] = useState(false); // Collapsed by default
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    fetchActivity();
    if (isGuidedFirstChat) {
      fetchOnboardingProfile();
    }
  }, [isGuidedFirstChat]);

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

  const fetchOnboardingProfile = async () => {
    try {
      const res = await fetch("/api/profile/context");
      if (res.ok) {
        const data = await res.json();
        setOnboardingProfile({
          preferred_name: data.preferred_name,
          user_role: data.user_role,
          primary_goals: data.primary_goals || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch onboarding profile:", error);
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

  // Build guided first-chat content when profile is loaded
  const firstChatPrompt = isGuidedFirstChat && onboardingProfile?.user_role
    ? buildFirstChatPrompt({
        preferredName: onboardingProfile.preferred_name || userName || "there",
        userRole: onboardingProfile.user_role,
        primaryGoals: onboardingProfile.primary_goals || [],
      })
    : null;

  const firstChatSuggestions = isGuidedFirstChat && onboardingProfile?.user_role
    ? getFirstChatSuggestions(
        onboardingProfile.user_role,
        onboardingProfile.primary_goals || []
      )
    : null;

  const displayName = onboardingProfile?.preferred_name || userName || "there";

  // Guided first-chat layout — personalized aha moment
  if (isGuidedFirstChat) {
    return (
      <div className="flex-1 flex flex-col px-4 py-6 overflow-auto">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* Personalized welcome header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 mt-6"
          >
            <div className="inline-flex h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 items-center justify-center mb-4 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Welcome to your AI brain, {displayName}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              I already know a bit about you from your setup. Try asking me something — I'll remember everything.
            </p>
          </motion.div>

          {/* Pre-built first message card */}
          {firstChatPrompt ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 text-center font-medium uppercase tracking-wider">
                Send your first message
              </p>
              <button
                onClick={() => onSuggestionClick(firstChatPrompt)}
                className="w-full p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    "{firstChatPrompt}"
                  </p>
                  <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </motion.div>
          ) : (
            <div className="mb-6 flex justify-center">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          )}

          {/* Personalized quick suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {firstChatSuggestions
              ? firstChatSuggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => onSuggestionClick(suggestion.prompt)}
                    className="text-xs gap-1.5 h-9 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/20"
                  >
                    <span>{suggestion.icon}</span>
                    {suggestion.text}
                  </Button>
                ))
              : QUICK_PROMPTS.map((prompt, idx) => (
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
        </div>
      </div>
    );
  }

  // Standard empty state layout
  // Combine all activity items into a single list
  const activityItems: { type: string; item: any }[] = [];
  activity?.meetings?.slice(0, 2).forEach(m => activityItems.push({ type: 'meeting', item: m }));
  activity?.tasks?.slice(0, 2).forEach(t => activityItems.push({ type: 'task', item: t }));
  activity?.documents?.slice(0, 2).forEach(d => activityItems.push({ type: 'document', item: d }));

  const recentConversations = conversations?.slice(0, 3) || []; // Show max 3 to keep compact

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
            <div className="bg-gradient-to-b from-violet-50 to-slate-50 dark:from-violet-950/30 dark:to-slate-900 rounded-xl border border-violet-200 dark:border-violet-800/50 overflow-hidden">
              {/* Header with toggle */}
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="w-full px-4 py-3 flex items-center justify-between bg-violet-100/50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
                    Recent conversations
                  </span>
                  <span className="text-xs text-violet-600 dark:text-violet-400 bg-violet-200 dark:bg-violet-800 px-1.5 py-0.5 rounded-full">
                    {recentConversations.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                  <span className="text-xs">{showConversations ? "Hide" : "Show"}</span>
                  {showConversations ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Conversation list - compact */}
              {showConversations && (
                <div className="p-2 space-y-1">
                  {recentConversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation?.(conv.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {conv.title || "New conversation"}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {formatTime(conv.updated_at)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
