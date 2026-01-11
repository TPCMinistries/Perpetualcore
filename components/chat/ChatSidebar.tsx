"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Calendar,
  CheckSquare,
  Sparkles,
  User,
} from "lucide-react";
import { DailyBriefingCard } from "./DailyBriefingCard";
import { Conversation, Advisor } from "./types";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  currentConversationId?: string;
}

// Quick access advisors - the most used ones
const QUICK_ADVISORS: Advisor[] = [
  {
    id: "ceo",
    name: "CEO",
    emoji: "👔",
    role: "Executive",
    description: "Strategic leadership advice",
    systemPrompt: "Act as an experienced CEO advisor...",
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "📈",
    role: "Marketing",
    description: "Marketing & growth strategies",
    systemPrompt: "Act as a marketing expert...",
  },
  {
    id: "code",
    name: "Code",
    emoji: "💻",
    role: "Engineering",
    description: "Technical assistance",
    systemPrompt: "Act as a senior software engineer...",
  },
];

export function ChatSidebar({
  isOpen,
  onToggle,
  conversations,
  onSelectConversation,
  onNewChat,
  currentConversationId,
}: ChatSidebarProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute top-4 z-50 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all",
          isOpen ? "left-[276px]" : "left-4"
        )}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden"
          >
            {/* New Chat Button */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <Button
                onClick={onNewChat}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Daily Briefing Card */}
                <DailyBriefingCard />

                {/* Recent Conversations */}
                <div>
                  <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
                    Recent Chats
                  </h3>
                  <div className="space-y-1">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 px-2 py-3">
                        No conversations yet
                      </p>
                    ) : (
                      conversations.slice(0, 10).map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => onSelectConversation(conv.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                            currentConversationId === conv.id
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{conv.title}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Advisors */}
                <div>
                  <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">
                    Quick Advisors
                  </h3>
                  <div className="space-y-1">
                    {QUICK_ADVISORS.map((advisor) => (
                      <button
                        key={advisor.id}
                        onClick={() => setSelectedAdvisor(advisor.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedAdvisor === advisor.id
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{advisor.emoji}</span>
                          <div>
                            <span className="font-medium">{advisor.name}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                              {advisor.role}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                    <a
                      href="/dashboard/assistants"
                      className="block text-center text-xs text-violet-600 dark:text-violet-400 hover:underline py-2"
                    >
                      See all advisors →
                    </a>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
