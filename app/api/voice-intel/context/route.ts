import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContextCreateRequest } from "@/lib/voice-intel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET - List voice intel context items for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const typeFilter = req.nextUrl.searchParams.get("type");

    let query = supabase
      .from("voice_intel_context")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (typeFilter) {
      query = query.eq("context_type", typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Voice intel context fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch context" },
        { status: 500 }
      );
    }

    return NextResponse.json({ context: data || [] });
  } catch (error) {
    console.error("Voice intel context GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new voice intel context item
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ContextCreateRequest = await req.json();

    if (!body.context_type || !body.name) {
      return NextResponse.json(
        { error: "context_type and name are required" },
        { status: 400 }
      );
    }

    const validTypes = ["entity", "person", "project", "keyword"];
    if (!validTypes.includes(body.context_type)) {
      return NextResponse.json(
        { error: `context_type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("voice_intel_context")
      .insert({
        user_id: user.id,
        context_type: body.context_type,
        name: body.name,
        aliases: body.aliases || [],
        metadata: body.metadata || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Voice intel context insert error:", error);
      return NextResponse.json(
        { error: "Failed to create context item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ context: data }, { status: 201 });
  } catch (error) {
    console.error("Voice intel context POST error:", error);
    return NextResponse.json(
      { error: "Failed to create context item" },
      { status: 500 }
    );
  }
}
