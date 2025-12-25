"use client";

import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/work";
import { ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowPipelineProps {
  stages: WorkflowStage[];
  currentStageId?: string;
  counts?: Record<string, number>;
  onStageClick?: (stage: WorkflowStage) => void;
  className?: string;
  compact?: boolean;
}

export function WorkflowPipeline({
  stages,
  currentStageId,
  counts = {},
  onStageClick,
  className,
  compact = false,
}: WorkflowPipelineProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {sortedStages.map((stage, index) => {
          const count = counts[stage.id] || 0;
          const isActive = stage.id === currentStageId;

          return (
            <TooltipProvider key={stage.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onStageClick?.(stage)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                      "hover:ring-2 hover:ring-offset-1",
                      isActive
                        ? "ring-2 ring-offset-1"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{
                      backgroundColor: `${stage.color}20`,
                      color: stage.color,
                      borderColor: stage.color,
                      ["--tw-ring-color" as string]: stage.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {count > 0 && <span className="font-medium">{count}</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} item{count !== 1 ? "s" : ""}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-stretch gap-0.5 overflow-x-auto", className)}>
      {sortedStages.map((stage, index) => {
        const count = counts[stage.id] || 0;
        const isActive = stage.id === currentStageId;
        const isFirst = index === 0;
        const isLast = index === sortedStages.length - 1;

        return (
          <div key={stage.id} className="flex items-stretch">
            <button
              onClick={() => onStageClick?.(stage)}
              className={cn(
                "relative flex flex-col items-center justify-center px-4 py-2 min-w-[100px] transition-all",
                "hover:brightness-95",
                isFirst && "rounded-l-lg",
                isLast && "rounded-r-lg",
                isActive && "ring-2 ring-offset-1"
              )}
              style={{
                backgroundColor: `${stage.color}15`,
                ["--tw-ring-color" as string]: stage.color,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: stage.color }}
                >
                  {stage.name}
                </span>
              </div>
              <span className="text-lg font-bold" style={{ color: stage.color }}>
                {count}
              </span>
            </button>
            {!isLast && (
              <div className="flex items-center -mx-2 z-10">
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground/30"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Horizontal bar version with progress visualization
interface WorkflowProgressBarProps {
  stages: WorkflowStage[];
  counts?: Record<string, number>;
  className?: string;
}

export function WorkflowProgressBar({
  stages,
  counts = {},
  className,
}: WorkflowProgressBarProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {sortedStages.map((stage) => {
          const count = counts[stage.id] || 0;
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

          if (percentage === 0) return null;

          return (
            <TooltipProvider key={stage.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-full transition-all cursor-pointer hover:brightness-110"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} ({Math.round(percentage)}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {sortedStages.map((stage) => {
          const count = counts[stage.id] || 0;
          if (count === 0) return null;

          return (
            <div key={stage.id} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-muted-foreground">{stage.name}:</span>
              <span className="font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Card version for team overview
interface WorkflowStageCardsProps {
  stages: WorkflowStage[];
  counts?: Record<string, number>;
  onStageClick?: (stage: WorkflowStage) => void;
  className?: string;
}

export function WorkflowStageCards({
  stages,
  counts = {},
  onStageClick,
  className,
}: WorkflowStageCardsProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3", className)}>
      {sortedStages.map((stage) => {
        const count = counts[stage.id] || 0;

        return (
          <button
            key={stage.id}
            onClick={() => onStageClick?.(stage)}
            className={cn(
              "p-3 rounded-lg border transition-all text-left",
              "hover:shadow-md hover:border-transparent",
              count > 0 ? "cursor-pointer" : "cursor-default opacity-60"
            )}
            style={{
              borderColor: `${stage.color}40`,
              backgroundColor: count > 0 ? `${stage.color}10` : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs font-medium truncate" style={{ color: stage.color }}>
                {stage.name}
              </span>
            </div>
            <span className="text-2xl font-bold block" style={{ color: stage.color }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
