"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Entity, EntityWithStats, Brand, EntityContext } from "@/types/entities";

interface EntityProviderProps {
  children: ReactNode;
}

interface EntityContextValue extends EntityContext {
  switchEntity: (entityId: string | null) => void;
  switchBrand: (brandId: string | null) => void;
  refreshEntities: () => Promise<void>;
}

const EntityContextInstance = createContext<EntityContextValue | null>(null);

export function EntityProvider({ children }: EntityProviderProps) {
  const [entities, setEntities] = useState<EntityWithStats[]>([]);
  const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/entities");
      if (!response.ok) {
        throw new Error("Failed to fetch entities");
      }

      const data = await response.json();
      setEntities(data.entities || []);

      // Restore last selected entity from localStorage (if explicitly saved)
      // Default: "All Spaces" (null) - shows all data unfiltered
      const savedEntityId = localStorage.getItem("perpetual-current-entity");
      if (savedEntityId && data.entities?.length > 0) {
        const saved = data.entities.find((e: EntityWithStats) => e.id === savedEntityId);
        if (saved) {
          setCurrentEntity(saved);
        }
        // If saved entity no longer exists, stay at "All Spaces" (null)
      }
      // No else - default to null (All Spaces)
    } catch (err) {
      console.error("Error fetching entities:", err);
      setError(err instanceof Error ? err.message : "Failed to load entities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const switchEntity = useCallback((entityId: string | null) => {
    if (!entityId) {
      setCurrentEntity(null);
      setCurrentBrand(null);
      localStorage.removeItem("perpetual-current-entity");
      return;
    }

    const entity = entities.find((e) => e.id === entityId);
    if (entity) {
      setCurrentEntity(entity);
      setCurrentBrand(null); // Reset brand when switching entity
      localStorage.setItem("perpetual-current-entity", entityId);

      // Dispatch event for other components
      window.dispatchEvent(
        new CustomEvent("entity-switch", { detail: { entity } })
      );
    }
  }, [entities]);

  const switchBrand = useCallback(async (brandId: string | null) => {
    if (!brandId) {
      setCurrentBrand(null);
      localStorage.removeItem("perpetual-current-brand");
      return;
    }

    try {
      const response = await fetch(`/api/brands/${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentBrand(data.brand);
        localStorage.setItem("perpetual-current-brand", brandId);

        // Dispatch event
        window.dispatchEvent(
          new CustomEvent("brand-switch", { detail: { brand: data.brand } })
        );
      }
    } catch (err) {
      console.error("Error fetching brand:", err);
    }
  }, []);

  const value: EntityContextValue = {
    entities,
    currentEntity,
    currentBrand,
    isLoading,
    error,
    switchEntity,
    switchBrand,
    refreshEntities: fetchEntities,
  };

  return (
    <EntityContextInstance.Provider value={value}>
      {children}
    </EntityContextInstance.Provider>
  );
}

export function useEntityContext() {
  const context = useContext(EntityContextInstance);
  if (!context) {
    throw new Error("useEntityContext must be used within an EntityProvider");
  }
  return context;
}

/**
 * Hook for getting current entity context for API calls
 */
export function useCurrentEntityIds() {
  const { currentEntity, currentBrand } = useEntityContext();
  return {
    entityId: currentEntity?.id || null,
    brandId: currentBrand?.id || null,
  };
}
