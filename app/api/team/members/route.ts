import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/team/members - Get all members in the user's organization
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
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
      return new Response("User has no organization", { status: 400 });
    }

    // Get all members in the organization (excluding current user)
    const { data: members, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("organization_id", profile.organization_id)
      .neq("id", user.id)
      .order("full_name", { ascending: true, nullsFirst: false })
      .order("email", { ascending: true });

    if (error) {
      console.error("Error fetching team members:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ members: members || [] });
  } catch (error: any) {
    console.error("Error in GET /api/team/members:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
