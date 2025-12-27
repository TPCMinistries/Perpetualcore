"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActionItem {
  id?: string;
  title: string;
  description?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  sourceText?: string;
  confidence: number;
  documentId?: string;
  documentTitle?: string;
}

interface ActionItemsListProps {
  documentId?: string;
  organizationWide?: boolean;
  className?: string;
  compact?: boolean;
  maxItems?: number;
  onItemClick?: (item: ActionItem) => void;
}

const priorityConfig: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  urgent: { color: "text-red-500 bg-red-500/10 border-red-200 dark:border-red-800", label: "Urgent", icon: AlertCircle },
  high: { color: "text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-800", label: "High", icon: AlertTriangle },
  medium: { color: "text-blue-500 bg-blue-500/10 border-blue-200 dark:border-blue-800", label: "Medium", icon: Clock },
  low: { color: "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-700", label: "Low", icon: Circle },
};

function formatDueDate(dateStr?: string): { text: string; isOverdue: boolean; isDueSoon: boolean } {
  if (!dateStr) return { text: "No due date", isOverdue: false, isDueSoon: false };

  const date = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let text = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 3;

  if (diffDays === 0) text = "Today";
  else if (diffDays === 1) text = "Tomorrow";
  else if (isOverdue) text = `${Math.abs(diffDays)} days overdue`;

  return { text, isOverdue, isDueSoon };
}

export function ActionItemsList({
  documentId,
  organizationWide = false,
  className,
  compact = false,
  maxItems = 20,
  onItemClick,
}: ActionItemsListProps) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchActionItems();
  }, [documentId, organizationWide]);

  const fetchActionItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (documentId) {
        params.set("documentId", documentId);
        params.set("type", "actions");
      }

      const response = await fetch(`/api/library/intelligence?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (documentId) {
          setItems(data.actionItems || []);
        } else {
          setItems(data.pendingActionItems || []);
        }
      }
    } catch (error) {
      console.error("Error fetching action items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (index: number) => {
    const item = items[index];
    const newStatus = item.status === "completed" ? "pending" : "completed";

    // Optimistic update
    setItems(prev => prev.map((it, i) =>
      i === index ? { ...it, status: newStatus } : it
    ));

    if (item.id) {
      try {
        await fetch(`/api/library/intelligence/actions/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (error) {
        // Revert on error
        setItems(prev => prev.map((it, i) =>
          i === index ? { ...it, status: item.status } : it
        ));
        toast.error("Failed to update status");
      }
    }
  };

  const pendingItems = items.filter(i => i.status !== "completed");
  const completedItems = items.filter(i => i.status === "completed");
  const displayedItems = (showCompleted ? items : pendingItems).slice(0, maxItems);

  // Sort by priority and due date
  displayedItems.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.dueDate ? -1 : 1;
  });

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No action items found</p>
        ) : (
          displayedItems.slice(0, 5).map((item, i) => {
            const config = priorityConfig[item.priority];
            const Icon = config.icon;
            const { text: dueDateText, isOverdue } = formatDueDate(item.dueDate);
            return (
              <div
                key={i}
                className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                onClick={() => onItemClick?.(item)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(i);
                  }}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    item.status === "completed" ? "text-green-500" : "text-slate-400 hover:text-green-500"
                  )}
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-slate-700 dark:text-slate-300 truncate",
                    item.status === "completed" && "line-through opacity-60"
                  )}>
                    {item.title}
                  </p>
                </div>
                <span className={cn(
                  "text-xs flex-shrink-0",
                  isOverdue ? "text-red-500" : "text-slate-400"
                )}>
                  {dueDateText}
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Action Items</h3>
          <span className="text-sm text-slate-400">
            ({pendingItems.length} pending)
          </span>
        </div>
        {completedItems.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {showCompleted ? "Hide" : "Show"} completed ({completedItems.length})
          </button>
        )}
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No action items found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Extract intelligence to find tasks and action items
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayedItems.map((item, index) => {
              const config = priorityConfig[item.priority];
              const Icon = config.icon;
              const { text: dueDateText, isOverdue, isDueSoon } = formatDueDate(item.dueDate);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all cursor-pointer",
                    "hover:shadow-md",
                    item.status === "completed"
                      ? "opacity-60 border-slate-200 dark:border-slate-700"
                      : config.color.split(" ").find(c => c.startsWith("border")) || "border-slate-200 dark:border-slate-700"
                  )}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(index);
                      }}
                      className={cn(
                        "mt-0.5 flex-shrink-0 transition-colors",
                        item.status === "completed" ? "text-green-500" : "text-slate-400 hover:text-green-500"
                      )}
                    >
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-medium text-slate-900 dark:text-white",
                            item.status === "completed" && "line-through"
                          )}>
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {/* Priority badge */}
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                              config.color
                            )}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </span>

                            {/* Assignee */}
                            {item.assigneeName && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.assigneeName}
                              </span>
                            )}

                            {/* Due date */}
                            <span className={cn(
                              "text-xs flex items-center gap-1",
                              isOverdue ? "text-red-500 font-medium" : isDueSoon ? "text-amber-500" : "text-slate-500"
                            )}>
                              <Calendar className="h-3 w-3" />
                              {dueDateText}
                            </span>
                          </div>

                          {/* Source document */}
                          {item.documentTitle && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                              <FileText className="h-3 w-3" />
                              {item.documentTitle}
                            </div>
                          )}

                          {/* Source text */}
                          {item.sourceText && (
                            <p className="mt-2 text-xs text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-600 pl-2">
                              "{item.sourceText}"
                            </p>
                          )}
                        </div>

                        {/* Arrow for clickable */}
                        {onItemClick && (
                          <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Confidence indicator */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
