"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
  conversations?: any[];
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  currentConversationId?: string;
}

export function ChatLayout({
  children,
}: ChatLayoutProps) {
  // Simplified layout - no duplicate sidebar
  // Main app sidebar already handles navigation
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      {children}
    </div>
  );
}
