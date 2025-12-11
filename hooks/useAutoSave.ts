import { useState, useRef, useCallback, useEffect } from "react";

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number; // in milliseconds
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  setDirty: (dirty: boolean) => void;
  triggerSave: () => void;
}

export function useAutoSave({
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveRef = useRef(onSave);

  // Keep onSave ref updated
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const setDirty = useCallback(
    (dirty: boolean) => {
      setIsDirty(dirty);

      if (dirty && enabled) {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout for auto-save
        timeoutRef.current = setTimeout(async () => {
          setIsSaving(true);
          try {
            await saveRef.current();
            setLastSavedAt(new Date());
            setIsDirty(false);
          } catch (error) {
            console.error("Auto-save failed:", error);
          } finally {
            setIsSaving(false);
          }
        }, delay);
      }
    },
    [enabled, delay]
  );

  const triggerSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    try {
      await saveRef.current();
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error("Manual save failed:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Warn before leaving if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (enabled) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, enabled]);

  return {
    isDirty,
    isSaving,
    lastSavedAt,
    setDirty,
    triggerSave,
  };
}
