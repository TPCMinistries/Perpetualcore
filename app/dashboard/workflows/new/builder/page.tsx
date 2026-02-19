"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewWorkflowBuilderPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(true);

  useEffect(() => {
    async function createAndRedirect() {
      try {
        const response = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Untitled Workflow",
            description: "",
            icon: "⚡",
            category: "automation",
            trigger_type: "manual",
            nodes: [],
            edges: [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          router.replace(`/dashboard/workflows/${data.workflow.id}/builder`);
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to create workflow");
          router.push("/dashboard/workflows");
        }
      } catch (error) {
        toast.error("Failed to create workflow");
        router.push("/dashboard/workflows");
      } finally {
        setCreating(false);
      }
    }

    createAndRedirect();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Creating new workflow...
      </p>
    </div>
  );
}
