/**
 * Custom Skill Tool Test API
 * POST - Test a specific tool from a custom skill
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { executeHttpTool } from "@/lib/skills/custom/http-executor";
import type { TestToolInput, CustomSkillRecord } from "@/lib/skills/custom/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/skills/custom/[id]/test
 * Test a tool from a custom skill with provided parameters
 */
export async function POST(
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

    // Fetch the skill
    const { data: skill, error: fetchError } = await admin
      .from("custom_skills")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Only creator can test
    if (skill.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can test this skill" },
        { status: 403 }
      );
    }

    const body: TestToolInput = await request.json();

    // Validate tool_index
    const record = skill as CustomSkillRecord;
    if (
      body.tool_index < 0 ||
      body.tool_index >= (record.tools?.length || 0)
    ) {
      return NextResponse.json(
        { error: `Invalid tool_index. Skill has ${record.tools?.length || 0} tools.` },
        { status: 400 }
      );
    }

    const toolConfig = record.tools[body.tool_index];

    // Execute with credential override if provided
    const result = await executeHttpTool(
      toolConfig,
      body.params || {},
      {
        userId: user.id,
        organizationId: record.organization_id || undefined,
        skillConfig: {
          _skillSlug: record.slug,
          _skillId: record.id,
          _authType: record.auth_type,
        },
      },
      {
        authType: record.auth_type,
        authConfig: record.auth_config || {},
        allowedDomains: record.allowed_domains || [],
        credentialOverride: body.credential_value,
      }
    );

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      display: result.display,
    });
  } catch (error: any) {
    console.error("[CustomSkills] Test error:", error);
    return NextResponse.json(
      { error: "Test failed: " + error.message },
      { status: 500 }
    );
  }
}
