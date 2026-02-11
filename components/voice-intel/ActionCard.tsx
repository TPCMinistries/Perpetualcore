"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, CheckCircle2, XCircle, Zap } from "lucide-react";
import { PeopleList } from "./PeopleList";
import type { VoiceIntelAction } from "@/lib/voice-intel/types";

const TIER_BORDER: Record<string, string> = {
  red: "border-l-4 border-l-red-500",
  yellow: "border-l-4 border-l-amber-500",
  green: "border-l-4 border-l-emerald-500",
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: <XCircle className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  auto_completed: {
    label: "Auto",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <Zap className="h-3 w-3" />,
  },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface ActionCardProps {
  action: VoiceIntelAction;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onView?: (action: VoiceIntelAction) => void;
}

export function ActionCard({
  action,
  onApprove,
  onReject,
  onView,
}: ActionCardProps) {
  const [rejecting, setRejecting] = useState(false);

  const border = TIER_BORDER[action.tier] || "";
  const statusInfo = STATUS_BADGE[action.status] || STATUS_BADGE.pending;
  const showActions = action.tier === "red" && action.status === "pending";

  return (
    <Card
      className={`${border} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onView?.(action)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
            {action.title}
          </h4>
          <Badge variant="outline" className={`text-xs shrink-0 gap-1 ${statusInfo.className}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>

        {/* Description */}
        {action.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {action.description}
          </p>
        )}

        {/* Badges row: entity + action_type */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {action.related_entity && (
            <Badge variant="secondary" className="text-xs py-0">
              {action.related_entity}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs py-0">
            {action.action_type}
          </Badge>
        </div>

        {/* People */}
        {action.related_people && action.related_people.length > 0 && (
          <PeopleList people={action.related_people} />
        )}

        {/* Footer: time + actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400">
            {timeAgo(action.created_at)}
          </span>

          {showActions && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => onApprove?.(action.id)}
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => {
                  if (rejecting) return;
                  setRejecting(true);
                  const reason = prompt("Rejection reason:");
                  if (reason) {
                    onReject?.(action.id, reason);
                  }
                  setRejecting(false);
                }}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
