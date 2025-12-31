"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileAITriggerProps {
  onClick: () => void;
  hasUnread?: boolean;
  className?: string;
}

export function MobileAITrigger({ onClick, hasUnread, className }: MobileAITriggerProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
        "bg-gradient-to-br from-violet-500 to-purple-600",
        "hover:from-violet-600 hover:to-purple-700",
        "text-white",
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <Sparkles className="h-6 w-6" />

      {/* Unread indicator */}
      {hasUnread && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">!</span>
        </span>
      )}
    </Button>
  );
}
