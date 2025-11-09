"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  promptTemplates,
  promptCategories,
  type PromptTemplate,
} from "@/lib/prompts/templates";
import { Search, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt: (template: PromptTemplate) => void;
}

export default function PromptLibrary({
  open,
  onOpenChange,
  onSelectPrompt,
}: PromptLibraryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter prompts
  const filteredPrompts = promptTemplates.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Featured prompts
  const featuredPrompts = filteredPrompts.filter((p) => p.featured);

  const handleSelect = (template: PromptTemplate) => {
    onSelectPrompt(template);
    onOpenChange(false);
  };

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      creative: "from-purple-500 to-pink-500",
      code: "from-blue-500 to-cyan-500",
      writing: "from-green-500 to-emerald-500",
      analysis: "from-orange-500 to-amber-500",
      research: "from-pink-500 to-rose-500",
      business: "from-indigo-500 to-blue-500",
      learning: "from-yellow-500 to-orange-500",
      productivity: "from-cyan-500 to-teal-500",
    };
    return colors[categoryId] || "from-slate-500 to-slate-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold mb-2">
                Prompt Library
              </DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Discover powerful prompts to supercharge your workflow
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {filteredPrompts.length} prompts
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              size="sm"
              variant={!selectedCategory ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={cn(
                !selectedCategory &&
                  "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
              )}
            >
              All Categories
            </Button>
            {promptCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "gap-1.5",
                    selectedCategory === cat.id &&
                      "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-6">
          {/* Featured Section */}
          {featuredPrompts.length > 0 && !search && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Featured Prompts
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredPrompts.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-left transition-all hover:shadow-lg hover:scale-105 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Gradient Accent */}
                      <div
                        className={cn(
                          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                          getCategoryColor(template.category)
                        )}
                      />

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-br",
                            getCategoryColor(template.category)
                          )}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {template.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-slate-300 dark:border-slate-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Prompts */}
          <div>
            {!search && featuredPrompts.length > 0 && (
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                All Prompts
              </h3>
            )}

            {filteredPrompts.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  No prompts found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrompts.map((template) => {
                  const Icon = template.icon;
                  const category = promptCategories.find(
                    (c) => c.id === template.category
                  );

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {template.title}
                            </h4>
                            {template.featured && (
                              <Star
                                className="h-3 w-3 text-yellow-500 flex-shrink-0"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        >
                          {category?.name}
                        </Badge>
                        {template.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-slate-300 dark:border-slate-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
