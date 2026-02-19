"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Node, Edge } from "@xyflow/react";

interface WorkflowData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflow() {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (response.ok) {
          const data = await response.json();
          setWorkflow(data.workflow);
        } else {
          toast.error("Failed to load workflow");
          router.push("/dashboard/workflows");
        }
      } catch (error) {
        toast.error("Failed to load workflow");
        router.push("/dashboard/workflows");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [workflowId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground dark:text-muted-foreground">
          Workflow not found
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/workflows">Back to Workflows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/workflows">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Workflows
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/workflows/${workflowId}`}>
            {workflow.name}
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Builder</span>
      </div>

      {/* Builder */}
      <div className="flex-1">
        <WorkflowBuilder
          workflowId={workflowId}
          workflowName={workflow.name}
          initialNodes={workflow.nodes || []}
          initialEdges={workflow.edges || []}
        />
      </div>
    </div>
  );
}
