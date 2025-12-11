"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton-loader";
import { LoadingButton } from "@/components/ui/loading-button";
import { Brain, Lightbulb, TrendingUp, Target, Sparkles, RefreshCw, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  confidence_score: number;
  relevance_score: number;
}

interface Pattern {
  id: string;
  pattern_name: string;
  pattern_description: string;
  pattern_type: string;
  occurrence_count: number;
  confidence: number;
}

interface Preference {
  preference_type: string;
  preference_key: string;
  preference_value: any;
  confidence: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  suggestion_type: string;
  relevance_score: number;
  priority: string;
  status: string;
}

export default function IntelligenceDashboard() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadIntelligence();
  }, []);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/intelligence/summary");
      if (!response.ok) throw new Error("Failed to load intelligence");
      
      const data = await response.json();
      setInsights(data.insights || []);
      setPatterns(data.patterns || []);
      setPreferences(data.preferences || []);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error loading intelligence:", error);
      toast.error("Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/intelligence/suggestions?generate=true");
      if (!response.ok) throw new Error("Failed to generate suggestions");
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success("Suggestions generated successfully");
      await loadIntelligence();
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: string) => {
    try {
      const response = await fetch("/api/intelligence/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, status }),
      });
      
      if (!response.ok) throw new Error("Failed to update suggestion");
      
      toast.success(`Suggestion ${status}`);
      await loadIntelligence();
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast.error("Failed to update suggestion");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Your organization's learning and insights</p>
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Your organization's learning and insights</p>
        </div>
        <LoadingButton
          onClick={generateSuggestions}
          isLoading={generating}
          loadingText="Generating suggestions..."
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Suggestions
        </LoadingButton>
      </div>

      {/* Suggestions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Predictive Suggestions
        </h2>
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No suggestions yet. Have some conversations to generate intelligent suggestions.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      <CardDescription className="mt-2">{suggestion.description}</CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSuggestionStatus(suggestion.id, "accepted")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSuggestionStatus(suggestion.id, "dismissed")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Priority: {suggestion.priority}</span>
                    <span>Relevance: {Math.round(suggestion.relevance_score * 100)}%</span>
                    <span>Type: {suggestion.suggestion_type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Insights ({insights.length})
            </CardTitle>
            <CardDescription>Learned insights from conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No insights yet</p>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 bg-muted rounded-md">
                    <div className="font-semibold text-sm mb-1">{insight.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {insight.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(insight.confidence_score * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Patterns ({patterns.length})
            </CardTitle>
            <CardDescription>Recognized patterns across conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patterns yet</p>
            ) : (
              <div className="space-y-3">
                {patterns.slice(0, 3).map((pattern) => (
                  <div key={pattern.id} className="p-3 bg-muted rounded-md">
                    <div className="font-semibold text-sm mb-1">{pattern.pattern_name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {pattern.pattern_description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Occurrences: {pattern.occurrence_count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Preferences ({preferences.length})
            </CardTitle>
            <CardDescription>Learned user preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {preferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No preferences learned yet</p>
            ) : (
              <div className="space-y-3">
                {preferences.slice(0, 5).map((pref, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-md">
                    <div className="font-semibold text-sm mb-1">
                      {pref.preference_type}: {pref.preference_key}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(pref.preference_value)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(pref.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

