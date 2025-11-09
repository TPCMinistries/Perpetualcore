"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  promptTemplates,
  promptCategories,
  type PromptTemplate,
} from "@/lib/prompts/templates";
import { Search, Command, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt: (template: PromptTemplate) => void;
}

export default function PromptCommandPalette({
  open,
  onOpenChange,
  onSelectPrompt,
}: PromptCommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    let filtered = promptTemplates;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [search, selectedCategory]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredPrompts]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredPrompts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && filteredPrompts[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredPrompts[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredPrompts, selectedIndex]);

  const handleSelect = (template: PromptTemplate) => {
    onSelectPrompt(template);
    onOpenChange(false);
    setSearch("");
    setSelectedCategory(null);
  };

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      creative: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      code: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      writing: "bg-green-500/10 text-green-700 dark:text-green-300",
      analysis: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
      research: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
      business: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
      learning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
      productivity: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    };
    return colors[categoryId] || "bg-slate-500/10 text-slate-700 dark:text-slate-300";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Command className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Prompt Library
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-slate-300 dark:border-slate-700"
              autoFocus
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                !selectedCategory
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              All
            </button>
            {promptCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
                    selectedCategory === cat.id
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[50vh]">
          {filteredPrompts.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                No prompts found
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredPrompts.map((template, index) => {
                const Icon = template.icon;
                const category = promptCategories.find(
                  (c) => c.id === template.category
                );

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-all mb-2",
                      index === selectedIndex
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          index === selectedIndex
                            ? "bg-white/20 dark:bg-slate-900/20"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            index === selectedIndex
                              ? "text-white dark:text-slate-900"
                              : "text-slate-700 dark:text-slate-300"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {template.title}
                          </h4>
                          {template.featured && (
                            <Star
                              className={cn(
                                "h-3 w-3",
                                index === selectedIndex
                                  ? "text-yellow-300"
                                  : "text-yellow-500"
                              )}
                              fill="currentColor"
                            />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-xs mb-2",
                            index === selectedIndex
                              ? "text-white/80 dark:text-slate-900/80"
                              : "text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              index === selectedIndex
                                ? "border-white/30 text-white/90 dark:border-slate-900/30 dark:text-slate-900/90"
                                : getCategoryColor(template.category)
                            )}
                          >
                            {category?.name}
                          </Badge>
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={cn(
                                "text-xs",
                                index === selectedIndex
                                  ? "border-white/20 text-white/70 dark:border-slate-900/20 dark:text-slate-900/70"
                                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <span>{filteredPrompts.length} results</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
