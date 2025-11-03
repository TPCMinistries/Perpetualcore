"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  Users,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { SharedConversationWithParticipants } from "@/types";

export default function TeamConversationsPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<SharedConversationWithParticipants[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      setConversations(data.conversations || []);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error(error.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100 animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Team Conversations
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Collaborate with your team using AI-powered conversations
                </p>
              </div>
            </div>
            <Link href="/dashboard/conversations/new">
              <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </Link>
          </div>
        </div>

        {/* Conversations Grid */}
        {conversations.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12">
            <div className="text-center max-w-2xl mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Start Your First Team Conversation
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Create collaborative AI conversations where your team can work together,
                  share knowledge, and get AI assistance in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Collaborate</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Work together with team members on projects
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">AI Powered</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get intelligent responses from Claude AI
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Document Context</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Link conversations to documents for context
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/dashboard/conversations/new">
                  <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Conversation
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conv: any) => (
              <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`}>
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105 duration-300">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {conv.title}
                        </h3>
                        {conv.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            {conv.description}
                          </p>
                        )}
                      </div>
                      <MessageSquare className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 ml-2" />
                    </div>

                    {/* Context Badge */}
                    {conv.context_type && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {conv.context_type === "document" && <FileText className="h-3 w-3 mr-1" />}
                        {conv.context_type}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <MessageSquare className="h-4 w-4" />
                        <span>{conv.message_count || 0} messages</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(conv.last_message_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
