"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Lightbulb,
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  Filter,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  suggested_action: string;
  action_url: string | null;
  confidence_score: number;
  reasoning: string;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  dismissed: number;
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    accepted: 0,
    dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  const filters = [
    { id: "pending", label: "Active" },
    { id: "accepted", label: "Accepted" },
    { id: "dismissed", label: "Dismissed" },
    { id: "all", label: "All" },
  ];

  useEffect(() => {
    fetchSuggestions();
  }, [filter]);

  async function fetchSuggestions() {
    try {
      const response = await fetch(`/api/suggestions?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }

  async function acceptSuggestion(suggestionId: string, actionUrl: string | null) {
    setActionLoading(suggestionId);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Suggestion accepted");
        if (actionUrl) {
          window.location.href = actionUrl;
        } else {
          fetchSuggestions();
        }
      } else {
        toast.error("Failed to accept suggestion");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  async function dismissSuggestion(suggestionId: string) {
    setActionLoading(suggestionId);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/dismiss`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Suggestion dismissed");
        fetchSuggestions();
      } else {
        toast.error("Failed to dismiss suggestion");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  async function snoozeSuggestion(suggestionId: string) {
    setActionLoading(suggestionId);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 24 }),
      });

      if (response.ok) {
        toast.success("Suggestion snoozed for 24 hours");
        fetchSuggestions();
      } else {
        toast.error("Failed to snooze suggestion");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }

  function getCategoryBadge(category: string) {
    const colors: { [key: string]: string } = {
      productivity: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      workflow: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      task: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      document: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      email: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      optimization: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      insight: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    };

    return (
      <Badge variant="outline" className={colors[category] || "bg-gray-100"}>
        {category}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border border-yellow-100 dark:border-yellow-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-900 via-amber-800 to-orange-900 dark:from-yellow-100 dark:via-amber-100 dark:to-orange-100 bg-clip-text text-transparent">AI Suggestions</h1>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Intelligent recommendations to improve your workflow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dismissed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.dismissed}</p>
              </div>
              <X className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No suggestions"
          description={
            filter === "pending"
              ? "You're all caught up! We'll notify you when we have new recommendations."
              : `No ${filter} suggestions found.`
          }
        />
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getCategoryBadge(suggestion.category)}
                      <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="flex items-center gap-2 text-sm bg-accent/50 rounded-lg p-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">{suggestion.suggested_action}</span>
                  </div>

                  {/* Reasoning */}
                  {suggestion.reasoning && (
                    <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3">
                      <span className="font-medium">Why: </span>
                      {suggestion.reasoning}
                    </div>
                  )}

                  {/* Confidence */}
                  {suggestion.confidence_score && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="flex-1 bg-muted rounded-full h-2 max-w-[200px]">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${suggestion.confidence_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">
                        {Math.round(suggestion.confidence_score * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {suggestion.status === "pending" && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        variant="default"
                        onClick={() => acceptSuggestion(suggestion.id, suggestion.action_url)}
                        disabled={actionLoading === suggestion.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {suggestion.action_url ? "Take Action" : "Accept"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => snoozeSuggestion(suggestion.id)}
                        disabled={actionLoading === suggestion.id}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Snooze
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => dismissSuggestion(suggestion.id)}
                        disabled={actionLoading === suggestion.id}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground">
                    {new Date(suggestion.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
