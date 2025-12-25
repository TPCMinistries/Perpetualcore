import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CreateExceptionRequest } from "@/types/command-center";

// GET /api/command-center/exceptions - List exceptions
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const source_type = searchParams.get("source_type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("exceptions")
    .select(
      `
      *,
      assigned_user:profiles!exceptions_assigned_to_fkey(id, full_name, avatar_url)
    `
    )
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    if (status === "active") {
      query = query.in("status", ["open", "acknowledged", "in_progress"]);
    } else {
      query = query.eq("status", status);
    }
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (source_type) {
    query = query.eq("source_type", source_type);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching exceptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch exceptions" },
      { status: 500 }
    );
  }

  // Get counts by status
  const { data: countData } = await supabase
    .from("exceptions")
    .select("status, severity")
    .eq("organization_id", profile.organization_id);

  const counts = {
    open: 0,
    acknowledged: 0,
    in_progress: 0,
    resolved: 0,
    dismissed: 0,
    critical: 0,
  };

  countData?.forEach((e) => {
    counts[e.status as keyof typeof counts]++;
    if (e.severity === "critical" && e.status !== "resolved" && e.status !== "dismissed") {
      counts.critical++;
    }
  });

  return NextResponse.json({
    exceptions: data,
    counts,
    total: count,
  });
}

// POST /api/command-center/exceptions - Create exception
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const body: CreateExceptionRequest = await request.json();

  if (!body.title || !body.source_type) {
    return NextResponse.json(
      { error: "Title and source_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("exceptions")
    .insert({
      organization_id: profile.organization_id,
      source_type: body.source_type,
      source_id: body.source_id,
      source_name: body.source_name,
      title: body.title,
      description: body.description,
      error_message: body.error_message,
      error_code: body.error_code,
      severity: body.severity || "medium",
      can_retry: body.can_retry || false,
      retry_payload: body.retry_payload,
      metadata: body.metadata || {},
      tags: body.tags || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating exception:", error);
    return NextResponse.json(
      { error: "Failed to create exception" },
      { status: 500 }
    );
  }

  // Log creation event
  await supabase.from("exception_events").insert({
    exception_id: data.id,
    event_type: "created",
    performed_by: user.id,
  });

  return NextResponse.json({ exception: data }, { status: 201 });
}
