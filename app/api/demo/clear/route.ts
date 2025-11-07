import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to get organization_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, demo_mode")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.demo_mode) {
      return NextResponse.json({
        success: false,
        message: "Demo mode is not enabled for this account",
      });
    }

    const organization_id = profile.organization_id;

    // Delete demo data
    // Note: In a production app, you'd want to mark demo data specifically
    // and only delete those marked items. For now, we'll delete all user's data.

    let documentsDeleted = 0;
    let tasksDeleted = 0;
    let conversationsDeleted = 0;
    let eventsDeleted = 0;

    // Delete documents
    const { data: deletedDocs } = await supabase
      .from("documents")
      .delete()
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .select("id");

    documentsDeleted = deletedDocs?.length || 0;

    // Delete tasks
    const { data: deletedTasks } = await supabase
      .from("tasks")
      .delete()
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .select("id");

    tasksDeleted = deletedTasks?.length || 0;

    // Delete conversations (messages will be cascade deleted)
    const { data: deletedConvs } = await supabase
      .from("conversations")
      .delete()
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .select("id");

    conversationsDeleted = deletedConvs?.length || 0;

    // Delete calendar events
    const { data: deletedEvents } = await supabase
      .from("calendar_events")
      .delete()
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .select("id");

    eventsDeleted = deletedEvents?.length || 0;

    // Mark user as not having demo data
    await supabase
      .from("profiles")
      .update({ demo_mode: false })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "Demo data cleared successfully!",
      summary: {
        documents: documentsDeleted,
        tasks: tasksDeleted,
        conversations: conversationsDeleted,
        events: eventsDeleted,
      },
    });
  } catch (error) {
    console.error("Demo clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
