"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  Send,
  Loader2,
  X,
  MessageSquare,
  FileText,
  Lightbulb,
  Zap,
  ArrowRight,
  Bot,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface AIContextButtonProps {
  /** Context about the current page/feature */
  context?: string;
  /** Pre-defined quick actions */
  quickActions?: {
    label: string;
    prompt: string;
    icon?: React.ReactNode;
  }[];
  /** Whether to show as floating button */
  floating?: boolean;
  /** Position for floating button */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

// Default contextual actions based on current page
const getDefaultActions = (pathname: string) => {
  const actions = [
    { label: "Explain this page", prompt: "Explain what I can do on this page and how to use it effectively", icon: <Lightbulb className="h-3 w-3" /> },
  ];

  if (pathname.includes("/tasks")) {
    actions.push(
      { label: "Prioritize my tasks", prompt: "Help me prioritize my current tasks based on urgency and importance", icon: <Zap className="h-3 w-3" /> },
      { label: "Break down a task", prompt: "Help me break down a complex task into smaller actionable steps", icon: <FileText className="h-3 w-3" /> }
    );
  } else if (pathname.includes("/leads")) {
    actions.push(
      { label: "Score my leads", prompt: "Help me analyze and score my leads based on their potential", icon: <Zap className="h-3 w-3" /> },
      { label: "Draft outreach", prompt: "Help me draft a personalized outreach message for my top leads", icon: <FileText className="h-3 w-3" /> }
    );
  } else if (pathname.includes("/documents") || pathname.includes("/library")) {
    actions.push(
      { label: "Summarize document", prompt: "Summarize the key points from my most recent document", icon: <FileText className="h-3 w-3" /> },
      { label: "Find related docs", prompt: "Find documents related to my current work", icon: <Zap className="h-3 w-3" /> }
    );
  } else if (pathname.includes("/calendar")) {
    actions.push(
      { label: "Prep for next meeting", prompt: "Help me prepare for my next upcoming meeting with a briefing", icon: <FileText className="h-3 w-3" /> },
      { label: "Find meeting time", prompt: "Help me find the best time for a meeting this week", icon: <Zap className="h-3 w-3" /> }
    );
  } else if (pathname.includes("/projects")) {
    actions.push(
      { label: "Project status", prompt: "Give me a summary of my project status and what needs attention", icon: <Zap className="h-3 w-3" /> },
      { label: "Suggest next steps", prompt: "Based on my current project, suggest the next steps I should take", icon: <Lightbulb className="h-3 w-3" /> }
    );
  } else if (pathname.includes("/inbox")) {
    actions.push(
      { label: "Summarize inbox", prompt: "Summarize what's in my inbox that needs attention", icon: <FileText className="h-3 w-3" /> },
      { label: "Draft response", prompt: "Help me draft a response to my most important email", icon: <Zap className="h-3 w-3" /> }
    );
  }

  return actions;
};

export function AIContextButton({
  context,
  quickActions,
  floating = true,
  position = "bottom-right",
}: AIContextButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const defaultActions = getDefaultActions(pathname);
  const actions = quickActions || defaultActions;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickAction = async (prompt: string) => {
    setLoading(true);
    setResponse(null);

    try {
      const fullPrompt = context
        ? `Context: ${context}\n\nUser request: ${prompt}`
        : prompt;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: fullPrompt }],
          quick: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setResponse(data.message);
        } else {
          // Navigate to chat for longer response
          router.push(`/dashboard/chat?prompt=${encodeURIComponent(prompt)}`);
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.error("AI context error:", error);
      router.push(`/dashboard/chat?prompt=${encodeURIComponent(prompt)}`);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    handleQuickAction(input);
    setInput("");
  };

  const positionClasses = {
    "bottom-right": "right-6 bottom-6",
    "bottom-left": "left-6 bottom-6",
    "bottom-center": "left-1/2 -translate-x-1/2 bottom-6",
  };

  const buttonContent = (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      className={`rounded-full shadow-lg ${
        isOpen
          ? "bg-violet-600 hover:bg-violet-700"
          : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
      }`}
      size="lg"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
          >
            <ChevronUp className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">Ask AI</span>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              ⌘K
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );

  return (
    <>
      {/* Floating button */}
      {floating && (
        <div className={`fixed z-50 ${positionClasses[position]}`}>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-16 right-0 w-80 sm:w-96 bg-background border rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-3 border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-violet-600" />
                    <span className="font-medium">AI Assistant</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Context-aware
                    </Badge>
                  </div>
                </div>

                {/* Quick Actions */}
                {!response && (
                  <div className="p-3 border-b">
                    <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {actions.slice(0, 4).map((action, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.prompt)}
                          disabled={loading}
                          className="text-xs h-7 gap-1"
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response */}
                <AnimatePresence>
                  {response && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 border-b max-h-60 overflow-y-auto"
                    >
                      <div className="flex items-start gap-2">
                        <Bot className="h-4 w-4 text-violet-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm whitespace-pre-wrap">{response}</p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResponse(null)}
                              className="h-6 text-xs"
                            >
                              Clear
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push("/dashboard/chat");
                                setIsOpen(false);
                              }}
                              className="h-6 text-xs"
                            >
                              Continue in Chat
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3">
                  <div className="relative">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything..."
                      className="min-h-[60px] pr-12 resize-none"
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!input.trim() || loading}
                      className="absolute right-2 bottom-2 h-8 w-8 p-0"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {buttonContent}
        </div>
      )}

      {/* Non-floating version */}
      {!floating && (
        <div className="relative inline-block">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
          {/* Similar popup but positioned relative */}
        </div>
      )}
    </>
  );
}

/**
 * AI action button for specific operations
 */
interface AIActionButtonProps {
  action: "summarize" | "explain" | "expand" | "improve" | "translate";
  content: string;
  onResult?: (result: string) => void;
  size?: "sm" | "default";
}

export function AIActionButton({
  action,
  content,
  onResult,
  size = "sm",
}: AIActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const actionConfig = {
    summarize: { label: "Summarize", icon: <FileText className="h-3 w-3" />, prompt: "Summarize this concisely:" },
    explain: { label: "Explain", icon: <Lightbulb className="h-3 w-3" />, prompt: "Explain this in simple terms:" },
    expand: { label: "Expand", icon: <ArrowRight className="h-3 w-3" />, prompt: "Expand on this with more detail:" },
    improve: { label: "Improve", icon: <Sparkles className="h-3 w-3" />, prompt: "Improve this writing:" },
    translate: { label: "Translate", icon: <MessageSquare className="h-3 w-3" />, prompt: "Translate this to English:" },
  };

  const config = actionConfig[action];

  const handleClick = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${config.prompt}\n\n${content}` }],
          quick: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message && onResult) {
          onResult(data.message);
        }
      }
    } catch (error) {
      console.error("AI action error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={loading}
      className="gap-1"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        config.icon
      )}
      {config.label}
    </Button>
  );
}
