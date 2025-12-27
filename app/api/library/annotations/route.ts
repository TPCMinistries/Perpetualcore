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

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
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

    // Fetch annotations with user info
    const { data: annotations, error } = await supabase
      .from("document_annotations")
      .select(`
        id,
        document_id,
        user_id,
        annotation_type,
        content,
        text_selection,
        position_start,
        position_end,
        parent_id,
        is_resolved,
        resolved_at,
        mentioned_users,
        assignee_id,
        due_date,
        created_at,
        updated_at,
        profiles!document_annotations_user_id_fkey(full_name, avatar_url)
      `)
      .eq("document_id", documentId)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Transform and group by parent
    const annotationMap = new Map();
    const topLevel: any[] = [];

    (annotations || []).forEach((a: any) => {
      const annotation = {
        id: a.id,
        documentId: a.document_id,
        userId: a.user_id,
        userName: a.profiles?.full_name || "Unknown",
        userAvatar: a.profiles?.avatar_url,
        annotationType: a.annotation_type,
        content: a.content,
        textSelection: a.text_selection,
        positionStart: a.position_start,
        positionEnd: a.position_end,
        parentId: a.parent_id,
        isResolved: a.is_resolved,
        resolvedAt: a.resolved_at,
        mentionedUsers: a.mentioned_users || [],
        assigneeId: a.assignee_id,
        dueDate: a.due_date,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        replies: [],
      };

      annotationMap.set(a.id, annotation);

      if (!a.parent_id) {
        topLevel.push(annotation);
      }
    });

    // Attach replies to parents
    (annotations || []).forEach((a: any) => {
      if (a.parent_id && annotationMap.has(a.parent_id)) {
        const parent = annotationMap.get(a.parent_id);
        const child = annotationMap.get(a.id);
        if (parent && child) {
          parent.replies.push(child);
        }
      }
    });

    return NextResponse.json({ annotations: topLevel });
  } catch (error) {
    console.error("Annotations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
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
    const {
      documentId,
      annotationType = "comment",
      content,
      textSelection,
      positionStart,
      positionEnd,
      parentId,
      assigneeId,
      dueDate,
      mentionedUsers = [],
    } = body;

    if (!documentId || !content) {
      return NextResponse.json(
        { error: "documentId and content are required" },
        { status: 400 }
      );
    }

    // Create annotation
    const { data: annotation, error } = await supabase
      .from("document_annotations")
      .insert({
        document_id: documentId,
        user_id: user.id,
        organization_id: profile.organization_id,
        annotation_type: annotationType,
        content,
        text_selection: textSelection,
        position_start: positionStart,
        position_end: positionEnd,
        parent_id: parentId,
        assignee_id: assigneeId,
        due_date: dueDate,
        mentioned_users: mentionedUsers,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity
    await supabase.from("document_activity").insert({
      organization_id: profile.organization_id,
      document_id: documentId,
      user_id: user.id,
      activity_type: annotationType === "reply" ? "comment" : annotationType,
      metadata: { annotationId: annotation.id },
    });

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error("Annotation create error:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
