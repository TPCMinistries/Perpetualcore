"use client";

import { useEffect, useCallback } from "react";

type KeyCombo = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type ShortcutHandler = () => void;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Hook for registering global keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, ShortcutHandler>,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape to still work
        if (event.key !== "Escape") return;
      }

      // Build the key combo string
      const parts: string[] = [];
      if (event.metaKey || event.ctrlKey) parts.push("mod");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");
      parts.push(event.key.toLowerCase());

      const combo = parts.join("+");

      // Check for matching shortcut
      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo]();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Parse a shortcut string like "mod+j" into a readable format
 */
export function formatShortcut(shortcut: string): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  return shortcut
    .split("+")
    .map((key) => {
      switch (key) {
        case "mod":
          return isMac ? "⌘" : "Ctrl";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "alt":
          return isMac ? "⌥" : "Alt";
        case "enter":
          return "↵";
        case "escape":
          return "Esc";
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? "" : "+");
}
