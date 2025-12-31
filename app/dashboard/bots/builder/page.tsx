"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BotBuilder } from "@/components/bots/BotBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";
import type { Node, Edge } from "@xyflow/react";

function BotBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botId = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [botName, setBotName] = useState("New Bot");
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (botId) {
      loadBotFlow();
    } else {
      // New bot - set default trigger node
      setInitialNodes([
        {
          id: "trigger-initial",
          type: "trigger",
          position: { x: 250, y: 50 },
          data: {
            label: "Webhook",
            icon: "webhook",
            description: "HTTP webhook trigger",
            config: {},
          },
        },
      ]);
      setLoading(false);
    }
  }, [botId]);

  async function loadBotFlow() {
    try {
      const response = await fetch(`/api/bots/${botId}/flow`);
      if (!response.ok) {
        throw new Error("Failed to load bot flow");
      }
      const data = await response.json();

      // Transform API nodes to React Flow format
      const nodes = (data.nodes || []).map((node: any) => ({
        id: node.id,
        type: node.node_type || "action",
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.config?.label || node.node_type,
          icon: node.config?.icon || "zap",
          description: node.config?.description || "",
          config: node.config || {},
        },
      }));

      const edges = (data.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        sourceHandle: edge.condition?.handle,
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }));

      setInitialNodes(nodes);
      setInitialEdges(edges);

      // Also fetch bot name
      const botResponse = await fetch(`/api/agents?id=${botId}`);
      if (botResponse.ok) {
        const botData = await botResponse.json();
        setBotName(botData.agent?.name || "Untitled Bot");
      }
    } catch (error) {
      console.error("Error loading bot flow:", error);
      toast.error("Failed to load bot flow");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(nodes: Node[], edges: Edge[]) {
    const apiNodes = nodes.map((node) => ({
      id: node.id,
      node_type: node.type,
      position: node.position,
      config: {
        label: node.data.label,
        icon: node.data.icon,
        description: node.data.description,
        ...node.data.config,
      },
    }));

    const apiEdges = edges.map((edge) => ({
      id: edge.id,
      source_node_id: edge.source,
      target_node_id: edge.target,
      condition: edge.sourceHandle ? { handle: edge.sourceHandle } : null,
    }));

    if (!botId) {
      // Create new bot first
      const createResponse = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: botName,
          type: "custom_bot",
          description: "Custom bot created with visual builder",
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create bot");
      }

      const { agent } = await createResponse.json();

      // Save flow to new bot
      const flowResponse = await fetch(`/api/bots/${agent.id}/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: apiNodes, edges: apiEdges }),
      });

      if (!flowResponse.ok) {
        throw new Error("Failed to save bot flow");
      }

      // Redirect to the new bot's builder page
      router.push(`/dashboard/bots/builder?id=${agent.id}`);
    } else {
      // Update existing bot flow
      const response = await fetch(`/api/bots/${botId}/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: apiNodes, edges: apiEdges }),
      });

      if (!response.ok) {
        throw new Error("Failed to save bot flow");
      }
    }
  }

  async function handleExecute() {
    if (!botId) {
      toast.error("Please save the bot first");
      return;
    }

    const response = await fetch(`/api/bots/${botId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_data: {} }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to execute bot");
    }

    const result = await response.json();
    if (result.success) {
      toast.success(`Bot executed successfully (${result.nodes_executed || 0} nodes)`);
    } else {
      toast.error(result.error || "Execution completed with errors");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/bots">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <Input
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="font-semibold text-lg h-8 border-0 p-0 focus-visible:ring-0 bg-transparent"
                placeholder="Bot Name"
              />
              <p className="text-xs text-muted-foreground">
                {botId ? `ID: ${botId.slice(0, 8)}...` : "New Bot"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Builder Canvas */}
      <div className="flex-1">
        <BotBuilder
          botId={botId || "new"}
          botName={botName}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onSave={handleSave}
          onExecute={handleExecute}
        />
      </div>
    </div>
  );
}

export default function BotBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BotBuilderContent />
    </Suspense>
  );
}
