"use client";

import {
  Zap,
  Clock,
  Webhook,
  Brain,
  FileText,
  GitBranch,
  Repeat,
  Timer,
  Mail,
  Database,
  Send,
  Code,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/lib/workflow-engine";

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  clock: Clock,
  webhook: Webhook,
  brain: Brain,
  "file-text": FileText,
  branch: GitBranch,
  repeat: Repeat,
  timer: Timer,
  mail: Mail,
  database: Database,
  send: Send,
  code: Code,
};

interface PaletteItem {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
}

interface PaletteCategory {
  category: string;
  color: string;
  items: PaletteItem[];
}

const colorClasses: Record<string, string> = {
  emerald:
    "from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700",
  purple:
    "from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700",
  amber:
    "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
  blue: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
  slate: "from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-800",
};

const paletteItems: PaletteCategory[] = [
  {
    category: "Triggers",
    color: "emerald",
    items: [
      {
        type: "input",
        label: "Webhook",
        icon: "webhook",
        description: "HTTP webhook trigger",
      },
      {
        type: "input",
        label: "Schedule",
        icon: "clock",
        description: "Cron schedule trigger",
      },
      {
        type: "input",
        label: "Manual",
        icon: "zap",
        description: "Manual trigger",
      },
    ],
  },
  {
    category: "AI",
    color: "purple",
    items: [
      {
        type: "assistant",
        label: "Assistant",
        icon: "brain",
        description: "AI processing step",
      },
      {
        type: "assistant",
        label: "Summarizer",
        icon: "file-text",
        description: "AI text summarizer",
      },
      {
        type: "assistant",
        label: "Classifier",
        icon: "brain",
        description: "AI classification",
      },
    ],
  },
  {
    category: "Logic",
    color: "amber",
    items: [
      {
        type: "condition",
        label: "Condition",
        icon: "branch",
        description: "If/else branching",
      },
      {
        type: "custom",
        label: "Loop",
        icon: "repeat",
        description: "Iterate over items",
      },
      {
        type: "custom",
        label: "Delay",
        icon: "timer",
        description: "Wait for duration",
      },
    ],
  },
  {
    category: "Output",
    color: "blue",
    items: [
      {
        type: "output",
        label: "Email",
        icon: "mail",
        description: "Send email output",
      },
      {
        type: "output",
        label: "Webhook",
        icon: "send",
        description: "Send to webhook",
      },
      {
        type: "output",
        label: "Database",
        icon: "database",
        description: "Store in database",
      },
    ],
  },
];

export function WorkflowNodePalette() {
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Node Palette</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag nodes to the canvas
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {paletteItems.map((category) => (
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
                          "application/workflownode",
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
                        <p className="text-sm font-medium truncate">
                          {item.label}
                        </p>
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
  );
}
