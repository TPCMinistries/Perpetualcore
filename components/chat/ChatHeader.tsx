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
  Zap,
  Settings,
  Check,
} from "lucide-react";
import { Advisor, DEFAULT_ADVISOR } from "./types";
import { cn } from "@/lib/utils";

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "auto";
  description: string;
  speed: "fast" | "medium" | "slow";
  capability: "basic" | "advanced" | "best";
}

export const AI_MODELS: AIModel[] = [
  {
    id: "auto",
    name: "Auto",
    provider: "auto",
    description: "Smart routing based on task complexity",
    speed: "fast",
    capability: "best",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's most capable model",
    speed: "medium",
    capability: "best",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient for simple tasks",
    speed: "fast",
    capability: "basic",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's balanced model",
    speed: "medium",
    capability: "advanced",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Most powerful for complex reasoning",
    speed: "slow",
    capability: "best",
  },
];

interface ChatHeaderProps {
  currentAdvisor: Advisor;
  onAdvisorChange: (advisor: Advisor) => void;
  onVoiceToggle: () => void;
  isVoiceMode: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
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
  selectedModel,
  onModelChange,
  currentModel,
  ragInfo,
}: ChatHeaderProps) {
  const selectedModelData = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-2">
        {/* Advisor Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="text-xl">{currentAdvisor.emoji}</span>
              <div className="text-left hidden sm:block">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {currentAdvisor.name}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
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
                {currentAdvisor.id === advisor.id && (
                  <Check className="h-4 w-4 text-violet-600" />
                )}
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

        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-9 px-3"
            >
              <Brain className="h-4 w-4 text-slate-500" />
              <span className="text-sm">{selectedModelData.name}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">
              Select Model
            </div>
            {AI_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={cn(
                  "flex items-center gap-3 py-2.5 cursor-pointer",
                  selectedModel === model.id && "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <div className="flex-shrink-0">
                  {model.provider === "openai" && (
                    <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">G</span>
                    </div>
                  )}
                  {model.provider === "anthropic" && (
                    <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600">C</span>
                    </div>
                  )}
                  {model.provider === "auto" && (
                    <div className="w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-violet-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.speed === "fast" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                        Fast
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{model.description}</div>
                </div>
                {selectedModel === model.id && (
                  <Check className="h-4 w-4 text-violet-600 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* RAG Indicator */}
        {ragInfo?.used && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-xs text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3 w-3" />
            <span>{ragInfo.documentsCount} sources</span>
          </div>
        )}

        {/* Active Model Indicator (when auto-routing) */}
        {currentModel && selectedModel === "auto" && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <Brain className="h-3 w-3" />
            <span>Using {currentModel.name}</span>
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
