import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { purchaseId, itemId, itemType } = await request.json();

    if (!purchaseId || !itemId || !itemType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the purchase belongs to this user
    const { data: purchase, error: purchaseError } = await supabase
      .from("marketplace_purchases")
      .select("*, marketplace_items(*)")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const item = purchase.marketplace_items;

    if (itemType === "agent") {
      // Create an AI agent from the marketplace item
      const { data: agent, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          name: item.name,
          description: item.description,
          agent_type: item.category?.toLowerCase() || "general",
          config: item.config || {},
          personality: "professional",
          instructions: item.description || "",
          enabled: true,
          marketplace_item_id: item.id,
        })
        .select()
        .single();

      if (agentError) {
        // Check if already activated
        if (agentError.code === "23505") {
          return NextResponse.json({ error: "This item is already activated" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Agent activated successfully",
        agent,
      });
    } else if (itemType === "workflow") {
      // Create a workflow from the marketplace item
      const { data: workflow, error: workflowError } = await supabase
        .from("workflows")
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          name: item.name,
          description: item.description,
          config: item.config || {},
          enabled: true,
          marketplace_item_id: item.id,
        })
        .select()
        .single();

      if (workflowError) {
        // Check if already activated
        if (workflowError.code === "23505") {
          return NextResponse.json({ error: "This item is already activated" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Workflow activated successfully",
        workflow,
      });
    } else {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
