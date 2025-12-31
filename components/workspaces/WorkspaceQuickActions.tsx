"use client";

import { Button } from "@/components/ui/button";
import { useWorkspace } from "./WorkspaceProvider";
import {
  CheckSquare,
  Mail,
  Calendar,
  FileText,
  Phone,
  Target,
  Zap,
  Brain,
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  href?: string;
  action?: () => void;
}

const workspaceActions: Record<string, QuickAction[]> = {
  focus: [
    { id: "tasks", label: "View Tasks", icon: CheckSquare, href: "/dashboard/tasks" },
    { id: "documents", label: "Documents", icon: FileText, href: "/dashboard/library" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/dashboard/calendar" },
  ],
  sales: [
    { id: "leads", label: "Check Leads", icon: Target, href: "/dashboard/leads" },
    { id: "outreach", label: "Send Outreach", icon: Mail, href: "/dashboard/outreach" },
    { id: "calls", label: "Log Call", icon: Phone, href: "/dashboard/contacts?action=log-call" },
  ],
  research: [
    { id: "chat", label: "Research Chat", icon: Brain, href: "/dashboard/chat" },
    { id: "documents", label: "Documents", icon: FileText, href: "/dashboard/library" },
    { id: "search", label: "Deep Search", icon: Target, href: "/dashboard/search" },
  ],
  operations: [
    { id: "automation", label: "Automations", icon: Zap, href: "/dashboard/automation" },
    { id: "activity", label: "Activity", icon: CheckSquare, href: "/dashboard/activity" },
    { id: "analytics", label: "Analytics", icon: Target, href: "/dashboard/analytics" },
  ],
};

export function WorkspaceQuickActions() {
  const { currentWorkspace } = useWorkspace();

  const actions = workspaceActions[currentWorkspace.id] || [];

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
      <p className="w-full text-xs text-muted-foreground mb-1">Quick Actions</p>
      {actions.map((action) => (
        <Link key={action.id} href={action.href || "#"}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
