"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Loader2,
  RefreshCw,
  FileText,
  Tag,
  Hash,
  Zap,
  FolderOpen,
  BookOpen,
  Briefcase,
  Lightbulb,
  Star,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SmartCollection {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  documentIds: string[];
  confidence: number;
  color: string;
  icon: string;
  isPinned?: boolean;
  type: "auto" | "manual";
}

interface SmartCollectionsProps {
  onCollectionSelect?: (collection: SmartCollection) => void;
  onDocumentsFilter?: (documentIds: string[]) => void;
  selectedCollectionId?: string | null;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  folder: Folder,
  "folder-open": FolderOpen,
  book: BookOpen,
  "file-text": FileText,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  star: Star,
  tag: Tag,
  bookmark: Bookmark,
};

export function SmartCollections({
  onCollectionSelect,
  onDocumentsFilter,
  selectedCollectionId,
  className,
}: SmartCollectionsProps) {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{
    totalDocuments: number;
    clusteredDocuments: number;
    clusterCount: number;
  } | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/library/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateClusters = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/library/collections/generate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate clusters");
      }

      const data = await response.json();
      setCollections(data.clusters || []);
      setStats(data.stats || null);
      toast.success(`Generated ${data.clusters?.length || 0} smart collections`);
    } catch (error) {
      console.error("Error generating clusters:", error);
      toast.error("Failed to generate clusters");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCollectionClick = (collection: SmartCollection) => {
    onCollectionSelect?.(collection);
    onDocumentsFilter?.(collection.documentIds);
  };

  const togglePin = async (collection: SmartCollection) => {
    try {
      await fetch(`/api/library/collections/${collection.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !collection.isPinned }),
      });

      setCollections(prev =>
        prev.map(c =>
          c.id === collection.id ? { ...c, isPinned: !c.isPinned } : c
        )
      );
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      await fetch(`/api/library/collections/${collectionId}`, {
        method: "DELETE",
      });

      setCollections(prev => prev.filter(c => c.id !== collectionId));
      toast.success("Collection deleted");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  // Sort: pinned first, then by document count
  const sortedCollections = [...collections].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.documentIds.length - a.documentIds.length;
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Collections</h3>
            {stats && (
              <p className="text-xs text-slate-400">
                {stats.clusteredDocuments} of {stats.totalDocuments} docs organized
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchCollections}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateClusters}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white border border-purple-500/30 hover:border-purple-500/50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyzing documents...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Generate Smart Collections
          </>
        )}
      </Button>

      {/* Collections List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 rounded-lg bg-white/5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-6">
            <FolderOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No collections yet</p>
            <p className="text-xs text-slate-500">
              Click "Generate Smart Collections" to auto-organize your documents
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {sortedCollections.map((collection) => {
              const IconComponent = iconMap[collection.icon] || Folder;
              const isExpanded = expandedCollections.has(collection.id);
              const isSelected = selectedCollectionId === collection.id;

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "rounded-lg border transition-all",
                    isSelected
                      ? "bg-white/10 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                  )}
                >
                  {/* Collection Header */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => handleCollectionClick(collection)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(collection.id);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${collection.color}20` }}
                    >
                      <IconComponent
                        className="h-4 w-4"
                        style={{ color: collection.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {collection.name}
                        </p>
                        {collection.isPinned && (
                          <Pin className="h-3 w-3 text-amber-400" />
                        )}
                        {collection.type === "auto" && (
                          <Sparkles className="h-3 w-3 text-purple-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {collection.documentIds.length} document{collection.documentIds.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Confidence Badge */}
                    <div
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        collection.confidence >= 0.8
                          ? "bg-green-500/20 text-green-400"
                          : collection.confidence >= 0.6
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                      )}
                    >
                      {Math.round(collection.confidence * 100)}%
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => togglePin(collection)}
                          className="text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          {collection.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin to top
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {}}
                          className="text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                          onClick={() => deleteCollection(collection.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-white/5">
                          {/* Description */}
                          {collection.description && (
                            <p className="text-xs text-slate-400 mb-3">
                              {collection.description}
                            </p>
                          )}

                          {/* Keywords */}
                          {collection.keywords.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {collection.keywords.map((keyword, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400"
                                >
                                  <Hash className="h-2.5 w-2.5 inline mr-0.5" />
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Topics Summary */}
      {stats && stats.clusterCount > 0 && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-2">Topics Distribution</p>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
            {sortedCollections.slice(0, 5).map((collection, i) => {
              const percentage = (collection.documentIds.length / stats.totalDocuments) * 100;
              return (
                <div
                  key={collection.id}
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: collection.color,
                  }}
                  title={`${collection.name}: ${Math.round(percentage)}%`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
