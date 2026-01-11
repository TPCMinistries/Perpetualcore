"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  MessageSquare,
  Users,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Lightbulb,
  Heart,
  Target,
  BookOpen,
  Activity,
  Loader2,
  ChevronRight,
  Plus,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface MemoryStats {
  documents: { count: number; lastAdded: string | null };
  conversations: { count: number; totalMessages: number };
  contacts: { count: number; withContext: number };
  tasks: { count: number; completed: number };
  memories: {
    total: number;
    byType: Record<string, number>;
    lastLearned: string | null;
    highConfidence: number;
  };
  learningLog: {
    todayCount: number;
    weekCount: number;
    recentEvents: Array<{
      type: string;
      content: string;
      created_at: string;
    }>;
  };
  conversationContexts: number;
  insights: number;
}

const MEMORY_TYPE_ICONS: Record<string, any> = {
  fact: BookOpen,
  preference: Heart,
  project: Target,
  relationship: Users,
  goal: TrendingUp,
  style: Sparkles,
  context: Brain,
  skill: Zap,
  challenge: Activity,
  workflow: Clock,
};

const MEMORY_TYPE_COLORS: Record<string, string> = {
  fact: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preference: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  project: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  relationship: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  goal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  context: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  skill: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  challenge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  workflow: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function MemoryPage() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/memory/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch memory stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Failed to load memory stats</p>
      </div>
    );
  }

  const totalKnowledge =
    stats.documents.count +
    stats.conversations.totalMessages +
    stats.contacts.count +
    stats.memories.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg"
            >
              <Brain className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Your AI Brain
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Everything your AI knows about you and your work
              </p>
            </div>
          </div>
          <Link href="/dashboard/onboarding/brain-dump">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Teach AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Brain Health Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/50 dark:to-slate-900 col-span-1 md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <Database className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Knowledge</p>
                <p className="text-4xl font-bold text-violet-700 dark:text-violet-300">
                  {totalKnowledge.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  pieces of information indexed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-slate-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI Memories</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.memories.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-slate-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Insights</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.insights}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Knowledge Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Documents</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {stats.documents.count}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Last added {formatTime(stats.documents.lastAdded)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {stats.conversations.count}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.conversations.totalMessages.toLocaleString()} messages
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Contacts</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {stats.contacts.count}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.contacts.withContext} with AI context
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tasks</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {stats.tasks.count}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.tasks.completed} completed
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Types */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">What AI Remembers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.memories.byType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.memories.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const Icon = MEMORY_TYPE_ICONS[type] || Brain;
                    const colorClass = MEMORY_TYPE_COLORS[type] || "bg-slate-100 text-slate-700";
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No memories yet. Start chatting to teach your AI!
                </p>
                <Link href="/dashboard/chat">
                  <Button variant="outline" size="sm">
                    Start Chatting <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Activity */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-900 dark:text-slate-100">Learning Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.learningLog.todayCount}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Learned today</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.learningLog.weekCount}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">This week</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Recent Learning
              </p>
              {stats.learningLog.recentEvents.length > 0 ? (
                stats.learningLog.recentEvents.slice(0, 5).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {event.content}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatEventType(event.type)} {formatTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No recent learning events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            Grow Your AI Brain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/onboarding/brain-dump" className="block">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                    <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Brain Dump</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tell AI about your work, goals, and preferences
                </p>
              </div>
            </Link>

            <Link href="/dashboard/library" className="block">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Upload Documents</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add files, PDFs, and documents for AI to learn from
                </p>
              </div>
            </Link>

            <Link href="/dashboard/chat" className="block">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                    <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">Chat & Learn</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  AI learns from your conversations automatically
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
