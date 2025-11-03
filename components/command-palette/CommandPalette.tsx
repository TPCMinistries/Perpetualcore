"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Home,
  MessageSquare,
  FileText,
  Calendar,
  Mail,
  CheckSquare,
  Settings,
  MessageCircle,
  Search,
  Bell,
  BarChart3,
  Plus,
  FileUp,
  LogOut,
  Moon,
  Sun,
  Download,
  Upload,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  category: "navigation" | "actions" | "settings";
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Toggle command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-home",
      label: "Go to Dashboard",
      icon: Home,
      action: () => navigate("/dashboard"),
      category: "navigation",
      keywords: ["home", "overview"],
    },
    {
      id: "nav-chat",
      label: "Go to AI Chat",
      icon: MessageSquare,
      action: () => navigate("/dashboard/chat"),
      category: "navigation",
      keywords: ["ai", "assistant", "conversation"],
    },
    {
      id: "nav-search",
      label: "Go to Search",
      icon: Search,
      action: () => navigate("/dashboard/search"),
      category: "navigation",
      keywords: ["find", "lookup"],
    },
    {
      id: "nav-documents",
      label: "Go to Documents",
      icon: FileText,
      action: () => navigate("/dashboard/documents"),
      category: "navigation",
      keywords: ["files", "docs"],
    },
    {
      id: "nav-calendar",
      label: "Go to Calendar",
      icon: Calendar,
      action: () => navigate("/dashboard/calendar"),
      category: "navigation",
      keywords: ["events", "schedule"],
    },
    {
      id: "nav-email",
      label: "Go to Email",
      icon: Mail,
      action: () => navigate("/dashboard/email"),
      category: "navigation",
      keywords: ["inbox", "messages"],
    },
    {
      id: "nav-tasks",
      label: "Go to Tasks",
      icon: CheckSquare,
      action: () => navigate("/dashboard/tasks"),
      category: "navigation",
      keywords: ["todos", "todo"],
    },
    {
      id: "nav-whatsapp",
      label: "Go to WhatsApp",
      icon: MessageCircle,
      action: () => navigate("/dashboard/whatsapp"),
      category: "navigation",
      keywords: ["messages", "chat"],
    },
    {
      id: "nav-notifications",
      label: "Go to Notifications",
      icon: Bell,
      action: () => navigate("/dashboard/notifications"),
      category: "navigation",
      keywords: ["alerts", "updates"],
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      action: () => navigate("/dashboard/analytics"),
      category: "navigation",
      keywords: ["stats", "metrics", "insights"],
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: Settings,
      action: () => navigate("/dashboard/settings"),
      category: "navigation",
      keywords: ["preferences", "config"],
    },

    // Quick Actions
    {
      id: "action-new-task",
      label: "Create New Task",
      icon: Plus,
      action: () => navigate("/dashboard/tasks?new=true"),
      category: "actions",
      keywords: ["add", "todo"],
    },
    {
      id: "action-new-document",
      label: "Create New Document",
      icon: Plus,
      action: () => navigate("/dashboard/documents?new=true"),
      category: "actions",
      keywords: ["add", "file"],
    },
    {
      id: "action-upload",
      label: "Upload Document",
      icon: FileUp,
      action: () => navigate("/dashboard/documents?upload=true"),
      category: "actions",
      keywords: ["add", "file", "import"],
    },
    {
      id: "action-export",
      label: "Export Data",
      icon: Download,
      action: () => navigate("/dashboard/settings/import-export"),
      category: "actions",
      keywords: ["download", "backup"],
    },
    {
      id: "action-import",
      label: "Import Data",
      icon: Upload,
      action: () => navigate("/dashboard/settings/import-export"),
      category: "actions",
      keywords: ["upload", "restore"],
    },

    // Settings
    {
      id: "settings-billing",
      label: "Manage Billing",
      icon: Settings,
      action: () => navigate("/dashboard/settings/billing"),
      category: "settings",
      keywords: ["subscription", "payment", "plan"],
    },
    {
      id: "settings-profile",
      label: "Edit Profile",
      icon: Settings,
      action: () => navigate("/dashboard/settings"),
      category: "settings",
      keywords: ["account", "user"],
    },
    {
      id: "settings-notifications",
      label: "Notification Settings",
      icon: Bell,
      action: () => navigate("/dashboard/notifications/settings"),
      category: "settings",
      keywords: ["alerts", "preferences"],
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-1/2 top-[20%] w-full max-w-2xl -translate-x-1/2">
        <Command className="rounded-lg border bg-white shadow-2xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
            />
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="mb-2">
              {commands
                .filter((cmd) => cmd.category === "navigation")
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.keywords?.join(" ") || ""}`}
                      onSelect={() => cmd.action()}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span>{cmd.label}</span>
                    </Command.Item>
                  );
                })}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-gray-200" />

            <Command.Group heading="Actions" className="mb-2">
              {commands
                .filter((cmd) => cmd.category === "actions")
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.keywords?.join(" ") || ""}`}
                      onSelect={() => cmd.action()}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span>{cmd.label}</span>
                    </Command.Item>
                  );
                })}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-gray-200" />

            <Command.Group heading="Settings">
              {commands
                .filter((cmd) => cmd.category === "settings")
                .map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.keywords?.join(" ") || ""}`}
                      onSelect={() => cmd.action()}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span>{cmd.label}</span>
                    </Command.Item>
                  );
                })}
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↑</kbd>
                <kbd className="rounded border bg-muted px-1 font-mono">↓</kbd>
                <span className="ml-1">navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd>
                <span className="ml-1">select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">
                {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">K</kbd>
              <span className="ml-1">to toggle</span>
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
