"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Loader2, Sparkles, Library, Command, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import PromptCommandPalette from "@/components/chat/PromptCommandPalette";
import PromptLibrary from "@/components/chat/PromptLibrary";
import QuickActionsToolbar from "@/components/chat/QuickActionsToolbar";
import { type PromptTemplate } from "@/lib/prompts/templates";

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

export default function ChatV2Page() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prompt menu state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Command Palette keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle prompt template selection
  const handlePromptSelect = (template: PromptTemplate) => {
    let promptText = template.prompt;

    // Fill in variables if present
    if (template.variables && template.variables.length > 0) {
      // For now, just insert placeholders
      template.variables.forEach((variable) => {
        promptText = promptText.replace(`{${variable}}`, `[${variable.toUpperCase()}]`);
      });
    }

    setInput(promptText);
    textareaRef.current?.focus();
  };

  // Handle quick action
  const handleQuickAction = (actionId: string, prompt: string) => {
    setInput(prompt);
    setQuickActionsVisible(false);
    textareaRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = "";
      let newConversationId = conversationId;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

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

              if (parsed.conversationId) {
                newConversationId = parsed.conversationId;
                setConversationId(parsed.conversationId);
              }

              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please log in to use chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-semibold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Ask anything, attach documents, get intelligent responses
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Start a conversation</h2>
                <p className="mt-2 text-muted-foreground">
                  Ask questions, upload documents, or get help with anything
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "assistant" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="mx-auto max-w-3xl">
          {/* Prompt Menu Buttons */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="gap-2"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Prompts</span>
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromptLibraryOpen(true)}
              className="gap-2"
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Browse Library</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickActionsVisible(!quickActionsVisible)}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Actions</span>
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span className="hidden md:inline">AI-Powered Prompts</span>
            </div>
          </div>

          <div className="flex items-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="mb-2"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI... (or use prompts above)"
                className="min-h-[60px] max-h-[200px] resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="mb-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift + Enter for new line, ⌘K for prompts
          </p>
        </div>
      </div>

      {/* Prompt Menu Components */}
      <PromptCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectPrompt={handlePromptSelect}
      />

      <PromptLibrary
        open={promptLibraryOpen}
        onOpenChange={setPromptLibraryOpen}
        onSelectPrompt={handlePromptSelect}
      />

      <QuickActionsToolbar
        visible={quickActionsVisible}
        onAction={handleQuickAction}
        selectedText={selectedText}
      />
    </div>
  );
}
