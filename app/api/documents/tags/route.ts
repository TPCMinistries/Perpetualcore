import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents/tags
// Get all tags for the user's organization
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all tags with document counts
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select(`
        *,
        document_tags(count)
      `)
      .eq("organization_id", profile.organization_id)
      .order("name");

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tags: tags || [] });
  } catch (error) {
    console.error("Get tags API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/tags
// Create a new tag
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    // Create tag in both tables to satisfy FK constraint
    // First create in tags table (with full schema)
    const { data: tag, error: tagsInsertError } = await supabase
      .from("tags")
      .insert({
        organization_id: profile.organization_id,
        name: name.trim(),
        color: color || "gray",
      })
      .select()
      .single();

    if (tagsInsertError) {
      console.error("Error creating tag:", tagsInsertError);

      // Check for duplicate tag name
      if (tagsInsertError.code === "23505") {
        return NextResponse.json(
          { error: "A tag with this name already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create tag" },
        { status: 500 }
      );
    }

    // Also insert into document_tags_master to satisfy FK constraint (using same ID)
    const { error: docTagsError } = await supabase
      .from("document_tags_master")
      .insert({
        id: tag.id,
        organization_id: profile.organization_id,
        name: tag.name,
      });

    if (docTagsError) {
      console.error("Error creating tag in document_tags_master:", docTagsError);
      // Don't fail the request, the tag exists in tags table
    }

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Create tag API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
