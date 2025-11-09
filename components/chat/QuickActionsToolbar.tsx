"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { quickActions } from "@/lib/prompts/templates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsToolbarProps {
  visible: boolean;
  onAction: (action: string, prompt: string) => void;
  selectedText?: string;
}

export default function QuickActionsToolbar({
  visible,
  onAction,
  selectedText = "",
}: QuickActionsToolbarProps) {
  if (!visible) return null;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 p-2 rounded-xl",
          "border border-slate-200 dark:border-slate-800",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg",
          "shadow-2xl",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        {/* Label */}
        <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-800">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Quick Actions
          </span>
        </div>

        {/* Action Buttons */}
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const prompt = action.prompt.replace("{selection}", selectedText);
                    onAction(action.id, prompt);
                  }}
                  className="h-9 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {action.label} the selected text
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
