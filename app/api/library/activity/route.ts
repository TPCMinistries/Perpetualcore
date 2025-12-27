import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const projectId = searchParams.get("projectId");
    const spaceId = searchParams.get("spaceId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("document_activity")
      .select(`
        id,
        user_id,
        document_id,
        activity_type,
        metadata,
        created_at,
        profiles!document_activity_user_id_fkey(full_name, avatar_url),
        documents!document_activity_document_id_fkey(title)
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    if (documentId) {
      query = query.eq("document_id", documentId);
    }

    // Note: projectId and spaceId filtering would require joining with document_projects/document_spaces
    // For now, we'll filter on the client side if needed

    const { data: activities, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to response format
    const formattedActivities = (activities || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      userName: a.profiles?.full_name || "Unknown",
      userAvatar: a.profiles?.avatar_url,
      documentId: a.document_id,
      documentTitle: a.documents?.title,
      activityType: a.activity_type,
      metadata: a.metadata,
      createdAt: a.created_at,
    }));

    // Check if there are more results
    const { count } = await supabase
      .from("document_activity")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id);

    return NextResponse.json({
      activities: formattedActivities,
      hasMore: (count || 0) > offset + limit,
      total: count || 0,
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();
    const { documentId, activityType, metadata = {} } = body;

    if (!activityType) {
      return NextResponse.json(
        { error: "activityType is required" },
        { status: 400 }
      );
    }

    // Create activity
    const { data: activity, error } = await supabase
      .from("document_activity")
      .insert({
        organization_id: profile.organization_id,
        document_id: documentId,
        user_id: user.id,
        activity_type: activityType,
        metadata,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Activity create error:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
