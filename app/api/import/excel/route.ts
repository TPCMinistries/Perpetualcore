import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { parseExcelBuffer, inferColumnTypes, transformData, ColumnMapping } from "@/lib/excel/parser";
import { logActivity } from "@/lib/activity-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/import/excel/preview
 * Preview Excel file before import
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const action = formData.get("action") as string || "preview";
    const entityType = formData.get("entityType") as string;
    const mappingsJson = formData.get("mappings") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel or CSV file." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();

    // Parse the Excel file
    const parsedSheets = parseExcelBuffer(buffer, { maxPreviewRows: 20 });

    if (parsedSheets.length === 0 || parsedSheets[0].totalRows === 0) {
      return NextResponse.json(
        { error: "No data found in the file" },
        { status: 400 }
      );
    }

    const sheet = parsedSheets[0];

    // If just previewing, return the parsed data
    if (action === "preview") {
      const columnTypes = inferColumnTypes(sheet.preview);

      return NextResponse.json({
        success: true,
        sheets: parsedSheets.map((s) => s.sheetName),
        currentSheet: sheet.sheetName,
        headers: sheet.headers,
        preview: sheet.preview,
        totalRows: sheet.totalRows,
        columnTypes,
      });
    }

    // If importing, validate entity type and mappings
    if (action === "import") {
      if (!entityType) {
        return NextResponse.json(
          { error: "Entity type is required for import" },
          { status: 400 }
        );
      }

      if (!mappingsJson) {
        return NextResponse.json(
          { error: "Column mappings are required for import" },
          { status: 400 }
        );
      }

      const mappings: ColumnMapping[] = JSON.parse(mappingsJson);

      // Transform data according to mappings
      const { data: transformedData, errors } = transformData(sheet.rows, mappings);

      if (errors.length > 0 && transformedData.length === 0) {
        return NextResponse.json({
          success: false,
          errors,
          imported: 0,
        });
      }

      // Import based on entity type
      let imported = 0;
      const importErrors: string[] = [...errors];

      switch (entityType) {
        case "tasks":
          imported = await importTasks(supabase, user.id, transformedData, importErrors);
          break;
        case "contacts":
          imported = await importContacts(supabase, user.id, transformedData, importErrors);
          break;
        case "projects":
          imported = await importProjects(supabase, user.id, transformedData, importErrors);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported entity type: ${entityType}` },
            { status: 400 }
          );
      }

      // Log activity
      await logActivity({
        supabase,
        userId: user.id,
        action: "uploaded",
        entityType: entityType as any,
        entityId: "bulk-import",
        entityName: `Excel Import (${imported} ${entityType})`,
        metadata: {
          fileName: file.name,
          totalRows: sheet.totalRows,
          imported,
          errors: importErrors.length,
        },
      });

      return NextResponse.json({
        success: true,
        imported,
        failed: sheet.totalRows - imported,
        errors: importErrors.slice(0, 10), // Return first 10 errors
        totalErrors: importErrors.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Excel import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

async function importTasks(
  supabase: any,
  userId: string,
  data: Record<string, any>[],
  errors: string[]
): Promise<number> {
  let imported = 0;

  for (const row of data) {
    try {
      const { error } = await supabase.from("tasks").insert({
        created_by: userId,
        title: row.title,
        description: row.description || null,
        status: row.status || "todo",
        priority: row.priority || "medium",
        due_date: row.due_date || null,
      });

      if (error) {
        errors.push(`Task "${row.title}": ${error.message}`);
      } else {
        imported++;
      }
    } catch (e) {
      errors.push(`Task "${row.title}": ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return imported;
}

async function importContacts(
  supabase: any,
  userId: string,
  data: Record<string, any>[],
  errors: string[]
): Promise<number> {
  let imported = 0;

  for (const row of data) {
    try {
      const { error } = await supabase.from("contacts").insert({
        user_id: userId,
        first_name: row.first_name,
        last_name: row.last_name || null,
        email: row.email || null,
        phone: row.phone || null,
        company: row.company || null,
        job_title: row.job_title || null,
        contact_type: row.contact_type || "contact",
        notes: row.notes || null,
        tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
        source: "excel_import",
      });

      if (error) {
        errors.push(`Contact "${row.first_name}": ${error.message}`);
      } else {
        imported++;
      }
    } catch (e) {
      errors.push(`Contact "${row.first_name}": ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return imported;
}

async function importProjects(
  supabase: any,
  userId: string,
  data: Record<string, any>[],
  errors: string[]
): Promise<number> {
  let imported = 0;

  // Get user's org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  for (const row of data) {
    try {
      const { error } = await supabase.from("projects").insert({
        organization_id: profile?.organization_id,
        created_by: userId,
        name: row.name,
        description: row.description || null,
        current_stage: row.current_stage || "ideation",
        priority: row.priority || "medium",
        start_date: row.start_date || null,
        target_date: row.target_date || null,
        project_type: row.project_type || "general",
      });

      if (error) {
        errors.push(`Project "${row.name}": ${error.message}`);
      } else {
        imported++;
      }
    } catch (e) {
      errors.push(`Project "${row.name}": ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return imported;
}
