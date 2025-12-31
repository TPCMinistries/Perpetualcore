"use client";

import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PenLine,
  Brain,
  ListOrdered,
  GitBranch,
  HelpCircle,
  History,
  Mail,
  Zap,
} from "lucide-react";
import { QuickAction } from "@/hooks/useAIAssistant";
import { cn } from "@/lib/utils";

interface AIQuickActionsProps {
  actions: QuickAction[];
  compact?: boolean;
}

const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  pen: PenLine,
  brain: Brain,
  "list-ordered": ListOrdered,
  "git-branch": GitBranch,
  "help-circle": HelpCircle,
  history: History,
  mail: Mail,
  zap: Zap,
};

export function AIQuickActions({ actions, compact = false }: AIQuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      compact ? "justify-start" : "justify-center"
    )}>
      {actions.map((action) => {
        const Icon = action.icon ? iconMap[action.icon] || Sparkles : Sparkles;

        return (
          <Button
            key={action.id}
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={action.action}
            className={cn(
              "gap-2",
              compact && "h-7 text-xs"
            )}
          >
            <Icon className={cn("h-4 w-4", compact && "h-3 w-3")} />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
