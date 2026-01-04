import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST - Set up a quick start template for the user
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await req.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = profile?.organization_id;

    // Set up based on template
    const setupResults: string[] = [];

    switch (templateId) {
      case "sales-pipeline":
        // Create Sales Engine team if not exists
        await setupSalesTemplate(supabase, user.id, organizationId);
        setupResults.push("sales-team", "leads-page", "pipeline-view");
        break;

      case "email-automation":
        // Set up email preferences
        await setupEmailTemplate(supabase, user.id, organizationId);
        setupResults.push("email-integration", "smart-filters", "templates");
        break;

      case "project-hub":
        // Create project workspace
        await setupProjectTemplate(supabase, user.id, organizationId);
        setupResults.push("project-board", "task-tracking", "team-view");
        break;

      case "meeting-assistant":
        // Set up calendar integration
        await setupMeetingTemplate(supabase, user.id, organizationId);
        setupResults.push("calendar-sync", "meeting-prep", "action-items");
        break;

      case "content-engine":
        // Set up content workspace
        await setupContentTemplate(supabase, user.id, organizationId);
        setupResults.push("document-library", "ai-writer", "templates");
        break;

      case "automation-starter":
        // Set up automation hub
        await setupAutomationTemplate(supabase, user.id, organizationId);
        setupResults.push("workflow-builder", "triggers", "integrations");
        break;

      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 }
        );
    }

    // Record quick start completion
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      key: `quick_start_${templateId}`,
      value: { completed: true, timestamp: new Date().toISOString() },
    }, { onConflict: "user_id,key" });

    return NextResponse.json({
      success: true,
      templateId,
      setupResults,
    });
  } catch (error) {
    console.error("Quick start setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up template" },
      { status: 500 }
    );
  }
}

async function setupSalesTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Check if sales team already exists
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("name", "%sales%")
    .limit(1)
    .single();

  if (!existingTeam && organizationId) {
    // Create a sales team
    await supabase.from("teams").insert({
      name: "Sales Team",
      description: "Sales pipeline and lead management",
      organization_id: organizationId,
      created_by: userId,
      template_id: "sales-engine",
      ai_context: {
        personality: "sales-focused",
        suggestions_focus: ["lead conversion", "pipeline velocity", "deal closing"],
      },
    });
  }

  // Add AI memory about sales focus
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "goal",
    p_content: "Focused on building and managing a sales pipeline",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}

async function setupEmailTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Set up email preferences
  await supabase.from("user_preferences").upsert({
    user_id: userId,
    key: "email_automation",
    value: {
      enabled: true,
      smart_categorization: true,
      ai_drafts: true,
      auto_followup: false, // User should enable explicitly
    },
  }, { onConflict: "user_id,key" });

  // Add AI memory
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "workflow",
    p_content: "Uses AI for email drafting and organization",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}

async function setupProjectTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Create a sample project if none exists
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 0 && organizationId) {
    await supabase.from("projects").insert({
      name: "My First Project",
      description: "Sample project to get you started",
      organization_id: organizationId,
      user_id: userId,
      status: "active",
    });
  }

  // Add AI memory
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "workflow",
    p_content: "Uses project management to track work and tasks",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}

async function setupMeetingTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Set up meeting preferences
  await supabase.from("user_preferences").upsert({
    user_id: userId,
    key: "meeting_assistant",
    value: {
      enabled: true,
      prep_briefs: true,
      auto_action_items: true,
      followup_reminders: true,
    },
  }, { onConflict: "user_id,key" });

  // Add AI memory
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "preference",
    p_content: "Wants AI help with meeting preparation and follow-up",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}

async function setupContentTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Set up content preferences
  await supabase.from("user_preferences").upsert({
    user_id: userId,
    key: "content_engine",
    value: {
      enabled: true,
      ai_writing: true,
      brand_voice: null, // User will set up
      content_calendar: true,
    },
  }, { onConflict: "user_id,key" });

  // Add AI memory
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "skill",
    p_content: "Creates content regularly and needs AI writing assistance",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}

async function setupAutomationTemplate(supabase: any, userId: string, organizationId: string | null) {
  // Set up automation preferences
  await supabase.from("user_preferences").upsert({
    user_id: userId,
    key: "automation_enabled",
    value: {
      enabled: true,
      workflows_shown: true,
      n8n_integration: false, // User will connect
    },
  }, { onConflict: "user_id,key" });

  // Add AI memory
  await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: "goal",
    p_content: "Wants to automate repetitive tasks and workflows",
    p_source: "quick_start",
    p_confidence: 0.9,
  });
}
