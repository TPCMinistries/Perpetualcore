"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  CheckCircle,
  X,
  Clock,
  ChevronRight,
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
  status: string;
}

export function SuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const response = await fetch("/api/suggestions?limit=3");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptSuggestion(suggestionId: string) {
    setActionLoading(suggestionId);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Suggestion accepted");
        fetchSuggestions();
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

  function getCategoryIcon(category: string) {
    return <Sparkles className="h-4 w-4" />;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No suggestions right now</p>
            <p className="text-xs mt-1">
              We'll notify you when we have recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Suggestions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/suggestions">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <div className="mt-0.5">{getCategoryIcon(suggestion.category)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${getPriorityColor(suggestion.priority)} text-xs`}
              >
                {suggestion.priority}
              </Badge>
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Suggested:</span>
              <span className="font-medium">{suggestion.suggested_action}</span>
            </div>

            {/* Confidence */}
            {suggestion.confidence_score && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[100px]">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${suggestion.confidence_score * 100}%` }}
                  ></div>
                </div>
                <span>{Math.round(suggestion.confidence_score * 100)}%</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {suggestion.action_url ? (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    acceptSuggestion(suggestion.id);
                    window.location.href = suggestion.action_url!;
                  }}
                  disabled={actionLoading === suggestion.id}
                >
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Take Action
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => acceptSuggestion(suggestion.id)}
                  disabled={actionLoading === suggestion.id}
                >
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Accept
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissSuggestion(suggestion.id)}
                disabled={actionLoading === suggestion.id}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
