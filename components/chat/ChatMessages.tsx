"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Image,
  FileText,
} from "lucide-react";
import { Message } from "./types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  PlanDelegationCard,
  parsePlanDelegation,
} from "./PlanDelegationCard";
import { ToolCallIndicator } from "./ToolCallIndicator";
import { A2UIBlockRenderer } from "./a2ui/A2UIBlock";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  showThinking: boolean;
  onFeedback: (messageId: string, helpful: boolean) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  showThinking,
  onFeedback,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showThinking]);

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {/* Assistant Avatar */}
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Message Content */}
              <div
                className={cn(
                  "group relative max-w-[85%]",
                  message.role === "user" ? "order-first" : ""
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary via-purple-600 to-purple-700 text-white"
                      : "bg-card/80 backdrop-blur-sm border border-border/50 text-foreground"
                  )}
                >
                  {message.toolActivity && message.toolActivity.length > 0 && (
                    <ToolCallIndicator activities={message.toolActivity} />
                  )}
                  {message.role === "assistant" ? (
                    <>
                      <MarkdownMessage content={message.content} />
                      {message.blocks && message.blocks.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.blocks.map((block) => (
                            <A2UIBlockRenderer key={block.id} block={block} />
                          ))}
                        </div>
                      )}
                      {(() => {
                        const delegation = parsePlanDelegation(message.content);
                        if (!delegation) return null;
                        return (
                          <PlanDelegationCard
                            planId={delegation.planId}
                            goal={delegation.goal}
                            stepCount={delegation.stepCount}
                          />
                        );
                      })()}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}

                  {/* Attachments Preview */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((att, attIdx) => (
                        <div
                          key={attIdx}
                          className="flex items-center gap-1.5 text-xs bg-background/20 border border-border/30 rounded px-2 py-1"
                        >
                          {att.type === "image" ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span className="truncate max-w-[100px]">
                            {att.file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions (visible on hover for assistant messages) */}
                {message.role === "assistant" && (
                  <div className="absolute -bottom-6 left-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-1 py-0.5 shadow-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(message.content, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </Button>

                    {message.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            message.feedback === "helpful" &&
                              "text-green-500 bg-green-50 dark:bg-green-950/30"
                          )}
                          onClick={() => onFeedback(message.id!, true)}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            message.feedback === "not_helpful" &&
                              "text-red-500 bg-red-50 dark:bg-red-950/30"
                          )}
                          onClick={() => onFeedback(message.id!, false)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Thinking Indicator */}
          {showThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground ml-1">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
