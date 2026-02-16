"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Zap,
  Brain,
  GitBranch,
  Send,
  Code,
  Webhook,
  Clock,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowNodeData {
  label: string;
  description?: string;
  config?: Record<string, unknown>;
  icon?: string;
  [key: string]: unknown;
}

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  brain: Brain,
  branch: GitBranch,
  send: Send,
  code: Code,
  webhook: Webhook,
  clock: Clock,
  mail: Mail,
};

// Input Node - Green accent, trigger/entry point
export const InputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const Icon = iconMap[nodeData.icon || "zap"] || Zap;

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
        selected ? "ring-2 ring-emerald-500 ring-offset-2" : "",
        "border-emerald-300 dark:border-emerald-700"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-emerald-500 to-green-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      {nodeData.config &&
        Object.keys(nodeData.config).length > 0 && (
          <div className="px-3 pb-2 text-xs text-emerald-600 dark:text-emerald-400">
            {(nodeData.config as Record<string, unknown>).trigger_type
              ? `Trigger: ${(nodeData.config as Record<string, unknown>).trigger_type}`
              : "Configured"}
          </div>
        )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});
InputNode.displayName = "InputNode";

// Assistant Node - Purple accent, AI processing
export const AssistantNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const Icon = iconMap[nodeData.icon || "brain"] || Brain;

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
        selected ? "ring-2 ring-purple-500 ring-offset-2" : "",
        "border-purple-300 dark:border-purple-700"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-purple-500 to-violet-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      {nodeData.config &&
        Object.keys(nodeData.config).length > 0 && (
          <div className="px-3 pb-2 text-xs text-purple-600 dark:text-purple-400">
            {(nodeData.config as Record<string, unknown>).model
              ? `Model: ${(nodeData.config as Record<string, unknown>).model}`
              : "Configured"}
          </div>
        )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});
AssistantNode.displayName = "AssistantNode";

// Condition Node - Yellow/Amber accent, branching with two outputs
export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const Icon = iconMap[nodeData.icon || "branch"] || GitBranch;

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
        selected ? "ring-2 ring-amber-500 ring-offset-2" : "",
        "border-amber-300 dark:border-amber-700"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-amber-500 to-orange-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      {nodeData.config &&
        Object.keys(nodeData.config).length > 0 && (
          <div className="px-3 pb-2 text-xs text-amber-600 dark:text-amber-400">
            {(nodeData.config as Record<string, unknown>).field
              ? `${(nodeData.config as Record<string, unknown>).field} ${(nodeData.config as Record<string, unknown>).operator} ${(nodeData.config as Record<string, unknown>).value}`
              : "Configured"}
          </div>
        )}
      <div className="flex justify-between px-3 pb-1">
        <span className="text-[10px] text-green-600">True</span>
        <span className="text-[10px] text-red-600">False</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white dark:!border-slate-900 !left-1/3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white dark:!border-slate-900 !left-2/3"
      />
    </div>
  );
});
ConditionNode.displayName = "ConditionNode";

// Output Node - Blue accent, result/destination
export const OutputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const Icon = iconMap[nodeData.icon || "send"] || Send;

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
        selected ? "ring-2 ring-blue-500 ring-offset-2" : "",
        "border-blue-300 dark:border-blue-700"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      {nodeData.config &&
        Object.keys(nodeData.config).length > 0 && (
          <div className="px-3 pb-2 text-xs text-blue-600 dark:text-blue-400">
            {(nodeData.config as Record<string, unknown>).destination
              ? `To: ${(nodeData.config as Record<string, unknown>).destination}`
              : "Configured"}
          </div>
        )}
    </div>
  );
});
OutputNode.displayName = "OutputNode";

// Custom Node - Gray/Slate accent, user-defined
export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;
  const Icon = iconMap[nodeData.icon || "code"] || Code;

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
        selected ? "ring-2 ring-slate-500 ring-offset-2" : "",
        "border-slate-300 dark:border-slate-600"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-slate-500 to-slate-700">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {nodeData.label}
        </span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});
CustomNode.displayName = "CustomNode";

export const nodeTypes = {
  input: InputNode,
  assistant: AssistantNode,
  condition: ConditionNode,
  output: OutputNode,
  custom: CustomNode,
};
