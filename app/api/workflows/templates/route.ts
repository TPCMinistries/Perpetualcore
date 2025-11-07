import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/workflows/templates
 * Get all workflow templates
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .order("is_popular", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching workflow templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: templates || [],
      count: templates?.length || 0,
    });
  } catch (error: any) {
    console.error("Get workflow templates error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
