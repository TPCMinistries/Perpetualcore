"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Table2,
  List,
  LayoutGrid,
  Filter,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  Upload,
  Sparkles,
  UserPlus,
  X,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactsPage, ViewMode } from "./ContactsPageProvider";
import {
  RelationshipStrength,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";

interface ContactsToolbarProps {
  onImport?: () => void;
  onDiscover?: () => void;
  onAddContact?: () => void;
  onAdvancedSearch?: () => void;
}

const VIEW_MODES: { mode: ViewMode; icon: typeof Table2; label: string }[] = [
  { mode: "table", icon: Table2, label: "Table" },
  { mode: "list", icon: List, label: "List" },
  { mode: "cards", icon: LayoutGrid, label: "Cards" },
];

const CONTACT_TYPES = [
  { value: "", label: "All Types" },
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
  { value: "both", label: "Both" },
  { value: "investor", label: "Investor" },
  { value: "partner", label: "Partner" },
  { value: "customer", label: "Customer" },
  { value: "prospect", label: "Prospect" },
  { value: "mentor", label: "Mentor" },
  { value: "mentee", label: "Mentee" },
  { value: "contact", label: "Contact" },
];

const STRENGTH_FILTERS: { value: RelationshipStrength | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "inner_circle", label: "Inner Circle" },
  { value: "close", label: "Close" },
  { value: "connected", label: "Connected" },
  { value: "acquaintance", label: "Acquaintance" },
  { value: "new", label: "New" },
];

export function ContactsToolbar({
  onImport,
  onDiscover,
  onAddContact,
  onAdvancedSearch,
}: ContactsToolbarProps) {
  const {
    state,
    setViewMode,
    setSearch,
    setTypeFilter,
    setStrengthFilter,
    setQuickFilter,
    resetFilters,
    openCommandPalette,
    activeFiltersCount,
  } = useContactsPage();

  return (
    <div className="space-y-4">
      {/* Main toolbar row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-0.5">
          {VIEW_MODES.map(({ mode, icon: Icon, label }, index) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    state.viewMode === mode
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label} view (press {index + 1})</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
          <Input
            placeholder="Search contacts..."
            value={state.search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={openCommandPalette}
            className="pl-10 pr-20 h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 shadow-sm">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Type Filter */}
        <Select value={state.typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_TYPES.map((type) => (
              <SelectItem key={type.value || "all"} value={type.value || "_all_"}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onAdvancedSearch}
              className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Advanced filters</TooltipContent>
        </Tooltip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onImport && (
            <Button
              variant="outline"
              onClick={onImport}
              className="gap-2 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          )}
          {onDiscover && (
            <Button
              variant="outline"
              onClick={onDiscover}
              className="gap-2 h-10 rounded-xl border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </Button>
          )}
          {onAddContact && (
            <Button
              onClick={onAddContact}
              className="gap-2 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 border-0"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
        {/* Relationship Strength Pills */}
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Relationship</span>
        <div className="flex items-center gap-1 ml-1">
          {STRENGTH_FILTERS.map(({ value, label }) => {
            const isActive = state.strengthFilter === value;
            const strengthColors: Record<string, string> = {
              inner_circle: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700",
              close: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
              connected: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
              acquaintance: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
              new: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
            };

            return (
              <button
                key={value || "all"}
                onClick={() => setStrengthFilter(value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                  isActive
                    ? value
                      ? strengthColors[value]
                      : "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-3" />

        {/* Quick Filters */}
        <button
          onClick={() =>
            setQuickFilter(
              state.quickFilter === "needs_followup" ? "" : "needs_followup"
            )
          }
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
            state.quickFilter === "needs_followup"
              ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700"
              : "bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400"
          )}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Needs Follow-up
        </button>

        <button
          onClick={() =>
            setQuickFilter(
              state.quickFilter === "recently_contacted" ? "" : "recently_contacted"
            )
          }
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
            state.quickFilter === "recently_contacted"
              ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
              : "bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Recently Contacted
        </button>

        {/* Active Filters Count & Clear */}
        {activeFiltersCount > 0 && (
          <>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-3" />
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800 gap-1 px-2.5 py-1">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
