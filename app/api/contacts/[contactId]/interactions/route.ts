import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { CreateInteractionInput } from "@/types/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

/**
 * GET - Fetch interactions for a contact
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const interactionType = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("contact_interactions")
      .select("*", { count: "exact" })
      .eq("contact_id", contactId)
      .order("interaction_date", { ascending: false });

    if (interactionType) {
      query = query.eq("interaction_type", interactionType);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: interactions, error, count } = await query;

    if (error) {
      console.error("Interactions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
    }

    return NextResponse.json({
      interactions,
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Interactions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
  }
}

/**
 * POST - Log a new interaction with a contact
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body: CreateInteractionInput = await req.json();

    // Validate required fields
    if (!body.interaction_type) {
      return NextResponse.json({ error: "Interaction type is required" }, { status: 400 });
    }

    if (!body.summary?.trim()) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 });
    }

    const interactionData = {
      contact_id: contactId,
      user_id: user.id,
      interaction_type: body.interaction_type,
      direction: body.direction || null,
      subject: body.subject?.trim() || null,
      summary: body.summary.trim(),
      key_points: body.key_points || [],
      action_items: body.action_items || [],
      sentiment: body.sentiment || null,
      location: body.location?.trim() || null,
      duration_minutes: body.duration_minutes || null,
      participants: body.participants || [],
      related_project_id: body.related_project_id || null,
      related_task_id: body.related_task_id || null,
      attachments: body.attachments || [],
      interaction_date: body.interaction_date || new Date().toISOString(),
    };

    const { data: interaction, error } = await supabase
      .from("contact_interactions")
      .insert(interactionData)
      .select()
      .single();

    if (error) {
      console.error("Interaction creation error:", error);
      return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
    }

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("Interactions POST error:", error);
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
  }
}
