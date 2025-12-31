import {
  Focus,
  DollarSign,
  FlaskConical,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceId = "default" | "focus" | "sales" | "research" | "operations" | string;

export interface WorkspaceConfig {
  id: WorkspaceId;
  name: string;
  icon: string; // emoji
  lucideIcon?: LucideIcon;
  description: string;
  // Navigation filtering
  prioritizeSections?: string[]; // Sections to show first/highlight
  hideSections?: string[]; // Sections to hide
  showOnlyItems?: string[]; // If set, only show these nav items
  hideItems?: string[]; // Items to hide
  // Features
  silentNotifications?: boolean;
  aiMode?: "default" | "research" | "sales" | "creative";
  quickActions?: string[];
  // UI
  accentColor?: string;
  isBuiltIn?: boolean;
  isCustom?: boolean;
}

export const BUILT_IN_WORKSPACES: WorkspaceConfig[] = [
  {
    id: "default",
    name: "All Features",
    icon: "✨",
    lucideIcon: Sparkles,
    description: "Full access to all features",
    isBuiltIn: true,
    accentColor: "violet",
  },
  {
    id: "focus",
    name: "Focus Mode",
    icon: "🎯",
    lucideIcon: Focus,
    description: "Minimal distractions, just the essentials",
    hideSections: ["GROW", "Insights"],
    hideItems: ["activity", "analytics", "usage"],
    silentNotifications: true,
    isBuiltIn: true,
    accentColor: "slate",
    quickActions: ["new-task", "quick-note", "start-timer"],
  },
  {
    id: "sales",
    name: "Sales Mode",
    icon: "💰",
    lucideIcon: DollarSign,
    description: "Pipeline, outreach, and contacts front and center",
    prioritizeSections: ["GROW"],
    showOnlyItems: [
      "home",
      "inbox",
      "search",
      "leads",
      "outreach",
      "contacts",
      "calendar",
      "tasks",
    ],
    aiMode: "sales",
    isBuiltIn: true,
    accentColor: "emerald",
    quickActions: ["log-call", "send-email", "schedule-meeting", "create-lead"],
  },
  {
    id: "research",
    name: "Research Mode",
    icon: "🔬",
    lucideIcon: FlaskConical,
    description: "Documents, AI chat, and deep work",
    prioritizeSections: ["WORK"],
    showOnlyItems: [
      "home",
      "inbox",
      "search",
      "chat",
      "library",
      "documents",
      "intelligence",
      "ideas",
    ],
    aiMode: "research",
    isBuiltIn: true,
    accentColor: "blue",
    quickActions: ["new-document", "ask-ai", "search-docs", "save-insight"],
  },
  {
    id: "operations",
    name: "Operations Mode",
    icon: "⚙️",
    lucideIcon: Settings2,
    description: "Automation, monitoring, and system health",
    prioritizeSections: ["AUTOMATE"],
    showOnlyItems: [
      "home",
      "inbox",
      "search",
      "automation",
      "agents",
      "command-center",
      "activity",
      "usage",
      "developer",
    ],
    isBuiltIn: true,
    accentColor: "orange",
    quickActions: ["run-workflow", "check-status", "view-logs", "create-bot"],
  },
];

export function getWorkspaceById(id: WorkspaceId): WorkspaceConfig | undefined {
  return BUILT_IN_WORKSPACES.find((w) => w.id === id);
}

export function getDefaultWorkspace(): WorkspaceConfig {
  return BUILT_IN_WORKSPACES[0];
}

// Quick actions definitions
export const QUICK_ACTIONS: Record<string, { label: string; icon: string; href?: string; action?: string }> = {
  "new-task": { label: "New Task", icon: "CheckSquare", href: "/dashboard/tasks?new=true" },
  "quick-note": { label: "Quick Note", icon: "StickyNote", action: "open-quick-note" },
  "start-timer": { label: "Start Timer", icon: "Timer", action: "start-focus-timer" },
  "log-call": { label: "Log Call", icon: "Phone", action: "open-call-log" },
  "send-email": { label: "Send Email", icon: "Mail", href: "/dashboard/outreach?compose=true" },
  "schedule-meeting": { label: "Schedule Meeting", icon: "Calendar", href: "/dashboard/calendar?new=true" },
  "create-lead": { label: "Create Lead", icon: "UserPlus", href: "/dashboard/leads?new=true" },
  "new-document": { label: "New Document", icon: "FilePlus", href: "/dashboard/documents?new=true" },
  "ask-ai": { label: "Ask AI", icon: "MessageSquare", href: "/dashboard/chat" },
  "search-docs": { label: "Search Docs", icon: "Search", action: "open-doc-search" },
  "save-insight": { label: "Save Insight", icon: "Lightbulb", action: "open-insight-capture" },
  "run-workflow": { label: "Run Workflow", icon: "Play", action: "open-workflow-runner" },
  "check-status": { label: "Check Status", icon: "Activity", href: "/dashboard/command-center" },
  "view-logs": { label: "View Logs", icon: "ScrollText", href: "/dashboard/activity" },
  "create-bot": { label: "Create Bot", icon: "Bot", href: "/dashboard/bots/builder" },
};
