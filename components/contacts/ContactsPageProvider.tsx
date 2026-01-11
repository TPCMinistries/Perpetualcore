"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { Contact, ContactFilters, RelationshipStrength } from "@/types/contacts";

// Types
export type ViewMode = "table" | "list" | "cards";

export interface ContactsPageState {
  // View state
  viewMode: ViewMode;

  // Selection state
  selectedIds: Set<string>;
  lastSelectedId: string | null;

  // Navigation state
  focusedIndex: number;

  // UI state
  isCommandPaletteOpen: boolean;
  isBulkActionDialogOpen: boolean;
  bulkActionType: "tag" | "export" | "delete" | "email" | null;

  // Inline editing
  editingCell: { rowId: string; columnId: string } | null;

  // Filters (managed here for URL sync)
  search: string;
  typeFilter: string;
  strengthFilter: RelationshipStrength | "";
  quickFilter: "needs_followup" | "recently_contacted" | "";

  // Pagination
  pageSize: number;
  currentPage: number;
}

type ContactsPageAction =
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SELECT_SINGLE"; payload: string }
  | { type: "SELECT_TOGGLE"; payload: string }
  | { type: "SELECT_RANGE"; payload: { ids: string[]; lastId: string } }
  | { type: "SELECT_ALL"; payload: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_FOCUSED_INDEX"; payload: number }
  | { type: "NAVIGATE"; payload: "up" | "down" | "first" | "last"; totalCount: number }
  | { type: "OPEN_COMMAND_PALETTE" }
  | { type: "CLOSE_COMMAND_PALETTE" }
  | { type: "TOGGLE_COMMAND_PALETTE" }
  | { type: "SET_COMMAND_PALETTE"; payload: boolean }
  | { type: "OPEN_BULK_ACTION"; payload: "tag" | "export" | "delete" | "email" }
  | { type: "CLOSE_BULK_ACTION" }
  | { type: "START_EDITING"; payload: { rowId: string; columnId: string } }
  | { type: "STOP_EDITING" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_TYPE_FILTER"; payload: string }
  | { type: "SET_STRENGTH_FILTER"; payload: RelationshipStrength | "" }
  | { type: "SET_QUICK_FILTER"; payload: "needs_followup" | "recently_contacted" | "" }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "RESET_FILTERS" };

const initialState: ContactsPageState = {
  viewMode: "table",
  selectedIds: new Set(),
  lastSelectedId: null,
  focusedIndex: -1,
  isCommandPaletteOpen: false,
  isBulkActionDialogOpen: false,
  bulkActionType: null,
  editingCell: null,
  search: "",
  typeFilter: "",
  strengthFilter: "",
  quickFilter: "",
  pageSize: 50,
  currentPage: 1,
};

function contactsReducer(
  state: ContactsPageState,
  action: ContactsPageAction
): ContactsPageState {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "SELECT_SINGLE":
      return {
        ...state,
        selectedIds: new Set([action.payload]),
        lastSelectedId: action.payload,
      };

    case "SELECT_TOGGLE": {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload);
      } else {
        newSelected.add(action.payload);
      }
      return {
        ...state,
        selectedIds: newSelected,
        lastSelectedId: action.payload,
      };
    }

    case "SELECT_RANGE":
      return {
        ...state,
        selectedIds: new Set([...state.selectedIds, ...action.payload.ids]),
        lastSelectedId: action.payload.lastId,
      };

    case "SELECT_ALL":
      return {
        ...state,
        selectedIds: new Set(action.payload),
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedIds: new Set(),
        lastSelectedId: null,
      };

    case "SET_FOCUSED_INDEX":
      return { ...state, focusedIndex: action.payload };

    case "NAVIGATE": {
      const { payload: direction, totalCount } = action;
      let newIndex = state.focusedIndex;

      switch (direction) {
        case "up":
          newIndex = Math.max(0, state.focusedIndex - 1);
          break;
        case "down":
          newIndex = Math.min(totalCount - 1, state.focusedIndex + 1);
          break;
        case "first":
          newIndex = 0;
          break;
        case "last":
          newIndex = totalCount - 1;
          break;
      }

      return { ...state, focusedIndex: newIndex };
    }

    case "OPEN_COMMAND_PALETTE":
      return { ...state, isCommandPaletteOpen: true };

    case "CLOSE_COMMAND_PALETTE":
      return { ...state, isCommandPaletteOpen: false };

    case "TOGGLE_COMMAND_PALETTE":
      return { ...state, isCommandPaletteOpen: !state.isCommandPaletteOpen };

    case "SET_COMMAND_PALETTE":
      return { ...state, isCommandPaletteOpen: action.payload };

    case "OPEN_BULK_ACTION":
      return {
        ...state,
        isBulkActionDialogOpen: true,
        bulkActionType: action.payload,
      };

    case "CLOSE_BULK_ACTION":
      return {
        ...state,
        isBulkActionDialogOpen: false,
        bulkActionType: null,
      };

    case "START_EDITING":
      return { ...state, editingCell: action.payload };

    case "STOP_EDITING":
      return { ...state, editingCell: null };

    case "SET_SEARCH":
      return { ...state, search: action.payload, currentPage: 1 };

    case "SET_TYPE_FILTER":
      return { ...state, typeFilter: action.payload, currentPage: 1 };

    case "SET_STRENGTH_FILTER":
      return { ...state, strengthFilter: action.payload, currentPage: 1 };

    case "SET_QUICK_FILTER":
      return { ...state, quickFilter: action.payload, currentPage: 1 };

    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload, currentPage: 1 };

    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };

    case "RESET_FILTERS":
      return {
        ...state,
        search: "",
        typeFilter: "",
        strengthFilter: "",
        quickFilter: "",
        currentPage: 1,
      };

    default:
      return state;
  }
}

// Context
interface ContactsPageContextValue {
  state: ContactsPageState;
  dispatch: React.Dispatch<ContactsPageAction>;

  // Convenience actions
  setViewMode: (mode: ViewMode) => void;
  selectContact: (id: string, shiftKey?: boolean, ctrlKey?: boolean, allIds?: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  navigate: (direction: "up" | "down" | "first" | "last", totalCount: number) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openBulkAction: (type: "tag" | "export" | "delete" | "email") => void;
  closeBulkAction: () => void;
  startEditing: (rowId: string, columnId: string) => void;
  stopEditing: () => void;
  setSearch: (search: string) => void;
  setTypeFilter: (type: string) => void;
  setStrengthFilter: (strength: RelationshipStrength | "") => void;
  setQuickFilter: (filter: "needs_followup" | "recently_contacted" | "") => void;
  resetFilters: () => void;

  // Computed
  selectedCount: number;
  hasSelection: boolean;
  isEditing: boolean;
  activeFiltersCount: number;
}

const ContactsPageContext = createContext<ContactsPageContextValue | null>(null);

// Provider
interface ContactsPageProviderProps {
  children: ReactNode;
  defaultViewMode?: ViewMode;
}

export function ContactsPageProvider({
  children,
  defaultViewMode = "table",
}: ContactsPageProviderProps) {
  const [state, dispatch] = useReducer(contactsReducer, {
    ...initialState,
    viewMode: defaultViewMode,
  });

  // Convenience actions
  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  const selectContact = useCallback(
    (id: string, shiftKey = false, ctrlKey = false, allIds: string[] = []) => {
      if (shiftKey && state.lastSelectedId && allIds.length > 0) {
        // Range select
        const lastIdx = allIds.indexOf(state.lastSelectedId);
        const currentIdx = allIds.indexOf(id);
        if (lastIdx !== -1 && currentIdx !== -1) {
          const [start, end] = lastIdx < currentIdx ? [lastIdx, currentIdx] : [currentIdx, lastIdx];
          const rangeIds = allIds.slice(start, end + 1);
          dispatch({ type: "SELECT_RANGE", payload: { ids: rangeIds, lastId: id } });
          return;
        }
      }

      if (ctrlKey) {
        dispatch({ type: "SELECT_TOGGLE", payload: id });
      } else {
        dispatch({ type: "SELECT_SINGLE", payload: id });
      }
    },
    [state.lastSelectedId]
  );

  const selectAll = useCallback((ids: string[]) => {
    dispatch({ type: "SELECT_ALL", payload: ids });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    dispatch({ type: "SELECT_TOGGLE", payload: id });
  }, []);

  const navigate = useCallback((direction: "up" | "down" | "first" | "last", totalCount: number) => {
    dispatch({ type: "NAVIGATE", payload: direction, totalCount });
  }, []);

  const openCommandPalette = useCallback(() => {
    dispatch({ type: "OPEN_COMMAND_PALETTE" });
  }, []);

  const closeCommandPalette = useCallback(() => {
    dispatch({ type: "CLOSE_COMMAND_PALETTE" });
  }, []);

  const openBulkAction = useCallback((type: "tag" | "export" | "delete" | "email") => {
    dispatch({ type: "OPEN_BULK_ACTION", payload: type });
  }, []);

  const closeBulkAction = useCallback(() => {
    dispatch({ type: "CLOSE_BULK_ACTION" });
  }, []);

  const startEditing = useCallback((rowId: string, columnId: string) => {
    dispatch({ type: "START_EDITING", payload: { rowId, columnId } });
  }, []);

  const stopEditing = useCallback(() => {
    dispatch({ type: "STOP_EDITING" });
  }, []);

  const setSearch = useCallback((search: string) => {
    dispatch({ type: "SET_SEARCH", payload: search });
  }, []);

  const setTypeFilter = useCallback((type: string) => {
    dispatch({ type: "SET_TYPE_FILTER", payload: type });
  }, []);

  const setStrengthFilter = useCallback((strength: RelationshipStrength | "") => {
    dispatch({ type: "SET_STRENGTH_FILTER", payload: strength });
  }, []);

  const setQuickFilter = useCallback((filter: "needs_followup" | "recently_contacted" | "") => {
    dispatch({ type: "SET_QUICK_FILTER", payload: filter });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  // Computed values
  const selectedCount = state.selectedIds.size;
  const hasSelection = selectedCount > 0;
  const isEditing = state.editingCell !== null;
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (state.search) count++;
    if (state.typeFilter) count++;
    if (state.strengthFilter) count++;
    if (state.quickFilter) count++;
    return count;
  }, [state.search, state.typeFilter, state.strengthFilter, state.quickFilter]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setViewMode,
      selectContact,
      selectAll,
      clearSelection,
      toggleSelection,
      navigate,
      openCommandPalette,
      closeCommandPalette,
      openBulkAction,
      closeBulkAction,
      startEditing,
      stopEditing,
      setSearch,
      setTypeFilter,
      setStrengthFilter,
      setQuickFilter,
      resetFilters,
      selectedCount,
      hasSelection,
      isEditing,
      activeFiltersCount,
    }),
    [
      state,
      setViewMode,
      selectContact,
      selectAll,
      clearSelection,
      toggleSelection,
      navigate,
      openCommandPalette,
      closeCommandPalette,
      openBulkAction,
      closeBulkAction,
      startEditing,
      stopEditing,
      setSearch,
      setTypeFilter,
      setStrengthFilter,
      setQuickFilter,
      resetFilters,
      selectedCount,
      hasSelection,
      isEditing,
      activeFiltersCount,
    ]
  );

  return (
    <ContactsPageContext.Provider value={value}>
      {children}
    </ContactsPageContext.Provider>
  );
}

// Hook
export function useContactsPage() {
  const context = useContext(ContactsPageContext);
  if (!context) {
    throw new Error("useContactsPage must be used within a ContactsPageProvider");
  }
  return context;
}
