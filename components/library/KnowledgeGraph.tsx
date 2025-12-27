"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  RefreshCw,
  FileText,
  Lightbulb,
  Users,
  Briefcase,
  Building2,
  X,
  MessageSquare,
  Eye,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { libraryTheme, glassClasses } from "@/lib/design/library-theme";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center animate-pulse">
          <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading knowledge graph...</p>
      </div>
    </div>
  ),
});

export interface GraphNode {
  id: string;
  type: "document" | "concept" | "person" | "project" | "space";
  label: string;
  size?: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "references" | "related" | "authored" | "belongs_to";
  strength?: number;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  isLoading?: boolean;
  className?: string;
}

// Use neon colors from the theme for vibrant graph nodes
const nodeColors: Record<GraphNode["type"], string> = {
  document: libraryTheme.neon.blue,
  concept: libraryTheme.neon.purple,
  person: libraryTheme.neon.green,
  project: libraryTheme.neon.amber,
  space: libraryTheme.neon.cyan,
};

const nodeIcons: Record<GraphNode["type"], React.ElementType> = {
  document: FileText,
  concept: Lightbulb,
  person: Users,
  project: Briefcase,
  space: Building2,
};

// Sample data for demo
const sampleNodes: GraphNode[] = [
  { id: "doc1", type: "document", label: "Q4 Financial Report", size: 20 },
  { id: "doc2", type: "document", label: "Marketing Strategy", size: 18 },
  { id: "doc3", type: "document", label: "Product Roadmap", size: 22 },
  { id: "doc4", type: "document", label: "Customer Research", size: 16 },
  { id: "doc5", type: "document", label: "Team Guidelines", size: 14 },
  { id: "concept1", type: "concept", label: "Revenue Growth", size: 24 },
  { id: "concept2", type: "concept", label: "Market Expansion", size: 20 },
  { id: "concept3", type: "concept", label: "User Experience", size: 18 },
  { id: "project1", type: "project", label: "Q1 Launch", size: 22 },
  { id: "space1", type: "space", label: "Engineering", size: 20 },
  { id: "space2", type: "space", label: "Sales", size: 18 },
];

const sampleLinks: GraphLink[] = [
  { source: "doc1", target: "concept1", type: "references", strength: 0.9 },
  { source: "doc2", target: "concept2", type: "references", strength: 0.8 },
  { source: "doc3", target: "concept3", type: "references", strength: 0.7 },
  { source: "doc4", target: "concept3", type: "references", strength: 0.6 },
  { source: "concept1", target: "concept2", type: "related", strength: 0.5 },
  { source: "doc1", target: "project1", type: "belongs_to", strength: 0.9 },
  { source: "doc2", target: "project1", type: "belongs_to", strength: 0.8 },
  { source: "doc5", target: "space1", type: "belongs_to", strength: 0.9 },
  { source: "doc1", target: "space2", type: "belongs_to", strength: 0.7 },
];

export function KnowledgeGraph({
  nodes = sampleNodes,
  links = sampleLinks,
  onNodeClick,
  onNodeDoubleClick,
  isLoading = false,
  className,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [activeFilters, setActiveFilters] = useState<GraphNode["type"][]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const filteredNodes = activeFilters.length > 0
    ? nodes.filter((n) => activeFilters.includes(n.type))
    : nodes;

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = links.filter(
    (l) =>
      filteredNodeIds.has(typeof l.source === "string" ? l.source : (l.source as any).id) &&
      filteredNodeIds.has(typeof l.target === "string" ? l.target : (l.target as any).id)
  );

  const graphData = {
    nodes: filteredNodes.map((n) => ({
      ...n,
      color: nodeColors[n.type],
      val: n.size || 15,
    })),
    links: filteredLinks.map((l) => ({
      ...l,
      color: "rgba(255, 255, 255, 0.1)",
    })),
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.3, 400);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  const toggleFilter = (type: GraphNode["type"]) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label;
      const fontSize = 12 / globalScale;
      const nodeSize = (node.val || 15) / globalScale;
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Draw glow for selected/hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize + 8 / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = `${node.color}40`;
        ctx.fill();
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = isSelected ? "#fff" : `${node.color}80`;
      ctx.lineWidth = isSelected ? 2 / globalScale : 1 / globalScale;
      ctx.stroke();

      // Draw label
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(label, node.x, node.y + nodeSize + fontSize + 4 / globalScale);
    },
    [selectedNode, hoveredNode]
  );

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  const handleNodeDoubleClick = (node: any) => {
    onNodeDoubleClick?.(node);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      {/* Graph */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val || 15) + 5, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={() => "rgba(255, 255, 255, 0.1)"}
          linkWidth={(link: any) => (link.strength || 0.5) * 2}
          onNodeClick={handleNodeClick}
          onNodeDblClick={handleNodeDoubleClick}
          onNodeHover={(node: any) => setHoveredNode(node)}
          backgroundColor="transparent"
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10",
            showFilters && "bg-purple-500/20 border-purple-500/50"
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFitView}
          className="bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Filter by type
            </p>
            <div className="space-y-2">
              {(["document", "concept", "person", "project", "space"] as const).map((type) => {
                const Icon = nodeIcons[type];
                const isActive = activeFilters.length === 0 || activeFilters.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: nodeColors[type] }}
                    />
                    <Icon className="h-4 w-4" />
                    <span className="text-sm capitalize">{type}s</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10">
        {(["document", "concept", "project", "space"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: nodeColors[type] }}
            />
            <span className="text-xs text-slate-400 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 w-80 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${nodeColors[selectedNode.type]}30` }}
                >
                  {(() => {
                    const Icon = nodeIcons[selectedNode.type];
                    return <Icon className="h-5 w-5" style={{ color: nodeColors[selectedNode.type] }} />;
                  })()}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{selectedNode.label}</h4>
                  <p className="text-xs text-slate-400 capitalize">{selectedNode.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedNode.type === "document" && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => onNodeDoubleClick?.(selectedNode)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-400">Building knowledge graph...</p>
          </div>
        </div>
      )}
    </div>
  );
}
