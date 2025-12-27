import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export interface ProjectStage {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string;
  sort_order: number;
  is_default: boolean;
  is_complete: boolean;
  is_archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// GET - Fetch all stages for the organization
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  // Fetch stages
  const { data: stages, error } = await supabase
    .from("project_stages")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching stages:", error);
    return NextResponse.json(
      { error: "Failed to fetch stages" },
      { status: 500 }
    );
  }

  // If no stages exist, seed defaults
  if (!stages || stages.length === 0) {
    // Seed default stages
    const { error: seedError } = await supabase.rpc(
      "seed_default_project_stages",
      {
        org_id: profile.organization_id,
        user_id: user.id,
      }
    );

    if (seedError) {
      console.error("Error seeding stages:", seedError);
      // Return hardcoded defaults as fallback
      return NextResponse.json({
        stages: getDefaultStages(),
        seeded: false,
      });
    }

    // Re-fetch after seeding
    const { data: seededStages } = await supabase
      .from("project_stages")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true });

    return NextResponse.json({
      stages: seededStages || getDefaultStages(),
      seeded: true,
    });
  }

  return NextResponse.json({ stages });
}

// POST - Create a new stage
export async function POST(request: NextRequest) {
  const supabase = await createClient();

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
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, color, icon, description, is_default, is_complete } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Stage name is required" },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from("project_stages")
    .select("sort_order")
    .eq("organization_id", profile.organization_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrder?.sort_order ?? -1) + 1;

  // Create stage
  const { data: stage, error } = await supabase
    .from("project_stages")
    .insert({
      organization_id: profile.organization_id,
      name,
      slug,
      color: color || "#6366f1",
      icon: icon || "circle",
      description,
      sort_order: newOrder,
      is_default: is_default || false,
      is_complete: is_complete || false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating stage:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A stage with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create stage" },
      { status: 500 }
    );
  }

  return NextResponse.json({ stage }, { status: 201 });
}

// Helper function for default stages
function getDefaultStages(): ProjectStage[] {
  return [
    {
      id: "ideation",
      organization_id: "",
      name: "Ideation",
      slug: "ideation",
      color: "#a855f7",
      icon: "lightbulb",
      description: "New ideas and concepts being explored",
      sort_order: 0,
      is_default: true,
      is_complete: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "planning",
      organization_id: "",
      name: "Planning",
      slug: "planning",
      color: "#3b82f6",
      icon: "clipboard-list",
      description: "Defining scope, requirements, and timeline",
      sort_order: 1,
      is_default: false,
      is_complete: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "in_progress",
      organization_id: "",
      name: "In Progress",
      slug: "in_progress",
      color: "#f59e0b",
      icon: "play-circle",
      description: "Actively being worked on",
      sort_order: 2,
      is_default: false,
      is_complete: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "review",
      organization_id: "",
      name: "Review",
      slug: "review",
      color: "#10b981",
      icon: "eye",
      description: "Under review or testing",
      sort_order: 3,
      is_default: false,
      is_complete: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "complete",
      organization_id: "",
      name: "Complete",
      slug: "complete",
      color: "#22c55e",
      icon: "check-circle",
      description: "Successfully completed",
      sort_order: 4,
      is_default: false,
      is_complete: true,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
