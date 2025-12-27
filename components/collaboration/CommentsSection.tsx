"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  User,
  AtSign,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  annotationType: "comment" | "highlight" | "action_item" | "reply";
  content: string;
  textSelection?: string;
  positionStart?: number;
  positionEnd?: number;
  parentId?: string;
  isResolved: boolean;
  resolvedAt?: string;
  mentionedUsers: string[];
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Annotation[];
}

interface CommentsSectionProps {
  documentId: string;
  className?: string;
  initialSelection?: { text: string; start: number; end: number };
  onAnnotationClick?: (annotation: Annotation) => void;
}

export function CommentsSection({
  documentId,
  className,
  initialSelection,
  onAnnotationClick,
}: CommentsSectionProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchAnnotations();
    getCurrentUser();
  }, [documentId]);

  useEffect(() => {
    if (initialSelection?.text) {
      setNewComment(`Re: "${initialSelection.text.substring(0, 50)}..."\n\n`);
      inputRef.current?.focus();
    }
  }, [initialSelection]);

  const getCurrentUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchAnnotations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/library/annotations?documentId=${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error("Error fetching annotations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/library/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          annotationType: "comment",
          content: newComment.trim(),
          textSelection: initialSelection?.text,
          positionStart: initialSelection?.start,
          positionEnd: initialSelection?.end,
        }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchAnnotations();
        toast.success("Comment added");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/library/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          annotationType: "reply",
          content: replyContent.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        await fetchAnnotations();
        toast.success("Reply added");
      } else {
        toast.error("Failed to add reply");
      }
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResolved = async (annotationId: string, isResolved: boolean) => {
    try {
      const response = await fetch(`/api/library/annotations/${annotationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !isResolved }),
      });

      if (response.ok) {
        await fetchAnnotations();
        toast.success(isResolved ? "Reopened" : "Resolved");
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(`/api/library/annotations/${annotationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAnnotations();
        toast.success("Deleted");
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // Group annotations - top level and replies
  const topLevelAnnotations = annotations.filter(a => !a.parentId);
  const unresolvedCount = topLevelAnnotations.filter(a => !a.isResolved).length;
  const resolvedCount = topLevelAnnotations.filter(a => a.isResolved).length;

  const visibleAnnotations = showResolved
    ? topLevelAnnotations
    : topLevelAnnotations.filter(a => !a.isResolved);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Comments
            </h3>
            {unresolvedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium">
                {unresolvedCount}
              </span>
            )}
          </div>
          {resolvedCount > 0 && (
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
            >
              {showResolved ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide resolved ({resolvedCount})
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show resolved ({resolvedCount})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : visibleAnnotations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No comments yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Be the first to add a comment
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {visibleAnnotations.map((annotation) => (
              <motion.div
                key={annotation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  annotation.isResolved
                    ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-700"
                )}
              >
                {/* Quoted text */}
                {annotation.textSelection && (
                  <div className="mb-3 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400">
                    <p className="text-xs text-amber-700 dark:text-amber-300 italic line-clamp-2">
                      "{annotation.textSelection}"
                    </p>
                  </div>
                )}

                {/* Author and time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                      {annotation.userAvatar ? (
                        <img
                          src={annotation.userAvatar}
                          alt={annotation.userName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        annotation.userName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {annotation.userName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(annotation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Resolve button */}
                    <button
                      onClick={() => toggleResolved(annotation.id, annotation.isResolved)}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        annotation.isResolved
                          ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30"
                          : "text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                      title={annotation.isResolved ? "Reopen" : "Resolve"}
                    >
                      {annotation.isResolved ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    {/* More options */}
                    {currentUserId === annotation.userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteAnnotation(annotation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Comment content */}
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {annotation.content}
                </p>

                {/* Replies */}
                {annotation.replies && annotation.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-600 space-y-3">
                    {annotation.replies.map((reply) => (
                      <div key={reply.id} className="pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-5 w-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-medium text-white">
                            {reply.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {reply.userName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply button */}
                {!annotation.isResolved && (
                  <div className="mt-3">
                    {replyingTo === annotation.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="min-h-[60px] text-sm resize-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => submitReply(annotation.id)}
                            disabled={!replyContent.trim() || isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(annotation.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* New Comment Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Textarea
          ref={inputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <button className="text-xs text-slate-500 hover:text-violet-600 flex items-center gap-1">
            <AtSign className="h-3.5 w-3.5" />
            Mention
          </button>
          <Button
            onClick={submitComment}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
