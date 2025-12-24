import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// GET /api/teams/[teamId]/documents - List team documents
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this team
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: team } = await supabase
      .from("teams")
      .select("organization_id")
      .eq("id", teamId)
      .single();

    if (!team || team.organization_id !== profile?.organization_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch documents assigned to this team
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select(`
        id,
        title,
        file_type,
        file_size,
        visibility,
        created_at,
        updated_at
      `)
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false });

    if (docsError) {
      console.error("Error fetching team documents:", docsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error("Team documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/documents - Assign document to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Update document to assign to team
    const { data: document, error: updateError } = await supabase
      .from("documents")
      .update({ team_id: teamId })
      .eq("id", document_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error assigning document to team:", updateError);
      return NextResponse.json(
        { error: "Failed to assign document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Team documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/documents?documentId=xxx - Remove document from team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Remove team assignment (set team_id to null)
    const { error: updateError } = await supabase
      .from("documents")
      .update({ team_id: null })
      .eq("id", documentId)
      .eq("team_id", teamId);

    if (updateError) {
      console.error("Error removing document from team:", updateError);
      return NextResponse.json(
        { error: "Failed to remove document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
