import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateBrandRequest, Brand } from "@/types/entities";

export const runtime = "nodejs";

/**
 * GET - List all brands for the user (optionally filtered by entity)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const entityId = searchParams.get("entity_id");

    let query = supabase
      .from("brands")
      .select(`
        *,
        entity:entities(id, name)
      `)
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("name");

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    const { data: brands, error } = await query;

    if (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    return NextResponse.json({ brands: brands || [] });
  } catch (error) {
    console.error("Brands GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new brand
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateBrandRequest = await req.json();

    if (!body.entity_id) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      );
    }

    // Verify user owns the entity
    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("id", body.entity_id)
      .eq("owner_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    // Default tone config
    const defaultToneConfig = {
      voice: "professional",
      personality_traits: [],
      writing_style: "clear and concise",
      avoid_words: [],
      preferred_phrases: [],
      emoji_usage: "minimal",
      hashtag_strategy: "relevant",
      cta_style: "soft",
    };

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        entity_id: body.entity_id,
        owner_id: user.id,
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        tone_config: body.tone_config ? { ...defaultToneConfig, ...body.tone_config } : defaultToneConfig,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating brand:", error);
      return NextResponse.json(
        { error: "Failed to create brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Brands POST error:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
