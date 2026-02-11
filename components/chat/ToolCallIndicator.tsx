"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  FileText,
  MessageSquare,
  Users,
  CheckSquare,
  Terminal,
  Bot,
  Activity,
  Mail,
  Calendar,
  Zap,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { type ToolActivity } from "./types";
import { cn } from "@/lib/utils";

interface ToolCallIndicatorProps {
  activities: ToolActivity[];
}

const TOOL_META: Record<string, { label: string; icon: typeof Globe }> = {
  web_search: { label: "Searching the web", icon: Globe },
  search_documents: { label: "Searching documents", icon: FileText },
  search_conversations: { label: "Searching conversations", icon: MessageSquare },
  search_contacts: { label: "Searching contacts", icon: Users },
  create_task: { label: "Creating task", icon: CheckSquare },
  execute_code: { label: "Running code", icon: Terminal },
  browse_web: { label: "Browsing website", icon: Globe },
  delegate_to_agent: { label: "Creating agent plan", icon: Bot },
  get_plan_status: { label: "Checking plan status", icon: Activity },
};

const PREFIX_META: { prefix: string; label: string; icon: typeof Globe }[] = [
  { prefix: "gmail_", label: "Working with email", icon: Mail },
  { prefix: "google-calendar_", label: "Working with calendar", icon: Calendar },
  { prefix: "todoist_", label: "Managing tasks", icon: CheckSquare },
  { prefix: "linear_", label: "Updating Linear", icon: Zap },
];

function getToolMeta(name: string) {
  if (TOOL_META[name]) return TOOL_META[name];
  for (const p of PREFIX_META) {
    if (name.startsWith(p.prefix)) return { label: p.label, icon: p.icon };
  }
  return { label: `Running ${name.replace(/_/g, " ")}`, icon: Wrench };
}

export function ToolCallIndicator({ activities }: ToolCallIndicatorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1.5 mb-2">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, i) => {
          const meta = getToolMeta(activity.name);
          const Icon = meta.icon;
          const isExpanded = expandedIndex === i;

          return (
            <motion.div
              key={`${activity.name}-${i}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="button"
                onClick={() =>
                  activity.result
                    ? setExpandedIndex(isExpanded ? null : i)
                    : undefined
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activity.status === "running" &&
                    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
                  activity.status === "complete" &&
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer",
                  activity.status === "error" &&
                    "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                )}
              >
                {activity.status === "running" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {activity.status === "complete" && (
                  <CheckCircle className="h-3 w-3" />
                )}
                {activity.status === "error" && (
                  <AlertCircle className="h-3 w-3" />
                )}
                <Icon className="h-3 w-3" />
                <span>
                  {activity.status === "running"
                    ? `${meta.label}...`
                    : activity.result || meta.label}
                </span>
              </button>

              {isExpanded && activity.result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 ml-3 text-xs text-slate-500 dark:text-slate-400 max-w-md truncate"
                >
                  {activity.result}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
