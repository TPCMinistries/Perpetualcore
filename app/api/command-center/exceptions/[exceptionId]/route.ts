import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UpdateExceptionRequest } from "@/types/command-center";

// GET /api/command-center/exceptions/[exceptionId] - Get single exception
export async function GET(
  request: Request,
  { params }: { params: Promise<{ exceptionId: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { exceptionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: exception, error } = await supabase
    .from("exceptions")
    .select(
      `
      *,
      assigned_user:profiles!exceptions_assigned_to_fkey(id, full_name, avatar_url),
      resolved_by_user:profiles!exceptions_resolved_by_fkey(id, full_name, avatar_url)
    `
    )
    .eq("id", exceptionId)
    .single();

  if (error || !exception) {
    return NextResponse.json(
      { error: "Exception not found" },
      { status: 404 }
    );
  }

  // Get events
  const { data: events } = await supabase
    .from("exception_events")
    .select(
      `
      *,
      performer:profiles!exception_events_performed_by_fkey(id, full_name, avatar_url)
    `
    )
    .eq("exception_id", exceptionId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    exception,
    events: events || [],
  });
}

// PATCH /api/command-center/exceptions/[exceptionId] - Update exception
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ exceptionId: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { exceptionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: UpdateExceptionRequest = await request.json();

  const updateData: Record<string, unknown> = {};

  if (body.status !== undefined) {
    updateData.status = body.status;
    if (body.status === "resolved") {
      updateData.resolved_by = user.id;
      updateData.resolved_at = new Date().toISOString();
    }
  }

  if (body.severity !== undefined) {
    updateData.severity = body.severity;
  }

  if (body.assigned_to !== undefined) {
    updateData.assigned_to = body.assigned_to;
  }

  if (body.resolution_notes !== undefined) {
    updateData.resolution_notes = body.resolution_notes;
  }

  if (body.tags !== undefined) {
    updateData.tags = body.tags;
  }

  const { data, error } = await supabase
    .from("exceptions")
    .update(updateData)
    .eq("id", exceptionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating exception:", error);
    return NextResponse.json(
      { error: "Failed to update exception" },
      { status: 500 }
    );
  }

  return NextResponse.json({ exception: data });
}

// DELETE /api/command-center/exceptions/[exceptionId] - Dismiss exception
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ exceptionId: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { exceptionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("exceptions")
    .update({
      status: "dismissed",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", exceptionId);

  if (error) {
    console.error("Error dismissing exception:", error);
    return NextResponse.json(
      { error: "Failed to dismiss exception" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
