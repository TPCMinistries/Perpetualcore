"use client";

import { useCallback, useState, useRef, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  Loader2,
  ChevronDown,
  GripVertical,
  Zap,
  Clock,
  Webhook,
  Mail,
  Brain,
  GitBranch,
  Repeat,
  Timer,
  Send,
  Bell,
  Database,
  Code,
  Filter,
  Merge,
  FileJson,
  FileText,
} from "lucide-react";
import { nodeTypes, nodePaletteItems } from "./BotNodeTypes";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  zap: Zap,
  clock: Clock,
  webhook: Webhook,
  mail: Mail,
  brain: Brain,
  branch: GitBranch,
  repeat: Repeat,
  timer: Timer,
  send: Send,
  bell: Bell,
  database: Database,
  code: Code,
  filter: Filter,
  merge: Merge,
  json: FileJson,
  file: FileText,
};

const colorClasses: Record<string, string> = {
  amber: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
  blue: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
  purple: "from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700",
  emerald: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
};

interface BotBuilderProps {
  botId: string;
  botName: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onExecute?: () => Promise<void>;
}

function BotBuilderInner({
  botId,
  botName,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
}: BotBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const nodeData = event.dataTransfer.getData("application/botnode");
      if (!nodeData) return;

      const { type, label, icon, description } = JSON.parse(nodeData);

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label, icon, description, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setConfigSheetOpen(true);
  }, []);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(nodes, edges);
      toast.success("Bot flow saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save bot flow");
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!onExecute) return;
    setExecuting(true);
    try {
      await onExecute();
      toast.success("Bot execution started");
    } catch (error: any) {
      toast.error(error.message || "Failed to execute bot");
    } finally {
      setExecuting(false);
    }
  };

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
    setConfigSheetOpen(false);
  }, [selectedNode, setNodes, setEdges]);

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    const newNode: Node = {
      ...selectedNode,
      id: `${selectedNode.type}-${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
      selected: false,
    };
    setNodes((nds) => nds.concat(newNode));
    toast.success("Node duplicated");
  }, [selectedNode, setNodes]);

  const updateNodeConfig = useCallback(
    (key: string, value: any) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...(n.data.config || {}),
                  [key]: value,
                },
              },
            };
          }
          return n;
        })
      );
    },
    [selectedNode, setNodes]
  );

  const proOptions = { hideAttribution: true };

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-64 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Node Palette</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag nodes to the canvas
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {nodePaletteItems.map((category) => (
              <div key={category.category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.items.map((item) => {
                    const Icon = iconMap[item.icon] || Zap;
                    return (
                      <div
                        key={`${item.type}-${item.label}`}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing",
                          "bg-gradient-to-r text-white shadow-sm hover:shadow-md transition-all",
                          colorClasses[category.color]
                        )}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/botnode",
                            JSON.stringify(item)
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <GripVertical className="h-4 w-4 opacity-60" />
                        <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          proOptions={proOptions}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background !border !rounded-lg"
          />

          {/* Top Panel - Actions */}
          <Panel position="top-right" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={executing || nodes.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {executing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute
            </Button>
          </Panel>

          {/* Bottom Panel - Info */}
          <Panel position="bottom-left" className="text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-lg border">
            {nodes.length} nodes, {edges.length} connections
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Configuration Sheet */}
      <Sheet open={configSheetOpen} onOpenChange={setConfigSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Node
            </SheetTitle>
            <SheetDescription>
              {selectedNode?.data?.label as string}
            </SheetDescription>
          </SheetHeader>

          {selectedNode && (
            <div className="space-y-6 mt-6">
              {/* Node Info */}
              <div className="space-y-2">
                <Label>Node Type</Label>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium">{selectedNode.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedNode.data?.description as string}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Configuration Fields based on node type */}
              {selectedNode.type === "trigger" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trigger Configuration</Label>
                    <Input
                      placeholder="Webhook URL or schedule expression"
                      value={(selectedNode.data?.config as any)?.trigger_config || ""}
                      onChange={(e) => updateNodeConfig("trigger_config", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "action" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Action Configuration</Label>
                    <Input
                      placeholder="Configure action settings"
                      value={(selectedNode.data?.config as any)?.action_config || ""}
                      onChange={(e) => updateNodeConfig("action_config", e.target.value)}
                    />
                  </div>
                  {(selectedNode.data?.label as string)?.includes("AI") && (
                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <textarea
                        className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none"
                        placeholder="Enter the system prompt for the AI..."
                        value={(selectedNode.data?.config as any)?.system_prompt || ""}
                        onChange={(e) => updateNodeConfig("system_prompt", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === "logic" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Condition Expression</Label>
                    <Input
                      placeholder="e.g., data.value > 10"
                      value={(selectedNode.data?.config as any)?.condition || ""}
                      onChange={(e) => updateNodeConfig("condition", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "transform" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Transform Code</Label>
                    <textarea
                      className="w-full min-h-[150px] p-3 rounded-lg border bg-background font-mono text-sm resize-none"
                      placeholder="// Transform data here&#10;return { ...data, processed: true };"
                      value={(selectedNode.data?.config as any)?.code || ""}
                      onChange={(e) => updateNodeConfig("code", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Node Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicateSelectedNode}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedNode}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function BotBuilder(props: BotBuilderProps) {
  return (
    <ReactFlowProvider>
      <BotBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
