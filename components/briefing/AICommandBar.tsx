"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  Loader2,
  Calendar,
  Mail,
  CheckSquare,
  Users,
  FileText,
  MessageSquare,
  Zap,
  ChevronRight,
  Bot,
  ArrowRight,
} from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function AICommandBar() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Smart suggestions based on time of day and common actions
  const suggestions: Suggestion[] = [
    {
      id: "check-emails",
      text: "Summarize my unread emails",
      icon: <Mail className="h-4 w-4" />,
      action: () => router.push("/dashboard/inbox"),
      category: "Inbox",
    },
    {
      id: "todays-tasks",
      text: "What should I focus on today?",
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => handleQuickAsk("What should I focus on today? Prioritize my tasks."),
      category: "Productivity",
    },
    {
      id: "prep-meeting",
      text: "Prepare me for my next meeting",
      icon: <Calendar className="h-4 w-4" />,
      action: () => handleQuickAsk("Help me prepare for my next upcoming meeting."),
      category: "Calendar",
    },
    {
      id: "draft-email",
      text: "Draft a follow-up email",
      icon: <Send className="h-4 w-4" />,
      action: () => router.push("/dashboard/chat?prompt=help+me+draft+a+follow-up+email"),
      category: "Writing",
    },
    {
      id: "check-leads",
      text: "Review my hottest leads",
      icon: <Users className="h-4 w-4" />,
      action: () => router.push("/dashboard/leads?sort=score"),
      category: "Sales",
    },
    {
      id: "create-task",
      text: "Create a new task",
      icon: <Zap className="h-4 w-4" />,
      action: () => router.push("/dashboard/tasks?new=true"),
      category: "Tasks",
    },
  ];

  // Filter suggestions based on input
  const filteredSuggestions = input
    ? suggestions.filter(s =>
        s.text.toLowerCase().includes(input.toLowerCase()) ||
        s.category.toLowerCase().includes(input.toLowerCase())
      )
    : suggestions.slice(0, 4);

  const handleQuickAsk = async (question: string) => {
    setLoading(true);
    setInput(question);
    setResponse(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          quick: true, // Hint for quick response
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Handle streaming or regular response
        if (data.message) {
          setResponse(data.message);
        } else {
          // Navigate to chat for full conversation
          router.push(`/dashboard/chat?prompt=${encodeURIComponent(question)}`);
        }
      } else {
        router.push(`/dashboard/chat?prompt=${encodeURIComponent(question)}`);
      }
    } catch (error) {
      console.error("Quick ask error:", error);
      router.push(`/dashboard/chat?prompt=${encodeURIComponent(question)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if matches a suggestion
    const matchedSuggestion = suggestions.find(s =>
      s.text.toLowerCase() === input.toLowerCase()
    );

    if (matchedSuggestion) {
      matchedSuggestion.action();
    } else {
      // Navigate to chat with the question
      router.push(`/dashboard/chat?prompt=${encodeURIComponent(input)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <motion.div
        layout
        className={`relative rounded-xl border transition-all duration-200 ${
          focused
            ? "border-violet-500/50 shadow-lg shadow-violet-500/10 bg-background"
            : "border-border bg-muted/30 hover:bg-muted/50"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3">
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 text-violet-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-violet-500" />
            )}
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything... or try: 'What should I focus on today?'"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            disabled={loading}
          />

          <AnimatePresence>
            {input && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/chat")}
            className="text-xs text-muted-foreground"
          >
            Open Chat
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </form>

        {/* Quick Suggestions */}
        <AnimatePresence>
          {focused && !response && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t px-3 py-2"
            >
              <p className="text-xs text-muted-foreground mb-2">Quick suggestions</p>
              <div className="flex flex-wrap gap-2">
                {filteredSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(suggestion.text);
                      suggestion.action();
                    }}
                    className="text-xs gap-1.5 h-7"
                  >
                    {suggestion.icon}
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-violet-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{response}</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => router.push(`/dashboard/chat?prompt=${encodeURIComponent(input)}`)}
                    className="text-xs text-violet-500 p-0 h-auto mt-2"
                  >
                    Continue conversation
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResponse(null);
                    setInput("");
                  }}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
