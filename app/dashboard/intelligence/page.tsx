"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Zap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const priorityColors = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

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
      <DashboardPageWrapper>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <DashboardHeader
        title="Intelligence"
        subtitle="AI-powered insights, patterns, and suggestions from your conversations"
        icon={Brain}
        iconColor="violet"
        stats={[
          { label: "insights", value: insights.length },
          { label: "patterns", value: patterns.length },
          { label: "suggestions", value: suggestions.filter(s => s.status === "pending").length },
        ]}
        actions={[
          {
            label: generating ? "Generating..." : "Generate Suggestions",
            icon: generating ? Loader2 : Sparkles,
            onClick: generateSuggestions,
            variant: "primary",
          },
        ]}
      />

      {/* Stats Cards */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <StatCardGrid columns={4} className="mb-6">
          <StatCard
            label="Total Insights"
            value={insights.length}
            icon={Lightbulb}
            iconColor="amber"
            description="Learned from conversations"
          />
          <StatCard
            label="Patterns Found"
            value={patterns.length}
            icon={TrendingUp}
            iconColor="emerald"
            description="Recurring behaviors"
          />
          <StatCard
            label="Preferences"
            value={preferences.length}
            icon={Target}
            iconColor="blue"
            description="User preferences learned"
          />
          <StatCard
            label="Active Suggestions"
            value={suggestions.filter(s => s.status === "pending").length}
            icon={Sparkles}
            iconColor="violet"
            description="Awaiting your review"
          />
        </StatCardGrid>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Predictive Suggestions</CardTitle>
                  <CardDescription>AI-generated recommendations based on your activity</CardDescription>
                </div>
              </div>
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="font-medium">
                  {suggestions.filter(s => s.status === "pending").length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Sparkles className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No suggestions yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-4">
                  Have some conversations to generate intelligent suggestions tailored to your workflow.
                </p>
                <Button
                  onClick={generateSuggestions}
                  disabled={generating}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Suggestions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion, i) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {suggestion.title}
                          </h4>
                          <Badge className={cn("text-xs", priorityColors[suggestion.priority as keyof typeof priorityColors] || priorityColors.low)}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {Math.round(suggestion.relevance_score * 100)}% relevant
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {suggestion.suggestion_type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {suggestion.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSuggestionStatus(suggestion.id, "accepted")}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateSuggestionStatus(suggestion.id, "dismissed")}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {suggestion.status !== "pending" && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.status}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Three Column Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Insights */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Insights
                    <Badge variant="secondary" className="font-medium">
                      {insights.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Learned from conversations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Lightbulb className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No insights yet. Keep chatting!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.slice(0, 4).map((insight, i) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30"
                    >
                      <div className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                        {insight.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {insight.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${insight.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {Math.round(insight.confidence_score * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Patterns */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Patterns
                    <Badge variant="secondary" className="font-medium">
                      {patterns.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Recognized behaviors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {patterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No patterns detected yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patterns.slice(0, 4).map((pattern, i) => (
                    <motion.div
                      key={pattern.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30"
                    >
                      <div className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                        {pattern.pattern_name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {pattern.pattern_description}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{pattern.occurrence_count} occurrences</span>
                        <span>{Math.round(pattern.confidence * 100)}% confident</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Preferences
                    <Badge variant="secondary" className="font-medium">
                      {preferences.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Learned user preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {preferences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No preferences learned yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preferences.slice(0, 5).map((pref, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {pref.preference_type}
                        </Badge>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {pref.preference_key}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {typeof pref.preference_value === "object"
                          ? JSON.stringify(pref.preference_value)
                          : String(pref.preference_value)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${pref.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {Math.round(pref.confidence * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardPageWrapper>
  );
}
