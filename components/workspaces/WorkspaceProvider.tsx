"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  addCustomWorkspace: (workspace: WorkspaceConfig) => void;
  removeCustomWorkspace: (id: string) => void;
  isItemVisible: (itemName: string) => boolean;
  isSectionVisible: (sectionName: string) => boolean;
  isSectionPrioritized: (sectionName: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: getDefaultWorkspace(),
  setWorkspace: () => {},
  availableWorkspaces: BUILT_IN_WORKSPACES,
  customWorkspaces: [],
  addCustomWorkspace: () => {},
  removeCustomWorkspace: () => {},
  isItemVisible: () => true,
  isSectionVisible: () => true,
  isSectionPrioritized: () => false,
});

export const useWorkspace = () => useContext(WorkspaceContext);

const STORAGE_KEY = "ai-os-workspace";
const CUSTOM_WORKSPACES_KEY = "ai-os-custom-workspaces";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceConfig>(
    getDefaultWorkspace()
  );
  const [customWorkspaces, setCustomWorkspaces] = useState<WorkspaceConfig[]>([]);

  // Load workspace from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const workspace = getWorkspaceById(savedId as WorkspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    }

    // Load custom workspaces
    const savedCustom = localStorage.getItem(CUSTOM_WORKSPACES_KEY);
    if (savedCustom) {
      try {
        setCustomWorkspaces(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Failed to parse custom workspaces:", e);
      }
    }
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

  const addCustomWorkspace = useCallback((workspace: WorkspaceConfig) => {
    const newWorkspace = { ...workspace, isCustom: true };
    setCustomWorkspaces((prev) => {
      const updated = [...prev, newWorkspace];
      localStorage.setItem(CUSTOM_WORKSPACES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCustomWorkspace = useCallback((id: string) => {
    setCustomWorkspaces((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      localStorage.setItem(CUSTOM_WORKSPACES_KEY, JSON.stringify(updated));
      return updated;
    });
    // If removing current workspace, switch to default
    if (currentWorkspace.id === id) {
      setWorkspace("default");
    }
  }, [currentWorkspace.id, setWorkspace]);

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
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
