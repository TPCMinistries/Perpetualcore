"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionItemComponent } from "./AttentionItem";
import {
  AttentionFilters,
  FilterType,
  FilterUrgency,
  SortOption,
  ViewMode,
} from "./AttentionFilters";
import { BulkActionBar } from "./BulkActionBar";
import {
  AttentionItem,
  AttentionItemType,
  sortByPriority,
  groupByPriority,
} from "@/lib/attention/priority";
import {
  Search,
  RefreshCw,
  Inbox,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface AttentionCenterProps {
  initialFilter?: FilterType;
}

export function AttentionCenter({ initialFilter = "all" }: AttentionCenterProps) {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [filterType, setFilterType] = useState<FilterType>(initialFilter);
  const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterUrgency !== "all") params.set("urgency", filterUrgency);
      params.set("sort", sortBy);

      const response = await fetch(`/api/attention?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching attention items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, filterUrgency, sortBy]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items by search
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.preview?.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query)
    );
  });

  // Apply sorting
  const sortedItems = sortBy === "priority"
    ? sortByPriority(filteredItems)
    : sortBy === "date"
    ? [...filteredItems].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [...filteredItems].sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });

  // Calculate counts
  const counts: Record<FilterType, number> = {
    all: items.length,
    task: items.filter((i) => i.type === "task").length,
    email: items.filter((i) => i.type === "email").length,
    notification: items.filter((i) => i.type === "notification").length,
    automation: items.filter((i) => i.type === "automation").length,
    mention: items.filter((i) => i.type === "mention").length,
    team_request: items.filter((i) => i.type === "team_request").length,
    ai_suggestion: items.filter((i) => i.type === "ai_suggestion").length,
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk action handlers
  const handleBulkAction = async (action: string) => {
    try {
      await fetch("/api/attention/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
        }),
      });
      toast.success(`${selectedIds.size} items ${action}ed`);
      clearSelection();
      fetchItems(true);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  // Single item handlers
  const handleResolve = async (id: string) => {
    try {
      await fetch(`/api/attention/${id}/resolve`, { method: "POST" });
      fetchItems(true);
    } catch (error) {
      toast.error("Failed to resolve");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/attention/${id}/archive`, { method: "POST" });
      fetchItems(true);
    } catch (error) {
      toast.error("Failed to archive");
    }
  };

  // Grouped view
  const groupedItems = groupByPriority(sortedItems);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attention items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Prioritize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AttentionFilters
          filterType={filterType}
          filterUrgency={filterUrgency}
          sortBy={sortBy}
          viewMode={viewMode}
          counts={counts}
          onFilterTypeChange={setFilterType}
          onFilterUrgencyChange={setFilterUrgency}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
        />
      </motion.div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BulkActionBar
              selectedCount={selectedIds.size}
              onMarkDone={() => handleBulkAction("resolve")}
              onArchive={() => handleBulkAction("archive")}
              onStar={() => handleBulkAction("star")}
              onSnooze={() => handleBulkAction("snooze")}
              onDelete={() => handleBulkAction("delete")}
              onClearSelection={clearSelection}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="divide-y divide-border/50 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3"
                >
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-20 h-20 mb-4 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center"
              >
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No items match your search"
                  : "You have no items requiring attention"}
              </p>
            </motion.div>
          ) : viewMode === "grouped" ? (
          // Grouped View
          <div className="divide-y divide-border">
            {groupedItems.critical.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Critical ({groupedItems.critical.length})
                  </h3>
                </div>
                {groupedItems.critical.map((item) => (
                  <AttentionItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onResolve={() => handleResolve(item.id)}
                    onArchive={() => handleArchive(item.id)}
                  />
                ))}
              </div>
            )}
            {groupedItems.high.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border-l-4 border-orange-500">
                  <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    High Priority ({groupedItems.high.length})
                  </h3>
                </div>
                {groupedItems.high.map((item) => (
                  <AttentionItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onResolve={() => handleResolve(item.id)}
                    onArchive={() => handleArchive(item.id)}
                  />
                ))}
              </div>
            )}
            {groupedItems.medium.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500">
                  <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    Medium ({groupedItems.medium.length})
                  </h3>
                </div>
                {groupedItems.medium.map((item) => (
                  <AttentionItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onResolve={() => handleResolve(item.id)}
                    onArchive={() => handleArchive(item.id)}
                  />
                ))}
              </div>
            )}
            {groupedItems.low.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Low Priority ({groupedItems.low.length})
                  </h3>
                </div>
                {groupedItems.low.map((item) => (
                  <AttentionItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onResolve={() => handleResolve(item.id)}
                    onArchive={() => handleArchive(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // List View
          <AnimatePresence mode="popLayout">
            {sortedItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
              >
                <AttentionItemComponent
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  onSelect={() => toggleSelect(item.id)}
                  onResolve={() => handleResolve(item.id)}
                  onArchive={() => handleArchive(item.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
