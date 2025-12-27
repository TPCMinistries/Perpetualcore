"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Wand2,
  Copy,
  Check,
  X,
  Download,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Parse platform suggestions from AI response
function parsePlatformSuggestions(content: string): Array<{ platform: string; content: string }> {
  const suggestions: Array<{ platform: string; content: string }> = [];

  // Match patterns like **[Twitter]** or 1. **[Twitter]** followed by content
  const patterns = [
    /\*\*\[?(Twitter|LinkedIn|Instagram|Facebook|YouTube)\]?\*\*[:\s]*\n?([\s\S]*?)(?=\n\n\d+\.\s*\*\*|\n\n\*\*\[?(?:Twitter|LinkedIn|Instagram|Facebook|YouTube)|\n\nLet me know|$)/gi,
    /\d+\.\s*\*\*\[?(Twitter|LinkedIn|Instagram|Facebook|YouTube)\]?\*\*[:\s]*\n?([\s\S]*?)(?=\n\n\d+\.\s*\*\*|\n\nLet me know|$)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const platform = match[1].toLowerCase();
      let suggestionContent = match[2].trim();

      // Clean up the content - remove leading emoji if present
      suggestionContent = suggestionContent.replace(/^[🚀🌟🎉💡✨⭐️📱💫🔥]+\s*/, '');

      // Skip if empty or too short
      if (suggestionContent.length > 10) {
        suggestions.push({ platform, content: suggestionContent });
      }
    }
  }

  return suggestions;
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "twitter":
      return <Twitter className="h-3 w-3" />;
    case "linkedin":
      return <Linkedin className="h-3 w-3" />;
    case "instagram":
      return <Instagram className="h-3 w-3" />;
    case "facebook":
      return <Facebook className="h-3 w-3" />;
    case "youtube":
      return <Youtube className="h-3 w-3" />;
    default:
      return null;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: Array<{ platform: string; content: string }>;
}

interface AICompanionProps {
  taskTitle: string;
  taskDescription?: string;
  deliverables?: Array<{
    id: string;
    platform?: string | null;
    content: string;
  }>;
  onApplySuggestion?: (deliverableId: string, newContent: string) => void;
}

export function AICompanion({
  taskTitle,
  taskDescription,
  deliverables = [],
  onApplySuggestion,
}: AICompanionProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm here to help you with "${taskTitle}". I can help you:\n\n• Refine your content for different platforms\n• Suggest improvements or variations\n• Answer questions about best practices\n• Help you brainstorm ideas\n\nHow can I help you today?`,
        },
      ]);
    }
  }, [open, taskTitle, messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Build context about the task and deliverables
      const deliverableContext = deliverables.length > 0
        ? `\n\nCurrent deliverables:\n${deliverables.map((d, i) =>
            `${i + 1}. ${d.platform ? `[${d.platform}] ` : ""}${d.content.substring(0, 200)}${d.content.length > 200 ? "..." : ""}`
          ).join("\n")}`
        : "";

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a helpful AI assistant helping with a task titled "${taskTitle}".${taskDescription ? ` Task description: ${taskDescription}` : ""}${deliverableContext}

Your role is to:
- Help refine and improve content
- Suggest platform-specific optimizations
- Provide creative alternatives
- Answer questions about best practices

When suggesting content changes, format them clearly so the user can easily copy them. Be concise and helpful.`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiContent = data.response || data.message;
        const suggestions = parsePlatformSuggestions(aiContent);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiContent, suggestions },
        ]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const quickPrompts = [
    { label: "Make it shorter", prompt: "Make the content more concise while keeping the key message" },
    { label: "More engaging", prompt: "Make the content more engaging and attention-grabbing" },
    { label: "Add emojis", prompt: "Add relevant emojis to make the content more visually appealing" },
    { label: "Different angle", prompt: "Suggest a different angle or approach for this content" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            AI Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 relative group",
                  message.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && (
                  <button
                    onClick={() => copyToClipboard(message.content, index)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                )}
                {/* Apply buttons for AI suggestions */}
                {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Apply to deliverables:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, sugIndex) => {
                        const matchingDeliverable = deliverables.find(
                          (d) => d.platform?.toLowerCase() === suggestion.platform.toLowerCase()
                        );
                        if (!matchingDeliverable) return null;
                        return (
                          <button
                            key={sugIndex}
                            onClick={() => {
                              if (onApplySuggestion) {
                                onApplySuggestion(matchingDeliverable.id, suggestion.content);
                                toast.success(`Applied to ${suggestion.platform}!`);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                          >
                            {getPlatformIcon(suggestion.platform)}
                            Apply to {suggestion.platform.charAt(0).toUpperCase() + suggestion.platform.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => {
                    setInput(qp.prompt);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <Wand2 className="h-3 w-3 inline mr-1" />
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask for help with your content..."
              className="min-h-[44px] max-h-[120px] resize-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 px-3"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
