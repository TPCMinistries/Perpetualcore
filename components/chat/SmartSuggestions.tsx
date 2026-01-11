"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckSquare,
  User,
  FileText,
  Sparkles,
  Clock,
} from "lucide-react";
import { SmartSuggestion } from "./types";

interface SmartSuggestionsProps {
  onSuggestionClick: (text: string) => void;
  visible?: boolean;
}

export function SmartSuggestions({
  onSuggestionClick,
  visible = true,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchSuggestions();
    }
  }, [visible]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/chat/suggestions");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: SmartSuggestion["source"]) => {
    switch (source) {
      case "calendar":
        return <Calendar className="h-3 w-3" />;
      case "task":
        return <CheckSquare className="h-3 w-3" />;
      case "contact":
        return <User className="h-3 w-3" />;
      case "document":
        return <FileText className="h-3 w-3" />;
      case "pattern":
        return <Clock className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: SmartSuggestion["source"]) => {
    switch (source) {
      case "calendar":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "task":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "contact":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
      case "document":
        return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800";
      case "pattern":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <div className="flex gap-2 px-4 py-2">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex flex-wrap gap-2 px-4 py-2"
      >
        {suggestions.slice(0, 3).map((suggestion, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all hover:shadow-sm
              ${getSourceColor(suggestion.source)}
            `}
          >
            {getSourceIcon(suggestion.source)}
            <span className="truncate max-w-[150px]">{suggestion.text}</span>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
