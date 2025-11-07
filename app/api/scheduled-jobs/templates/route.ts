import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data: templates, error } = await supabase
      .from("job_templates")
      .select("*")
      .order("is_popular", { ascending: false })
      .order("usage_count", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
