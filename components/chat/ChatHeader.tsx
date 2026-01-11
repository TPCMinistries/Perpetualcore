"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Mic,
  Brain,
  Sparkles,
  Info,
  Settings,
} from "lucide-react";
import { Advisor, DEFAULT_ADVISOR } from "./types";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  currentAdvisor: Advisor;
  onAdvisorChange: (advisor: Advisor) => void;
  onVoiceToggle: () => void;
  isVoiceMode: boolean;
  currentModel?: { name: string; reason: string } | null;
  ragInfo?: { used: boolean; documentsCount: number } | null;
}

// Available advisors for quick switching
const ADVISORS: Advisor[] = [
  DEFAULT_ADVISOR,
  {
    id: "ceo",
    name: "CEO Advisor",
    emoji: "👔",
    role: "Executive",
    description: "Strategic leadership and business decisions",
    systemPrompt: "Act as an experienced CEO advisor focused on strategic thinking...",
  },
  {
    id: "marketing",
    name: "Marketing Pro",
    emoji: "📈",
    role: "Marketing",
    description: "Marketing strategies and growth",
    systemPrompt: "Act as a marketing expert...",
  },
  {
    id: "code",
    name: "Code Expert",
    emoji: "💻",
    role: "Engineering",
    description: "Technical assistance and code review",
    systemPrompt: "Act as a senior software engineer...",
  },
  {
    id: "writing",
    name: "Writing Coach",
    emoji: "✍️",
    role: "Writing",
    description: "Content creation and editing",
    systemPrompt: "Act as a professional writing coach...",
  },
];

export function ChatHeader({
  currentAdvisor,
  onAdvisorChange,
  onVoiceToggle,
  isVoiceMode,
  currentModel,
  ragInfo,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-4">
        {/* Advisor Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="text-xl">{currentAdvisor.emoji}</span>
              <div className="text-left">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {currentAdvisor.name}
                </span>
                {currentAdvisor.role !== "Assistant" && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs py-0 px-1.5"
                  >
                    {currentAdvisor.role}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {ADVISORS.map((advisor) => (
              <DropdownMenuItem
                key={advisor.id}
                onClick={() => onAdvisorChange(advisor)}
                className={cn(
                  "flex items-center gap-3 py-2.5 cursor-pointer",
                  currentAdvisor.id === advisor.id && "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <span className="text-xl">{advisor.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{advisor.name}</div>
                  <div className="text-xs text-slate-500">{advisor.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="/dashboard/assistants"
                className="flex items-center gap-2 text-violet-600 dark:text-violet-400"
              >
                <Sparkles className="h-4 w-4" />
                <span>See all advisors</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Model Indicator */}
        {currentModel && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Brain className="h-3.5 w-3.5" />
            <span>{currentModel.name}</span>
          </div>
        )}

        {/* RAG Indicator */}
        {ragInfo?.used && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{ragInfo.documentsCount} sources</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Voice Toggle */}
        <Button
          variant={isVoiceMode ? "default" : "outline"}
          size="sm"
          onClick={onVoiceToggle}
          className={cn(
            "flex items-center gap-2",
            isVoiceMode && "bg-violet-600 hover:bg-violet-700"
          )}
        >
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Voice</span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4 text-slate-500" />
        </Button>
      </div>
    </header>
  );
}
