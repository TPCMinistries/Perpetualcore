"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

export interface AIContext {
  route: string;
  pageType: string;
  selectedItems: any[];
  pageData: Record<string, any>;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: AIContext;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

/**
 * Hook for interacting with the AI assistant
 */
export function useAIAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [context, setContext] = useState<AIContext>({
    route: pathname,
    pageType: getPageType(pathname),
    selectedItems: [],
    pageData: {},
  });

  // Update context when route changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      route: pathname,
      pageType: getPageType(pathname),
    }));
  }, [pathname]);

  // Open/close handlers
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Update selected items
  const setSelectedItems = useCallback((items: any[]) => {
    setContext((prev) => ({ ...prev, selectedItems: items }));
  }, []);

  // Update page data
  const setPageData = useCallback((data: Record<string, any>) => {
    setContext((prev) => ({ ...prev, pageData: { ...prev.pageData, ...data } }));
  }, []);

  // Send message to AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
        context,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            context,
            history: messages.slice(-10), // Last 10 messages for context
          }),
        });

        if (!response.ok) throw new Error("AI request failed");

        const data = await response.json();

        const assistantMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Handle any actions the AI wants to take
        if (data.actions) {
          // Execute actions (navigation, etc.)
          for (const action of data.actions) {
            await executeAction(action);
          }
        }

        return assistantMessage;
      } catch (error) {
        console.error("AI assistant error:", error);
        const errorMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return errorMessage;
      } finally {
        setIsLoading(false);
      }
    },
    [context, messages]
  );

  // Get context-specific quick actions
  const getQuickActions = useCallback((): QuickAction[] => {
    const actions: QuickAction[] = [];

    switch (context.pageType) {
      case "inbox":
        actions.push(
          { id: "summarize", label: "Summarize unread", icon: "sparkles", action: () => sendMessage("Summarize my unread messages") },
          { id: "draft", label: "Draft reply", icon: "pen", action: () => sendMessage("Help me draft a reply") }
        );
        break;
      case "documents":
        actions.push(
          { id: "analyze", label: "Analyze this", icon: "brain", action: () => sendMessage("Analyze this document") },
          { id: "summarize", label: "Summarize", icon: "sparkles", action: () => sendMessage("Summarize this document") }
        );
        break;
      case "tasks":
        actions.push(
          { id: "prioritize", label: "Prioritize tasks", icon: "list-ordered", action: () => sendMessage("Help me prioritize my tasks") },
          { id: "breakdown", label: "Break down task", icon: "git-branch", action: () => sendMessage("Break down this task into subtasks") }
        );
        break;
      case "automation":
        actions.push(
          { id: "explain", label: "Explain error", icon: "help-circle", action: () => sendMessage("Why did this automation fail?") },
          { id: "optimize", label: "Optimize", icon: "zap", action: () => sendMessage("How can I optimize this automation?") }
        );
        break;
      case "contacts":
        actions.push(
          { id: "history", label: "Show history", icon: "history", action: () => sendMessage("Show my interaction history with this contact") },
          { id: "draft-email", label: "Draft email", icon: "mail", action: () => sendMessage("Draft an email to this contact") }
        );
        break;
    }

    // Always include general actions
    actions.push(
      { id: "help", label: "What can you do?", icon: "help-circle", action: () => sendMessage("What can you help me with on this page?") }
    );

    return actions;
  }, [context.pageType, sendMessage]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isOpen,
    isLoading,
    messages,
    context,
    open,
    close,
    toggle,
    sendMessage,
    setSelectedItems,
    setPageData,
    getQuickActions,
    clearMessages,
  };
}

function getPageType(pathname: string): string {
  if (pathname.includes("/inbox")) return "inbox";
  if (pathname.includes("/library") || pathname.includes("/documents")) return "documents";
  if (pathname.includes("/tasks")) return "tasks";
  if (pathname.includes("/automation")) return "automation";
  if (pathname.includes("/contacts")) return "contacts";
  if (pathname.includes("/calendar")) return "calendar";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/chat")) return "chat";
  if (pathname.includes("/home")) return "home";
  return "general";
}

async function executeAction(action: { type: string; payload: any }) {
  switch (action.type) {
    case "navigate":
      window.location.href = action.payload.url;
      break;
    case "copy":
      await navigator.clipboard.writeText(action.payload.text);
      break;
    case "openModal":
      window.dispatchEvent(new CustomEvent("ai-action", { detail: action }));
      break;
    default:
      console.log("Unknown action:", action);
  }
}
