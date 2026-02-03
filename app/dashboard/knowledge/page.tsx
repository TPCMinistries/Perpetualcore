"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network,
  Search,
  Loader2,
  TrendingUp,
  Link2,
  Layers,
  ArrowRight,
  CircleDot,
  Sparkles,
  Brain,
} from "lucide-react";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GraphNode {
  id: string;
  label: string;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

interface KnowledgeStats {
  totalConcepts: number;
  totalRelationships: number;
  relationshipTypes: Record<string, number>;
  averageStrength: number;
  topConcepts: Array<{ concept: string; connections: number }>;
}

interface ConceptPath {
  source: string;
  target: string;
  path: any[];
  pathLength: number;
  connected: boolean;
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

const relationshipColors: Record<string, { bg: string; text: string; badge: string }> = {
  related_to: {
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  depends_on: {
    bg: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
  similar_to: {
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  opposite_of: {
    bg: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
  part_of: {
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export default function KnowledgePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [clusters, setClusters] = useState<string[][]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  // Search state
  const [searchConcept, setSearchConcept] = useState("");
  const [targetConcept, setTargetConcept] = useState("");
  const [pathResult, setPathResult] = useState<ConceptPath | null>(null);
  const [searchingPath, setSearchingPath] = useState(false);

  useEffect(() => {
    fetchKnowledgeGraph();
  }, []);

  async function fetchKnowledgeGraph() {
    try {
      const [overviewRes, exploreRes] = await Promise.all([
        fetch("/api/intelligence/knowledge-graph"),
        fetch("/api/intelligence/knowledge-graph/explore?limit=50"),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setStats(data.stats);
        setConcepts(data.concepts || []);
        setClusters(data.clusters || []);
      }

      if (exploreRes.ok) {
        const graphData = await exploreRes.json();
        setNodes(graphData.nodes || []);
        setEdges(graphData.edges || []);
      }
    } catch (error) {
      console.error("Error fetching knowledge graph:", error);
    } finally {
      setLoading(false);
    }
  }

  async function findPath() {
    if (!searchConcept || !targetConcept) return;

    setSearchingPath(true);
    setPathResult(null);

    try {
      const res = await fetch(
        `/api/intelligence/knowledge-graph/concepts?concept=${encodeURIComponent(
          searchConcept
        )}&target=${encodeURIComponent(targetConcept)}`
      );

      if (res.ok) {
        const data = await res.json();
        setPathResult(data);
      }
    } catch (error) {
      console.error("Error finding path:", error);
    } finally {
      setSearchingPath(false);
    }
  }

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
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <DashboardHeader
        title="Knowledge Graph"
        subtitle="Explore relationships between concepts learned from your conversations"
        icon={Network}
        iconColor="violet"
        stats={[
          { label: "concepts", value: stats?.totalConcepts || 0 },
          { label: "relationships", value: stats?.totalRelationships || 0 },
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
            label="Total Concepts"
            value={stats?.totalConcepts || 0}
            icon={CircleDot}
            iconColor="violet"
            description="Unique knowledge nodes"
          />
          <StatCard
            label="Relationships"
            value={stats?.totalRelationships || 0}
            icon={Link2}
            iconColor="blue"
            description="Connections between concepts"
          />
          <StatCard
            label="Avg Strength"
            value={`${((stats?.averageStrength || 0) * 100).toFixed(0)}%`}
            icon={TrendingUp}
            iconColor="emerald"
            description="Relationship confidence"
          />
          <StatCard
            label="Clusters"
            value={clusters.length}
            icon={Layers}
            iconColor="amber"
            description="Connected groups"
          />
        </StatCardGrid>
      </motion.div>

      {/* Path Finder */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Search className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">Find Connection Path</CardTitle>
                <CardDescription>
                  Discover how two concepts are connected through the knowledge graph
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Start concept..."
                  value={searchConcept}
                  onChange={(e) => setSearchConcept(e.target.value)}
                  list="concepts-list"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Target concept..."
                  value={targetConcept}
                  onChange={(e) => setTargetConcept(e.target.value)}
                  list="concepts-list"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <Button
                onClick={findPath}
                disabled={searchingPath || !searchConcept || !targetConcept}
                className="h-11 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
              >
                {searchingPath ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Find Path</span>
              </Button>
            </div>

            {/* Concepts datalist for autocomplete */}
            <datalist id="concepts-list">
              {concepts.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {/* Path Result */}
            {pathResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                {pathResult.connected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        Path found with {pathResult.pathLength} hop{pathResult.pathLength !== 1 ? "s" : ""}!
                      </p>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {pathResult.source}
                      </Badge>
                      {pathResult.path.map((edge, i) => {
                        const colors = relationshipColors[edge.relationship_type] || {
                          badge: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
                        };
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <Badge className={cn("text-xs", colors.badge)}>
                              {edge.relationship_type.replace("_", " ")}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {edge.source_concept === pathResult.path[i - 1]?.target_concept ||
                              edge.source_concept === pathResult.source
                                ? edge.target_concept
                                : edge.source_concept}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Brain className="h-5 w-5" />
                    <p className="text-sm">
                      No connection found between &quot;{pathResult.source}&quot; and &quot;{pathResult.target}&quot;
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Concepts */}
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
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Top Connected Concepts</CardTitle>
                  <CardDescription>Most connected nodes in your knowledge graph</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.topConcepts && stats.topConcepts.length > 0 ? (
                <div className="space-y-3">
                  {stats.topConcepts.map((item, i) => (
                    <motion.div
                      key={item.concept}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          i === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                          i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.concept}</span>
                      </div>
                      <Badge variant="secondary" className="font-medium">
                        {item.connections} links
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No concepts yet. Keep chatting to build your knowledge graph!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Relationship Types */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Relationship Distribution</CardTitle>
                  <CardDescription>Types of connections in your knowledge</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.relationshipTypes && Object.keys(stats.relationshipTypes).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.relationshipTypes)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count], i) => {
                      const colors = relationshipColors[type] || {
                        bg: "bg-slate-500",
                        text: "text-slate-600 dark:text-slate-400",
                        badge: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
                      };
                      const total = stats.totalRelationships || 1;
                      const percent = (count / total) * 100;

                      return (
                        <motion.div
                          key={type}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge className={cn("text-xs", colors.badge)}>
                              {type.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {count} ({percent.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", colors.bg)}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Link2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No relationships yet. The graph builds as you chat!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graph Visualization */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Network className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">Knowledge Network</CardTitle>
                <CardDescription>Visual representation of concept relationships</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {nodes.length > 0 ? (
              <div className="relative min-h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-8 overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-violet-200 dark:bg-violet-900/30 rounded-full blur-3xl" />
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl" />
                </div>

                {/* Nodes visualization */}
                <div className="relative flex flex-wrap gap-4 justify-center items-center">
                  {nodes.slice(0, 20).map((node, i) => {
                    const scale = 0.85 + (node.connections / 10) * 0.35;
                    const isHighConnection = node.connections > 5;
                    const isMediumConnection = node.connections > 2;

                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="relative group"
                        style={{ transform: `scale(${scale})` }}
                      >
                        <div
                          className={cn(
                            "px-4 py-2.5 rounded-full border-2 transition-all cursor-pointer shadow-sm",
                            isHighConnection
                              ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 border-violet-300 dark:border-violet-600 shadow-violet-200 dark:shadow-violet-900/30"
                              : isMediumConnection
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600",
                            "hover:shadow-lg hover:scale-105 hover:-translate-y-1"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-medium whitespace-nowrap",
                            isHighConnection ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {node.label}
                          </span>
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {node.connections} links
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {nodes.length > 20 && (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-10">
                    Showing top 20 of {nodes.length} concepts
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <Network className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No knowledge graph yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  Your knowledge graph will grow as you have conversations with AI.
                  Concepts and relationships are automatically extracted from your chats.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Clusters */}
      {clusters.length > 0 && (
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Concept Clusters</CardTitle>
                  <CardDescription>Groups of closely related concepts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {clusters.slice(0, 5).map((cluster, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        i === 0 ? "bg-violet-100 dark:bg-violet-900/30" :
                        i === 1 ? "bg-blue-100 dark:bg-blue-900/30" :
                        i === 2 ? "bg-emerald-100 dark:bg-emerald-900/30" :
                        i === 3 ? "bg-amber-100 dark:bg-amber-900/30" :
                        "bg-slate-100 dark:bg-slate-700"
                      )}>
                        <Layers className={cn(
                          "h-4 w-4",
                          i === 0 ? "text-violet-600 dark:text-violet-400" :
                          i === 1 ? "text-blue-600 dark:text-blue-400" :
                          i === 2 ? "text-emerald-600 dark:text-emerald-400" :
                          i === 3 ? "text-amber-600 dark:text-amber-400" :
                          "text-slate-600 dark:text-slate-400"
                        )} />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">Cluster {i + 1}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {cluster.length} concepts
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cluster.slice(0, 10).map((concept) => (
                        <Badge key={concept} variant="outline" className="text-xs">
                          {concept}
                        </Badge>
                      ))}
                      {cluster.length > 10 && (
                        <Badge variant="outline" className="text-xs text-slate-400">
                          +{cluster.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardPageWrapper>
  );
}
