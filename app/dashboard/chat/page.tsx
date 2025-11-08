"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, Bot, User, Paperclip, X, FileText, Image as ImageIcon, Mic, MicOff, Copy, Check, Download, FileSpreadsheet, Presentation, File, Phone, PhoneOff, Menu, MessageSquare, Brain, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AIModel } from "@/types";
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/ai/config";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { MarkdownMessage } from "@/components/markdown-message";
import { VoiceConversation } from "@/components/voice-conversation-fallback";

interface FileAttachment {
  file: File;
  type: "document" | "image";
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [currentModel, setCurrentModel] = useState<{
    name: string;
    reason: string;
    model: string;
    icon?: string;
  } | null>(null);
  const [ragInfo, setRagInfo] = useState<{
    used: boolean;
    documentsCount: number;
  } | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [exportingAs, setExportingAs] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [libraryStats, setLibraryStats] = useState<{
    docCount: number;
    spacesCount: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript);
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Fetch library stats to show full context access
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
        console.error("Error fetching library stats:", error);
      }
    }

    fetchLibraryStats();
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file type
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

      // Create preview for images
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
      // Revoke object URL for images
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
      // Fetch messages directly from the messages table for this conversation
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
      console.error("Failed to load conversation:", error);
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

  const toggleVoiceRecording = () => {
    if (!recognition) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
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
        // Convert messages to slides
        payload.slides = messages.map((msg, idx) => ({
          title: msg.role === "user" ? `Question ${Math.floor(idx / 2) + 1}` : `Response ${Math.floor(idx / 2) + 1}`,
          content: [msg.content.substring(0, 500) + (msg.content.length > 500 ? "..." : "")]
        }));
      } else if (type === "pdf") {
        // Convert messages to PDF content
        payload.content = messages
          .map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}`)
          .join("\n\n---\n\n");
      } else if (type === "excel") {
        // Convert messages to Excel data
        payload.data = messages.map((msg, idx) => ({
          "#": idx + 1,
          Role: msg.role === "user" ? "User" : "Assistant",
          Message: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
          "Full Content": msg.content,
        }));
      } else if (type === "word") {
        // Convert messages to Word content
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

      // Download the file
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
      console.error("Error exporting conversation:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setExportingAs(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
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
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    setRagInfo(null); // Reset RAG indicator for new message

    try {
      // Process attachments for API
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
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

            if (data.content) {
              assistantMessage += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch (err) {
            console.error("Error parsing chunk:", err);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
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
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] relative">
      {/* Collapsible Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-shrink-0">
          <ConversationSidebar
            mode="personal"
            currentConversationId={conversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}

      {/* Main Chat Area - Centered Layout */}
      <div className="flex flex-col flex-1 min-w-0 max-w-full">
          {/* Minimal Header - Claude-like */}
          <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="h-9 px-3 border-slate-300 dark:border-slate-700"
                  title="View past conversations"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="text-sm">History</span>
                </Button>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Model:</span>
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => setSelectedModel(value as AIModel)}
                    disabled={messages.length > 0 || isVoiceMode}
                  >
                    <SelectTrigger className="border border-slate-300 dark:border-slate-700 h-9 px-3 text-sm font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[180px]">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AI_MODELS).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.icon}</span>
                            <span>{model.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mr-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportConversation("powerpoint")}
                      disabled={exportingAs !== null}
                      className="h-8 px-2 text-xs"
                      title="Export as PowerPoint"
                    >
                      <Presentation className="h-3.5 w-3.5 mr-1.5" />
                      PPT
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportConversation("pdf")}
                      disabled={exportingAs !== null}
                      className="h-8 px-2 text-xs"
                      title="Export as PDF"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportConversation("word")}
                      disabled={exportingAs !== null}
                      className="h-8 px-2 text-xs"
                      title="Export as Word"
                    >
                      <File className="h-3.5 w-3.5 mr-1.5" />
                      Word
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-9 text-sm px-3"
                >
                  New chat
                </Button>
              </div>
            </div>
          </div>

      {/* Library Context Banner */}
      {libraryStats && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-b border-purple-100 dark:border-purple-900/30">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3 text-sm">
              <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                Your AI assistant has access to your <strong>entire library</strong>
              </span>
              <div className="flex items-center gap-3 ml-auto text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">{libraryStats.docCount} documents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{libraryStats.spacesCount} spaces</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Mode or Text Mode */}
      {isVoiceMode ? (
        <div className="flex-1 overflow-hidden">
          <VoiceConversation onClose={() => setIsVoiceMode(false)} />
        </div>
      ) : (
        <>
      {/* Messages - Centered like Claude */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-8">
            <div className="w-full space-y-6">
              {/* Hero Section - Clean */}
              <div className="py-8">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  What can I help you with today?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base mb-2">
                  {selectedModel === "auto"
                    ? "I'll automatically select the best AI model for your question"
                    : `Powered by ${AI_MODELS[selectedModel].name}`}
                </p>
                {selectedModel === "auto" && (
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    GPT-4o Mini • Claude • GPT-4o • Gemini • Gamma
                  </p>
                )}
              </div>

              {/* Quick Start Suggestions - Minimal Cards */}
              <div className="grid md:grid-cols-2 gap-3 mb-6">
                {[
                  {
                    icon: "💡",
                    title: "Brainstorm ideas",
                    prompt: "Help me brainstorm creative ideas for",
                  },
                  {
                    icon: "📝",
                    title: "Write content",
                    prompt: "Help me write professional content about",
                  },
                  {
                    icon: "🔍",
                    title: "Analyze data",
                    prompt: "Help me analyze and understand",
                  },
                  {
                    icon: "📊",
                    title: "Create presentation",
                    prompt: "Help me create a presentation about",
                  }
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion.prompt + " ")}
                    className="group border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg p-5 text-left transition-all bg-white dark:bg-slate-900"
                  >
                    <div className="text-2xl mb-3">{suggestion.icon}</div>
                    <h3 className="font-medium text-base mb-1 text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Click to start with a template
                    </p>
                  </button>
                ))}
              </div>

            </div>
          </div>
        ) : (
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
                        <MarkdownMessage content={message.content} />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content, index)}
                        className="absolute top-0 right-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Copy to clipboard"
                      >
                        {copiedMessageIndex === index ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
      </div>

      {/* Input Area - Centered like Claude */}
      <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative group bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 flex items-center gap-2"
                >
                  {attachment.type === "image" && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(attachment.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border transition-all shadow-sm ${
              isDragging
                ? "border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 shadow-lg"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <form onSubmit={handleSubmit} className="flex gap-2 items-end p-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv,image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach files"
                className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRecording
                    ? "Listening..."
                    : isDragging
                    ? "Drop files here..."
                    : "Ask me anything..."
                }
                disabled={isLoading}
                className="flex-1 min-h-[36px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 px-2 text-[15px]"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '36px';
                  target.style.height = target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="h-9 w-9 p-0 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 disabled:opacity-50"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      </>
      )}
      </div>
    </div>
  );
}
