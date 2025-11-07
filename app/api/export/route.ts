import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exportAsJSON,
  exportAsNotionZip,
  exportConversationsAsMarkdown,
  exportTasksAsMarkdown,
  exportDocumentsAsCSV,
  exportCalendarAsICS,
} from "@/lib/import-export/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Export user data in various formats
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    switch (format) {
      case "json": {
        const data = await exportAsJSON(user.id, profile.organization_id);
        return NextResponse.json(data, {
          headers: {
            "Content-Disposition": `attachment; filename="ai-brain-export-${Date.now()}.json"`,
          },
        });
      }

      case "zip": {
        const zipBlob = await exportAsNotionZip(user.id, profile.organization_id);
        return new NextResponse(zipBlob, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="ai-brain-export-${Date.now()}.zip"`,
          },
        });
      }

      case "tasks-md": {
        const markdown = await exportTasksAsMarkdown(profile.organization_id);
        return new NextResponse(markdown, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="tasks-${Date.now()}.md"`,
          },
        });
      }

      case "documents-csv": {
        const csv = await exportDocumentsAsCSV(profile.organization_id);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="documents-${Date.now()}.csv"`,
          },
        });
      }

      case "calendar-ics": {
        const ics = await exportCalendarAsICS(profile.organization_id);
        return new NextResponse(ics, {
          headers: {
            "Content-Type": "text/calendar",
            "Content-Disposition": `attachment; filename="calendar-${Date.now()}.ics"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid format. Supported: json, zip, tasks-md, documents-csv, calendar-ics" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
