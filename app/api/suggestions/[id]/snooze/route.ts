import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { hours } = await request.json();

    // Verify ownership
    const { data: suggestion } = await supabase
      .from("ai_suggestions")
      .select("user_id")
      .eq("id", suggestionId)
      .single();

    if (!suggestion || suggestion.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate snooze time
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + (hours || 24));

    const { data: updatedSuggestion, error: updateError } = await supabase
      .from("ai_suggestions")
      .update({
        status: "snoozed",
        snoozed_until: snoozeUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error snoozing suggestion:", updateError);
      return NextResponse.json({ error: "Failed to snooze suggestion" }, { status: 500 });
    }

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error("Snooze suggestion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
