import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { exportToExcel, ENTITY_COLUMNS } from "@/lib/excel/exporter";
import { logActivity } from "@/lib/activity-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export/excel
 * Export data to Excel
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("type");
    const filters = searchParams.get("filters");

    if (!entityType) {
      return NextResponse.json(
        { error: "Entity type is required" },
        { status: 400 }
      );
    }

    let data: Record<string, any>[] = [];
    let columns = ENTITY_COLUMNS[entityType as keyof typeof ENTITY_COLUMNS];
    let title = "";

    const parsedFilters = filters ? JSON.parse(filters) : {};

    switch (entityType) {
      case "tasks":
        data = await exportTasks(supabase, user.id, parsedFilters);
        title = "Tasks Export";
        break;
      case "contacts":
        data = await exportContacts(supabase, user.id, parsedFilters);
        title = "Contacts Export";
        break;
      case "projects":
        data = await exportProjects(supabase, user.id, parsedFilters);
        title = "Projects Export";
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported entity type: ${entityType}` },
          { status: 400 }
        );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No data to export" },
        { status: 404 }
      );
    }

    const buffer = await exportToExcel(data, {
      sheetName: entityType.charAt(0).toUpperCase() + entityType.slice(1),
      columns,
      title,
      includeTimestamp: true,
      freezeHeader: true,
      autoFilter: true,
    });

    // Log activity
    await logActivity({
      supabase,
      userId: user.id,
      action: "downloaded",
      entityType: entityType as any,
      entityId: "bulk-export",
      entityName: `Excel Export (${data.length} ${entityType})`,
      metadata: {
        count: data.length,
        filters: parsedFilters,
      },
    });

    // Return Excel file
    const filename = `${entityType}-export-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}

async function exportTasks(
  supabase: any,
  userId: string,
  filters: Record<string, any>
): Promise<Record<string, any>[]> {
  let query = supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      updated_at,
      assignee:profiles!tasks_assigned_to_fkey(full_name),
      project:projects(name)
    `)
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Export tasks error:", error);
    return [];
  }

  return (data || []).map((task: any) => ({
    ...task,
    assignee_name: task.assignee?.full_name || "",
    project_name: task.project?.name || "",
    assignee: undefined,
    project: undefined,
  }));
}

async function exportContacts(
  supabase: any,
  userId: string,
  filters: Record<string, any>
): Promise<Record<string, any>[]> {
  let query = supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (filters.contact_type) {
    query = query.eq("contact_type", filters.contact_type);
  }
  if (filters.company) {
    query = query.ilike("company", `%${filters.company}%`);
  }
  if (filters.relationship_status) {
    query = query.eq("relationship_status", filters.relationship_status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Export contacts error:", error);
    return [];
  }

  return data || [];
}

async function exportProjects(
  supabase: any,
  userId: string,
  filters: Record<string, any>
): Promise<Record<string, any>[]> {
  // Get user's org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (!profile?.organization_id) {
    return [];
  }

  let query = supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      current_stage,
      priority,
      start_date,
      target_date,
      project_type,
      created_at,
      team:teams(name)
    `)
    .eq("organization_id", profile.organization_id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (filters.current_stage) {
    query = query.eq("current_stage", filters.current_stage);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.team_id) {
    query = query.eq("team_id", filters.team_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Export projects error:", error);
    return [];
  }

  return (data || []).map((project: any) => ({
    ...project,
    team_name: project.team?.name || "",
    team: undefined,
  }));
}
