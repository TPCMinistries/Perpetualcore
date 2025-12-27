"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  Search,
  Compass,
  ArrowRight,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  documents?: { id: string; title: string }[];
}

interface Suggestion {
  id: string;
  type: "explore" | "action" | "insight";
  title: string;
  description: string;
  action?: () => void;
}

interface LibraryAssistantProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  suggestions?: Suggestion[];
  onSearch?: (query: string) => void;
  onAskQuestion?: (question: string) => Promise<string>;
  className?: string;
}

const quickPrompts = [
  { icon: Search, text: "Find documents about...", prefix: "Find documents about " },
  { icon: Lightbulb, text: "Summarize recent uploads", prefix: "Summarize the documents uploaded in the last week" },
  { icon: Compass, text: "I don't know what I'm looking for", prefix: "Help me explore. " },
  { icon: FileText, text: "What topics are covered?", prefix: "What are the main topics covered in my library?" },
];

const defaultSuggestions: Suggestion[] = [
  {
    id: "1",
    type: "insight",
    title: "3 documents need summaries",
    description: "Generate AI summaries for faster searching",
  },
  {
    id: "2",
    type: "explore",
    title: "Explore by topic",
    description: "View documents grouped by AI-detected themes",
  },
  {
    id: "3",
    type: "action",
    title: "Review recent additions",
    description: "5 documents added this week",
  },
];

export function LibraryAssistant({
  isCollapsed,
  onToggleCollapse,
  suggestions = defaultSuggestions,
  onSearch,
  onAskQuestion,
  className,
}: LibraryAssistantProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (onAskQuestion) {
        const response = await onAskQuestion(input.trim());
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Simulate response for demo
        await new Promise((r) => setTimeout(r, 1000));
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I found 3 relevant documents in your library. Would you like me to summarize them or show the key points?",
          documents: [
            { id: "1", title: "Q4 Financial Report" },
            { id: "2", title: "Budget Analysis 2024" },
          ],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prefix: string) => {
    setInput(prefix);
    inputRef.current?.focus();
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 60 }}
        animate={{ width: 60 }}
        className={cn(
          "relative flex flex-col items-center py-4 border-r border-white/10",
          "bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-xl",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="w-8 h-px bg-white/10" />
          <button
            onClick={onToggleCollapse}
            className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 320 }}
      animate={{ width: 360 }}
      className={cn(
        "relative flex flex-col border-r border-white/10",
        "bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Library Assistant</h3>
            <p className="text-xs text-slate-400">Ask anything about your docs</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="p-4 space-y-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Suggestions for you
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={suggestion.action}
                className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {suggestion.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/10 text-white border border-white/10"
                )}
              >
                <p className="text-sm">{message.content}</p>
                {message.documents && message.documents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                    {message.documents.map((doc) => (
                      <button
                        key={doc.id}
                        className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        {doc.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span className="text-sm text-slate-400">Searching library...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.prefix)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all"
                >
                  <Icon className="h-3 w-3" />
                  {prompt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents..."
            className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-600/10 to-transparent pointer-events-none" />
    </motion.div>
  );
}
