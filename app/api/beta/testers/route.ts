import { requireAdmin } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Require admin authorization
    await requireAdmin();

    const supabase = await createClient();

    // Fetch all beta testers from user_activity_stats view
    const { data: testers, error } = await supabase
      .from("user_activity_stats")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching beta testers:", error);
      return NextResponse.json(
        { error: "Failed to fetch beta testers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testers: testers || [],
    });
  } catch (error: any) {
    console.error("Error fetching beta testers:", error);
    return NextResponse.json(
      { error: "Failed to fetch beta testers" },
      { status: 500 }
    );
  }
}
