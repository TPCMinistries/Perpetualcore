import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents/folders
// Get all folders for the user's organization
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

    // Get all folders (without document count for now due to FK constraint)
    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name");

    if (foldersError) {
      console.error("Error fetching folders:", foldersError);
      return NextResponse.json(
        { error: "Failed to fetch folders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ folders: folders || [] });
  } catch (error) {
    console.error("Get folders API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/folders
// Create a new folder
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
    const { name, description, parent_folder_id, color, icon } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Check if folder with same name exists in same parent
    const { data: existingFolder } = await supabase
      .from("folders")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("name", name.trim())
      .eq("parent_folder_id", parent_folder_id || null)
      .single();

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists in this location" },
        { status: 400 }
      );
    }

    // Create folder in both tables to satisfy FK constraint
    // First create in folders table (with full schema)
    const { data: folder, error: foldersInsertError } = await supabase
      .from("folders")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        parent_folder_id: parent_folder_id || null,
        color: color || "blue",
        icon: icon || "folder",
      })
      .select()
      .single();

    if (foldersInsertError) {
      console.error("Error creating folder:", foldersInsertError);
      return NextResponse.json(
        { error: "Failed to create folder" },
        { status: 500 }
      );
    }

    // Also insert into document_folders to satisfy FK constraint (using same ID)
    // Include name as it's required (NOT NULL constraint)
    const { error: docFoldersError } = await supabase
      .from("document_folders")
      .insert({
        id: folder.id,
        organization_id: profile.organization_id,
        name: folder.name,
      });

    if (docFoldersError) {
      console.error("Error creating folder in document_folders:", docFoldersError);
      // Don't fail the request, the folder exists in folders table
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
