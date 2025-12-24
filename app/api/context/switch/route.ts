import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/context/switch - Switch team context for admin view
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role, organization_id")
      .eq("id", user.id)
      .single();

    if (!["admin", "owner", "manager"].includes(profile?.user_role || "")) {
      return NextResponse.json(
        { error: "Permission denied. Only admins can switch team context." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { team_id } = body; // null to clear context

    // If team_id provided, verify it exists and belongs to user's org
    if (team_id) {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name, emoji, color, team_type, ai_context")
        .eq("id", team_id)
        .eq("organization_id", profile?.organization_id)
        .single();

      if (teamError || !team) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }

      // Update profile with team context
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          active_team_context: team_id,
          team_context_switched_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error switching team context:", updateError);
        return NextResponse.json(
          { error: "Failed to switch team context" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        activeContext: {
          teamId: team.id,
          teamName: team.name,
          teamEmoji: team.emoji,
          teamColor: team.color,
          teamType: team.team_type,
        },
        context: {
          team_id: team.id,
          team_name: team.name,
          team_emoji: team.emoji,
          team_color: team.color,
          team_type: team.team_type,
          ai_context: team.ai_context,
        },
      });
    } else {
      // Clear team context (back to global view)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          active_team_context: null,
          team_context_switched_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error clearing team context:", updateError);
        return NextResponse.json(
          { error: "Failed to clear team context" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        activeContext: null,
        context: null,
      });
    }
  } catch (error) {
    console.error("Context switch API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/context/switch - Get current team context
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's current context
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_team_context, team_context_switched_at")
      .eq("id", user.id)
      .single();

    if (!profile?.active_team_context) {
      return NextResponse.json({ context: null });
    }

    // Get team details
    const { data: team } = await supabase
      .from("teams")
      .select("id, name, emoji, color, team_type, ai_context")
      .eq("id", profile.active_team_context)
      .single();

    if (!team) {
      // Clear stale context
      await supabase
        .from("profiles")
        .update({ active_team_context: null })
        .eq("id", user.id);

      return NextResponse.json({ activeContext: null, context: null });
    }

    return NextResponse.json({
      activeContext: {
        teamId: team.id,
        teamName: team.name,
        teamEmoji: team.emoji,
        teamColor: team.color,
        teamType: team.team_type,
      },
      context: {
        team_id: team.id,
        team_name: team.name,
        team_emoji: team.emoji,
        team_color: team.color,
        team_type: team.team_type,
        ai_context: team.ai_context,
        switched_at: profile.team_context_switched_at,
      },
    });
  } catch (error) {
    console.error("Context API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
