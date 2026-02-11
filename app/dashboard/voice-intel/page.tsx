"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Brain, TrendingUp, Users, Building2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActionQueueHeader } from "@/components/voice-intel/ActionQueueHeader";
import { ActionTierColumn } from "@/components/voice-intel/ActionTierColumn";
import { ActionDetailSheet } from "@/components/voice-intel/ActionDetailSheet";
import type {
  VoiceIntelAction,
  ActionTier,
  EntityType,
} from "@/lib/voice-intel/types";
import type { PatternInsight, EntityDashboard } from "@/lib/voice-intel/intelligence";

const TIERS: ActionTier[] = ["red", "yellow", "green"];

const ENTITIES: EntityType[] = [
  "IHA",
  "Uplift Communities",
  "DeepFutures Capital",
  "TPC Ministries",
  "Perpetual Core",
  "Personal/Family",
];

export default function VoiceIntelPage() {
  const [actionsByTier, setActionsByTier] = useState<
    Record<ActionTier, VoiceIntelAction[]>
  >({ red: [], yellow: [], green: [] });
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] =
    useState<VoiceIntelAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Intelligence tab state
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [entityDashboards, setEntityDashboards] = useState<
    Record<string, EntityDashboard>
  >({});
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const fetchActions = useCallback(async () => {
    try {
      const results = await Promise.all(
        TIERS.map(async (tier) => {
          const res = await fetch(
            `/api/voice-intel/actions?tier=${tier}&limit=50`
          );
          if (!res.ok) return { tier, actions: [] };
          const data = await res.json();
          return { tier, actions: data.actions as VoiceIntelAction[] };
        })
      );

      const grouped: Record<ActionTier, VoiceIntelAction[]> = {
        red: [],
        yellow: [],
        green: [],
      };
      for (const result of results) {
        grouped[result.tier] = result.actions;
      }
      setActionsByTier(grouped);
    } catch (err) {
      console.error("Failed to fetch actions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatterns = useCallback(async () => {
    setPatternsLoading(true);
    try {
      const res = await fetch("/api/voice-intel/patterns");
      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns || []);
      }
    } catch (err) {
      console.error("Failed to fetch patterns:", err);
    } finally {
      setPatternsLoading(false);
    }
  }, []);

  const fetchEntityDashboards = useCallback(async () => {
    setEntitiesLoading(true);
    try {
      const results = await Promise.all(
        ENTITIES.map(async (entity) => {
          const res = await fetch(
            `/api/voice-intel/entities/${encodeURIComponent(entity)}`
          );
          if (!res.ok) return null;
          const data: EntityDashboard = await res.json();
          return data;
        })
      );

      const dashboards: Record<string, EntityDashboard> = {};
      for (const d of results) {
        if (d) dashboards[d.entity] = d;
      }
      setEntityDashboards(dashboards);
    } catch (err) {
      console.error("Failed to fetch entity dashboards:", err);
    } finally {
      setEntitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/voice-intel/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        fetchActions();
        if (selectedAction?.id === id) {
          setSheetOpen(false);
          setSelectedAction(null);
        }
      }
    } catch (err) {
      console.error("Failed to approve action:", err);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/voice-intel/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejection_reason: reason }),
      });
      if (res.ok) {
        fetchActions();
        if (selectedAction?.id === id) {
          setSheetOpen(false);
          setSelectedAction(null);
        }
      }
    } catch (err) {
      console.error("Failed to reject action:", err);
    }
  };

  const handleView = (action: VoiceIntelAction) => {
    setSelectedAction(action);
    setSheetOpen(true);
  };

  const handleTabChange = (value: string) => {
    if (value === "intelligence") {
      fetchPatterns();
      fetchEntityDashboards();
    }
  };

  // Stats
  const pendingRedCount = actionsByTier.red.filter(
    (a) => a.status === "pending"
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const totalTodayCount = TIERS.reduce(
    (sum, tier) =>
      sum +
      actionsByTier[tier].filter((a) => a.created_at.startsWith(today)).length,
    0
  );

  const totalInsights = TIERS.reduce(
    (sum, tier) => sum + actionsByTier[tier].length,
    0
  );

  // Aggregate top people across all entity dashboards
  const allPeopleCounts: Record<string, number> = {};
  for (const d of Object.values(entityDashboards)) {
    for (const p of d.topPeople) {
      allPeopleCounts[p.name] = (allPeopleCounts[p.name] || 0) + p.count;
    }
  }
  const topPeopleList = Object.entries(allPeopleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <ActionQueueHeader
        pendingRedCount={pendingRedCount}
        totalTodayCount={totalTodayCount}
        totalInsights={totalInsights}
      />

      <Tabs defaultValue="actions" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="actions" className="gap-2">
            Action Queue
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <Brain className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Action Queue */}
        <TabsContent value="actions" className="space-y-4 mt-4">
          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <ActionTierColumn
                key={tier}
                tier={tier}
                actions={actionsByTier[tier]}
                onApprove={handleApprove}
                onReject={handleReject}
                onView={handleView}
              />
            ))}
          </div>

          {/* Mobile: Tabs */}
          <div className="md:hidden">
            <Tabs defaultValue="red">
              <TabsList className="w-full">
                <TabsTrigger value="red" className="flex-1 text-red-600">
                  Urgent ({actionsByTier.red.length})
                </TabsTrigger>
                <TabsTrigger value="yellow" className="flex-1 text-amber-600">
                  Info ({actionsByTier.yellow.length})
                </TabsTrigger>
                <TabsTrigger value="green" className="flex-1 text-emerald-600">
                  Auto ({actionsByTier.green.length})
                </TabsTrigger>
              </TabsList>
              {TIERS.map((tier) => (
                <TabsContent key={tier} value={tier}>
                  <ActionTierColumn
                    tier={tier}
                    actions={actionsByTier[tier]}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onView={handleView}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        {/* Tab 2: Intelligence */}
        <TabsContent value="intelligence" className="space-y-6 mt-4">
          {/* Pattern Insights */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Pattern Insights
            </h3>
            {patternsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : patterns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No patterns detected yet. Record more voice memos to unlock insights.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {patterns.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
                          p.type === "entity_focus"
                            ? "bg-indigo-500"
                            : p.type === "relationship"
                            ? "bg-emerald-500"
                            : p.type === "action_trend"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {p.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entity Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-violet-500" />
              Entity Breakdown
            </h3>
            {entitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ENTITIES.map((entity) => {
                  const d = entityDashboards[entity];
                  return (
                    <div
                      key={entity}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {entity}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {d?.totalMemos || 0} memos
                        </span>
                      </div>
                      {d && d.recentActivity.length > 0 ? (
                        <div className="space-y-1">
                          {d.recentActivity.slice(0, 3).map((a, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-600">{a.activity}</span>
                              <span className="text-slate-400">{a.count}</span>
                            </div>
                          ))}
                          {d.pendingActions > 0 && (
                            <div className="mt-2 text-xs text-red-600 font-medium">
                              {d.pendingActions} pending action{d.pendingActions !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No activity yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* People Mentioned */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-cyan-500" />
              Top People Mentioned
            </h3>
            {entitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : topPeopleList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No people mentioned yet.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                {topPeopleList.map(([name, count], i) => (
                  <div
                    key={name}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < topPeopleList.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-900">{name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {count} mention{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail sheet */}
      <ActionDetailSheet
        action={selectedAction}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedAction(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
