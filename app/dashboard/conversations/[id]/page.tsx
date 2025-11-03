"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  ArrowLeft,
  Users,
  FileText,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  DollarSign,
  MoreVertical,
  BotOff,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { MarkdownMessage } from "@/components/markdown-message";
import { SharedConversationWithParticipants, ConversationMessageWithProfile } from "@/types";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<SharedConversationWithParticipants | null>(null);
  const [messages, setMessages] = useState<ConversationMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [documentContext, setDocumentContext] = useState<{title: string, content: string} | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
    loadAvailableDocuments();
  }, [conversationId]);

  useEffect(() => {
    if (conversation?.document_id) {
      loadDocument(conversation.document_id);
    }
  }, [conversation?.document_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadConversation() {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversation");
      }

      setConversation(data.conversation);
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error(error.message || "Failed to load conversation");
      router.push("/dashboard/conversations");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  }

  async function loadDocument(documentId: string) {
    try {
      const response = await fetch(`/api/documents/text/${documentId}`);
      const data = await response.json();

      if (response.ok && data.document) {
        setDocumentContext({
          title: data.document.title,
          content: data.document.content_text || data.document.content_html || ""
        });
      }
    } catch (error: any) {
      console.error("Error loading document:", error);
    }
  }

  async function loadAvailableDocuments() {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (response.ok) {
        setAvailableDocuments(data.documents || []);
      }
    } catch (error: any) {
      console.error("Error loading documents:", error);
    }
  }

  // Detect @document mentions in the message
  function detectDocumentMentions(text: string): string[] {
    // Match patterns like @document:title or @"Document Title"
    const mentionPattern = /@(?:document:([^\s]+)|"([^"]+)")/gi;
    const matches = [];
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      matches.push(match[1] || match[2]);
    }

    return matches;
  }

  // Fetch mentioned documents
  async function fetchMentionedDocuments(mentions: string[]): Promise<Array<{title: string, content: string}>> {
    const mentionedDocs = [];

    for (const mention of mentions) {
      // Find matching document (case-insensitive partial match)
      const doc = availableDocuments.find(d =>
        d.title.toLowerCase().includes(mention.toLowerCase())
      );

      if (doc) {
        try {
          const response = await fetch(`/api/documents/text/${doc.id}`);
          const data = await response.json();

          if (response.ok && data.document) {
            mentionedDocs.push({
              title: data.document.title,
              content: data.document.content_text || data.document.content_html || ""
            });
          }
        } catch (error) {
          console.error(`Error fetching document ${mention}:`, error);
        }
      }
    }

    return mentionedDocs;
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage("");
    setSending(true);

    try {
      // Check if message contains @AI or @Assistant mention
      const hasAIMention = /@(AI|ai|Assistant|assistant)\b/.test(messageText);

      // AI responds if: toggle is ON OR message has @mention
      const shouldTriggerAI = aiEnabled || hasAIMention;

      // Detect @document mentions
      const documentMentions = detectDocumentMentions(messageText);
      const mentionedDocs = documentMentions.length > 0
        ? await fetchMentionedDocuments(documentMentions)
        : [];

      // Show notification if documents were mentioned and found
      if (mentionedDocs.length > 0) {
        toast.info(`Including ${mentionedDocs.length} referenced document(s) in context`);
      } else if (documentMentions.length > 0) {
        toast.warning(`Could not find mentioned document(s): ${documentMentions.join(", ")}`);
      }

      // Build context with both primary document and mentioned documents
      let contextPayload = null;
      if (documentContext || mentionedDocs.length > 0) {
        const allDocuments = [];

        // Add primary linked document
        if (documentContext) {
          allDocuments.push({
            title: documentContext.title,
            content: documentContext.content,
            isPrimary: true
          });
        }

        // Add mentioned documents
        mentionedDocs.forEach(doc => {
          allDocuments.push({
            title: doc.title,
            content: doc.content,
            isPrimary: false
          });
        });

        // Combine all document content for AI
        const combinedContent = allDocuments.map(doc =>
          `Document: "${doc.title}"${doc.isPrimary ? " (primary)" : ""}\n\n${doc.content}`
        ).join("\n\n---\n\n");

        contextPayload = {
          document_title: allDocuments.map(d => d.title).join(", "),
          document_content: combinedContent
        };
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageText,
          skipAI: !shouldTriggerAI,
          context: contextPayload
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Reload messages to show both user message and AI response
      await loadMessages();
      toast.success("Message sent!");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    // Show date and time for older messages
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function calculateTotalCost() {
    return messages
      .filter(m => m.role === "assistant")
      .reduce((sum, m) => sum + (parseFloat(String(m.cost_usd || 0))), 0)
      .toFixed(4);
  }

  function calculateTotalTokens() {
    return messages
      .filter(m => m.role === "assistant")
      .reduce((sum, m) => sum + (m.tokens_used || 0), 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-background via-background to-indigo-500/5">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Link href="/dashboard/conversations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {conversation.title}
                </h1>
                {conversation.context_type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {conversation.context_type === "document" && <FileText className="h-3 w-3 mr-1" />}
                    {conversation.context_type}
                  </span>
                )}
                {documentContext && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    <FileText className="h-3 w-3 mr-1" />
                    Document linked: {documentContext.title}
                  </span>
                )}
              </div>
              {conversation.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {conversation.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{conversation.conversation_participants?.length || 0} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{messages.length} messages</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {conversation.conversation_participants?.slice(0, 5).map((participant: any) => (
                <div
                  key={participant.id}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold border-2 border-background"
                  title={participant.profiles?.full_name || participant.profiles?.email}
                >
                  {participant.profiles?.full_name?.[0]?.toUpperCase() ||
                   participant.profiles?.email?.[0]?.toUpperCase() ||
                   "?"}
                </div>
              ))}
              {(conversation.conversation_participants?.length || 0) > 5 && (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold border-2 border-background">
                  +{(conversation.conversation_participants?.length || 0) - 5}
                </div>
              )}
            </div>

            {/* AI Toggle Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiEnabled(!aiEnabled)}
                className={aiEnabled ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700" : ""}
              >
                {aiEnabled ? (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    AI On
                  </>
                ) : (
                  <>
                    <BotOff className="h-4 w-4 mr-2" />
                    AI Off
                  </>
                )}
              </Button>
              <div
                className="group relative"
                title="Click for AI assistant info"
              >
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="invisible group-hover:visible absolute right-0 top-6 w-72 bg-popover border border-border rounded-lg shadow-lg p-3 text-xs z-50">
                  <p className="font-semibold mb-2">AI Assistant Control</p>
                  <p className="mb-2">
                    <strong>ON:</strong> AI responds to every message
                  </p>
                  <p className="mb-2">
                    <strong>OFF:</strong> Team chat only. Use @AI or @Assistant to invoke AI for specific messages
                  </p>
                  <p className="text-muted-foreground">
                    Perfect for switching between team discussions and AI-assisted work
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start the conversation</h3>
              <p className="text-muted-foreground">
                Send your first message to begin collaborating with your team and AI assistant
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "assistant" ? "bg-indigo-50/50 dark:bg-indigo-950/20 -mx-6 px-6 py-4" : ""
                }`}
              >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.role === "assistant" ? (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold">
                    {message.profiles?.full_name?.[0]?.toUpperCase() ||
                     message.profiles?.email?.[0]?.toUpperCase() ||
                     "U"}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {message.role === "assistant"
                      ? "AI Assistant"
                      : message.profiles?.full_name || message.profiles?.email || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.created_at)}
                  </span>
                  {message.role === "assistant" && message.model_used && (
                    <span className="text-xs text-muted-foreground">
                      • {message.model_used}
                    </span>
                  )}
                </div>
                <div className="text-sm text-foreground">
                  {message.role === "assistant" ? (
                    <MarkdownMessage content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {message.role === "assistant" && (message.tokens_used || message.cost_usd) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {message.tokens_used && (
                      <span>
                        {message.tokens_used.toLocaleString()} tokens
                      </span>
                    )}
                    {message.cost_usd && (
                      <span>
                        ${parseFloat(String(message.cost_usd)).toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            ))}

            {/* Typing Indicator */}
            {sending && (
              <div className="flex gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 -mx-6 px-6 py-4 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">AI Assistant</span>
                    <span className="text-xs text-muted-foreground">thinking...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-xl px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              aiEnabled
                ? 'Type your message... Reference docs with @"Document Title" (Shift+Enter for new line)'
                : 'Type your message... Use @AI to invoke assistant, @"Document Title" to reference docs'
            }
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white self-end"
            size="lg"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          {aiEnabled ? (
            <>AI responds to all messages with full conversation context{" "}{conversation.document_id && "and linked document content"}</>
          ) : (
            <>AI is off. Use @AI or @Assistant in your message to invoke the assistant</>
          )}
        </p>
      </div>
    </div>
  );
}
