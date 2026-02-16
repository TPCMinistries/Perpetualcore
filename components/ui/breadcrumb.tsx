"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

// Map of path segments to display names (override auto-formatting)
const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  home: "Home",
  chat: "AI Chat",
  agents: "AI Agents",
  agent: "Agent",
  plans: "Plans",
  workflows: "Workflows",
  contacts: "Contacts",
  library: "Documents",
  tasks: "Tasks",
  projects: "Projects",
  teams: "Teams",
  calendar: "Calendar",
  inbox: "Email",
  settings: "Settings",
  "voice-memos": "Voice Memos",
  "voice-intel": "Voice Intelligence",
  brands: "Brands",
  content: "Content Studio",
  ideas: "Ideas",
  leads: "Leads",
  outreach: "Outreach",
  analytics: "Analytics",
  memory: "AI Memory",
  teach: "Teach AI",
  assistants: "AI Advisors",
  developer: "Developer",
  "api-keys": "API Keys",
  webhooks: "Webhooks",
  "audit-logs": "Audit Logs",
  ecosystem: "Ecosystem",
  intelligence: "Intelligence",
  expenses: "Expenses",
  reminders: "Reminders",
  "command-center": "Command Center",
  help: "Help",
  support: "Support",
  share: "Share & Invite",
  team: "Team",
  search: "Search",
  conversations: "Chat History",
  automation: "Automation Hub",
  "data-explorer": "Data Explorer",
  knowledge: "Knowledge",
  entities: "Entities",
};

// Paths that should not show breadcrumbs (top-level pages)
const HIDE_BREADCRUMB_PATHS = ["/dashboard", "/dashboard/home"];

function formatSegment(segment: string): string {
  if (PATH_LABELS[segment]) return PATH_LABELS[segment];
  // UUID check - show "Details" for UUIDs
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(segment)) return "Details";
  // Auto-format: convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumbs on top-level pages
  if (HIDE_BREADCRUMB_PATHS.includes(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);

  // Need at least 2 segments after /dashboard to show breadcrumbs
  // e.g., /dashboard/agents/123 shows: Home > AI Agents > Details
  if (segments.length <= 2) return null;

  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return { path, label, isLast };
  });

  // Replace first crumb ("dashboard") with Home icon
  crumbs[0] = { path: "/dashboard/home", label: "Home", isLast: false };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm mb-4"
    >
      {crumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
          )}
          {crumb.isLast ? (
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.path}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] flex items-center gap-1"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              {index === 0 ? null : crumb.label}
            </Link>
          )}
        </div>
      ))}
    </motion.nav>
  );
}
