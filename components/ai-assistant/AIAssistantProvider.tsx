"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type AIAssistantContextType = ReturnType<typeof useAIAssistant>;

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function useAIAssistantContext() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistantContext must be used within AIAssistantProvider");
  }
  return context;
}

interface AIAssistantProviderProps {
  children: ReactNode;
}

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const assistant = useAIAssistant();

  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    "mod+j": assistant.toggle,
    escape: () => {
      if (assistant.isOpen) assistant.close();
    },
  });

  return (
    <AIAssistantContext.Provider value={assistant}>
      {children}
    </AIAssistantContext.Provider>
  );
}
