/**
 * Custom Skill Detail API
 * GET - Fetch a custom skill
 * PUT - Update a custom skill
 * DELETE - Delete a custom skill
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateCustomSkill } from "@/lib/skills/custom/validator";
import type { UpdateCustomSkillInput } from "@/lib/skills/custom/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/skills/custom/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: skill, error } = await admin
      .from("custom_skills")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Check access: creator, same org, or public+published
    const hasAccess =
      skill.creator_id === user.id ||
      (skill.visibility === "public" && skill.is_published);

    if (!hasAccess && skill.visibility === "organization") {
      const { data: profile } = await admin
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id !== skill.organization_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ skill });
  } catch (error: any) {
    console.error("[CustomSkills] GET detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/skills/custom/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("custom_skills")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (existing.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can edit this skill" },
        { status: 403 }
      );
    }

    const body: UpdateCustomSkillInput = await request.json();

    // If tools are being updated, validate the full skill
    if (body.tools) {
      const validation = validateCustomSkill({
        name: body.name || "placeholder",
        slug: body.slug || "placeholder",
        description: body.description || "",
        tools: body.tools,
        auth_type: body.auth_type,
        auth_config: body.auth_config,
        allowed_domains: body.allowed_domains,
      });
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Validation failed", errors: validation.errors },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const update: Record<string, any> = {};
    const allowedFields = [
      "name",
      "slug",
      "description",
      "category",
      "tags",
      "icon",
      "color",
      "visibility",
      "is_published",
      "system_prompt",
      "config_schema",
      "default_config",
      "tools",
      "auth_type",
      "auth_config",
      "allowed_domains",
    ];

    for (const field of allowedFields) {
      if ((body as any)[field] !== undefined) {
        update[field] = (body as any)[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    update.updated_at = new Date().toISOString();

    const { data: skill, error } = await admin
      .from("custom_skills")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[CustomSkills] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update skill: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ skill });
  } catch (error: any) {
    console.error("[CustomSkills] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update skill: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/custom/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("custom_skills")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (existing.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can delete this skill" },
        { status: 403 }
      );
    }

    // Delete associated user_skills entries first
    await admin.from("user_skills").delete().like("skill_id", `custom_${id}%`);

    // Delete the skill
    const { error } = await admin
      .from("custom_skills")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[CustomSkills] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete skill: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error: any) {
    console.error("[CustomSkills] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete skill: " + error.message },
      { status: 500 }
    );
  }
}
