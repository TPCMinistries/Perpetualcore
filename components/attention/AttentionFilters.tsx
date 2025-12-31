"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Mail,
  Bell,
  Zap,
  AtSign,
  Users,
  Sparkles,
  Filter,
  SortAsc,
  LayoutGrid,
  List,
} from "lucide-react";
import { AttentionItemType } from "@/lib/attention/priority";

export type FilterType = "all" | AttentionItemType;
export type FilterUrgency = "all" | "critical" | "high" | "medium" | "low";
export type SortOption = "priority" | "date" | "due";
export type ViewMode = "list" | "grouped";

interface AttentionFiltersProps {
  filterType: FilterType;
  filterUrgency: FilterUrgency;
  sortBy: SortOption;
  viewMode: ViewMode;
  counts: Record<FilterType, number>;
  onFilterTypeChange: (value: FilterType) => void;
  onFilterUrgencyChange: (value: FilterUrgency) => void;
  onSortChange: (value: SortOption) => void;
  onViewModeChange: (value: ViewMode) => void;
}

const typeFilters: { value: FilterType; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Filter },
  { value: "task", label: "Tasks", icon: CheckSquare },
  { value: "email", label: "Emails", icon: Mail },
  { value: "notification", label: "Notifications", icon: Bell },
  { value: "automation", label: "Automations", icon: Zap },
  { value: "mention", label: "Mentions", icon: AtSign },
  { value: "team_request", label: "Team", icon: Users },
  { value: "ai_suggestion", label: "AI", icon: Sparkles },
];

export function AttentionFilters({
  filterType,
  filterUrgency,
  sortBy,
  viewMode,
  counts,
  onFilterTypeChange,
  onFilterUrgencyChange,
  onSortChange,
  onViewModeChange,
}: AttentionFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Type Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(({ value, label, icon: Icon }) => {
          const count = counts[value] || 0;
          const isActive = filterType === value;

          return (
            <Button
              key={value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterTypeChange(value)}
              className={isActive ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : ""}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
              {count > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1.5 text-xs px-1.5"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Secondary Filters Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* Urgency Filter */}
          <Select value={filterUrgency} onValueChange={onFilterUrgencyChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="critical">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Critical
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Low
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-32 h-8">
              <SortAsc className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="due">Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={`h-7 ${viewMode === "list" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : ""}`}
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grouped" ? "default" : "ghost"}
            size="sm"
            className={`h-7 ${viewMode === "grouped" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : ""}`}
            onClick={() => onViewModeChange("grouped")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
