"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  X,
  RefreshCw,
  Zap,
  TrendingUp,
  Link as LinkIcon,
  Eye,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassClasses, motionVariants } from "@/lib/design/library-theme";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  documents?: { id: string; title: string; similarity?: number }[];
}

interface Suggestion {
  id: string;
  type: "explore" | "action" | "insight" | "connection";
  title: string;
  description: string;
  priority?: number;
  metadata?: {
    documentIds?: string[];
    query?: string;
    action?: string;
  };
}

interface LibraryAssistantProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDocumentClick?: (documentId: string) => void;
  onDocumentChat?: (documentId: string) => void;
  className?: string;
}

const quickPrompts = [
  { icon: Search, text: "Find documents about...", prefix: "Find documents about " },
  { icon: Lightbulb, text: "Summarize recent uploads", prefix: "Give me a summary of documents uploaded recently" },
  { icon: Compass, text: "Help me explore", prefix: "I'm not sure what I'm looking for. Help me explore my library and discover what's in there." },
  { icon: FileText, text: "What topics are covered?", prefix: "What are the main topics and themes covered across my documents?" },
];

const suggestionIcons: Record<string, React.ElementType> = {
  explore: Compass,
  action: Zap,
  insight: TrendingUp,
  connection: LinkIcon,
};

export function LibraryAssistant({
  isCollapsed,
  onToggleCollapse,
  onDocumentClick,
  onDocumentChat,
  className,
}: LibraryAssistantProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSuggestions = async () => {
    setIsSuggestionsLoading(true);
    try {
      const response = await fetch("/api/library/suggestions");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/library/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: conversationHistory.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        documents: data.documents?.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          similarity: doc.similarity,
        })),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation history for context
      setConversationHistory((prev) => [
        ...prev,
        { role: "user" as const, content: currentInput },
        { role: "assistant" as const, content: data.message },
      ].slice(-20)); // Keep last 20 messages

    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble searching your library right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prefix: string) => {
    setInput(prefix);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.metadata?.query) {
      setInput(suggestion.metadata.query);
      inputRef.current?.focus();
    } else if (suggestion.metadata?.action === "generate_summaries") {
      setInput("Generate summaries for documents that don't have them yet");
      inputRef.current?.focus();
    } else if (suggestion.metadata?.action === "view_recent") {
      setInput("Show me the documents that were added recently and summarize their contents");
      inputRef.current?.focus();
    } else if (suggestion.metadata?.action === "view_projects") {
      setInput("What documents are in each of my projects?");
      inputRef.current?.focus();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
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
      animate={{ width: 380 }}
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
            <p className="text-xs text-slate-400">AI-powered document discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="text-slate-400 hover:text-white hover:bg-white/10"
              title="Clear conversation"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="p-4 space-y-3 border-b border-white/10 max-h-[280px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              Suggestions for you
            </div>
            <button
              onClick={fetchSuggestions}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Refresh suggestions"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSuggestionsLoading && "animate-spin")} />
            </button>
          </div>

          {isSuggestionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestionIcons[suggestion.type] || Lightbulb;
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        suggestion.type === "action" && "bg-amber-500/20 text-amber-400",
                        suggestion.type === "explore" && "bg-blue-500/20 text-blue-400",
                        suggestion.type === "insight" && "bg-green-500/20 text-green-400",
                        suggestion.type === "connection" && "bg-purple-500/20 text-purple-400"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {suggestion.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
                  "max-w-[90%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/10 text-white border border-white/10"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}

                {message.documents && message.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Referenced Documents:</p>
                    {message.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <button
                          onClick={() => onDocumentClick?.(doc.id)}
                          className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors flex-1 min-w-0"
                        >
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          {doc.similarity && (
                            <span className="text-[10px] text-slate-500">
                              {Math.round(doc.similarity * 100)}%
                            </span>
                          )}
                          <button
                            onClick={() => onDocumentChat?.(doc.id)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Chat with document"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDocumentClick?.(doc.id)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="View document"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
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
                <span className="text-sm text-slate-400">Searching your library...</span>
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
