import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, description, events } = body;

    if (!url || !description || !events || events.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: url, description, and at least one event" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Generate a secure signing secret
    const secret = `whsec_${randomBytes(24).toString("hex")}`;

    const { data: webhook, error: createError } = await supabase
      .from("webhooks")
      .insert({
        user_id: user.id,
        url,
        description,
        events,
        secret,
        is_active: true,
        success_count: 0,
        failure_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating webhook:", createError);
      return NextResponse.json(
        { error: "Failed to create webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...webhook, secret }, { status: 201 });
  } catch (error) {
    console.error("Webhooks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
