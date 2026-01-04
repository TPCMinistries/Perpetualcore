import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET - List entity types
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from("lookup_entity_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching entity types:", error);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Entity types GET error:", error);
    return NextResponse.json({ items: [] });
  }
}
