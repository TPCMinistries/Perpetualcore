"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  FileText,
  Sparkles,
  Wand2,
  ListTree,
  Expand,
  MessageSquare,
  Save,
  X,
  ChevronRight,
  Brain,
  Lightbulb,
  PenLine,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
  Type,
  Zap,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIDocumentComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (documentId: string) => void;
  initialContent?: string;
  initialTitle?: string;
}

// AI Action types for inline commands
type AIAction =
  | "expand"
  | "summarize"
  | "make_plan"
  | "continue"
  | "rephrase"
  | "simplify"
  | "elaborate"
  | "bullet_points"
  | "professional"
  | "casual";

const AI_ACTIONS: { id: AIAction; label: string; icon: React.ElementType; description: string }[] = [
  { id: "expand", label: "Expand", icon: Expand, description: "Add more detail and depth" },
  { id: "summarize", label: "Summarize", icon: FileCheck, description: "Make it more concise" },
  { id: "make_plan", label: "Make a Plan", icon: ListTree, description: "Turn into actionable steps" },
  { id: "continue", label: "Continue Writing", icon: PenLine, description: "Continue the thought" },
  { id: "rephrase", label: "Rephrase", icon: RefreshCw, description: "Say it differently" },
  { id: "elaborate", label: "Elaborate", icon: Lightbulb, description: "Explain in more detail" },
  { id: "bullet_points", label: "Bullet Points", icon: List, description: "Convert to bullet list" },
  { id: "professional", label: "Professional Tone", icon: FileText, description: "Make it more formal" },
  { id: "casual", label: "Casual Tone", icon: MessageSquare, description: "Make it more conversational" },
];

export function AIDocumentComposer({
  open,
  onOpenChange,
  onSuccess,
  initialContent = "",
  initialTitle = "",
}: AIDocumentComposerProps) {
  // Document state
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Selection state for inline AI
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [processingAction, setProcessingAction] = useState<AIAction | null>(null);

  // Editor refs
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I'm here to help you create your document. You can:\n\n• **Type your initial thoughts** in the editor on the right\n• **Chat with me** here to brainstorm, outline, or refine ideas\n• **Select text** in the editor and use AI commands to expand, summarize, or transform it\n\nWhat would you like to write about today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, messages.length]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle text selection in editor
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionRect(rect);
      setShowAIMenu(true);
    } else {
      setShowAIMenu(false);
      setSelectedText("");
      setSelectionRect(null);
    }
  }, []);

  // Editor commands
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Send chat message
  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsThinking(true);

    try {
      // Build context with document content
      const context = content
        ? `\n\nCurrent document content:\n---\n${editorRef.current?.innerText || content}\n---`
        : "";

      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: `You are helping the user create a document. Be collaborative, creative, and helpful. When suggesting content, format it well with markdown. If they ask you to write something, provide it in a way they can easily copy into their document.${context}`,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsThinking(false);
    }
  };

  // Handle inline AI action
  const handleAIAction = async (action: AIAction) => {
    if (!selectedText) return;

    setProcessingAction(action);
    setShowAIMenu(false);

    const prompts: Record<AIAction, string> = {
      expand: `Expand on this text with more detail and depth. Keep the same tone and style:\n\n"${selectedText}"`,
      summarize: `Summarize this text concisely while keeping the key points:\n\n"${selectedText}"`,
      make_plan: `Turn this into a clear, actionable plan with numbered steps:\n\n"${selectedText}"`,
      continue: `Continue writing naturally from where this text leaves off:\n\n"${selectedText}"`,
      rephrase: `Rephrase this text in a different way while keeping the same meaning:\n\n"${selectedText}"`,
      elaborate: `Elaborate on this text with examples and explanations:\n\n"${selectedText}"`,
      bullet_points: `Convert this text into a clear bullet point list:\n\n"${selectedText}"`,
      professional: `Rewrite this text in a more professional and formal tone:\n\n"${selectedText}"`,
      casual: `Rewrite this text in a more casual and conversational tone:\n\n"${selectedText}"`,
      simplify: `Simplify this text to make it easier to understand:\n\n"${selectedText}"`,
    };

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompts[action],
          context: "You are helping edit a document. Respond with ONLY the transformed text, no explanations or prefixes. Format appropriately with HTML if needed (use <p>, <ul>, <li>, <strong>, <em> tags).",
        }),
      });

      if (!response.ok) throw new Error("Failed to process");

      const data = await response.json();
      const newText = data.response;

      // Replace selected text with AI result
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          // Create a temporary element to parse HTML
          const temp = document.createElement("div");
          temp.innerHTML = newText;

          // Insert nodes
          const fragment = document.createDocumentFragment();
          while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
          }
          range.insertNode(fragment);

          // Update content state
          handleEditorInput();
        }
      }

      toast.success(`Text ${action.replace("_", " ")}ed`);
    } catch (error) {
      console.error("AI action error:", error);
      toast.error("Failed to process text");
    } finally {
      setProcessingAction(null);
      setSelectedText("");
    }
  };

  // Insert AI response into editor
  const insertIntoEditor = (text: string) => {
    if (editorRef.current) {
      // Focus editor and insert at end
      editorRef.current.focus();

      // Move cursor to end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Insert the text
      document.execCommand("insertHTML", false, `<p>${text}</p>`);
      handleEditorInput();

      toast.success("Inserted into document");
    }
  };

  // Quick prompts for chat
  const quickPrompts = [
    { label: "Help me outline this", prompt: "Help me create an outline for my document based on what I've written so far" },
    { label: "Make it better", prompt: "Review what I've written and suggest improvements" },
    { label: "Continue the thought", prompt: "Continue writing from where I left off" },
    { label: "Create a plan", prompt: "Turn my ideas into a structured action plan" },
  ];

  // Save document
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("Organization not found");
        return;
      }

      // Create HTML document
      const htmlContent = content || "<p>Start writing...</p>";
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`;

      // Upload to storage
      const filePath = `${profile.organization_id}/${user.id}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, htmlBlob, { contentType: "text/html" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          title: title.trim(),
          file_name: fileName,
          file_type: "text/html",
          file_size: htmlBlob.size,
          file_url: publicUrl,
          storage_path: filePath,
          document_type: "Document",
          status: "completed",
          visibility: "organization",
          metadata: {
            createdWithAI: true,
            wordCount: (editorRef.current?.innerText || "").split(/\s+/).filter(Boolean).length,
            charCount: (editorRef.current?.innerText || "").length,
          },
        })
        .select()
        .single();

      if (docError) throw docError;

      toast.success("Document saved!");
      onOpenChange(false);
      onSuccess?.(document.id);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden",
          isFullscreen
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none"
            : "max-w-7xl w-[95vw] h-[90vh] max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Document Composer
              </h2>
              <p className="text-sm text-slate-500">
                Collaborate with AI to create your document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content - Split Pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: AI Chat Panel */}
          <div className="w-[400px] flex flex-col border-r bg-white dark:bg-slate-950">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-violet-600 to-purple-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <Brain className="h-4 w-4 text-white" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 rounded-2xl px-4 py-3 text-sm",
                        message.role === "assistant"
                          ? "bg-slate-100 dark:bg-slate-800"
                          : "bg-violet-600 text-white"
                      )}
                    >
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                      {message.role === "assistant" && message.id !== "welcome" && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast.success("Copied!");
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => insertIntoEditor(message.content)}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Insert
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Thinking</span>
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Prompts */}
            {messages.length < 3 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-slate-500 mb-2">Quick prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((qp) => (
                    <Button
                      key={qp.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => sendMessage(qp.prompt)}
                    >
                      {qp.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask AI for help..."
                  disabled={isThinking}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isThinking}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Right: Document Editor */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
            {/* Document Title */}
            <div className="px-6 py-4 border-b">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title..."
                className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
              />
            </div>

            {/* Editor Toolbar */}
            <div className="px-6 py-2 border-b bg-slate-50 dark:bg-slate-900 flex items-center gap-1 flex-wrap">
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("bold")}>
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("italic")}>
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2" />

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("formatBlock", "h1")}>
                        <Heading1 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 1</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("formatBlock", "h2")}>
                        <Heading2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Heading 2</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("formatBlock", "p")}>
                        <Type className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Paragraph</TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2" />

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("insertUnorderedList")}>
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bullet List</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("insertOrderedList")}>
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Numbered List</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("formatBlock", "blockquote")}>
                        <Quote className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Quote</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("formatBlock", "pre")}>
                        <Code className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Code</TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2" />

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("undo")}>
                        <Undo className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => executeCommand("redo")}>
                        <Redo className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex-1" />

                {/* AI Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      AI Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
                      Select text first, then choose an action
                    </div>
                    <DropdownMenuSeparator />
                    {AI_ACTIONS.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        disabled={!selectedText}
                        onClick={() => handleAIAction(action.id)}
                        className="gap-2"
                      >
                        <action.icon className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs text-slate-500">{action.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>

            {/* Editor Content */}
            <ScrollArea className="flex-1">
              <div
                ref={editorRef}
                contentEditable
                className="min-h-full p-6 prose prose-slate dark:prose-invert max-w-none focus:outline-none"
                onInput={handleEditorInput}
                onMouseUp={handleSelection}
                onKeyUp={handleSelection}
                dangerouslySetInnerHTML={{ __html: content || "" }}
                data-placeholder="Start writing your ideas here... You can also select text and use AI to enhance it."
              />
            </ScrollArea>

            {/* Floating AI Menu on Selection */}
            <AnimatePresence>
              {showAIMenu && selectionRect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border p-2 flex items-center gap-1"
                  style={{
                    top: selectionRect.bottom + 8,
                    left: Math.max(8, Math.min(selectionRect.left, window.innerWidth - 400)),
                  }}
                >
                  {processingAction ? (
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {AI_ACTIONS.slice(0, 5).map((action) => (
                        <Tooltip key={action.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleAIAction(action.id)}
                            >
                              <action.icon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{action.label}</TooltipContent>
                        </Tooltip>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            More
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {AI_ACTIONS.slice(5).map((action) => (
                            <DropdownMenuItem
                              key={action.id}
                              onClick={() => handleAIAction(action.id)}
                              className="gap-2"
                            >
                              <action.icon className="h-4 w-4" />
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {(editorRef.current?.innerText || "").split(/\s+/).filter(Boolean).length} words
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor styles */}
        <style jsx global>{`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            cursor: text;
          }
          [contenteditable] { outline: none; }
          [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
          [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
          [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
          [contenteditable] p { margin: 1em 0; }
          [contenteditable] blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; margin: 1em 0; color: #6b7280; }
          [contenteditable] pre { background: #f3f4f6; padding: 1em; border-radius: 0.375rem; font-family: monospace; }
          [contenteditable] ul, [contenteditable] ol { margin: 1em 0; padding-left: 2em; }
          [contenteditable] li { margin: 0.5em 0; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
