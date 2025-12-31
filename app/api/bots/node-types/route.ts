import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Get available bot node types
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: nodeTypes, error } = await supabase
      .from("bot_node_types")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (error) {
      console.error("Error fetching node types:", error);
      return NextResponse.json({ error: "Failed to fetch node types" }, { status: 500 });
    }

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const nodeType of nodeTypes || []) {
      if (!grouped[nodeType.category]) {
        grouped[nodeType.category] = [];
      }
      grouped[nodeType.category].push({
        id: nodeType.type_id,
        name: nodeType.name,
        description: nodeType.description,
        icon: nodeType.icon,
        color: nodeType.color,
        handles: nodeType.handles,
        config_schema: nodeType.config_schema,
        required_tier: nodeType.required_tier,
      });
    }

    return NextResponse.json({
      node_types: nodeTypes || [],
      by_category: grouped,
      categories: [
        { id: "trigger", name: "Triggers", icon: "⚡" },
        { id: "action", name: "Actions", icon: "🎯" },
        { id: "logic", name: "Logic", icon: "🔀" },
        { id: "transform", name: "Transform", icon: "🔧" },
      ],
    });
  } catch (error: any) {
    console.error("Node types error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
