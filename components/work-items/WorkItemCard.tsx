"use client";

import { WorkItem, WorkItemPriority } from "@/types/work";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GripVertical,
  AlertTriangle,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkItemCardProps {
  item: WorkItem;
  onClick?: () => void;
  showDragHandle?: boolean;
  compact?: boolean;
}

const priorityConfig: Record<
  WorkItemPriority,
  { label: string; color: string; bgColor: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

export function WorkItemCard({
  item,
  onClick,
  showDragHandle = false,
  compact = false,
}: WorkItemCardProps) {
  const priority = priorityConfig[item.priority] || priorityConfig.medium;
  const isOverdue =
    item.due_date && !item.completed_at && new Date(item.due_date) < new Date();
  const assignedUser = (item as Record<string, unknown>).assigned_user as {
    full_name?: string;
    avatar_url?: string;
  } | undefined;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer group",
        item.is_exception && "border-red-300 bg-red-50/50",
        isOverdue && !item.is_exception && "border-orange-300"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-3", compact && "p-2")}>
        <div className="flex items-start gap-2">
          {showDragHandle && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="font-medium text-sm leading-tight line-clamp-2">
                {item.title}
              </h4>
              {item.is_exception && (
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
            </div>

            {/* Description (if not compact) */}
            {!compact && item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>
            )}

            {/* Badges Row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <Badge
                variant="secondary"
                className={cn("text-[10px] px-1.5 py-0 h-4", priority.bgColor, priority.color)}
              >
                {priority.label}
              </Badge>

              {item.ai_score !== null && item.ai_score !== undefined && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 gap-0.5"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {Math.round(item.ai_score)}
                </Badge>
              )}

              {item.tags?.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                {item.due_date && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5",
                      isOverdue && "text-red-500"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(item.due_date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                {!item.due_date && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {assignedUser && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={assignedUser.avatar_url} />
                  <AvatarFallback className="text-[8px]">
                    {assignedUser.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Exception Reason */}
            {item.is_exception && item.exception_reason && (
              <div className="mt-2 p-1.5 rounded bg-red-100 text-red-700 text-[10px]">
                {item.exception_reason}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
