"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Zap,
  Clock,
  Webhook,
  Mail,
  MessageSquare,
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
  Calculator,
  FileText,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BotNodeData {
  label: string;
  description?: string;
  config?: Record<string, any>;
  icon?: string;
  color?: string;
}

const iconMap: Record<string, any> = {
  zap: Zap,
  clock: Clock,
  webhook: Webhook,
  mail: Mail,
  message: MessageSquare,
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
  calculator: Calculator,
  file: FileText,
  search: Search,
};

const colorMap: Record<string, string> = {
  trigger: "from-amber-500 to-orange-600 border-amber-300 dark:border-amber-700",
  action: "from-blue-500 to-indigo-600 border-blue-300 dark:border-blue-700",
  logic: "from-purple-500 to-violet-600 border-purple-300 dark:border-purple-700",
  transform: "from-emerald-500 to-teal-600 border-emerald-300 dark:border-emerald-700",
};

// Trigger Node - Entry points for bot execution
export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as BotNodeData;
  const Icon = iconMap[nodeData.icon || "zap"] || Zap;

  return (
    <div className={cn(
      "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
      selected ? "ring-2 ring-amber-500 ring-offset-2" : "",
      "border-amber-300 dark:border-amber-700"
    )}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-amber-500 to-orange-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});
TriggerNode.displayName = "TriggerNode";

// Action Node - Performs operations
export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as BotNodeData;
  const Icon = iconMap[nodeData.icon || "send"] || Send;

  return (
    <div className={cn(
      "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
      selected ? "ring-2 ring-blue-500 ring-offset-2" : "",
      "border-blue-300 dark:border-blue-700"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});
ActionNode.displayName = "ActionNode";

// Logic Node - Conditions and branching
export const LogicNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as BotNodeData;
  const Icon = iconMap[nodeData.icon || "branch"] || GitBranch;

  return (
    <div className={cn(
      "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
      selected ? "ring-2 ring-purple-500 ring-offset-2" : "",
      "border-purple-300 dark:border-purple-700"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-purple-500 to-violet-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
        </div>
      )}
      {/* Multiple outputs for branching */}
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
LogicNode.displayName = "LogicNode";

// Transform Node - Data manipulation
export const TransformNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as BotNodeData;
  const Icon = iconMap[nodeData.icon || "code"] || Code;

  return (
    <div className={cn(
      "min-w-[180px] rounded-xl border-2 bg-white dark:bg-slate-900 shadow-lg transition-all",
      selected ? "ring-2 ring-emerald-500 ring-offset-2" : "",
      "border-emerald-300 dark:border-emerald-700"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-slate-900"
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="h-6 w-6 rounded-md bg-white/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white truncate">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {nodeData.description}
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
TransformNode.displayName = "TransformNode";

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  transform: TransformNode,
};

// Node palette items for drag and drop
export const nodePaletteItems = [
  {
    category: "Triggers",
    color: "amber",
    items: [
      { type: "trigger", label: "Webhook", icon: "webhook", description: "HTTP webhook trigger" },
      { type: "trigger", label: "Schedule", icon: "clock", description: "Cron schedule trigger" },
      { type: "trigger", label: "Event", icon: "zap", description: "Platform event trigger" },
      { type: "trigger", label: "Email", icon: "mail", description: "Email received trigger" },
    ],
  },
  {
    category: "Actions",
    color: "blue",
    items: [
      { type: "action", label: "AI Response", icon: "brain", description: "Generate AI response" },
      { type: "action", label: "Send Email", icon: "mail", description: "Send email message" },
      { type: "action", label: "API Call", icon: "webhook", description: "Make HTTP request" },
      { type: "action", label: "Notification", icon: "bell", description: "Send notification" },
      { type: "action", label: "Database", icon: "database", description: "Database operation" },
    ],
  },
  {
    category: "Logic",
    color: "purple",
    items: [
      { type: "logic", label: "Condition", icon: "branch", description: "If/else branching" },
      { type: "logic", label: "Switch", icon: "branch", description: "Multi-way switch" },
      { type: "logic", label: "Loop", icon: "repeat", description: "Iterate over items" },
      { type: "logic", label: "Delay", icon: "timer", description: "Wait for duration" },
    ],
  },
  {
    category: "Transform",
    color: "emerald",
    items: [
      { type: "transform", label: "Code", icon: "code", description: "Custom JavaScript" },
      { type: "transform", label: "Filter", icon: "filter", description: "Filter data" },
      { type: "transform", label: "Merge", icon: "merge", description: "Merge data" },
      { type: "transform", label: "Parse JSON", icon: "json", description: "Parse JSON data" },
      { type: "transform", label: "Template", icon: "file", description: "Text template" },
    ],
  },
];
