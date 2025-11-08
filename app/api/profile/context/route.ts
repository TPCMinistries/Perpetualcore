import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const body = await request.json();
    const {
      preferredName,
      userRole,
      industry,
      primaryGoal,
      primaryGoals, // New: array of goals
      teamContext,
      contentTypes,
      aiExperience,
    } = body;

    // Update user profile with context
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        preferred_name: preferredName,
        user_role: userRole,
        industry: industry,
        primary_goal: primaryGoal,
        primary_goals: primaryGoals || (primaryGoal ? [primaryGoal] : []), // Store array of goals
        team_context: teamContext,
        content_types: contentTypes,
        ai_experience_level: aiExperience || "beginner",
        // Also update full_name if preferred name is different
        ...(preferredName && { full_name: preferredName }),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user context:", updateError);
      return NextResponse.json(
        { error: "Failed to update user context" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User context saved successfully",
    });
  } catch (error) {
    console.error("Profile context API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Get user context from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "preferred_name, user_role, industry, primary_goal, team_context, content_types, ai_experience_level"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch user context" },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile context API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
