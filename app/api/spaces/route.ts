import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/spaces - List user's spaces
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ spaces: [] });
    }

    // Get spaces where user is owner or member
    const { data: spaces, error } = await supabase
      .from("knowledge_spaces")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .or(`owner_id.eq.${user.id},member_ids.cs.{${user.id}}`)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching spaces:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ spaces: spaces || [] });
  } catch (error: any) {
    console.error("Error in GET /api/spaces:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/spaces - Create new space
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, space_type, emoji, color, is_private } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ error: "User has no organization" }, { status: 400 });
    }

    // Create space
    const { data: space, error } = await supabase
      .from("knowledge_spaces")
      .insert({
        organization_id: profile.organization_id,
        owner_id: user.id,
        name,
        description,
        space_type: space_type || "team",
        emoji: emoji || "📁",
        color: color || "#3B82F6",
        is_private: is_private || false,
        member_ids: [user.id], // Owner is automatically a member
        member_count: 1
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating space:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ space }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/spaces:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
