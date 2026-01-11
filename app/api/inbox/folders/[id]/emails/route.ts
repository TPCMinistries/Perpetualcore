import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inbox/folders/[id]/emails - Get emails in a folder
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify folder ownership
    const { data: folder } = await supabase
      .from("email_folders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // For smart folders, use smart_rules to filter
    if (folder.is_smart && folder.smart_rules) {
      const rules = folder.smart_rules as any;
      let query = supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false });

      // Apply smart rules
      if (rules.priority_min !== undefined) {
        query = query.gte("ai_priority_score", rules.priority_min);
      }
      if (rules.requires_response) {
        query = query.eq("requires_response", true);
      }
      if (rules.categories && rules.categories.length > 0) {
        query = query.in("ai_category", rules.categories);
      }

      const { data: emails, error } = await query.limit(100);
      if (error) throw error;

      return NextResponse.json({ emails: emails || [], folder });
    }

    // For custom folders, use assignments
    const { data: assignments, error } = await supabase
      .from("email_folder_assignments")
      .select("emails(*)")
      .eq("folder_id", id)
      .order("assigned_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const emails = assignments?.map((a) => a.emails).filter(Boolean) || [];

    return NextResponse.json({ emails, folder });
  } catch (error) {
    console.error("Get folder emails error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inbox/folders/[id]/emails - Add email to folder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email_id, assigned_by = "user" } = body;

    if (!email_id) {
      return NextResponse.json({ error: "email_id is required" }, { status: 400 });
    }

    // Verify folder ownership
    const { data: folder } = await supabase
      .from("email_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Add assignment
    const { data: assignment, error } = await supabase
      .from("email_folder_assignments")
      .upsert({
        email_id,
        folder_id: id,
        assigned_by,
      }, { onConflict: "email_id,folder_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Add to folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inbox/folders/[id]/emails - Remove email from folder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email_id = searchParams.get("email_id");

    if (!email_id) {
      return NextResponse.json({ error: "email_id is required" }, { status: 400 });
    }

    // Verify folder ownership
    const { data: folder } = await supabase
      .from("email_folders")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("email_folder_assignments")
      .delete()
      .eq("email_id", email_id)
      .eq("folder_id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
