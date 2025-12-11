"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Network,
  Search,
  Loader2,
  TrendingUp,
  Link2,
  Layers,
  ArrowRight,
  CircleDot,
} from "lucide-react";

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

  const relationshipColors: Record<string, string> = {
    related_to: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    depends_on: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    similar_to: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    opposite_of: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    part_of: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading knowledge graph...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Network className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Knowledge Graph
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Explore relationships between concepts learned from your conversations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
            <CircleDot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConcepts || 0}</div>
            <p className="text-xs text-muted-foreground">Unique knowledge nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRelationships || 0}</div>
            <p className="text-xs text-muted-foreground">Connections between concepts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.averageStrength || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Relationship confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusters.length}</div>
            <p className="text-xs text-muted-foreground">Connected groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Path Finder */}
      <Card>
        <CardHeader>
          <CardTitle>Find Connection Path</CardTitle>
          <CardDescription>
            Discover how two concepts are connected through the knowledge graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Start concept..."
                value={searchConcept}
                onChange={(e) => setSearchConcept(e.target.value)}
                list="concepts-list"
              />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Input
                placeholder="Target concept..."
                value={targetConcept}
                onChange={(e) => setTargetConcept(e.target.value)}
                list="concepts-list"
              />
            </div>
            <Button onClick={findPath} disabled={searchingPath || !searchConcept || !targetConcept}>
              {searchingPath ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              {pathResult.connected ? (
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-3">
                    Path found with {pathResult.pathLength} hop{pathResult.pathLength !== 1 ? "s" : ""}!
                  </p>
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm">
                      {pathResult.source}
                    </Badge>
                    {pathResult.path.map((edge, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge className={relationshipColors[edge.relationship_type] || "bg-slate-100"}>
                          {edge.relationship_type.replace("_", " ")}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-sm">
                          {edge.source_concept === pathResult.path[i - 1]?.target_concept ||
                          edge.source_concept === pathResult.source
                            ? edge.target_concept
                            : edge.source_concept}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No connection found between &quot;{pathResult.source}&quot; and &quot;{pathResult.target}&quot;
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Concepts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Connected Concepts</CardTitle>
            <CardDescription>Most connected nodes in your knowledge graph</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topConcepts && stats.topConcepts.length > 0 ? (
              <div className="space-y-3">
                {stats.topConcepts.map((item, i) => (
                  <div key={item.concept} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-4">
                        {i + 1}
                      </span>
                      <span className="font-medium">{item.concept}</span>
                    </div>
                    <Badge variant="secondary">{item.connections} connections</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No concepts yet. Keep chatting to build your knowledge graph!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Relationship Types */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship Distribution</CardTitle>
            <CardDescription>Types of connections in your knowledge</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.relationshipTypes && Object.keys(stats.relationshipTypes).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.relationshipTypes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge className={relationshipColors[type] || "bg-slate-100"}>
                        {type.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{count} relationships</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No relationships yet. The graph builds as you chat!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graph Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Network</CardTitle>
          <CardDescription>Visual representation of concept relationships</CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length > 0 ? (
            <div className="relative min-h-[400px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 overflow-hidden">
              {/* Simple text-based visualization */}
              <div className="flex flex-wrap gap-4 justify-center">
                {nodes.slice(0, 20).map((node) => (
                  <div
                    key={node.id}
                    className="relative group"
                    style={{
                      transform: `scale(${0.8 + (node.connections / 10) * 0.4})`,
                    }}
                  >
                    <div
                      className={`px-4 py-2 rounded-full border-2 transition-all cursor-pointer
                        ${
                          node.connections > 5
                            ? "bg-primary/20 border-primary text-primary"
                            : node.connections > 2
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                            : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        }
                        hover:shadow-lg hover:scale-110
                      `}
                    >
                      <span className="text-sm font-medium whitespace-nowrap">{node.label}</span>
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {node.connections} links
                    </span>
                  </div>
                ))}
              </div>
              {nodes.length > 20 && (
                <p className="text-center text-sm text-muted-foreground mt-8">
                  Showing top 20 of {nodes.length} concepts
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No knowledge graph yet</h3>
              <p className="text-muted-foreground max-w-md">
                Your knowledge graph will grow as you have conversations with AI.
                Concepts and relationships are automatically extracted from your chats.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clusters */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Concept Clusters</CardTitle>
            <CardDescription>Groups of closely related concepts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clusters.slice(0, 5).map((cluster, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-medium">Cluster {i + 1}</span>
                    <Badge variant="secondary">{cluster.length} concepts</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.slice(0, 10).map((concept) => (
                      <Badge key={concept} variant="outline">
                        {concept}
                      </Badge>
                    ))}
                    {cluster.length > 10 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        +{cluster.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
