"use client";

import { lazy, Suspense } from "react";
import type { A2UIBlock as A2UIBlockType } from "@/lib/a2ui/types";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load each block renderer for code splitting
const ChartBlock = lazy(() => import("./ChartBlock"));
const TableBlock = lazy(() => import("./TableBlock"));
const FormBlock = lazy(() => import("./FormBlock"));
const CardBlock = lazy(() => import("./CardBlock"));
const CardGridBlock = lazy(() => import("./CardBlock").then((m) => ({ default: m.CardGridBlock })));
const MetricBlock = lazy(() => import("./MetricBlock"));
const MetricRowBlock = lazy(() => import("./MetricBlock").then((m) => ({ default: m.MetricRowBlock })));
const ProgressBlock = lazy(() => import("./ProgressBlock"));
const ApprovalBlock = lazy(() => import("./ApprovalBlock"));
const ChecklistBlock = lazy(() => import("./ChecklistBlock"));
const CodeBlock = lazy(() => import("./CodeBlock"));
const KanbanBlock = lazy(() => import("./KanbanBlock"));
const CalendarBlock = lazy(() => import("./CalendarBlock"));
const ImageBlock = lazy(() => import("./ImageBlock"));

function BlockSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

interface A2UIBlockProps {
  block: A2UIBlockType;
}

export function A2UIBlockRenderer({ block }: A2UIBlockProps) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return null;
  }

  return (
    <div className="a2ui-block">
      {block.metadata?.title && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
          {block.metadata.title}
        </p>
      )}
      <Suspense fallback={<BlockSkeleton />}>
        <Component block={block} />
      </Suspense>
      {block.metadata?.description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {block.metadata.description}
        </p>
      )}
    </div>
  );
}

function getBlockComponent(
  type: A2UIBlockType["type"]
): React.LazyExoticComponent<React.ComponentType<{ block: A2UIBlockType }>> | null {
  switch (type) {
    case "chart":
      return ChartBlock;
    case "table":
      return TableBlock;
    case "form":
      return FormBlock;
    case "card":
      return CardBlock;
    case "card-grid":
      return CardGridBlock;
    case "metric":
      return MetricBlock;
    case "metric-row":
      return MetricRowBlock;
    case "progress":
      return ProgressBlock;
    case "approval":
      return ApprovalBlock;
    case "checklist":
      return ChecklistBlock;
    case "code":
      return CodeBlock;
    case "kanban":
      return KanbanBlock;
    case "calendar":
      return CalendarBlock;
    case "image":
      return ImageBlock;
    default:
      return null;
  }
}

export default A2UIBlockRenderer;
