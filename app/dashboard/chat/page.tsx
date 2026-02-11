"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ChatLayout,
  ChatHeader,
  ChatMessages,
  EmptyState,
  SmartSuggestions,
  Advisor,
  Message,
  FileAttachment,
  ToolActivity,
  DEFAULT_ADVISOR,
} from "@/components/chat";
import { ChatInput, MentionedContact } from "./components/ChatInput";
import { VoiceConversation } from "@/components/voice-conversation-fallback";
import { createClient } from "@/lib/supabase/client";
import PromptCommandPalette from "@/components/chat/PromptCommandPalette";
import PromptLibrary from "@/components/chat/PromptLibrary";
import { type PromptTemplate } from "@/lib/prompts/templates";

export default function ChatPage() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<any[]>([]);

  // Advisor & model state
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor>(DEFAULT_ADVISOR);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [currentModel, setCurrentModel] = useState<{
    name: string;
    reason: string;
    model: string;
  } | null>(null);
  const [ragInfo, setRagInfo] = useState<{
    used: boolean;
    documentsCount: number;
  } | null>(null);

  // UI state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [userName, setUserName] = useState<string>();

  // Prompt dialogs state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations and user info on mount
  useEffect(() => {
    fetchConversations();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      if (profile?.first_name) {
        setUserName(profile.first_name);
      }
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setConversationId(id);
        setMessages(
          data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            id: m.id,
          }))
        );
      }
    } catch (error) {
      toast.error("Failed to load conversation");
    }
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setRagInfo(null);
    setCurrentModel(null);
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // Handle selecting a prompt from command palette or library
  const handleSelectPrompt = (template: PromptTemplate) => {
    setInput(template.prompt);
    textareaRef.current?.focus();
  };

  // Keyboard shortcut for command palette (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent,
    mentionedContacts?: MentionedContact[]
  ) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input || "Sent files",
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentAttachments = [...attachments];
    const mentionedContactIds = mentionedContacts?.map((c) => c.id) || [];

    setInput("");
    setAttachments([]);
    setIsLoading(true);
    setShowThinking(true);
    setRagInfo(null);

    try {
      // Process attachments to base64
      const processedAttachments = await Promise.all(
        currentAttachments.map(async (att) => {
          return new Promise<{
            name: string;
            type: string;
            data: string;
            mimeType: string;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: att.file.name,
                type: att.type,
                data: reader.result as string,
                mimeType: att.file.type,
              });
            };
            reader.readAsDataURL(att.file);
          });
        })
      );

      // Add advisor context if not default
      const messageWithContext =
        currentAdvisor.id !== "general" && currentAdvisor.systemPrompt
          ? `[Advisor: ${currentAdvisor.name}]\n[Context: ${currentAdvisor.systemPrompt}]\n\n${currentInput}`
          : currentInput;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: messageWithContext },
          ],
          model: selectedModel,
          conversationId,
          attachments:
            processedAttachments.length > 0 ? processedAttachments : undefined,
          mentionedContactIds:
            mentionedContactIds.length > 0 ? mentionedContactIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setShowThinking(false);

      while (true) {
        const { done, value } = (await reader?.read()) || {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.modelUsed) setCurrentModel(data.modelUsed);
            if (data.ragUsed)
              setRagInfo({ used: true, documentsCount: data.documentsCount || 0 });
            if (data.conversationId && !conversationId) {
              setConversationId(data.conversationId);
              fetchConversations(); // Refresh list
            }
            if (data.messageId) {
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  id: data.messageId,
                };
                return newMessages;
              });
            }

            if (data.tool_status) {
              const match = data.tool_status.match(/^Calling (\S+)/);
              if (match) {
                const toolName = match[1].replace(/\.{3}$/, "");
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const last = newMessages[newMessages.length - 1];
                  const existing = last.toolActivity || [];
                  newMessages[newMessages.length - 1] = {
                    ...last,
                    toolActivity: [
                      ...existing,
                      { name: toolName, status: "running" },
                    ],
                  };
                  return newMessages;
                });
              }
            }

            if (data.tool_result) {
              const { name, result } = data.tool_result as {
                name: string;
                result?: string;
              };
              setMessages((prev) => {
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];
                const activities = (last.toolActivity || []).map((a) =>
                  a.name === name && a.status === "running"
                    ? {
                        ...a,
                        status: (result?.startsWith("Error:")
                          ? "error"
                          : "complete") as ToolActivity["status"],
                        result,
                      }
                    : a
                );
                newMessages[newMessages.length - 1] = {
                  ...last,
                  toolActivity: activities,
                };
                return newMessages;
              });
            }

            if (data.content) {
              assistantMessage += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                  id: newMessages[newMessages.length - 1].id,
                  toolActivity: newMessages[newMessages.length - 1].toolActivity,
                };
                return newMessages;
              });
            }
          } catch (err) {
            // Skip parse errors
          }
        }
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.message || "Unknown error"}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error?.message || "Something went wrong"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setShowThinking(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, helpful }),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, feedback: helpful ? "helpful" : "not_helpful" }
            : m
        )
      );

      toast.success(helpful ? "Thanks for the feedback!" : "Thanks, we'll improve!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  // File handling
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: FileAttachment[] = Array.from(files).map((file) => ({
      file,
      type: file.type.startsWith("image/") ? "image" : "document",
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Voice mode
  if (isVoiceMode) {
    return (
      <VoiceConversation
        onClose={() => setIsVoiceMode(false)}
      />
    );
  }

  return (
    <ChatLayout
      conversations={conversations}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      currentConversationId={conversationId}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <ChatHeader
          currentAdvisor={currentAdvisor}
          onAdvisorChange={setCurrentAdvisor}
          onVoiceToggle={() => setIsVoiceMode(true)}
          isVoiceMode={isVoiceMode}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          currentModel={currentModel}
          ragInfo={ragInfo}
        />

        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          <EmptyState
            onSuggestionClick={handleSuggestionClick}
            userName={userName}
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            showThinking={showThinking}
            onFeedback={handleFeedback}
          />
        )}

        {/* Smart Suggestions (shown when messages exist) */}
        {messages.length > 0 && !isLoading && (
          <SmartSuggestions onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Input */}
        <ChatInput
          input={input}
          onInputChange={setInput}
          attachments={attachments}
          isDragging={isDragging}
          isLoading={isLoading}
          isRecording={false}
          textareaRef={textareaRef as any}
          fileInputRef={fileInputRef as any}
          onSubmit={handleSubmit}
          onFileSelect={handleFileSelect}
          onRemoveAttachment={handleRemoveAttachment}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenPromptLibrary={() => setShowPromptLibrary(true)}
          onToggleQuickActions={() => setShowCommandPalette(true)}
        />
      </div>

      {/* Prompt Command Palette */}
      <PromptCommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onSelectPrompt={handleSelectPrompt}
      />

      {/* Prompt Library */}
      <PromptLibrary
        open={showPromptLibrary}
        onOpenChange={setShowPromptLibrary}
        onSelectPrompt={handleSelectPrompt}
      />
    </ChatLayout>
  );
}
