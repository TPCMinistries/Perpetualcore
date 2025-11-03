"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  ThumbsUp,
  Heart,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeComments } from "@/hooks/useRealtimeSubscription";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  mentioned_user_ids: string[];
  parent_comment_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
  reactions: Record<string, string[]>;
  replies?: Comment[];
}

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface CommentsSectionProps {
  entityType: string;
  entityId: string;
}

export function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
    fetchUsers();
  }, [entityType, entityId]);

  // Real-time subscription for live comment updates
  useRealtimeComments({
    entityType,
    entityId,
    onNewComment: (comment) => {
      // Fetch fresh comments to get user info
      fetchComments();
      toast.success("New comment added");
    },
    onCommentUpdated: () => {
      fetchComments();
    },
    onCommentDeleted: () => {
      fetchComments();
    },
  });

  async function fetchComments() {
    try {
      const response = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(organizeComments(data.comments || []));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  function organizeComments(allComments: Comment[]): Comment[] {
    const topLevel = allComments.filter(c => !c.parent_comment_id);
    const replies = allComments.filter(c => c.parent_comment_id);

    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_comment_id === comment.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async function handleSubmit(parentId: string | null = null) {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      // Extract mentioned user IDs from @[Name](uuid) format
      const mentionedIds = extractMentionedUsers(newComment);

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          content: newComment,
          parentCommentId: parentId,
          mentionedUserIds: mentionedIds,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setReplyingTo(null);
        toast.success("Comment posted");
        fetchComments();
      } else {
        toast.error("Failed to post comment");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function extractMentionedUsers(text: string): string[] {
    const mentionPattern = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
    const matches = text.matchAll(mentionPattern);
    return Array.from(matches).map(match => match[2]);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Comment deleted");
        fetchComments();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function handleReaction(commentId: string, emoji: string) {
    try {
      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  }

  function handleMention(user: User) {
    const mentionText = `@[${user.full_name}](${user.id})`;
    const beforeCursor = newComment.slice(0, cursorPosition);
    const afterCursor = newComment.slice(cursorPosition);

    // Replace the @mention search with the full mention
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const newText = beforeCursor.slice(0, lastAtIndex) + mentionText + " " + afterCursor;

    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch("");
    textareaRef.current?.focus();
  }

  function handleTextChange(text: string) {
    setNewComment(text);

    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0;
    setCursorPosition(cursorPos);

    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ")) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      if (!searchText.includes(" ")) {
        setMentionSearch(searchText.toLowerCase());
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(mentionSearch) ||
    user.email.toLowerCase().includes(mentionSearch)
  ).slice(0, 5);

  function renderComment(comment: Comment, isReply: boolean = false) {
    return (
      <div key={comment.id} className={isReply ? "ml-12 mt-2" : "mt-4"}>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {comment.user.full_name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-accent rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{comment.user.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  {comment.is_edited && " (edited)"}
                </span>
              </div>

              <div className="text-sm whitespace-pre-wrap break-words">
                {renderCommentContent(comment.content)}
              </div>

              {/* Reactions */}
              {Object.keys(comment.reactions || {}).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(comment.id, emoji)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background rounded-full hover:bg-accent transition-colors"
                    >
                      <span>{emoji}</span>
                      <span className="text-muted-foreground">{userIds.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-1 text-xs">
              <button
                onClick={() => handleReaction(comment.id, "👍")}
                className="text-muted-foreground hover:text-primary"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleReaction(comment.id, "❤️")}
                className="text-muted-foreground hover:text-primary"
              >
                <Heart className="h-3 w-3" />
              </button>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Reply className="h-3 w-3 mr-1 inline" />
                  Reply
                </button>
              )}
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1 inline" />
                Delete
              </button>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Write a reply..."
                  className="resize-none"
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(comment.id)}
                    disabled={!newComment.trim() || submitting}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCommentContent(content: string) {
    // Render @mentions as highlighted text
    const mentionPattern = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <Badge key={match.index} variant="secondary" className="mx-1">
          @{match[1]}
        </Badge>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* New comment input */}
      <div className="mb-6 relative">
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Write a comment... (Use @ to mention someone)"
          className="resize-none"
          rows={3}
        />

        {/* Mention suggestions */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute z-10 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto w-full">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleMention(user)}
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
              >
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          className="mt-2"
          onClick={() => handleSubmit(null)}
          disabled={!newComment.trim() || submitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet</p>
          <p className="text-sm mt-1">Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </Card>
  );
}
