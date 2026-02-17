import { createAdminClient } from "@/lib/supabase/server";
import { AUDIT_EVENTS, type AuditEventKey } from "./constants";

interface LogAuditParams {
  event: AuditEventKey;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  description?: string;
  details?: Record<string, unknown>;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  organization_id?: string;
  status?: "success" | "failure" | "warning";
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event. Non-blocking (fire-and-forget).
 *
 * Uses createAdminClient() to bypass RLS since this is a server-side
 * background operation that should never fail silently due to cookie issues.
 */
export function logAudit(params: LogAuditParams): void {
  const eventDef = AUDIT_EVENTS[params.event];

  const supabase = createAdminClient();

  supabase
    .rpc("log_audit_event", {
      p_organization_id: params.organization_id || null,
      p_user_id: params.user_id || null,
      p_actor_email: params.user_email || null,
      p_actor_name: params.user_name || null,
      p_event_type: eventDef.action,
      p_event_category: eventDef.category,
      p_event_action: eventDef.event_action,
      p_resource_type: params.resource_type || null,
      p_resource_id: params.resource_id || null,
      p_resource_name: params.resource_name || null,
      p_description: params.description || eventDef.description_template,
      p_metadata: params.details || {},
      p_status: params.status || "success",
      p_error_message: params.error_message || null,
      p_severity: eventDef.severity,
      p_actor_ip_address: params.ip_address || null,
      p_actor_user_agent: params.user_agent || null,
    })
    .then(() => {})
    .catch((err) => {
      console.error("[Audit] Failed to log event:", eventDef.action, err);
    });
}

/**
 * Extract IP address and user agent from a Request object.
 */
export function extractRequestContext(request: Request): {
  ip_address: string | null;
  user_agent: string | null;
} {
  return {
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    user_agent: request.headers.get("user-agent") || null,
  };
}
