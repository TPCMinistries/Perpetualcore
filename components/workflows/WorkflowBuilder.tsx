"use client";

import { useCallback, useState, useRef } from "react";
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
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Save, Play, Loader2, FlaskConical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { nodeTypes } from "./WorkflowNodeTypes";
import { WorkflowNodePalette } from "./WorkflowNodePalette";
import { WorkflowNodeConfig } from "./WorkflowNodeConfig";
import { WorkflowExecutionPanel, type NodeExecutionState } from "./WorkflowExecutionPanel";
import { WorkflowTestRunner } from "./WorkflowTestRunner";
import { validateWorkflow } from "@/lib/workflows/validation";
import type { WorkflowNode, WorkflowEdge, NodeType } from "@/lib/workflow-engine";

interface WorkflowBuilderProps {
  workflowId: string;
  workflowName: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

function WorkflowBuilderInner({
  workflowId,
  workflowName,
  initialNodes = [],
  initialEdges = [],
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executionStates, setExecutionStates] = useState<NodeExecutionState[]>([]);
  const [showExecution, setShowExecution] = useState(false);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
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

      const nodeData = event.dataTransfer.getData("application/workflownode");
      if (!nodeData) return;

      const { type, label, icon, description } = JSON.parse(nodeData) as {
        type: NodeType;
        label: string;
        icon: string;
        description: string;
      };

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
    // Validate before saving
    const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type as NodeType,
      data: {
        label: n.data.label as string,
        ...n.data,
      },
    }));

    const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label as string | undefined,
    }));

    const validation = validateWorkflow(workflowNodes, workflowEdges);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            label: e.label,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Workflow saved successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save workflow");
      }
    } catch (error) {
      toast.error("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
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
    (key: string, value: string) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...(n.data.config as Record<string, unknown> || {}),
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
      <WorkflowNodePalette />

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
            <WorkflowTestRunner
              workflowId={workflowId}
              trigger={
                <Button variant="outline" size="sm">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Test
                </Button>
              }
            />
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
          </Panel>

          {/* Bottom Panel - Info */}
          <Panel
            position="bottom-left"
            className="text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-lg border"
          >
            {nodes.length} nodes, {edges.length} connections
          </Panel>
        </ReactFlow>

        {/* Execution Panel */}
        <WorkflowExecutionPanel
          executions={executionStates}
          visible={showExecution}
        />
      </div>

      {/* Node Configuration Sheet */}
      <WorkflowNodeConfig
        open={configSheetOpen}
        onOpenChange={setConfigSheetOpen}
        selectedNode={selectedNode}
        onUpdateConfig={updateNodeConfig}
        onDelete={deleteSelectedNode}
        onDuplicate={duplicateSelectedNode}
      />
    </div>
  );
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
