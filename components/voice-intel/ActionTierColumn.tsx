"use client";

import { Badge } from "@/components/ui/badge";
import { ActionCard } from "./ActionCard";
import { Inbox } from "lucide-react";
import type { VoiceIntelAction, ActionTier } from "@/lib/voice-intel/types";

const TIER_CONFIG: Record<
  ActionTier,
  { label: string; color: string; bgColor: string }
> = {
  red: {
    label: "Urgent - Needs Approval",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  yellow: {
    label: "Informational",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  green: {
    label: "Auto-Completed",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
};

interface ActionTierColumnProps {
  tier: ActionTier;
  actions: VoiceIntelAction[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onView: (action: VoiceIntelAction) => void;
}

export function ActionTierColumn({
  tier,
  actions,
  onApprove,
  onReject,
  onView,
}: ActionTierColumnProps) {
  const config = TIER_CONFIG[tier];

  return (
    <div className={`rounded-lg ${config.bgColor} p-3`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${config.color}`}>
          {config.label}
        </h3>
        <Badge variant="outline" className="text-xs">
          {actions.length}
        </Badge>
      </div>

      {/* Action cards */}
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Inbox className="h-8 w-8 mb-2" />
            <p className="text-xs">No actions</p>
          </div>
        ) : (
          actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onApprove={onApprove}
              onReject={onReject}
              onView={onView}
            />
          ))
        )}
      </div>
    </div>
  );
}
