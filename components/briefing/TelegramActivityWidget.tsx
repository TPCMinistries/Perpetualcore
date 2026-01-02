"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Zap,
  Lightbulb,
  DollarSign,
  Bell,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TelegramInteraction {
  id: string;
  message_text: string;
  detected_intent: string;
  created_entity_type?: string;
  created_entity_id?: string;
  ai_response?: string;
  created_at: string;
}

interface TelegramActivityData {
  interactions: TelegramInteraction[];
  summary: {
    todayCount: number;
    mostRecentIntent: string | null;
    entitiesCreated: number;
  };
}

const INTENT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  task: { icon: CheckCircle2, color: "text-blue-500 bg-blue-100", label: "Task" },
  idea: { icon: Lightbulb, color: "text-yellow-500 bg-yellow-100", label: "Idea" },
  expense: { icon: DollarSign, color: "text-green-500 bg-green-100", label: "Expense" },
  reminder: { icon: Bell, color: "text-purple-500 bg-purple-100", label: "Reminder" },
  search: { icon: Search, color: "text-indigo-500 bg-indigo-100", label: "Search" },
  content: { icon: FileText, color: "text-pink-500 bg-pink-100", label: "Content" },
  chat: { icon: MessageSquare, color: "text-slate-500 bg-slate-100", label: "Chat" },
  unknown: { icon: Zap, color: "text-gray-500 bg-gray-100", label: "Other" },
};

interface TelegramActivityWidgetProps {
  limit?: number;
  compact?: boolean;
}

export function TelegramActivityWidget({
  limit = 5,
  compact = false,
}: TelegramActivityWidgetProps) {
  const [data, setData] = useState<TelegramActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [limit]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/telegram/activity?limit=${limit}`);
      if (response.ok) {
        const activityData = await response.json();
        setData(activityData);
      }
    } catch (error) {
      console.error("Failed to fetch Telegram activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.interactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            Telegram Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent Telegram activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Message your Telegram bot to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            Telegram Activity
          </CardTitle>
          {data.summary.todayCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {data.summary.todayCount} today
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Quick Stats */}
        {!compact && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{data.summary.entitiesCreated} created</span>
            </div>
            {data.summary.mostRecentIntent && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Last: {data.summary.mostRecentIntent}</span>
              </div>
            )}
          </div>
        )}

        {/* Activity List */}
        <div className="space-y-2">
          {data.interactions.map((interaction, index) => {
            const intentConfig = INTENT_CONFIG[interaction.detected_intent] || INTENT_CONFIG.unknown;
            const IntentIcon = intentConfig.icon;

            return (
              <motion.div
                key={interaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn("p-1.5 rounded-lg", intentConfig.color)}>
                  <IntentIcon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {truncateMessage(interaction.message_text)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs py-0">
                      {intentConfig.label}
                    </Badge>
                    {interaction.created_entity_type && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Created {interaction.created_entity_type}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(interaction.created_at)}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* View All Link */}
        {!compact && data.interactions.length >= limit && (
          <div className="mt-3 pt-3 border-t">
            <a
              href="/dashboard/activity?source=telegram"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all Telegram activity
              <Clock className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
