"use client";

import { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
  className?: string;
}

export function WorkspaceSwitcher({ collapsed, className }: WorkspaceSwitcherProps) {
  const {
    currentWorkspace,
    setWorkspace,
    availableWorkspaces,
  } = useWorkspace();

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-lg",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              className
            )}
          >
            <span className="text-lg">{currentWorkspace.icon}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableWorkspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setWorkspace(workspace.id)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{workspace.icon}</span>
              <span className="flex-1">{workspace.name}</span>
              {currentWorkspace.id === workspace.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between h-auto py-2 px-3",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            "border border-transparent hover:border-slate-200 dark:hover:border-slate-700",
            "rounded-lg transition-all",
            className
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-lg",
                "bg-gradient-to-br",
                currentWorkspace.accentColor === "violet" && "from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30",
                currentWorkspace.accentColor === "slate" && "from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800",
                currentWorkspace.accentColor === "emerald" && "from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30",
                currentWorkspace.accentColor === "blue" && "from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
                currentWorkspace.accentColor === "orange" && "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30"
              )}
            >
              {currentWorkspace.icon}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{currentWorkspace.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {currentWorkspace.description}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Switch Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableWorkspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setWorkspace(workspace.id)}
            className={cn(
              "flex items-start gap-3 py-2 cursor-pointer",
              currentWorkspace.id === workspace.id && "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0",
                "bg-gradient-to-br",
                workspace.accentColor === "violet" && "from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30",
                workspace.accentColor === "slate" && "from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800",
                workspace.accentColor === "emerald" && "from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30",
                workspace.accentColor === "blue" && "from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
                workspace.accentColor === "orange" && "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30"
              )}
            >
              {workspace.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{workspace.name}</p>
                {workspace.isCustom && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Custom
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {workspace.description}
              </p>
            </div>
            {currentWorkspace.id === workspace.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          Create Custom Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
