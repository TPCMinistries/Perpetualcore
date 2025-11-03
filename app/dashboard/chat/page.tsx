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
import { Send, Loader2, Bot, User, Paperclip, X, FileText, Image as ImageIcon, Mic, MicOff, Copy, Check, Download, FileSpreadsheet, Presentation, File, Phone, PhoneOff } from "lucide-react";
import { AIModel } from "@/types";
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/ai/config";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { MarkdownMessage } from "@/components/markdown-message";
import { VoiceConversation } from "@/components/voice-conversation";

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
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        mode="personal"
        currentConversationId={conversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
          {/* Header - Clean and Professional */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-4 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  AI Chat {isVoiceMode && <span className="text-emerald-600">(Voice Mode)</span>}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isVoiceMode ? "🎤 Voice conversation mode active" : "Intelligent multi-model AI assistant"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Voice Mode Toggle */}
                <Button
                  variant={isVoiceMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log("Voice mode clicked, current state:", isVoiceMode);
                    setIsVoiceMode(!isVoiceMode);
                    console.log("Voice mode new state:", !isVoiceMode);
                  }}
                  className={isVoiceMode ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-200 dark:border-slate-800"}
                  title={isVoiceMode ? "Switch to text mode" : "Switch to voice mode"}
                >
                  {isVoiceMode ? (
                    <>
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Voice
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Voice Mode
                    </>
                  )}
                </Button>

                <div className="w-64">
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => setSelectedModel(value as AIModel)}
                    disabled={messages.length > 0 || isVoiceMode}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-800">
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

                {/* Export Buttons */}
                {messages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation("pdf")}
                      disabled={exportingAs === "pdf"}
                      className="border-slate-200 dark:border-slate-800"
                      title="Export as PDF"
                    >
                      {exportingAs === "pdf" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation("powerpoint")}
                      disabled={exportingAs === "powerpoint"}
                      className="border-slate-200 dark:border-slate-800"
                      title="Export as PowerPoint"
                    >
                      {exportingAs === "powerpoint" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Presentation className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation("excel")}
                      disabled={exportingAs === "excel"}
                      className="border-slate-200 dark:border-slate-800"
                      title="Export as Excel"
                    >
                      {exportingAs === "excel" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation("word")}
                      disabled={exportingAs === "word"}
                      className="border-slate-200 dark:border-slate-800"
                      title="Export as Word"
                    >
                      {exportingAs === "word" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <File className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

        {/* Model and RAG Indicators */}
        {(currentModel || (ragInfo && ragInfo.used)) && (
          <div className="flex items-center gap-2">
            {currentModel && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs">
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  {currentModel.icon} {currentModel.name}
                </span>
                <span className="text-blue-600 dark:text-blue-500">
                  • {currentModel.reason}
                </span>
              </div>
            )}

            {ragInfo && ragInfo.used && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs">
                <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Using your documents
                </span>
                <span className="text-emerald-600 dark:text-emerald-500">
                  • {ragInfo.documentsCount} {ragInfo.documentsCount === 1 ? 'source' : 'sources'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice Mode or Text Mode */}
      {isVoiceMode ? (
        <div className="flex-1 overflow-hidden">
          <VoiceConversation onClose={() => setIsVoiceMode(false)} />
        </div>
      ) : (
        <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="max-w-3xl w-full space-y-8">
              {/* Hero Section - Clean */}
              <div className="py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-8 w-8 text-slate-700 dark:text-slate-300" />
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
              <div className="grid md:grid-cols-2 gap-3">
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
                    icon: "⚡",
                    title: "Solve problems",
                    prompt: "Help me solve this problem:",
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

              {/* Model Info - Subtle */}
              {selectedModel === "auto" && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-white dark:bg-slate-900">
                  <h3 className="font-medium text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">
                    Available AI Models
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-slate-600 dark:text-slate-400">GPT-4o Mini</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span className="text-slate-600 dark:text-slate-400">Claude</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">GPT-4o</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600 dark:text-slate-400">Gemini</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                      <span className="text-slate-600 dark:text-slate-400">Gamma</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                )}
                <div className="relative group max-w-[70%]">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
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
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.role === "assistant" && message.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content, index)}
                      className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md"
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
                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-white dark:text-slate-900" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 flex items-center gap-2"
            >
              {attachment.type === "image" && attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="h-14 w-14 object-cover rounded"
                />
              ) : (
                <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                  {attachment.file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
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

      {/* Input Area - Clean Design */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border transition-colors bg-white dark:bg-slate-900 p-3 ${
          isDragging
            ? "border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
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
            className="h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleVoiceRecording}
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Start voice input"}
            className={`h-9 w-9 ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? "Listening..."
                : isDragging
                ? "Drop files here..."
                : "Message AI..."
            }
            disabled={isLoading}
            className="flex-1 min-h-[36px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
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
            className="h-9 w-9 p-0 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
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
      </>
      )}
      </div>
    </div>
  );
}
