"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Loader2,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Presentation,
  File,
  MoreHorizontal,
  Sparkles,
  Brain,
  Code2,
  Lightbulb,
  Search,
  MessageSquare,
  Zap,
  ChevronDown,
  Library,
  PenLine,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Settings2,
  History,
  Plus,
  BookOpen,
  Target,
  Coffee,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AIModel } from "@/types";
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/ai/config";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { MarkdownMessage } from "@/components/markdown-message";
import { VoiceConversation } from "@/components/voice-conversation-fallback";
import { cn } from "@/lib/utils";

interface FileAttachment {
  file: File;
  type: "document" | "image";
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  id?: string;
  feedback?: "helpful" | "not_helpful" | null;
}

// Conversation modes with distinct personalities
const CONVERSATION_MODES = [
  {
    id: "auto",
    name: "Auto",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    description: "AI picks the best approach",
    systemPrompt: "",
  },
  {
    id: "creative",
    name: "Creative",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    description: "Brainstorm & ideate freely",
    systemPrompt: "Be creative, think outside the box, suggest bold ideas.",
  },
  {
    id: "research",
    name: "Research",
    icon: Search,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Deep analysis & facts",
    systemPrompt: "Be thorough, cite sources when possible, provide detailed analysis.",
  },
  {
    id: "code",
    name: "Code",
    icon: Code2,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    description: "Technical & programming",
    systemPrompt: "Focus on clean code, best practices, and clear explanations.",
  },
  {
    id: "writing",
    name: "Writing",
    icon: PenLine,
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800",
    description: "Polish & craft content",
    systemPrompt: "Help craft compelling, well-structured content with attention to tone and style.",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedMode, setSelectedMode] = useState(CONVERSATION_MODES[0]);
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
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [libraryStats, setLibraryStats] = useState<{
    docCount: number;
    spacesCount: number;
  } | null>(null);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }
          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript);
          }
        };

        recognitionInstance.onerror = () => setIsRecording(false);
        recognitionInstance.onend = () => setIsRecording(false);
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Fetch library stats and recent topics
  useEffect(() => {
    async function fetchUserContext() {
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

        // Fetch library stats
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

        // Fetch recent conversation topics for personalized suggestions
        const { data: recentConvos } = await supabase
          .from("conversations")
          .select("title")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5);

        if (recentConvos) {
          setRecentTopics(recentConvos.map(c => c.title).filter(Boolean));
        }
      } catch (error) {
        console.error("Error fetching context:", error);
      }
    }

    fetchUserContext();
  }, []);

  // Check for voice mode query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "voice") {
      setIsVoiceMode(true);
    }
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isDocument = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"].includes(file.type);

      if (!isImage && !isDocument) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      newAttachments.push({
        file,
        type: isImage ? "image" : "document",
        preview: isImage ? URL.createObjectURL(file) : undefined,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      updated.splice(index, 1);
      return updated;
    });
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        setConversationId(id);
      }
    } catch (error) {
      toast.error("Failed to load conversation");
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
      toast.error("Speech recognition not supported in your browser");
      return;
    }

    if (isRecording) {
      recognition.stop();
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
    await navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const submitFeedback = async (messageId: string | undefined, helpful: boolean, index: number) => {
    if (!messageId) return;

    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, helpful }),
      });

      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], feedback: helpful ? "helpful" : "not_helpful" };
        return updated;
      });

      toast.success(helpful ? "Thanks for the feedback!" : "Thanks, we'll improve!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const exportConversation = async (type: "pdf" | "word") => {
    if (messages.length === 0) {
      toast.error("No conversation to export");
      return;
    }

    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: `AI Conversation - ${new Date().toLocaleDateString()}`,
          content: messages.map((msg) => `${msg.role.toUpperCase()}:\n${msg.content}`).join("\n\n---\n\n"),
        }),
      });

      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${Date.now()}.${type === "pdf" ? "pdf" : "docx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Exported successfully!");
    } catch (error) {
      toast.error("Export failed");
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
    setShowThinking(true);
    setRagInfo(null);

    try {
      const processedAttachments = await Promise.all(
        currentAttachments.map(async (att) => {
          return new Promise<{ name: string; type: string; data: string; mimeType: string }>((resolve) => {
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

      // Add mode context to the message
      const messageWithContext = selectedMode.systemPrompt
        ? `[Context: ${selectedMode.systemPrompt}]\n\n${currentInput}`
        : currentInput;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: messageWithContext }],
          model: selectedModel,
          conversationId,
          attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
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
            if (data.ragUsed) setRagInfo({ used: true, documentsCount: data.documentsCount || 0 });
            if (data.conversationId && !conversationId) setConversationId(data.conversationId);
            if (data.messageId) {
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], id: data.messageId };
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
            // Skip parse errors
          }
        }
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.message || "Unknown error"}`);
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Error: ${error?.message || "Something went wrong"}` }]);
    } finally {
      setIsLoading(false);
      setShowThinking(false);
    }
  }

  // Personalized suggestion cards based on mode and recent activity
  const getSuggestionCards = () => {
    const baseCards = [
      { icon: "🎯", title: "Help me plan", prompt: "Help me create a plan for" },
      { icon: "✍️", title: "Write something", prompt: "Help me write" },
      { icon: "🔍", title: "Research a topic", prompt: "Research and explain" },
      { icon: "💡", title: "Brainstorm ideas", prompt: "Brainstorm creative ideas for" },
    ];

    if (selectedMode.id === "code") {
      return [
        { icon: "🐛", title: "Debug code", prompt: "Help me debug this code:" },
        { icon: "📝", title: "Write a function", prompt: "Write a function that" },
        { icon: "🔧", title: "Refactor code", prompt: "Help me refactor this code to be cleaner:" },
        { icon: "📚", title: "Explain concept", prompt: "Explain this programming concept:" },
      ];
    }

    if (selectedMode.id === "creative") {
      return [
        { icon: "🎨", title: "Creative concept", prompt: "Create a unique concept for" },
        { icon: "📖", title: "Story idea", prompt: "Help me develop a story about" },
        { icon: "🎬", title: "Content ideas", prompt: "Generate creative content ideas for" },
        { icon: "🌟", title: "Brand name", prompt: "Brainstorm brand names for" },
      ];
    }

    if (selectedMode.id === "writing") {
      return [
        { icon: "📧", title: "Draft email", prompt: "Write a professional email about" },
        { icon: "📝", title: "Blog post", prompt: "Write a blog post about" },
        { icon: "🎯", title: "Marketing copy", prompt: "Write compelling marketing copy for" },
        { icon: "📋", title: "Summary", prompt: "Summarize and improve this text:" },
      ];
    }

    return baseCards;
  };

  if (isVoiceMode) {
    return (
      <div className="h-[calc(100vh-6rem)]">
        <VoiceConversation onClose={() => setIsVoiceMode(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
          >
            <ConversationSidebar
              mode="personal"
              currentConversationId={conversationId}
              onConversationSelect={(id) => id && loadConversation(id)}
              onNewConversation={handleNewConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-8 w-8 p-0"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 gap-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>

          {/* Mode + Model Selector */}
          <div className="flex items-center gap-2">
            {/* Conversation Mode Chips */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              {CONVERSATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    selectedMode.id === mode.id
                      ? `bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white`
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <mode.icon className="h-3.5 w-3.5" />
                  {mode.name}
                </button>
              ))}
            </div>

            {/* Mobile Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm" className="gap-2">
                  <selectedMode.icon className="h-4 w-4" />
                  {selectedMode.name}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {CONVERSATION_MODES.map((mode) => (
                  <DropdownMenuItem key={mode.id} onClick={() => setSelectedMode(mode)}>
                    <mode.icon className="h-4 w-4 mr-2" />
                    {mode.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVoiceMode(true)}
              className="h-8 w-8 p-0"
              title="Voice mode"
            >
              <Volume2 className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportConversation("pdf")} disabled={messages.length === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportConversation("word")} disabled={messages.length === 0}>
                  <File className="h-4 w-4 mr-2" />
                  Export as Word
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Chat settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            {messages.length === 0 ? (
              /* Empty State - Inspiring Hero */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] py-12"
              >
                {/* Animated Logo */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={cn(
                    "h-20 w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg",
                    selectedMode.color
                  )}
                >
                  <selectedMode.icon className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-bold text-center mb-3 text-slate-900 dark:text-white"
                >
                  {selectedMode.id === "auto" ? "What can I help you with?" : `Let's ${selectedMode.name.toLowerCase()}`}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-600 dark:text-slate-400 text-center mb-2 max-w-md"
                >
                  {selectedMode.description}
                </motion.p>

                {/* Library Context */}
                {libraryStats && libraryStats.docCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 mb-8"
                  >
                    <Brain className="h-4 w-4" />
                    <span>Connected to {libraryStats.docCount} documents in your library</span>
                  </motion.div>
                )}

                {/* Suggestion Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3 w-full max-w-xl"
                >
                  {getSuggestionCards().map((card, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      onClick={() => setInput(card.prompt + " ")}
                      className={cn(
                        "group p-4 rounded-xl border text-left transition-all hover:shadow-md",
                        selectedMode.bgColor,
                        selectedMode.borderColor,
                        "hover:scale-[1.02]"
                      )}
                    >
                      <span className="text-2xl mb-2 block">{card.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white block mb-1">
                        {card.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Click to start
                      </span>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Recent Topics */}
                {recentTopics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                  >
                    <p className="text-xs text-slate-400 mb-2">Continue where you left off</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {recentTopics.slice(0, 3).map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(`Continue our conversation about ${topic}`)}
                          className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {topic.length > 30 ? topic.slice(0, 30) + "..." : topic}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* Messages */
              <div className="space-y-6 py-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {message.role === "assistant" ? (
                          <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center", selectedMode.color)}>
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {message.attachments.map((att, attIdx) => (
                              <div key={attIdx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                                {att.type === "image" && att.preview ? (
                                  <img src={att.preview} alt={att.file.name} className="h-10 w-10 object-cover rounded" />
                                ) : (
                                  <FileText className="h-5 w-5 text-slate-500" />
                                )}
                                <span className="text-xs truncate max-w-[100px]">{att.file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          {message.role === "assistant" ? (
                            <MarkdownMessage content={message.content} />
                          ) : (
                            <p className="whitespace-pre-wrap text-slate-900 dark:text-white">{message.content}</p>
                          )}
                        </div>

                        {/* Model/Source indicator */}
                        {message.role === "assistant" && index === messages.length - 1 && currentModel && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 mt-3 text-xs text-slate-500"
                          >
                            <span className="flex items-center gap-1">
                              {currentModel.icon} {currentModel.name}
                            </span>
                            {ragInfo?.used && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {ragInfo.documentsCount} sources
                              </span>
                            )}
                          </motion.div>
                        )}

                        {/* Actions */}
                        {message.role === "assistant" && message.content && (
                          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {message.id && !message.feedback && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => submitFeedback(message.id, true, index)} className="h-7 w-7 p-0">
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => submitFeedback(message.id, false, index)} className="h-7 w-7 p-0">
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {message.feedback && (
                              <span className="text-xs text-slate-400">{message.feedback === "helpful" ? "👍" : "👎"}</span>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content, index)} className="h-7 w-7 p-0">
                              {copiedMessageIndex === index ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Thinking indicator */}
                <AnimatePresence>
                  {showThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-4"
                    >
                      <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center", selectedMode.color)}>
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Thinking</span>
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ...
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group bg-slate-100 dark:bg-slate-800 rounded-lg p-2 flex items-center gap-2">
                    {att.type === "image" && att.preview ? (
                      <img src={att.preview} alt={att.file.name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="text-sm truncate max-w-[120px]">{att.file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Box */}
            <form
              onSubmit={handleSubmit}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }}
              className={cn(
                "flex items-end gap-2 p-2 rounded-2xl border transition-all",
                isDragging
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600"
              )}
            >
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
                className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                className={cn("h-9 w-9", isRecording ? "text-red-500 animate-pulse" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening..." : isDragging ? "Drop files here..." : "Message..."}
                disabled={isLoading}
                className="flex-1 min-h-[36px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent px-2"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "36px";
                  target.style.height = target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />

              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl transition-all",
                  input.trim() || attachments.length > 0
                    ? `bg-gradient-to-r ${selectedMode.color} text-white hover:opacity-90`
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                )}
                size="icon"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            <p className="text-xs text-center text-slate-400 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
