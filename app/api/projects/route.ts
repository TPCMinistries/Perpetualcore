import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch all projects for user's organization
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile to find organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response("Profile not found", { status: 404 });
    }

    // Fetch projects for this organization
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response("Failed to fetch projects", { status: 500 });
    }

    return Response.json(projects || []);
  } catch (error) {
    console.error("Projects API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST - Create a new project
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile to find organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response("Profile not found", { status: 404 });
    }

    const { name, color, icon } = await req.json();

    if (!name || !name.trim()) {
      return new Response("Project name is required", { status: 400 });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        organization_id: profile.organization_id,
        name: name.trim(),
        color: color || "#6366f1",
        icon: icon || "📁",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return new Response("Failed to create project", { status: 500 });
    }

    return Response.json(project);
  } catch (error) {
    console.error("Projects API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
