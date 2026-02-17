import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV, generateJSON } from "@/lib/audit/export";
import { logAudit, extractRequestContext } from "@/lib/audit/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/audit-logs/export
 * Generate and download an audit log export.
 * Admin/owner only.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role, email, full_name")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { format, startDate, endDate, filters } = body as {
      format: "csv" | "json";
      startDate?: string;
      endDate?: string;
      filters?: {
        event_category?: string;
        event_action?: string;
        status?: string;
        severity?: string;
      };
    };

    if (!format || !["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Format must be 'csv' or 'json'" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    if (filters?.event_category) query = query.eq("event_category", filters.event_category);
    if (filters?.event_action) query = query.eq("event_action", filters.event_action);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.severity) query = query.eq("severity", filters.severity);

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching audit logs for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }

    const auditLogs = logs || [];
    const content = format === "csv" ? generateCSV(auditLogs) : generateJSON(auditLogs);
    const contentType = format === "csv" ? "text/csv" : "application/json";
    const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;

    // Log the export event
    const reqCtx = extractRequestContext(request);
    logAudit({
      event: "EXPORT_GENERATED",
      resource_type: "audit_logs",
      description: `Exported ${auditLogs.length} audit logs as ${format.toUpperCase()}`,
      details: { format, record_count: auditLogs.length, startDate, endDate, filters },
      user_id: user.id,
      user_email: profile.email,
      user_name: profile.full_name,
      organization_id: profile.organization_id,
      ip_address: reqCtx.ip_address || undefined,
      user_agent: reqCtx.user_agent || undefined,
    });

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Audit log export error:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
