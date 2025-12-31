"use client";

import { Button } from "@/components/ui/button";
import {
  Mail,
  CheckSquare,
  MessageSquare,
  Calendar,
  Zap,
  FileText,
  Send,
  Brain
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  count?: number;
}

interface QuickMorningActionsProps {
  actions: QuickAction[];
}

const iconMap: Record<string, any> = {
  mail: Mail,
  "check-square": CheckSquare,
  "message-square": MessageSquare,
  calendar: Calendar,
  zap: Zap,
  "file-text": FileText,
  send: Send,
  brain: Brain,
};

export function QuickMorningActions({ actions }: QuickMorningActionsProps) {
  const router = useRouter();

  const handleAction = (action: string) => {
    // Handle different action types
    if (action.startsWith("/")) {
      router.push(action);
    } else if (action.startsWith("cmd:")) {
      // Trigger command palette or specific action
      const cmd = action.replace("cmd:", "");
      // Dispatch custom event for command handling
      window.dispatchEvent(new CustomEvent("quick-action", { detail: { command: cmd } }));
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = iconMap[action.icon] || Brain;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleAction(action.action)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {action.label}
            {action.count !== undefined && action.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded-full">
                {action.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
