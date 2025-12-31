"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Users,
  FolderKanban,
  Mail,
  FileText,
  Calendar,
  MessageSquare,
  ChevronRight,
  Link2,
  Loader2,
  Plus,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type SourceType = "task" | "contact" | "project" | "document" | "email";

interface RelatedItem {
  id: string;
  type: SourceType;
  title: string;
  subtitle?: string;
  status?: string;
  priority?: string;
  avatar_url?: string;
  emoji?: string;
  url: string;
  date?: string;
  metadata?: Record<string, unknown>;
}

interface RelatedItemsProps {
  sourceType: SourceType;
  sourceId: string;
  excludeTypes?: SourceType[];
  compact?: boolean;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<SourceType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}> = {
  task: {
    icon: CheckSquare,
    label: "Tasks",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30"
  },
  contact: {
    icon: Users,
    label: "Contacts",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  project: {
    icon: FolderKanban,
    label: "Projects",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  email: {
    icon: Mail,
    label: "Emails",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30"
  },
  document: {
    icon: FileText,
    label: "Documents",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30"
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-slate-400",
};

const STATUS_STYLES: Record<string, string> = {
  done: "text-green-600 bg-green-50 dark:bg-green-900/20",
  completed: "text-green-600 bg-green-50 dark:bg-green-900/20",
  in_progress: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  todo: "text-slate-600 bg-slate-100 dark:bg-slate-700",
};

export function RelatedItems({
  sourceType,
  sourceId,
  excludeTypes = [],
  compact = false,
  maxItems = 5,
  showHeader = true,
  className,
}: RelatedItemsProps) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchRelatedItems();
  }, [sourceType, sourceId]);

  const fetchRelatedItems = async () => {
    try {
      const excludeParam = excludeTypes.length > 0 ? `&exclude=${excludeTypes.join(",")}` : "";
      const response = await fetch(
        `/api/related-items?sourceType=${sourceType}&sourceId=${sourceId}${excludeParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch related items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<SourceType, RelatedItem[]>);

  const displayedItems = expanded ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  if (loading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-6 text-center">
          <Link2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No related items found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Items will appear here when linked
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {showHeader && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Related ({items.length})
            </h3>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {displayedItems.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const Icon = config.icon;
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.url}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  "border hover:shadow-sm transition-all",
                  config.bgColor, config.color
                )}
              >
                {item.emoji ? (
                  <span>{item.emoji}</span>
                ) : item.avatar_url ? (
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={item.avatar_url} />
                    <AvatarFallback className="text-[8px]">
                      {item.title.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="max-w-[120px] truncate">{item.title}</span>
              </Link>
            );
          })}
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              +{items.length - maxItems} more
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Related Items
            <Badge variant="secondary" className="ml-auto">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {Object.entries(groupedItems).map(([type, typeItems]) => {
          const config = TYPE_CONFIG[type as SourceType];
          const Icon = config.icon;

          return (
            <div key={type} className="border-b last:border-b-0">
              <div className={cn(
                "px-4 py-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider",
                config.bgColor, config.color
              )}>
                <Icon className="h-3.5 w-3.5" />
                {config.label} ({typeItems.length})
              </div>
              <AnimatePresence>
                {typeItems.slice(0, expanded ? undefined : 3).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                    >
                      {/* Icon/Avatar */}
                      {item.emoji ? (
                        <span className="text-lg">{item.emoji}</span>
                      ) : item.avatar_url ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {item.title.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          config.bgColor
                        )}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {item.title}
                          </span>
                          {item.priority && (
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                PRIORITY_COLORS[item.priority]
                              )}
                              title={`${item.priority} priority`}
                            />
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Status/Date */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] capitalize",
                              STATUS_STYLES[item.status]
                            )}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        )}
                        {item.date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
              {typeItems.length > 3 && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Show {typeItems.length - 3} more {config.label.toLowerCase()}
                </button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Minimal inline version for tight spaces
export function RelatedItemsInline({
  sourceType,
  sourceId,
  showType,
}: {
  sourceType: SourceType;
  sourceId: string;
  showType: SourceType;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `/api/related-items?sourceType=${sourceType}&sourceId=${sourceId}&types=${showType}`
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch related items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [sourceType, sourceId, showType]);

  if (loading) return null;
  if (items.length === 0) return null;

  const config = TYPE_CONFIG[showType];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {items.length} {items.length === 1 ? config.label.slice(0, -1) : config.label}
    </div>
  );
}
