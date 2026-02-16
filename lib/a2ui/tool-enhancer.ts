/**
 * A2UI Tool Enhancer
 *
 * Middleware that inspects tool call results and promotes them
 * to rich A2UI blocks when the data is suitable for visualization.
 */

import { A2UIBlock } from "./types";

/**
 * Attempt to promote a tool result into an A2UI block.
 * Returns null if the result is not suitable for rich rendering.
 */
export function enhanceToolResult(
  toolName: string,
  result: unknown
): A2UIBlock | null {
  if (!result || typeof result !== "string") return null;

  // Try to parse JSON from the tool result
  let parsed: unknown;
  try {
    parsed = JSON.parse(result);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const data = parsed as Record<string, unknown>;

  // Route to specific enhancers based on tool name
  switch (toolName) {
    case "search_contacts":
      return enhanceContacts(data);
    case "get_tasks":
    case "search_tasks":
      return enhanceTasks(data);
    case "execute_code":
      return enhanceCodeResult(data);
    case "web_search":
      return enhanceWebSearch(data);
    case "get_calendar_events":
      return enhanceCalendarEvents(data);
    case "get_plan_status":
      return enhancePlanStatus(data);
    default:
      break;
  }

  // Generic detection: if result has tabular data, render as table
  if (Array.isArray(data.results) && data.results.length > 0) {
    return enhanceGenericArray(data.results as Record<string, unknown>[]);
  }

  if (Array.isArray(data.data) && data.data.length > 0) {
    return enhanceGenericArray(data.data as Record<string, unknown>[]);
  }

  return null;
}

// ---- Specific enhancers ----

function enhanceContacts(data: Record<string, unknown>): A2UIBlock | null {
  const contacts = (data.contacts || data.results || data.data) as
    | Record<string, unknown>[]
    | undefined;
  if (!Array.isArray(contacts) || contacts.length === 0) return null;

  const cards = contacts.map((c) => ({
    title: `${c.first_name || ""}${c.last_name ? " " + c.last_name : ""}`.trim() || "Unknown",
    subtitle: c.job_title
      ? `${c.job_title}${c.company ? " at " + c.company : ""}`
      : (c.company as string) || undefined,
    description: (c.email as string) || (c.phone as string) || undefined,
    badges: [
      c.relationship_status as string,
      c.lead_status as string,
    ].filter(Boolean) as string[],
  }));

  return {
    id: `a2ui-contacts-${Date.now()}`,
    type: "card-grid",
    data: { cards, columns: contacts.length > 2 ? 3 : 2 },
    metadata: {
      title: `${contacts.length} Contact${contacts.length !== 1 ? "s" : ""} Found`,
    },
  };
}

function enhanceTasks(data: Record<string, unknown>): A2UIBlock | null {
  const tasks = (data.tasks || data.results || data.data) as
    | Record<string, unknown>[]
    | undefined;
  if (!Array.isArray(tasks) || tasks.length === 0) return null;

  const items = tasks.map((t, i) => ({
    id: (t.id as string) || `task-${i}`,
    label: (t.title as string) || (t.name as string) || "Untitled task",
    checked: t.status === "complete" || t.status === "done" || t.completed === true,
  }));

  return {
    id: `a2ui-tasks-${Date.now()}`,
    type: "checklist",
    data: { items, callbackId: "task-toggle" },
    metadata: {
      title: "Tasks",
      interactive: true,
    },
  };
}

function enhanceCodeResult(data: Record<string, unknown>): A2UIBlock | null {
  // If the result has chart-friendly data, render as chart
  if (Array.isArray(data.data) && data.data.length > 0) {
    const sample = data.data[0] as Record<string, unknown>;
    const keys = Object.keys(sample);
    const numericKeys = keys.filter((k) => typeof sample[k] === "number");

    if (numericKeys.length >= 1 && keys.length >= 2) {
      const xKey = keys.find((k) => !numericKeys.includes(k)) || keys[0];
      const yKey = numericKeys[0];

      return {
        id: `a2ui-chart-${Date.now()}`,
        type: "chart",
        data: {
          chartType: "bar" as const,
          data: data.data as Record<string, unknown>[],
          xKey,
          yKey,
        },
        metadata: { title: (data.title as string) || "Results" },
      };
    }
  }

  // If the result has code output, render as code block
  if (typeof data.output === "string" || typeof data.code === "string") {
    return {
      id: `a2ui-code-${Date.now()}`,
      type: "code",
      data: {
        code: (data.output as string) || (data.code as string),
        language: (data.language as string) || "plaintext",
      },
      metadata: { title: (data.filename as string) || "Output" },
    };
  }

  return null;
}

function enhanceWebSearch(data: Record<string, unknown>): A2UIBlock | null {
  const results = (data.results || data.data) as
    | Record<string, unknown>[]
    | undefined;
  if (!Array.isArray(results) || results.length === 0) return null;

  const cards = results.slice(0, 6).map((r) => ({
    title: (r.title as string) || "Untitled",
    description:
      (r.snippet as string) || (r.description as string) || undefined,
    subtitle: (r.url as string) || (r.link as string) || undefined,
  }));

  return {
    id: `a2ui-search-${Date.now()}`,
    type: "card-grid",
    data: { cards, columns: 2 },
    metadata: { title: "Search Results" },
  };
}

function enhanceCalendarEvents(data: Record<string, unknown>): A2UIBlock | null {
  const events = (data.events || data.results || data.data) as
    | Record<string, unknown>[]
    | undefined;
  if (!Array.isArray(events) || events.length === 0) return null;

  const mappedEvents = events.map((e) => ({
    title: (e.title as string) || (e.summary as string) || "Untitled Event",
    start: (e.start as string) || (e.start_time as string) || "",
    end: (e.end as string) || (e.end_time as string) || undefined,
    color: (e.color as string) || undefined,
  }));

  return {
    id: `a2ui-calendar-${Date.now()}`,
    type: "calendar",
    data: { events: mappedEvents, view: "week" as const },
    metadata: { title: "Calendar Events" },
  };
}

function enhancePlanStatus(data: Record<string, unknown>): A2UIBlock | null {
  const steps = (data.steps || data.tasks) as
    | Record<string, unknown>[]
    | undefined;
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const mappedSteps = steps.map((s) => {
    let status: "complete" | "current" | "pending" = "pending";
    if (s.status === "complete" || s.status === "done") status = "complete";
    else if (s.status === "running" || s.status === "current" || s.status === "in_progress")
      status = "current";

    return {
      label: (s.title as string) || (s.name as string) || "Step",
      status,
      description: (s.description as string) || undefined,
    };
  });

  return {
    id: `a2ui-progress-${Date.now()}`,
    type: "progress",
    data: { steps: mappedSteps },
    metadata: {
      title: (data.planName as string) || (data.title as string) || "Plan Progress",
    },
  };
}

function enhanceGenericArray(
  items: Record<string, unknown>[]
): A2UIBlock | null {
  if (items.length === 0) return null;

  const sampleKeys = Object.keys(items[0]);
  if (sampleKeys.length === 0) return null;

  // Build columns from the first item's keys
  const columns = sampleKeys.slice(0, 8).map((key) => ({
    key,
    label: key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    sortable: true,
  }));

  return {
    id: `a2ui-table-${Date.now()}`,
    type: "table",
    data: {
      columns,
      rows: items,
      searchable: items.length > 5,
      paginated: items.length > 10,
    },
    metadata: {
      title: `${items.length} Result${items.length !== 1 ? "s" : ""}`,
    },
  };
}
