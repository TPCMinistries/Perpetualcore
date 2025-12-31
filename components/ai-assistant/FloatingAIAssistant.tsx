"use client";

import { useState, useRef, useEffect } from "react";
import { useAIAssistantContext } from "./AIAssistantProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { AIQuickActions } from "./AIQuickActions";
import { AIContextPanel } from "./AIContextPanel";

export function FloatingAIAssistant() {
  const {
    isOpen,
    isLoading,
    messages,
    context,
    close,
    sendMessage,
    getQuickActions,
    clearMessages,
  } = useAIAssistantContext();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
  };

  if (!isOpen) return null;

  const quickActions = getQuickActions();

  return (
    <div
      className={cn(
        "fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col transition-all duration-200",
        isExpanded
          ? "inset-4 md:inset-8"
          : "bottom-4 right-4 w-[400px] h-[500px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {context.pageType !== "general" && (
                <Badge variant="secondary" className="text-xs mr-2">
                  {context.pageType}
                </Badge>
              )}
              {formatShortcut("mod+j")} to toggle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowContext(!showContext)}
            title="Show context"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", showContext && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={close}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="font-semibold mb-2">How can I help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  I can help you with tasks on this page, answer questions, and take actions.
                </p>

                {/* Quick Actions */}
                <AIQuickActions actions={quickActions} />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-2",
                        message.role === "user"
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Quick Actions when there are messages */}
          {messages.length > 0 && quickActions.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
              <AIQuickActions actions={quickActions} compact />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {messages.length > 0 && (
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-xs text-muted-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Context Panel */}
        {showContext && (
          <div className="w-64 border-l border-slate-200 dark:border-slate-700 overflow-hidden">
            <AIContextPanel context={context} />
          </div>
        )}
      </div>
    </div>
  );
}
