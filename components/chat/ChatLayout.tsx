"use client";

import { useState, ReactNode } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: ReactNode;
  conversations: any[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  currentConversationId?: string;
}

export function ChatLayout({
  children,
  conversations,
  onSelectConversation,
  onNewChat,
  currentConversationId,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        currentConversationId={currentConversationId}
      />

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarOpen ? "ml-0" : "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
