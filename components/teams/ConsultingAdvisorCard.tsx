"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Settings,
  X,
  TrendingUp,
  MessagesSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConsultingAdvisor {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  enabled: boolean;
  total_conversations: number;
  total_messages: number;
  personality_traits?: string[];
  consulting_id: string;
  added_at: string;
  notes?: string;
}

interface ConsultingAdvisorCardProps {
  advisor: ConsultingAdvisor;
  onChat: () => void;
  onRemove: () => void;
  removing?: boolean;
}

export function ConsultingAdvisorCard({
  advisor,
  onChat,
  onRemove,
  removing = false,
}: ConsultingAdvisorCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
      <div className="text-3xl p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        {advisor.avatar_emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{advisor.name}</p>
          <Badge variant="outline" className="text-xs">
            Consultant
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
          {advisor.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MessagesSquare className="h-3 w-3" />
            {advisor.total_conversations || 0}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {advisor.total_messages || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onChat}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat with {advisor.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/dashboard/assistants/${advisor.id}/settings`}>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                disabled={removing}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove from team</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default ConsultingAdvisorCard;
