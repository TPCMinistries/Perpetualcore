"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Bot, User, FileText, Image as ImageIcon, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { MarkdownMessage } from "@/components/markdown-message";
import {
  PlanDelegationCard,
  parsePlanDelegation,
} from "@/components/chat/PlanDelegationCard";
import { Message, ModelInfo, RAGInfo } from "../hooks/useChat";

interface ChatMessagesProps {
  messages: Message[];
  currentModel: ModelInfo | null;
  ragInfo: RAGInfo | null;
  copiedMessageIndex: number | null;
  messagesEndRef: RefObject<HTMLDivElement>;
  onCopy: (text: string, index: number) => void;
  onFeedback: (messageId: string | undefined, helpful: boolean, index: number) => void;
}

export function ChatMessages({
  messages,
  currentModel,
  ragInfo,
  copiedMessageIndex,
  messagesEndRef,
  onCopy,
  onFeedback,
}: ChatMessagesProps) {
  return (
    <div className="space-y-6 py-6">
      {messages.map((message, index) => (
        <div key={index} className="group">
          <div className="flex gap-4 max-w-full">
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="h-7 w-7 rounded-md bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div className="relative flex-1 min-w-0">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {message.attachments.map((attachment, attIndex) => (
                      <div
                        key={attIndex}
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 rounded p-2"
                      >
                        {attachment.type === "image" && attachment.preview ? (
                          <img
                            src={attachment.preview}
                            alt={attachment.file.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : attachment.type === "image" ? (
                          <ImageIcon className="h-6 w-6" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                        <div className="text-xs">
                          <p className="font-medium truncate max-w-[120px]">
                            {attachment.file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {message.role === "assistant" ? (
                  <>
                    <MarkdownMessage content={message.content} />
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
                  <div className="whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100">
                    {message.content}
                  </div>
                )}
                {/* Model/RAG indicators */}
                {message.role === "assistant" && index === messages.length - 1 && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    {currentModel && (
                      <span className="inline-flex items-center gap-1">
                        {currentModel.icon} {currentModel.name}
                      </span>
                    )}
                    {ragInfo && ragInfo.used && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {ragInfo.documentsCount} {ragInfo.documentsCount === 1 ? 'source' : 'sources'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {message.role === "assistant" && message.content && (
                <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Feedback buttons */}
                  {message.id && !message.feedback && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFeedback(message.id, true, index)}
                        className="h-6 w-6 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        title="This was helpful"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-slate-500 hover:text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFeedback(message.id, false, index)}
                        className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="This wasn't helpful"
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-slate-500 hover:text-red-600" />
                      </Button>
                    </>
                  )}
                  {/* Show feedback status if already given */}
                  {message.feedback && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {message.feedback === "helpful" ? "Thanks!" : "Noted"}
                    </span>
                  )}
                  {/* Copy button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(message.content, index)}
                    className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Copy to clipboard"
                  >
                    {copiedMessageIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
