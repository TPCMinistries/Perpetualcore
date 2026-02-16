"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "mod+k", description: "Open command palette" },
      { keys: "mod+/", description: "Toggle sidebar" },
      { keys: "?", description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Chat",
    shortcuts: [
      { keys: "mod+j", description: "Open AI Chat" },
      { keys: "mod+enter", description: "Send message" },
      { keys: "escape", description: "Close dialog / cancel" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: "mod+n", description: "Create new item" },
      { keys: "mod+s", description: "Save current" },
      { keys: "mod+shift+p", description: "New project" },
    ],
  },
  {
    title: "Views",
    shortcuts: [
      { keys: "mod+1", description: "Go to Home" },
      { keys: "mod+2", description: "Go to Chat" },
      { keys: "mod+3", description: "Go to Tasks" },
      { keys: "mod+4", description: "Go to Contacts" },
    ],
  },
];

function ShortcutKey({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split("+");

  return (
    <span className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground/50 mx-0.5">+</span>}
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium rounded-md bg-muted border border-border/50 text-foreground shadow-sm">
            {formatShortcut(key)}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcuts({
    "?": () => setIsOpen(prev => !prev),
    escape: () => setIsOpen(false),
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Keyboard className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Shortcut Groups */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-5">
                {SHORTCUT_GROUPS.map((group, groupIndex) => (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.05 }}
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.keys}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">{shortcut.description}</span>
                          <ShortcutKey shortcut={shortcut.keys} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-xs font-medium">?</kbd> to toggle this panel
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline keyboard shortcut badge for buttons
 * Usage: <button>New Task <Kbd shortcut="mod+n" /></button>
 */
export function Kbd({ shortcut, className }: { shortcut: string; className?: string }) {
  return (
    <kbd className={cn(
      "ml-2 inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1 py-0.5 text-[10px] font-medium text-muted-foreground",
      className
    )}>
      {formatShortcut(shortcut)}
    </kbd>
  );
}
