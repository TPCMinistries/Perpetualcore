"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tables that users can access (respecting RLS)
const ACCESSIBLE_TABLES = [
  "tasks",
  "projects",
  "contacts",
  "calendar_events",
  "documents",
  "notes",
  "emails",
  "conversations",
  "activity_feed",
  "automations",
  "automation_executions",
  "notifications",
  "workspaces",
  "ai_insights",
];

// Fields to exclude from results (sensitive data)
const EXCLUDED_FIELDS = ["password", "password_hash", "api_key", "secret", "token"];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "tables";

    if (action === "tables") {
      // Return list of accessible tables
      return NextResponse.json({
        tables: ACCESSIBLE_TABLES.map((name) => ({
          name,
          displayName: name
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        })),
      });
    }

    if (action === "query") {
      const table = searchParams.get("table");
      const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
      const offset = parseInt(searchParams.get("offset") || "0");
      const orderBy = searchParams.get("orderBy") || "created_at";
      const orderDir = searchParams.get("orderDir") === "asc" ? true : false;
      const search = searchParams.get("search") || "";
      const filters = searchParams.get("filters");

      if (!table || !ACCESSIBLE_TABLES.includes(table)) {
        return NextResponse.json(
          { error: "Invalid or inaccessible table" },
          { status: 400 }
        );
      }

      // Build query
      let query = supabase.from(table).select("*", { count: "exact" });

      // Apply user-based RLS (most tables have user_id)
      // RLS policies handle this, but we can add explicit filter for safety
      query = query.or(`user_id.eq.${user.id},created_by.eq.${user.id}`);

      // Apply search if provided
      if (search) {
        // Search across common text fields
        const searchConditions = [
          `title.ilike.%${search}%`,
          `name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `content.ilike.%${search}%`,
        ].join(",");
        query = query.or(searchConditions);
      }

      // Apply custom filters
      if (filters) {
        try {
          const parsedFilters = JSON.parse(filters);
          for (const filter of parsedFilters) {
            const { field, operator, value } = filter;
            if (field && operator && value !== undefined) {
              switch (operator) {
                case "eq":
                  query = query.eq(field, value);
                  break;
                case "neq":
                  query = query.neq(field, value);
                  break;
                case "gt":
                  query = query.gt(field, value);
                  break;
                case "gte":
                  query = query.gte(field, value);
                  break;
                case "lt":
                  query = query.lt(field, value);
                  break;
                case "lte":
                  query = query.lte(field, value);
                  break;
                case "like":
                  query = query.ilike(field, `%${value}%`);
                  break;
                case "is":
                  query = query.is(field, value);
                  break;
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse filters:", e);
        }
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDir })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Query error:", error);
        return NextResponse.json(
          { error: "Failed to query table", details: error.message },
          { status: 500 }
        );
      }

      // Remove sensitive fields from results
      const sanitizedData = (data || []).map((row: Record<string, any>) => {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          if (!EXCLUDED_FIELDS.some((f) => key.toLowerCase().includes(f))) {
            sanitized[key] = value;
          }
        }
        return sanitized;
      });

      // Infer columns from data
      const columns =
        sanitizedData.length > 0
          ? Object.keys(sanitizedData[0]).map((key) => ({
              name: key,
              displayName: key
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              type: inferColumnType(sanitizedData[0][key]),
            }))
          : [];

      return NextResponse.json({
        data: sanitizedData,
        columns,
        total: count || 0,
        limit,
        offset,
      });
    }

    if (action === "schema") {
      const table = searchParams.get("table");
      if (!table || !ACCESSIBLE_TABLES.includes(table)) {
        return NextResponse.json(
          { error: "Invalid or inaccessible table" },
          { status: 400 }
        );
      }

      // Get sample row to infer schema
      const { data } = await supabase.from(table).select("*").limit(1);

      if (!data || data.length === 0) {
        return NextResponse.json({ columns: [] });
      }

      const columns = Object.keys(data[0])
        .filter((key) => !EXCLUDED_FIELDS.some((f) => key.toLowerCase().includes(f)))
        .map((key) => ({
          name: key,
          displayName: key
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          type: inferColumnType(data[0][key]),
        }));

      return NextResponse.json({ columns });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Data explorer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function inferColumnType(value: any): string {
  if (value === null || value === undefined) return "text";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    // Check for date patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "datetime";
    if (value.length > 200) return "longtext";
    return "text";
  }
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "json";
  return "text";
}

// POST for updates
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, table, id, data } = body;

    if (!table || !ACCESSIBLE_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Invalid or inaccessible table" },
        { status: 400 }
      );
    }

    if (action === "update" && id && data) {
      // Remove sensitive fields from update
      const sanitizedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (!EXCLUDED_FIELDS.some((f) => key.toLowerCase().includes(f))) {
          sanitizedData[key] = value;
        }
      }

      const { error } = await supabase
        .from(table)
        .update(sanitizedData)
        .eq("id", id)
        .eq("user_id", user.id); // Ensure user owns the record

      if (error) {
        return NextResponse.json(
          { error: "Failed to update", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "export") {
      // Fetch all data for export (with reasonable limit)
      const { data: exportData, error } = await supabase
        .from(table)
        .select("*")
        .or(`user_id.eq.${user.id},created_by.eq.${user.id}`)
        .limit(5000);

      if (error) {
        return NextResponse.json(
          { error: "Failed to export", details: error.message },
          { status: 500 }
        );
      }

      // Sanitize export data
      const sanitizedExport = (exportData || []).map((row: Record<string, any>) => {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          if (!EXCLUDED_FIELDS.some((f) => key.toLowerCase().includes(f))) {
            sanitized[key] = value;
          }
        }
        return sanitized;
      });

      return NextResponse.json({ data: sanitizedExport });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Data explorer POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
