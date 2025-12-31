"use client";

import { Button } from "@/components/ui/button";
import { useAIAssistantContext } from "./AIAssistantProvider";
import { Sparkles } from "lucide-react";
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

interface AIAssistantTriggerProps {
  className?: string;
  showLabel?: boolean;
}

export function AIAssistantTrigger({ className, showLabel = false }: AIAssistantTriggerProps) {
  const { toggle, isOpen, messages } = useAIAssistantContext();

  return (
    <Button
      onClick={toggle}
      size={showLabel ? "default" : "icon"}
      className={cn(
        "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
        "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
        "text-white",
        isOpen && "opacity-0 pointer-events-none",
        className
      )}
      title={`AI Assistant (${formatShortcut("mod+j")})`}
    >
      <Sparkles className={cn("h-5 w-5", showLabel && "mr-2")} />
      {showLabel && "AI Assistant"}

      {/* Unread indicator */}
      {messages.length > 0 && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
      )}
    </Button>
  );
}
