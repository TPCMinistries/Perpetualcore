import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/audit-logs
// Query audit logs with filters
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only admins and owners can view audit logs
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Filters
    const eventCategory = searchParams.get("event_category");
    const eventAction = searchParams.get("event_action");
    const eventType = searchParams.get("event_type");
    const resourceType = searchParams.get("resource_type");
    const resourceId = searchParams.get("resource_id");
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("organization_id", profile.organization_id);

    // Apply filters
    if (eventCategory) query = query.eq("event_category", eventCategory);
    if (eventAction) query = query.eq("event_action", eventAction);
    if (eventType) query = query.eq("event_type", eventType);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (resourceId) query = query.eq("resource_id", resourceId);
    if (userId) query = query.eq("user_id", userId);
    if (status) query = query.eq("status", status);
    if (severity) query = query.eq("severity", severity);
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,actor_email.ilike.%${search}%,actor_name.ilike.%${search}%`
      );
    }
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    // Order and pagination
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Audit logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs
// Create a new audit log entry
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, email, full_name")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      event_type,
      event_category,
      event_action,
      resource_type,
      resource_id,
      resource_name,
      description,
      metadata = {},
      status = "success",
      error_message,
      severity = "info",
    } = body;

    // Validate required fields
    if (!event_type || !event_category || !event_action || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP and user agent from headers
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // Log the audit event using the database function
    const { data, error } = await supabase.rpc("log_audit_event", {
      p_organization_id: profile.organization_id,
      p_user_id: user.id,
      p_actor_email: profile.email,
      p_actor_name: profile.full_name,
      p_event_type: event_type,
      p_event_category: event_category,
      p_event_action: event_action,
      p_resource_type: resource_type || null,
      p_resource_id: resource_id || null,
      p_resource_name: resource_name || null,
      p_description: description,
      p_metadata: metadata,
      p_status: status,
      p_error_message: error_message || null,
      p_severity: severity,
      p_actor_ip_address: ip || null,
      p_actor_user_agent: userAgent || null,
    });

    if (error) {
      console.error("Error creating audit log:", error);
      return NextResponse.json(
        { error: "Failed to create audit log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (error) {
    console.error("Audit log POST error:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
