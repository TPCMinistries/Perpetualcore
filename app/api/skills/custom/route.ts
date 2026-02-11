/**
 * Custom Skills API
 * POST - Create a new custom skill
 * GET - List user's custom skills
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateCustomSkill, generateSlug } from "@/lib/skills/custom/validator";
import { enforceCustomSkillLimit } from "@/lib/billing/enforcement";
import type { CreateCustomSkillInput } from "@/lib/skills/custom/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/skills/custom
 * List custom skills accessible to the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get user's org
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;

    // Fetch accessible custom skills
    let query = admin
      .from("custom_skills")
      .select("*")
      .or(
        [
          `creator_id.eq.${user.id}`,
          orgId
            ? `and(visibility.eq.organization,organization_id.eq.${orgId})`
            : null,
          "and(visibility.eq.public,is_published.eq.true)",
        ]
          .filter(Boolean)
          .join(",")
      )
      .order("created_at", { ascending: false });

    // Optional filter: only user's own skills
    const mine = request.nextUrl.searchParams.get("mine");
    if (mine === "true") {
      query = admin
        .from("custom_skills")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("[CustomSkills] List error:", error);
      return NextResponse.json(
        { error: "Failed to list custom skills" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      skills: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("[CustomSkills] GET error:", error);
    return NextResponse.json(
      { error: "Failed to list custom skills: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills/custom
 * Create a new custom skill
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCustomSkillInput = await request.json();

    // Auto-generate slug if not provided
    if (!body.slug && body.name) {
      body.slug = generateSlug(body.name);
    }

    // Validate
    const validation = validateCustomSkill(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get user's org
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    // Enforce plan limits
    const enforcement = await enforceCustomSkillLimit(
      user.id,
      profile?.organization_id
    );
    if (!enforcement.allowed) {
      return NextResponse.json(
        { error: enforcement.message, upgrade: true },
        { status: 403 }
      );
    }

    // Check slug uniqueness for this creator
    const { data: existing } = await admin
      .from("custom_skills")
      .select("id")
      .eq("creator_id", user.id)
      .eq("slug", body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `You already have a skill with slug '${body.slug}'` },
        { status: 409 }
      );
    }

    // Insert
    const { data: skill, error } = await admin
      .from("custom_skills")
      .insert({
        creator_id: user.id,
        organization_id: profile?.organization_id || null,
        name: body.name,
        slug: body.slug,
        description: body.description || "",
        category: body.category || "utility",
        tags: body.tags || [],
        icon: body.icon || "puzzle",
        color: body.color || null,
        visibility: body.visibility || "private",
        is_published: false,
        system_prompt: body.system_prompt || null,
        config_schema: body.config_schema || {},
        default_config: body.default_config || {},
        tools: body.tools,
        auth_type: body.auth_type || "none",
        auth_config: body.auth_config || {},
        allowed_domains: body.allowed_domains || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[CustomSkills] Create error:", error);
      return NextResponse.json(
        { error: "Failed to create skill: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error: any) {
    console.error("[CustomSkills] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create custom skill: " + error.message },
      { status: 500 }
    );
  }
}
