"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckSquare,
  Mail,
  Bell,
  Zap,
  AtSign,
  Users,
  Sparkles,
  Clock,
  Star,
  Archive,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AttentionItem as AttentionItemType, getPriorityLabel } from "@/lib/attention/priority";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AttentionItemProps {
  item: AttentionItemType;
  isSelected?: boolean;
  isCompact?: boolean;
  onSelect?: () => void;
  onResolve?: () => void;
  onStar?: () => void;
  onArchive?: () => void;
}

const typeConfig = {
  task: {
    icon: CheckSquare,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    href: "/dashboard/tasks",
  },
  email: {
    icon: Mail,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    href: "/dashboard/inbox",
  },
  notification: {
    icon: Bell,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    href: "/dashboard/inbox",
  },
  automation: {
    icon: Zap,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    href: "/dashboard/automation",
  },
  mention: {
    icon: AtSign,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    href: "/dashboard/inbox",
  },
  team_request: {
    icon: Users,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    href: "/dashboard/team",
  },
  ai_suggestion: {
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    href: "/dashboard/intelligence",
  },
};

export function AttentionItemComponent({
  item,
  isSelected = false,
  isCompact = false,
  onSelect,
  onResolve,
  onStar,
  onArchive,
}: AttentionItemProps) {
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const priority = getPriorityLabel(item.aiPriorityScore ?? 0.5);
  const itemHref = item.metadata?.href || `${config.href}?id=${item.sourceId}`;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg transition-all",
        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        isSelected && "bg-slate-100 dark:bg-slate-800",
        item.isResolved && "opacity-60"
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="flex-shrink-0 pt-0.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
          />
        </div>
      )}

      {/* Type Icon */}
      <div className={cn("flex-shrink-0 p-2 rounded-lg", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title with link */}
            <Link href={itemHref} className="group/link">
              <p className={cn(
                "font-medium truncate group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400",
                isCompact ? "text-sm" : "text-base"
              )}>
                {item.title}
                <ExternalLink className="inline h-3 w-3 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </p>
            </Link>

            {/* Preview */}
            {!isCompact && item.preview && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {item.preview}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-1">
              {/* Priority badge */}
              {item.aiPriorityScore && item.aiPriorityScore >= 0.6 && (
                <Badge variant={priority.variant} className="text-xs">
                  {priority.label}
                </Badge>
              )}

              {/* Source */}
              <span className="text-xs text-muted-foreground">
                {item.source}
              </span>

              {/* Due date */}
              {item.dueAt && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  new Date(item.dueAt) < new Date() ? "text-red-500" : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.dueAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>

            {/* Quick actions - visible on hover */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onResolve && !item.isResolved && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    onResolve();
                  }}
                  title="Mark as done"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {onStar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    onStar();
                  }}
                  title="Star"
                >
                  <Star className={cn(
                    "h-3 w-3",
                    item.metadata?.isStarred && "fill-yellow-500 text-yellow-500"
                  )} />
                </Button>
              )}
              {onArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    onArchive();
                  }}
                  title="Archive"
                >
                  <Archive className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
