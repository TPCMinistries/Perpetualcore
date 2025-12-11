import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // First, try to get templates from the agent_templates table
    const { data: templates, error } = await supabase
      .from("agent_templates")
      .select("*")
      .order("usage_count", { ascending: false });

    if (!error && templates && templates.length > 0) {
      return NextResponse.json({ templates });
    }

    // If no agent_templates, try to fetch from marketplace_items where type is 'agent'
    const { data: marketplaceAgents, error: marketplaceError } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("type", "agent")
      .eq("status", "published")
      .order("total_sales", { ascending: false })
      .limit(10);

    if (!marketplaceError && marketplaceAgents && marketplaceAgents.length > 0) {
      // Transform marketplace items to template format
      const transformedTemplates = marketplaceAgents.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        agent_type: item.category?.toLowerCase() || "general",
        icon: getIconForCategory(item.category),
        category: item.category || "General",
        capabilities: item.features || [],
        usage_count: item.total_sales || 0,
        price: item.price,
        is_marketplace: true,
      }));

      return NextResponse.json({ templates: transformedTemplates });
    }

    // Return empty array if no templates available
    return NextResponse.json({
      templates: [],
      message: "No agent templates available. Visit the marketplace to find agents.",
    });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { templates: [], error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

function getIconForCategory(category: string | null): string {
  const icons: Record<string, string> = {
    "Communication": "💬",
    "Productivity": "📧",
    "Analytics": "📊",
    "Knowledge": "🔍",
    "Automation": "⚡",
    "Support": "🎧",
    "Sales": "💰",
    "Marketing": "📣",
  };
  return icons[category || ""] || "🤖";
}
