"use client";

import { motion } from "framer-motion";
import { Brain, Network, FolderOpen } from "lucide-react";

export type LibraryMode = "assistant" | "graph" | "files";

interface LibraryModeSwitchProps {
  mode: LibraryMode;
  onModeChange: (mode: LibraryMode) => void;
}

const modes: { id: LibraryMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "assistant", label: "AI", icon: Brain, description: "Ask anything" },
  { id: "graph", label: "Graph", icon: Network, description: "Visual map" },
  { id: "files", label: "Files", icon: FolderOpen, description: "Browse all" },
];

export function LibraryModeSwitch({ mode, onModeChange }: LibraryModeSwitchProps) {
  return (
    <div className="relative flex items-center gap-1 p-1 rounded-xl bg-slate-900/5 dark:bg-white/5 backdrop-blur-xl border border-white/10">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              isActive
                ? "text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 shadow-lg"
                style={{
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        );
      })}

      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-violet-600/20 rounded-xl blur-xl opacity-50 -z-10" />
    </div>
  );
}
