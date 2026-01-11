"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { CalendarView, CalendarFilters, CalendarItem } from "@/types/calendar";
import { navigatePrev, navigateNext } from "@/lib/calendar/calendar-utils";

// State types
export interface CalendarPageState {
  // View state
  view: CalendarView;
  currentDate: Date;
  selectedDate: Date | null;

  // Selection
  selectedEventId: string | null;

  // Filters
  filters: CalendarFilters;

  // UI state
  isSidebarOpen: boolean;
  isEventDetailOpen: boolean;
  isEventFormOpen: boolean;
  isQuickAddOpen: boolean;

  // Form state
  editingEventId: string | null;
}

type CalendarPageAction =
  | { type: "SET_VIEW"; payload: CalendarView }
  | { type: "SET_DATE"; payload: Date }
  | { type: "NAVIGATE_PREV" }
  | { type: "NAVIGATE_NEXT" }
  | { type: "GO_TODAY" }
  | { type: "SELECT_DATE"; payload: Date | null }
  | { type: "SELECT_EVENT"; payload: string | null }
  | { type: "SET_FILTER"; payload: Partial<CalendarFilters> }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "OPEN_EVENT_DETAIL"; payload: string }
  | { type: "CLOSE_EVENT_DETAIL" }
  | { type: "OPEN_EVENT_FORM"; payload?: string }
  | { type: "CLOSE_EVENT_FORM" }
  | { type: "TOGGLE_QUICK_ADD" }
  | { type: "SET_QUICK_ADD"; payload: boolean };

const initialState: CalendarPageState = {
  view: "month",
  currentDate: new Date(),
  selectedDate: null,
  selectedEventId: null,
  filters: {
    showEvents: true,
    showTasks: true,
    showFollowups: true,
  },
  isSidebarOpen: true,
  isEventDetailOpen: false,
  isEventFormOpen: false,
  isQuickAddOpen: false,
  editingEventId: null,
};

function calendarReducer(
  state: CalendarPageState,
  action: CalendarPageAction
): CalendarPageState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload };

    case "SET_DATE":
      return { ...state, currentDate: action.payload };

    case "NAVIGATE_PREV":
      return {
        ...state,
        currentDate: navigatePrev(state.currentDate, state.view),
      };

    case "NAVIGATE_NEXT":
      return {
        ...state,
        currentDate: navigateNext(state.currentDate, state.view),
      };

    case "GO_TODAY":
      return { ...state, currentDate: new Date(), selectedDate: new Date() };

    case "SELECT_DATE":
      return { ...state, selectedDate: action.payload };

    case "SELECT_EVENT":
      return { ...state, selectedEventId: action.payload };

    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case "SET_SIDEBAR":
      return { ...state, isSidebarOpen: action.payload };

    case "OPEN_EVENT_DETAIL":
      return {
        ...state,
        isEventDetailOpen: true,
        selectedEventId: action.payload,
      };

    case "CLOSE_EVENT_DETAIL":
      return {
        ...state,
        isEventDetailOpen: false,
        selectedEventId: null,
      };

    case "OPEN_EVENT_FORM":
      return {
        ...state,
        isEventFormOpen: true,
        editingEventId: action.payload || null,
      };

    case "CLOSE_EVENT_FORM":
      return {
        ...state,
        isEventFormOpen: false,
        editingEventId: null,
      };

    case "TOGGLE_QUICK_ADD":
      return { ...state, isQuickAddOpen: !state.isQuickAddOpen };

    case "SET_QUICK_ADD":
      return { ...state, isQuickAddOpen: action.payload };

    default:
      return state;
  }
}

// Context
interface CalendarPageContextValue {
  state: CalendarPageState;
  dispatch: React.Dispatch<CalendarPageAction>;

  // View actions
  setView: (view: CalendarView) => void;
  setDate: (date: Date) => void;
  navigatePrev: () => void;
  navigateNext: () => void;
  goToday: () => void;

  // Selection actions
  selectDate: (date: Date | null) => void;
  selectEvent: (id: string | null) => void;

  // Filter actions
  setFilter: (filter: Partial<CalendarFilters>) => void;
  toggleEvents: () => void;
  toggleTasks: () => void;
  toggleFollowups: () => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  openEventDetail: (id: string) => void;
  closeEventDetail: () => void;
  openEventForm: (id?: string) => void;
  closeEventForm: () => void;
  toggleQuickAdd: () => void;
  setQuickAdd: (open: boolean) => void;
}

const CalendarPageContext = createContext<CalendarPageContextValue | null>(null);

// Provider
interface CalendarPageProviderProps {
  children: ReactNode;
  defaultView?: CalendarView;
}

export function CalendarPageProvider({
  children,
  defaultView = "month",
}: CalendarPageProviderProps) {
  const [state, dispatch] = useReducer(calendarReducer, {
    ...initialState,
    view: defaultView,
  });

  // View actions
  const setView = useCallback((view: CalendarView) => {
    dispatch({ type: "SET_VIEW", payload: view });
  }, []);

  const setDate = useCallback((date: Date) => {
    dispatch({ type: "SET_DATE", payload: date });
  }, []);

  const navPrev = useCallback(() => {
    dispatch({ type: "NAVIGATE_PREV" });
  }, []);

  const navNext = useCallback(() => {
    dispatch({ type: "NAVIGATE_NEXT" });
  }, []);

  const goToday = useCallback(() => {
    dispatch({ type: "GO_TODAY" });
  }, []);

  // Selection actions
  const selectDate = useCallback((date: Date | null) => {
    dispatch({ type: "SELECT_DATE", payload: date });
  }, []);

  const selectEvent = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_EVENT", payload: id });
  }, []);

  // Filter actions
  const setFilter = useCallback((filter: Partial<CalendarFilters>) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  }, []);

  const toggleEvents = useCallback(() => {
    dispatch({ type: "SET_FILTER", payload: { showEvents: !state.filters.showEvents } });
  }, [state.filters.showEvents]);

  const toggleTasks = useCallback(() => {
    dispatch({ type: "SET_FILTER", payload: { showTasks: !state.filters.showTasks } });
  }, [state.filters.showTasks]);

  const toggleFollowups = useCallback(() => {
    dispatch({ type: "SET_FILTER", payload: { showFollowups: !state.filters.showFollowups } });
  }, [state.filters.showFollowups]);

  // UI actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const setSidebar = useCallback((open: boolean) => {
    dispatch({ type: "SET_SIDEBAR", payload: open });
  }, []);

  const openEventDetail = useCallback((id: string) => {
    dispatch({ type: "OPEN_EVENT_DETAIL", payload: id });
  }, []);

  const closeEventDetail = useCallback(() => {
    dispatch({ type: "CLOSE_EVENT_DETAIL" });
  }, []);

  const openEventForm = useCallback((id?: string) => {
    dispatch({ type: "OPEN_EVENT_FORM", payload: id });
  }, []);

  const closeEventForm = useCallback(() => {
    dispatch({ type: "CLOSE_EVENT_FORM" });
  }, []);

  const toggleQuickAdd = useCallback(() => {
    dispatch({ type: "TOGGLE_QUICK_ADD" });
  }, []);

  const setQuickAdd = useCallback((open: boolean) => {
    dispatch({ type: "SET_QUICK_ADD", payload: open });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setView,
      setDate,
      navigatePrev: navPrev,
      navigateNext: navNext,
      goToday,
      selectDate,
      selectEvent,
      setFilter,
      toggleEvents,
      toggleTasks,
      toggleFollowups,
      toggleSidebar,
      setSidebar,
      openEventDetail,
      closeEventDetail,
      openEventForm,
      closeEventForm,
      toggleQuickAdd,
      setQuickAdd,
    }),
    [
      state,
      setView,
      setDate,
      navPrev,
      navNext,
      goToday,
      selectDate,
      selectEvent,
      setFilter,
      toggleEvents,
      toggleTasks,
      toggleFollowups,
      toggleSidebar,
      setSidebar,
      openEventDetail,
      closeEventDetail,
      openEventForm,
      closeEventForm,
      toggleQuickAdd,
      setQuickAdd,
    ]
  );

  return (
    <CalendarPageContext.Provider value={value}>
      {children}
    </CalendarPageContext.Provider>
  );
}

// Hook
export function useCalendarPage() {
  const context = useContext(CalendarPageContext);
  if (!context) {
    throw new Error("useCalendarPage must be used within a CalendarPageProvider");
  }
  return context;
}
