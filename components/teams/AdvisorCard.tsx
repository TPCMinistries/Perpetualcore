"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Settings,
  Bot,
  Sparkles,
  TrendingUp,
  MessagesSquare,
} from "lucide-react";

interface Advisor {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  tone: string;
  total_conversations: number;
  total_messages: number;
  enabled: boolean;
  personality_traits?: string[];
}

interface AdvisorCardProps {
  advisorId: string;
  teamId: string;
  teamName: string;
  onChat?: () => void;
  compact?: boolean;
}

export function AdvisorCard({
  advisorId,
  teamId,
  teamName,
  onChat,
  compact = false,
}: AdvisorCardProps) {
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (advisorId) {
      fetchAdvisor();
    }
  }, [advisorId]);

  const fetchAdvisor = async () => {
    try {
      const response = await fetch(`/api/assistants/${advisorId}`);
      if (response.ok) {
        const data = await response.json();
        setAdvisor(data.assistant);
      }
    } catch (error) {
      console.error("Error fetching advisor:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!advisor) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="text-3xl">{advisor.avatar_emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{advisor.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Team Advisor
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onChat}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              {advisor.avatar_emoji}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {advisor.name}
                <Badge variant="secondary" className="text-xs font-normal">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Advisor
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Dedicated advisor for {teamName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/assistants/${advisor.id}/settings`}>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {advisor.description}
        </p>

        {/* Personality traits */}
        {advisor.personality_traits && advisor.personality_traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {advisor.personality_traits.slice(0, 4).map((trait, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <MessagesSquare className="h-4 w-4" />
            <span>{advisor.total_conversations || 0} chats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>{advisor.total_messages || 0} messages</span>
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={onChat}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat with Advisor
        </Button>
      </CardContent>
    </Card>
  );
}

export default AdvisorCard;
