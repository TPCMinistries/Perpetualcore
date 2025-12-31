"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const quickActions = getQuickActions();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col",
              isExpanded
                ? "inset-4 md:inset-8"
                : "bottom-4 right-4 w-[420px] h-[520px] max-h-[80vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-semibold">AI Assistant</h2>
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
                  <motion.div
                    animate={{ rotate: showContext ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
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
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="h-full flex flex-col items-center justify-center text-center px-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                        className="h-16 w-16 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-4"
                      >
                        <Sparkles className="h-8 w-8 text-violet-500" />
                      </motion.div>
                      <h3 className="font-semibold mb-2">How can I help?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        I can help you with tasks on this page, answer questions, and take actions.
                      </p>

                      {/* Quick Actions */}
                      <AIQuickActions actions={quickActions} />
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "flex",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5",
                                message.role === "user"
                                  ? "bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 text-white dark:text-slate-900 rounded-br-md"
                                  : "bg-slate-100 dark:bg-slate-800 rounded-bl-md"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-slate-400 rounded-full"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Quick Actions when there are messages */}
                <AnimatePresence>
                  {messages.length > 0 && quickActions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-2 border-t border-slate-100 dark:border-slate-800"
                    >
                      <AIQuickActions actions={quickActions} compact />
                    </motion.div>
                  )}
                </AnimatePresence>

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
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {messages.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-end mt-2"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Context Panel */}
              <AnimatePresence>
                {showContext && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 256, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-l border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <AIContextPanel context={context} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
