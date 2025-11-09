"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Loader2,
  MoreVertical,
  Users,
  Settings,
  Archive,
  Trash2,
  Tag,
  Lock,
  Globe,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  is_edited: boolean;
  user_name?: string;
  user_email?: string;
}

interface Conversation {
  id: string;
  title: string;
  description: string | null;
  context_type: string;
  is_private: boolean;
  is_archived: boolean;
  tags: string[] | null;
  created_at: string;
  created_by: string;
}

interface Participant {
  id: string;
  user_id: string;
  role: string;
  can_send_messages: boolean;
  user_name?: string;
  user_email?: string;
}

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSendMessages, setCanSendMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user && conversationId) {
      loadConversation();
      loadMessages();
      loadParticipants();
    }
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "36px";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shared_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("conversation_messages")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            email
          )
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        user_id: msg.user_id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        is_edited: msg.is_edited,
        user_name: msg.profiles?.full_name,
        user_email: msg.profiles?.email,
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("conversation_participants")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            email
          )
        `
        )
        .eq("conversation_id", conversationId);

      if (error) throw error;

      const formattedParticipants = data.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        role: p.role,
        can_send_messages: p.can_send_messages,
        user_name: p.profiles?.full_name,
        user_email: p.profiles?.email,
      }));

      setParticipants(formattedParticipants);

      // Check if current user can send messages
      const currentUserParticipant = formattedParticipants.find(
        (p) => p.user_id === user?.id
      );
      setCanSendMessages(currentUserParticipant?.can_send_messages || false);
    } catch (error: any) {
      console.error("Error loading participants:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !canSendMessages) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    try {
      const supabase = createClient();

      // Add user message to database
      const { data: userMsg, error: userError } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          user_id: user?.id,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Reload messages to show user message
      await loadMessages();

      // Update last_message_at
      await supabase
        .from("shared_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Get AI response
      const response = await fetch("/api/team-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Create placeholder for assistant message
      const { data: assistantMsg, error: assistantError } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          user_id: null,
          role: "assistant",
          content: "",
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      // Stream the response
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;

                // Update assistant message in database
                await supabase
                  .from("conversation_messages")
                  .update({ content: assistantMessage })
                  .eq("id", assistantMsg.id);

                // Reload messages to show streaming response
                await loadMessages();
              }
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          }
        }
      }

      // Final reload
      await loadMessages();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleArchive = async () => {
    try {
      const supabase = createClient();
      await supabase
        .from("shared_conversations")
        .update({ is_archived: !conversation?.is_archived })
        .eq("id", conversationId);

      toast.success(
        conversation?.is_archived ? "Conversation restored" : "Conversation archived"
      );
      router.push("/dashboard/team/conversations");
    } catch (error) {
      toast.error("Failed to archive conversation");
    }
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700 dark:text-slate-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">
          Please log in to view this conversation.
        </p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/team/conversations")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {conversation.title}
                </h1>
                {conversation.is_private && (
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                )}
                {conversation.is_archived && (
                  <Badge variant="secondary" className="text-xs">
                    Archived
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {conversation.description || "No description"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {participants.length}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Participants
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  {conversation.is_archived ? "Restore" : "Archive"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {conversation.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs text-slate-600 dark:text-slate-400"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center py-12">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
                <Send className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Start the conversation
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Send a message to begin collaborating with your team and AI
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role !== "user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-4 py-3",
                      message.role === "user"
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {message.role === "user" && message.user_name && (
                      <div className="mb-1 text-xs font-medium opacity-75">
                        {message.user_name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </p>
                    <div
                      className={cn(
                        "mt-1 text-xs opacity-60",
                        message.role === "user"
                          ? "text-white dark:text-slate-900"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {getUserInitials(message.user_name, message.user_email)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="mx-auto max-w-4xl">
          {canSendMessages ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[60px] max-h-[200px] resize-none"
                  disabled={sending}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                size="icon"
                className="mb-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You don't have permission to send messages in this conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
