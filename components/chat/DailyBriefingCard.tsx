"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sun,
  Moon,
  Sunrise,
  Calendar,
  CheckSquare,
  Mail,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { DailyBriefing, BriefingHighlight } from "./types";

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sunrise className="h-4 w-4 text-amber-500" />;
  if (hour < 18) return <Sun className="h-4 w-4 text-amber-500" />;
  return <Moon className="h-4 w-4 text-indigo-400" />;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DailyBriefingCard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      const response = await fetch("/api/chat/briefing");
      if (response.ok) {
        const data = await response.json();
        setBriefing(data);
      } else {
        // Fallback data if API not ready
        setBriefing({
          greeting: getTimeGreeting(),
          date: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          summary: "Ready to help with your day",
          highlights: [],
          suggestion: "What can I help you with?",
        });
      }
    } catch (error) {
      // Fallback
      setBriefing({
        greeting: getTimeGreeting(),
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        summary: "Ready to help with your day",
        highlights: [],
        suggestion: "What can I help you with?",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-8 w-full" />
      </Card>
    );
  }

  if (!briefing) return null;

  const getHighlightIcon = (type: BriefingHighlight["type"]) => {
    switch (type) {
      case "meeting":
        return <Calendar className="h-3 w-3" />;
      case "task":
        return <CheckSquare className="h-3 w-3" />;
      case "email":
        return <Mail className="h-3 w-3" />;
      case "agent":
        return <Sparkles className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {getGreetingIcon()}
          <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
            Daily Briefing
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-violet-600 dark:text-violet-400 mb-3">
          {briefing.date}
        </p>

        {/* Summary or Highlights */}
        {expanded && briefing.highlights.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            {briefing.highlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
              >
                <span
                  className={`p-1 rounded ${
                    highlight.type === "meeting"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                      : highlight.type === "task"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                      : highlight.type === "agent"
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                  }`}
                >
                  {getHighlightIcon(highlight.type)}
                </span>
                <span className="flex-1 truncate">{highlight.text}</span>
                {highlight.time && (
                  <span className="text-slate-400">{highlight.time}</span>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {briefing.summary}
          </p>
        )}

        {/* Expand indicator */}
        {briefing.highlights.length > 0 && (
          <div className="flex items-center justify-center mt-2">
            <ChevronRight
              className={`h-4 w-4 text-violet-400 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
}
