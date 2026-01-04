import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateEntityRequest, EntityWithStats } from "@/types/entities";

export const runtime = "nodejs";

/**
 * GET - List all entities for the user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the helper function
    const { data: entities, error } = await supabase.rpc("get_user_entities", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error fetching entities:", error);

      // Fallback to direct query if function doesn't exist
      const { data: fallbackEntities } = await supabase
        .from("entities")
        .select(`
          *,
          entity_type:lookup_entity_types(id, name, icon),
          primary_focus:lookup_focus_areas(id, name, icon)
        `)
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("name");

      // Add counts manually
      const entitiesWithCounts = await Promise.all(
        (fallbackEntities || []).map(async (entity) => {
          const { count: brandCount } = await supabase
            .from("brands")
            .select("id", { count: "exact", head: true })
            .eq("entity_id", entity.id)
            .eq("is_active", true);

          const { count: projectCount } = await supabase
            .from("entity_projects")
            .select("id", { count: "exact", head: true })
            .eq("entity_id", entity.id)
            .eq("is_active", true);

          return {
            ...entity,
            brand_count: brandCount || 0,
            project_count: projectCount || 0,
          };
        })
      );

      return NextResponse.json({ entities: entitiesWithCounts });
    }

    return NextResponse.json({ entities: entities || [] });
  } catch (error) {
    console.error("Entities GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entities" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new entity
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const body: CreateEntityRequest = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Entity name is required" },
        { status: 400 }
      );
    }

    const { data: entity, error } = await supabase
      .from("entities")
      .insert({
        owner_id: user.id,
        organization_id: profile?.organization_id,
        name: body.name,
        legal_name: body.legal_name,
        description: body.description,
        entity_type_id: body.entity_type_id,
        primary_focus_id: body.primary_focus_id,
        website: body.website,
        email: body.email,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating entity:", error);
      return NextResponse.json(
        { error: "Failed to create entity" },
        { status: 500 }
      );
    }

    // Add AI memory about the new entity
    try {
      await supabase.rpc("upsert_ai_memory", {
        p_user_id: user.id,
        p_memory_type: "context",
        p_content: `Has an entity called "${body.name}"${body.description ? `: ${body.description}` : ""}`,
        p_source: "entity_creation",
        p_confidence: 1.0,
      });
    } catch (memoryError) {
      console.error("Error adding entity memory:", memoryError);
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error("Entities POST error:", error);
    return NextResponse.json(
      { error: "Failed to create entity" },
      { status: 500 }
    );
  }
}
