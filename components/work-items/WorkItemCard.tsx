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
  Mail,
  Phone,
  Linkedin,
  Globe,
  User,
  Bot,
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
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    dotColor: "bg-slate-400",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    dotColor: "bg-blue-500",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    dotColor: "bg-orange-500",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-100",
    dotColor: "bg-red-500",
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

  // Extract custom fields
  const customFields = (item.custom_fields || {}) as Record<string, string>;
  const email = customFields.email;
  const phone = customFields.phone;
  const linkedinUrl = customFields.linkedin_url;
  const websiteUrl = customFields.website_url;
  const hasContactInfo = email || phone || linkedinUrl || websiteUrl;

  // Get initials from title (for person names)
  const initials = item.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group border-l-4",
        item.is_exception && "border-l-red-500 bg-red-50/30",
        isOverdue && !item.is_exception && "border-l-orange-500",
        !item.is_exception && !isOverdue && "border-l-transparent hover:border-l-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-3", compact && "p-2")}>
        <div className="flex items-start gap-3">
          {showDragHandle && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab mt-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Avatar/Initial */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            {assignedUser?.avatar_url ? (
              <AvatarImage src={assignedUser.avatar_url} />
            ) : null}
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight truncate">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Priority Indicator */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className={cn("w-2 h-2 rounded-full", priority.dotColor)}
                     title={priority.label} />
                {item.is_exception && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            {/* Contact Info Row */}
            {hasContactInfo && !compact && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{email}</span>
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Phone className="h-3 w-3" />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-[#0077B5]"
                  >
                    <Linkedin className="h-3 w-3" />
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Globe className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* AI Insights */}
            {item.ai_insights && !compact && (
              <div className="mt-2 p-2 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-1 text-[10px] font-medium text-purple-700 dark:text-purple-300 mb-0.5">
                  <Bot className="h-3 w-3" />
                  AI Insight
                </div>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 line-clamp-2">
                  {typeof item.ai_insights === 'string'
                    ? item.ai_insights
                    : JSON.stringify(item.ai_insights).slice(0, 100)}
                </p>
              </div>
            )}

            {/* Footer Row */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {/* AI Score */}
                {item.ai_score !== null && item.ai_score !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 gap-0.5 font-medium",
                      item.ai_score >= 80 && "bg-green-100 text-green-700",
                      item.ai_score >= 50 && item.ai_score < 80 && "bg-yellow-100 text-yellow-700",
                      item.ai_score < 50 && "bg-red-100 text-red-700"
                    )}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {Math.round(item.ai_score)}%
                  </Badge>
                )}

                {/* Due Date */}
                {item.due_date && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5",
                      isOverdue && "text-red-500 font-medium"
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

                {/* Created Time */}
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

              {/* Tags */}
              <div className="flex items-center gap-1">
                {item.tags?.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-3.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exception Reason */}
            {item.is_exception && item.exception_reason && (
              <div className="mt-2 p-2 rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-[11px]">
                <span className="font-medium">Needs attention: </span>
                {item.exception_reason}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
