"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Assistant {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  tone: string;
}

interface Conversation {
  id: string;
  title: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  rating?: number;
}

export default function AssistantChatPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantId) {
      fetchAssistantAndChat();
    }
  }, [assistantId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchAssistantAndChat() {
    try {
      // Fetch assistant details
      const assistantResponse = await fetch(`/api/assistants/${assistantId}`);
      if (assistantResponse.ok) {
        const data = await assistantResponse.json();
        setAssistant(data.assistant);
      }

      // Fetch or create conversation
      const convResponse = await fetch(
        `/api/assistants/${assistantId}/conversations`
      );
      if (convResponse.ok) {
        const data = await convResponse.json();
        if (data.conversations && data.conversations.length > 0) {
          const activeConv = data.conversations[0];
          setConversation(activeConv);
          await fetchMessages(activeConv.id);
        } else {
          await createNewConversation();
        }
      }
    } catch (error) {
      console.error("Error fetching assistant:", error);
      toast.error("Failed to load assistant");
    } finally {
      setLoading(false);
    }
  }

  async function createNewConversation() {
    try {
      const response = await fetch(`/api/assistants/${assistantId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New conversation" }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const response = await fetch(
        `/api/assistants/conversations/${conversationId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function sendMessage() {
    if (!inputMessage.trim() || !conversation || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch(
        `/api/assistants/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: userMessage }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Replace temp message with real ones
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage,
        ]);
      } else {
        toast.error("Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      }
    } catch (error) {
      toast.error("An error occurred");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  async function rateMessage(messageId: string, rating: number) {
    try {
      const response = await fetch(`/api/assistants/messages/${messageId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, rating } : m))
        );
        toast.success("Feedback submitted");
      }
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Assistant not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/dashboard/assistants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assistants
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{assistant.avatar_emoji}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{assistant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {assistant.description}
            </p>
          </div>
          <Badge variant="outline">{assistant.role.replace("_", " ")}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-8">
            <p className="text-lg mb-2">Start a conversation with {assistant.name}</p>
            <p className="text-sm">Ask anything related to {assistant.role.replace("_", " ")}</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="text-3xl flex-shrink-0">{assistant.avatar_emoji}</div>
            )}

            <Card
              className={`max-w-[80%] p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {message.role === "assistant" && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground mr-2">
                    Rate this response:
                  </span>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => rateMessage(message.id, rating)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-3 w-3 ${
                          message.rating && message.rating >= rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-2">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </Card>

            {message.role === "user" && (
              <div className="text-3xl flex-shrink-0">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="text-3xl flex-shrink-0">{assistant.avatar_emoji}</div>
            <Card className="p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${assistant.name}...`}
            className="resize-none"
            rows={3}
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || sending}
            size="icon"
            className="h-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
