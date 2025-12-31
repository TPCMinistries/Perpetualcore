"use client";

import { useWorkspace } from "@/components/workspaces/WorkspaceProvider";
import { BUILT_IN_WORKSPACES } from "@/config/workspaces";
import { cn } from "@/lib/utils";

export function MobileWorkspaceBar() {
  const { currentWorkspace, setWorkspace } = useWorkspace();

  const workspaces = Object.values(BUILT_IN_WORKSPACES);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1 safe-area-pb">
        <div className="flex justify-around items-center">
          {workspaces.slice(0, 5).map((workspace) => {
            const isActive = currentWorkspace.id === workspace.id;

            return (
              <button
                key={workspace.id}
                onClick={() => setWorkspace(workspace.id)}
                className={cn(
                  "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="text-lg">{workspace.icon}</span>
                <span className={cn(
                  "text-[10px] mt-0.5",
                  isActive
                    ? "text-slate-900 dark:text-slate-100 font-medium"
                    : "text-muted-foreground"
                )}>
                  {workspace.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
