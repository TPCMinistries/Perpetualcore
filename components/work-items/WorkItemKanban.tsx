"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkItem, WorkflowStage, getItemTypeLabel } from "@/types/work";
import { WorkItemCard } from "./WorkItemCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WorkItemKanbanProps {
  teamId: string;
  stages: WorkflowStage[];
  itemType: string;
  onItemClick: (item: WorkItem) => void;
  onCreateClick: (stageId: string) => void;
}

export function WorkItemKanban({
  teamId,
  stages,
  itemType,
  onItemClick,
  onCreateClick,
}: WorkItemKanbanProps) {
  const [items, setItems] = useState<Record<string, WorkItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/work-items?team_id=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        // Group items by stage
        const grouped: Record<string, WorkItem[]> = {};
        stages.forEach((stage) => {
          grouped[stage.id] = (data.items as WorkItem[]).filter(
            (item) => item.current_stage_id === stage.id
          );
        });
        setItems(grouped);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [teamId, stages]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, destStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    const itemId = e.dataTransfer.getData("text/plain") || draggedItem;
    if (!itemId) return;

    // Find source stage
    let sourceStageId: string | null = null;
    let item: WorkItem | null = null;
    for (const [stageId, stageItems] of Object.entries(items)) {
      const found = stageItems.find((i) => i.id === itemId);
      if (found) {
        sourceStageId = stageId;
        item = found;
        break;
      }
    }

    if (!item || sourceStageId === destStageId) {
      setDraggedItem(null);
      return;
    }

    // Optimistic update
    setItems((prev) => ({
      ...prev,
      [sourceStageId!]: prev[sourceStageId!].filter((i) => i.id !== itemId),
      [destStageId]: [
        ...prev[destStageId],
        { ...item!, current_stage_id: destStageId },
      ],
    }));
    setDraggedItem(null);

    // API call
    try {
      const response = await fetch(`/api/work-items/${itemId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_stage_id: destStageId }),
      });

      if (!response.ok) {
        throw new Error("Failed to move item");
      }

      const data = await response.json();
      toast.success(`Moved to ${data.transition.to_stage}`);
    } catch (error) {
      // Revert on error
      fetchItems();
      toast.error("Failed to move item");
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const itemTypeLabel = getItemTypeLabel(itemType);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {sortedStages.map((stage) => {
        const stageItems = items[stage.id] || [];
        const isOver = dragOverStage === stage.id;

        return (
          <div key={stage.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div
              className="p-3 rounded-t-lg border-b"
              style={{ backgroundColor: `${stage.color}20` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium" style={{ color: stage.color }}>
                    {stage.name}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    ({stageItems.length})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onCreateClick(stage.id)}
                  title={`Add ${itemTypeLabel}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                "min-h-[200px] p-2 rounded-b-lg border border-t-0 transition-colors",
                isOver && "bg-accent/50 border-primary"
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {stageItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <p>No {itemTypeLabel.toLowerCase()}s</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => onCreateClick(stage.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add {itemTypeLabel}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        draggedItem === item.id && "opacity-50"
                      )}
                    >
                      <WorkItemCard
                        item={item}
                        onClick={() => onItemClick(item)}
                        showDragHandle
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
