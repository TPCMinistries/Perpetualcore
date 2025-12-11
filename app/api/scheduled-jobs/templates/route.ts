import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from("job_templates")
      .select("*")
      .order("is_popular", { ascending: false })
      .order("usage_count", { ascending: false });

    if (error) {
      if (isDev) console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    if (isDev) console.error("Templates API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
