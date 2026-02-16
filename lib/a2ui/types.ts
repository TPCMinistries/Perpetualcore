/**
 * A2UI (Agent-to-UI) Block Type Definitions
 *
 * Defines the rich interactive components that AI can render
 * inline in the chat stream. Each block type has a specific
 * data interface that the corresponding React component consumes.
 */

export type A2UIBlockType =
  | "chart"
  | "table"
  | "form"
  | "card"
  | "card-grid"
  | "metric"
  | "metric-row"
  | "progress"
  | "code"
  | "approval"
  | "checklist"
  | "kanban"
  | "calendar"
  | "image";

export interface A2UIBlock {
  id: string;
  type: A2UIBlockType;
  data: A2UIBlockData;
  metadata?: {
    title?: string;
    description?: string;
    collapsible?: boolean;
    interactive?: boolean;
  };
}

/** Union of all block data types */
export type A2UIBlockData =
  | ChartBlockData
  | TableBlockData
  | FormBlockData
  | CardBlockData
  | CardGridBlockData
  | MetricBlockData
  | MetricRowBlockData
  | ProgressBlockData
  | CodeBlockData
  | ApprovalBlockData
  | ChecklistBlockData
  | KanbanBlockData
  | CalendarBlockData
  | ImageBlockData;

// ---- Chart ----
export interface ChartBlockData {
  chartType: "bar" | "line" | "pie" | "area";
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  colors?: string[];
  stacked?: boolean;
}

// ---- Table ----
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface TableBlockData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  searchable?: boolean;
  paginated?: boolean;
}

// ---- Form ----
export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "textarea" | "select" | "checkbox" | "date";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  default?: string | number | boolean;
}

export interface FormBlockData {
  fields: FormField[];
  submitLabel: string;
  callbackId: string;
}

// ---- Card ----
export interface CardAction {
  label: string;
  callbackId: string;
}

export interface CardBlockData {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  badges?: string[];
  actions?: CardAction[];
}

// ---- Card Grid ----
export interface CardGridBlockData {
  cards: CardBlockData[];
  columns?: number;
}

// ---- Metric ----
export interface MetricBlockData {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  change?: string;
  icon?: string;
}

// ---- Metric Row ----
export interface MetricRowBlockData {
  metrics: MetricBlockData[];
}

// ---- Progress ----
export interface ProgressStep {
  label: string;
  status: "complete" | "current" | "pending";
  description?: string;
}

export interface ProgressBlockData {
  steps: ProgressStep[];
}

// ---- Code ----
export interface CodeBlockData {
  code: string;
  language?: string;
  filename?: string;
  runnable?: boolean;
}

// ---- Approval ----
export interface ApprovalBlockData {
  title: string;
  description: string;
  callbackId: string;
  approveLabel?: string;
  rejectLabel?: string;
  details?: Record<string, string>;
}

// ---- Checklist ----
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistBlockData {
  items: ChecklistItem[];
  callbackId: string;
}

// ---- Kanban ----
export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface KanbanBlockData {
  columns: KanbanColumn[];
}

// ---- Calendar ----
export interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
  color?: string;
}

export interface CalendarBlockData {
  events: CalendarEvent[];
  view?: "month" | "week" | "day";
}

// ---- Image ----
export interface ImageBlockData {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}
