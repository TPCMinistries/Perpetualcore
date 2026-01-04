"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

export interface AIContext {
  route: string;
  pageType: string;
  selectedItems: any[];
  pageData: Record<string, any>;
  workspace?: {
    id: string;
    name: string;
    aiMode?: string;
  };
  entity?: {
    id: string;
    name: string;
    type?: string;
    description?: string;
  };
  brand?: {
    id: string;
    name: string;
  };
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

  // Update workspace context
  const setWorkspaceContext = useCallback((workspace: { id: string; name: string; aiMode?: string }) => {
    setContext((prev) => ({ ...prev, workspace }));
  }, []);

  // Listen for workspace changes
  useEffect(() => {
    const handleWorkspaceChange = (event: CustomEvent) => {
      const { workspace } = event.detail;
      if (workspace) {
        setWorkspaceContext({
          id: workspace.id,
          name: workspace.name,
          aiMode: workspace.aiMode,
        });
      }
    };

    window.addEventListener("workspaceChanged" as any, handleWorkspaceChange);
    return () => {
      window.removeEventListener("workspaceChanged" as any, handleWorkspaceChange);
    };
  }, [setWorkspaceContext]);

  // Listen for entity changes
  useEffect(() => {
    const handleEntityChange = (event: CustomEvent) => {
      const { entity } = event.detail;
      if (entity) {
        setContext((prev) => ({
          ...prev,
          entity: {
            id: entity.id,
            name: entity.name,
            type: entity.entity_type?.name,
            description: entity.description,
          },
        }));
      } else {
        setContext((prev) => ({ ...prev, entity: undefined }));
      }
    };

    const handleBrandChange = (event: CustomEvent) => {
      const { brand } = event.detail;
      if (brand) {
        setContext((prev) => ({
          ...prev,
          brand: {
            id: brand.id,
            name: brand.name,
          },
        }));
      } else {
        setContext((prev) => ({ ...prev, brand: undefined }));
      }
    };

    window.addEventListener("entity-switch" as any, handleEntityChange);
    window.addEventListener("brand-switch" as any, handleBrandChange);
    return () => {
      window.removeEventListener("entity-switch" as any, handleEntityChange);
      window.removeEventListener("brand-switch" as any, handleBrandChange);
    };
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

async function executeAction(action: { type: string; payload: any; label?: string }) {
  try {
    switch (action.type) {
      case "navigate":
        // Use router for SPA navigation
        window.location.href = action.payload.url;
        break;

      case "create_task":
        // Create a new task via API
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: action.payload.title,
            description: action.payload.description || "",
            priority: action.payload.priority || "medium",
          }),
        });
        if (taskRes.ok) {
          const { task } = await taskRes.json();
          // Dispatch success event for toast notification
          window.dispatchEvent(
            new CustomEvent("ai-action-success", {
              detail: { message: `Task created: ${task.title}`, action },
            })
          );
        }
        break;

      case "create_project":
        // Create a new project via API
        const projectRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: action.payload.name,
            description: action.payload.description || "",
          }),
        });
        if (projectRes.ok) {
          const { project } = await projectRes.json();
          window.dispatchEvent(
            new CustomEvent("ai-action-success", {
              detail: { message: `Project created: ${project.name}`, action },
            })
          );
        }
        break;

      case "search":
        // Navigate to search with query
        window.location.href = `/dashboard/search?q=${encodeURIComponent(action.payload.query)}`;
        break;

      case "send_email":
        // Navigate to compose email with pre-filled data
        const emailParams = new URLSearchParams({
          to: action.payload.to || "",
          subject: action.payload.subject || "",
        });
        window.location.href = `/dashboard/inbox/compose?${emailParams.toString()}`;
        break;

      case "copy":
        await navigator.clipboard.writeText(action.payload.text);
        window.dispatchEvent(
          new CustomEvent("ai-action-success", {
            detail: { message: "Copied to clipboard", action },
          })
        );
        break;

      case "openModal":
        window.dispatchEvent(new CustomEvent("ai-action", { detail: action }));
        break;

      default:
        console.log("Unknown action:", action);
        // Dispatch event for custom handling
        window.dispatchEvent(
          new CustomEvent("ai-action", { detail: action })
        );
    }
  } catch (error) {
    console.error("Failed to execute action:", error);
    window.dispatchEvent(
      new CustomEvent("ai-action-error", {
        detail: { message: `Failed: ${action.label || action.type}`, error },
      })
    );
  }
}
