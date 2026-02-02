/**
 * Skills API
 * GET - List all available skills with user's enabled status
 * POST - Enable/disable a skill
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllSkills,
  getUserSkills,
  enableSkill,
  disableSkill,
  updateSkillConfig,
  getSkill,
} from "@/lib/skills/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/skills
 * List all available skills with user's enabled status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all available skills
    const allSkills = getAllSkills();

    // Get user's enabled skills
    const userSkills = await getUserSkills(user.id);
    const userSkillMap = new Map(userSkills.map(s => [s.skillId, s]));

    // Combine into response
    const skills = allSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      category: skill.category,
      tags: skill.tags,
      icon: skill.icon,
      color: skill.color,
      tier: skill.tier,
      isBuiltIn: skill.isBuiltIn,
      toolCount: skill.tools.length,
      tools: skill.tools.map(t => ({
        name: t.name,
        description: t.description,
      })),
      configSchema: skill.configSchema,
      // User-specific
      enabled: userSkillMap.has(skill.id) ? userSkillMap.get(skill.id)!.enabled : false,
      userConfig: userSkillMap.get(skill.id)?.config || skill.defaultConfig || {},
      installedAt: userSkillMap.get(skill.id)?.installedAt,
      lastUsedAt: userSkillMap.get(skill.id)?.lastUsedAt,
    }));

    // Group by category
    const categories = [...new Set(skills.map(s => s.category))];
    const byCategory = categories.reduce((acc, cat) => {
      acc[cat] = skills.filter(s => s.category === cat);
      return acc;
    }, {} as Record<string, typeof skills>);

    return NextResponse.json({
      skills,
      byCategory,
      totalSkills: skills.length,
      enabledCount: skills.filter(s => s.enabled).length,
    });
  } catch (error: any) {
    console.error("Skills GET error:", error);
    return NextResponse.json(
      { error: "Failed to get skills: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 * Enable, disable, or update a skill
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, skillId, config } = body;

    if (!skillId) {
      return NextResponse.json({ error: "skillId is required" }, { status: 400 });
    }

    // Verify skill exists
    const skill = getSkill(skillId);
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    let result;

    switch (action) {
      case "enable":
        result = await enableSkill(user.id, skillId, config);
        break;

      case "disable":
        result = await disableSkill(user.id, skillId);
        break;

      case "update_config":
        if (!config) {
          return NextResponse.json({ error: "config is required for update_config" }, { status: 400 });
        }
        result = await updateSkillConfig(user.id, skillId, config);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'enable', 'disable', or 'update_config'" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      skillId,
      message: `Skill ${action}d successfully`,
    });
  } catch (error: any) {
    console.error("Skills POST error:", error);
    return NextResponse.json(
      { error: "Failed to update skill: " + error.message },
      { status: 500 }
    );
  }
}
