"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AIModel } from "@/types";
import { DEFAULT_MODEL } from "@/lib/ai/config";

export interface FileAttachment {
  file: File;
  type: "document" | "image";
  preview?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  id?: string;
  feedback?: "helpful" | "not_helpful" | null;
}

export interface ModelInfo {
  name: string;
  reason: string;
  model: string;
  icon?: string;
}

export interface RAGInfo {
  used: boolean;
  documentsCount: number;
}

export interface LibraryStats {
  docCount: number;
  spacesCount: number;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [ragInfo, setRagInfo] = useState<RAGInfo | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [exportingAs, setExportingAs] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch library stats
  useEffect(() => {
    async function fetchLibraryStats() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (!profile?.organization_id) return;

        const [docs, spaces] = await Promise.all([
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", profile.organization_id)
            .eq("status", "completed"),
          supabase
            .from("knowledge_spaces")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", profile.organization_id)
            .eq("is_archived", false),
        ]);

        setLibraryStats({
          docCount: docs.count || 0,
          spacesCount: spaces.count || 0,
        });
      } catch (error) {
        // Silent fail
      }
    }

    fetchLibraryStats();
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const isImage = file.type.startsWith("image/");
      const isDocument = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
      ].includes(file.type);

      if (!isImage && !isDocument) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      let preview: string | undefined;
      if (isImage) {
        preview = URL.createObjectURL(file);
      }

      newAttachments.push({
        file,
        type: isImage ? "image" : "document",
        preview,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
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

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          }))
        );
        setConversationId(id);
      } else {
        throw new Error("Failed to fetch conversation");
      }
    } catch (error) {
      toast.error("Failed to load conversation");
    }
  };

  const handleConversationSelect = (id: string | undefined) => {
    if (id) {
      loadConversation(id);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput("");
    setAttachments([]);
    setCurrentModel(null);
    setRagInfo(null);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const submitFeedback = async (messageId: string | undefined, helpful: boolean, index: number) => {
    if (!messageId) {
      toast.error("Cannot submit feedback for this message");
      return;
    }

    try {
      const response = await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, helpful }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          feedback: helpful ? "helpful" : "not_helpful",
        };
        return updated;
      });

      toast.success(helpful ? "Thanks for the feedback!" : "Thanks, we'll improve!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const exportConversation = async (type: "powerpoint" | "pdf" | "excel" | "word") => {
    if (messages.length === 0) {
      toast.error("No conversation to export");
      return;
    }

    setExportingAs(type);

    try {
      let payload: any = {
        type,
        title: `AI Conversation - ${new Date().toLocaleDateString()}`,
      };

      if (type === "powerpoint") {
        payload.slides = messages.map((msg, idx) => ({
          title: msg.role === "user" ? `Question ${Math.floor(idx / 2) + 1}` : `Response ${Math.floor(idx / 2) + 1}`,
          content: [msg.content.substring(0, 500) + (msg.content.length > 500 ? "..." : "")]
        }));
      } else if (type === "pdf") {
        payload.content = messages
          .map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}`)
          .join("\n\n---\n\n");
      } else if (type === "excel") {
        payload.data = messages.map((msg, idx) => ({
          "#": idx + 1,
          Role: msg.role === "user" ? "User" : "Assistant",
          Message: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
          "Full Content": msg.content,
        }));
      } else if (type === "word") {
        payload.content = messages
          .map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}`)
          .join("\n\n---\n\n");
      }

      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${new Date().getTime()}.${type === "powerpoint" ? "pptx" : type === "pdf" ? "pdf" : type === "word" ? "docx" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${type.toUpperCase()} exported successfully!`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setExportingAs(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent, mentionedContacts?: Array<{ id: string; full_name: string }>) => {
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
    const currentMentionedContactIds = mentionedContacts?.map(c => c.id) || [];
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    setRagInfo(null);

    try {
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

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: currentInput || "Sent files" }],
          model: selectedModel,
          conversationId,
          attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
          mentionedContactIds: currentMentionedContactIds.length > 0 ? currentMentionedContactIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to get response";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = (await reader?.read()) || {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.modelUsed) {
              setCurrentModel(data.modelUsed);
            }

            if (data.ragUsed) {
              setRagInfo({
                used: true,
                documentsCount: data.documentsCount || 0,
              });
            }

            if (data.conversationId && !conversationId) {
              setConversationId(data.conversationId);
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

            if (data.content) {
              assistantMessage += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                  id: newMessages[newMessages.length - 1].id,
                };
                return newMessages;
              });
            }
          } catch (err) {
            // Silent fail for parse errors
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error occurred";
      toast.error(`Chat error: ${errorMessage}`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}\n\nPlease try refreshing the page or selecting a different model.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    selectedModel,
    setSelectedModel,
    conversationId,
    currentModel,
    ragInfo,
    attachments,
    isDragging,
    copiedMessageIndex,
    exportingAs,
    isVoiceMode,
    setIsVoiceMode,
    isSidebarOpen,
    setIsSidebarOpen,
    libraryStats,
    messagesEndRef,
    fileInputRef,
    textareaRef,

    // Actions
    handleFileSelect,
    removeAttachment,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleConversationSelect,
    handleNewConversation,
    copyToClipboard,
    submitFeedback,
    exportConversation,
    handleSubmit,
  };
}
