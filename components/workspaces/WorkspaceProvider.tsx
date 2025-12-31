"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  WorkspaceConfig,
  WorkspaceId,
  BUILT_IN_WORKSPACES,
  getWorkspaceById,
  getDefaultWorkspace,
} from "@/config/workspaces";

interface WorkspaceContextType {
  currentWorkspace: WorkspaceConfig;
  setWorkspace: (id: WorkspaceId) => void;
  availableWorkspaces: WorkspaceConfig[];
  customWorkspaces: WorkspaceConfig[];
  addCustomWorkspace: (workspace: Omit<WorkspaceConfig, "id">) => Promise<void>;
  removeCustomWorkspace: (id: string) => Promise<void>;
  isItemVisible: (itemName: string) => boolean;
  isSectionVisible: (sectionName: string) => boolean;
  isSectionPrioritized: (sectionName: string) => boolean;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: getDefaultWorkspace(),
  setWorkspace: () => {},
  availableWorkspaces: BUILT_IN_WORKSPACES,
  customWorkspaces: [],
  addCustomWorkspace: async () => {},
  removeCustomWorkspace: async () => {},
  isItemVisible: () => true,
  isSectionVisible: () => true,
  isSectionPrioritized: () => false,
  isLoading: true,
});

export const useWorkspace = () => useContext(WorkspaceContext);

const STORAGE_KEY = "ai-os-workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceConfig>(
    getDefaultWorkspace()
  );
  const [customWorkspaces, setCustomWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load workspaces from database and localStorage
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);

          // Load user's custom workspaces from database
          const { data: dbWorkspaces } = await supabase
            .from("user_workspaces")
            .select("*")
            .eq("user_id", user.id);

          if (dbWorkspaces && dbWorkspaces.length > 0) {
            const customWs = dbWorkspaces.map((ws) => ({
              id: ws.id,
              name: ws.name,
              icon: ws.config?.icon || "📁",
              description: ws.config?.description || "",
              ...ws.config,
              isCustom: true,
            }));
            setCustomWorkspaces(customWs);

            // Find and set default workspace
            const defaultWs = dbWorkspaces.find((ws) => ws.is_default);
            if (defaultWs) {
              const wsConfig = {
                id: defaultWs.id,
                name: defaultWs.name,
                icon: defaultWs.config?.icon || "📁",
                description: defaultWs.config?.description || "",
                ...defaultWs.config,
                isCustom: true,
              };
              setCurrentWorkspace(wsConfig);
            }
          }
        }

        // Also check localStorage for last used workspace
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const builtInWs = getWorkspaceById(savedId as WorkspaceId);
          if (builtInWs) {
            setCurrentWorkspace(builtInWs);
          }
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const setWorkspace = useCallback((id: WorkspaceId) => {
    // Check built-in first, then custom
    let workspace = getWorkspaceById(id);
    if (!workspace) {
      workspace = customWorkspaces.find((w) => w.id === id);
    }
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem(STORAGE_KEY, id);

      // Dispatch event for other components to react
      window.dispatchEvent(
        new CustomEvent("workspaceChanged", { detail: { workspace } })
      );
    }
  }, [customWorkspaces]);

  const addCustomWorkspace = useCallback(async (workspace: Omit<WorkspaceConfig, "id">) => {
    if (!userId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_workspaces")
        .insert({
          user_id: userId,
          name: workspace.name,
          config: {
            icon: workspace.icon,
            description: workspace.description,
            prioritizeSections: workspace.prioritizeSections,
            hideSections: workspace.hideSections,
            showOnlyItems: workspace.showOnlyItems,
            hideItems: workspace.hideItems,
            silentNotifications: workspace.silentNotifications,
            aiMode: workspace.aiMode,
            quickActions: workspace.quickActions,
            accentColor: workspace.accentColor,
          },
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newWorkspace: WorkspaceConfig = {
          id: data.id,
          name: data.name,
          icon: data.config?.icon || "📁",
          description: data.config?.description || "",
          ...data.config,
          isCustom: true,
        };
        setCustomWorkspaces((prev) => [...prev, newWorkspace]);
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
      throw error;
    }
  }, [userId]);

  const removeCustomWorkspace = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_workspaces")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;

      setCustomWorkspaces((prev) => prev.filter((w) => w.id !== id));

      // If removing current workspace, switch to default
      if (currentWorkspace.id === id) {
        setWorkspace("default");
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      throw error;
    }
  }, [userId, currentWorkspace.id, setWorkspace]);

  // Check if a navigation item should be visible in current workspace
  const isItemVisible = useCallback(
    (itemName: string): boolean => {
      const normalizedName = itemName.toLowerCase().replace(/\s+/g, "-");

      // If showOnlyItems is set, only those items are visible
      if (currentWorkspace.showOnlyItems?.length) {
        return currentWorkspace.showOnlyItems.some(
          (item) => item.toLowerCase() === normalizedName
        );
      }

      // Check if item is hidden
      if (currentWorkspace.hideItems?.length) {
        return !currentWorkspace.hideItems.some(
          (item) => item.toLowerCase() === normalizedName
        );
      }

      return true;
    },
    [currentWorkspace]
  );

  // Check if a section should be visible
  const isSectionVisible = useCallback(
    (sectionName: string): boolean => {
      if (currentWorkspace.hideSections?.length) {
        return !currentWorkspace.hideSections.some(
          (s) => s.toLowerCase() === sectionName.toLowerCase()
        );
      }
      return true;
    },
    [currentWorkspace]
  );

  // Check if a section should be prioritized (shown first/highlighted)
  const isSectionPrioritized = useCallback(
    (sectionName: string): boolean => {
      if (currentWorkspace.prioritizeSections?.length) {
        return currentWorkspace.prioritizeSections.some(
          (s) => s.toLowerCase() === sectionName.toLowerCase()
        );
      }
      return false;
    },
    [currentWorkspace]
  );

  const availableWorkspaces = [...BUILT_IN_WORKSPACES, ...customWorkspaces];

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setWorkspace,
        availableWorkspaces,
        customWorkspaces,
        addCustomWorkspace,
        removeCustomWorkspace,
        isItemVisible,
        isSectionVisible,
        isSectionPrioritized,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
