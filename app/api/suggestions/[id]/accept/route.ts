import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processFeedback } from "@/lib/intelligence/feedback-learner";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suggestionId = params.id;

    // Verify ownership - use predictive_suggestions table
    const { data: suggestion } = await supabase
      .from("predictive_suggestions")
      .select("user_id, organization_id")
      .eq("id", suggestionId)
      .single();

    if (!suggestion || suggestion.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update suggestion status
    const { data: updatedSuggestion, error: updateError } = await supabase
      .from("predictive_suggestions")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error accepting suggestion:", updateError);
      return NextResponse.json({ error: "Failed to accept suggestion" }, { status: 500 });
    }

    // Learn from this feedback
    await processFeedback(
      suggestion.organization_id,
      user.id,
      "suggestion_accepted",
      { suggestionId }
    );

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error("Accept suggestion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
