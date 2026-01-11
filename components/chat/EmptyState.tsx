"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Users,
  Calendar,
  CheckSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AIMemory, SmartSuggestion } from "./types";

interface EmptyStateProps {
  onSuggestionClick: (prompt: string) => void;
  userName?: string;
}

interface SuggestionCard {
  icon: string;
  title: string;
  prompt: string;
}

const DEFAULT_SUGGESTIONS: SuggestionCard[] = [
  {
    icon: "📅",
    title: "What's on my schedule today?",
    prompt: "What's on my schedule today? Give me a summary of my meetings and tasks.",
  },
  {
    icon: "📄",
    title: "Summarize my recent documents",
    prompt: "Summarize my most recent documents and highlight key points.",
  },
  {
    icon: "✉️",
    title: "Draft an email",
    prompt: "Help me draft a professional email about",
  },
  {
    icon: "💡",
    title: "Brainstorm ideas",
    prompt: "Help me brainstorm ideas for",
  },
];

export function EmptyState({ onSuggestionClick, userName }: EmptyStateProps) {
  const [memory, setMemory] = useState<AIMemory | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemoryAndSuggestions();
  }, []);

  const fetchMemoryAndSuggestions = async () => {
    try {
      // Fetch AI memory stats
      const memoryRes = await fetch("/api/chat/memory");
      if (memoryRes.ok) {
        const memoryData = await memoryRes.json();
        setMemory(memoryData);
      }

      // Fetch smart suggestions
      const suggestionsRes = await fetch("/api/chat/suggestions");
      if (suggestionsRes.ok) {
        const suggestionsData = await suggestionsRes.json();
        setSuggestions(suggestionsData.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch memory/suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {userName ? `Welcome back, ${userName}` : "Welcome to your AI Assistant"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            I'm here to help with anything. Here's what I already know about you:
          </p>
        </div>

        {/* AI Memory Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={<FileText className="h-5 w-5 text-blue-500" />}
                value={memory?.documents.count || 0}
                label="documents"
              />
              <StatCard
                icon={<Users className="h-5 w-5 text-green-500" />}
                value={memory?.contacts.count || 0}
                label="contacts"
              />
              <StatCard
                icon={<Calendar className="h-5 w-5 text-amber-500" />}
                value={memory?.conversations.count || 0}
                label="conversations"
              />
              <StatCard
                icon={<CheckSquare className="h-5 w-5 text-violet-500" />}
                value={memory?.conversations.insights || 0}
                label="insights"
              />
            </>
          )}
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Try asking me:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <Card
                  className="p-4 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
                  onClick={() => onSuggestionClick(suggestion.prompt)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {suggestion.title}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Smart Suggestions (if available) */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion.text)}
                className="text-xs"
              >
                {suggestion.source === "calendar" && "📅"}
                {suggestion.source === "task" && "✅"}
                {suggestion.source === "contact" && "👤"}
                {suggestion.source === "document" && "📄"}
                <span className="ml-1">{suggestion.text}</span>
              </Button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </Card>
  );
}
