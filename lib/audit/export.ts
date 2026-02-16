import type { AuditLog } from "@/types";

/**
 * Generate CSV string from audit logs.
 */
export function generateCSV(logs: AuditLog[]): string {
  const headers = [
    "ID",
    "Timestamp",
    "Actor Email",
    "Actor Name",
    "Event Type",
    "Category",
    "Action",
    "Resource Type",
    "Resource ID",
    "Resource Name",
    "Description",
    "Status",
    "Severity",
    "IP Address",
    "User Agent",
    "Error Message",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.created_at,
    log.actor_email || "",
    log.actor_name || "",
    log.event_type,
    log.event_category,
    log.event_action,
    log.resource_type || "",
    log.resource_id || "",
    log.resource_name || "",
    log.description,
    log.status,
    log.severity,
    log.actor_ip_address || "",
    log.actor_user_agent || "",
    log.error_message || "",
  ]);

  const escape = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvLines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  return csvLines.join("\n");
}

/**
 * Generate formatted JSON string from audit logs.
 */
export function generateJSON(logs: AuditLog[]): string {
  const formatted = logs.map((log) => ({
    id: log.id,
    timestamp: log.created_at,
    actor: {
      email: log.actor_email,
      name: log.actor_name,
      ip_address: log.actor_ip_address,
      user_agent: log.actor_user_agent,
    },
    event: {
      type: log.event_type,
      category: log.event_category,
      action: log.event_action,
    },
    resource: {
      type: log.resource_type,
      id: log.resource_id,
      name: log.resource_name,
    },
    description: log.description,
    status: log.status,
    severity: log.severity,
    metadata: log.metadata,
    error_message: log.error_message,
  }));

  return JSON.stringify({ audit_logs: formatted, exported_at: new Date().toISOString(), count: formatted.length }, null, 2);
}
