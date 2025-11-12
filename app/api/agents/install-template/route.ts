import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock templates as fallback (same as in templates/route.ts)
const MOCK_TEMPLATES = [
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Handles customer inquiries and creates support tasks from emails",
    agent_type: "email_monitor",
    icon: "💬",
    category: "Communication",
    capabilities: ["Knowledge Base Search", "Email Response", "Ticket Routing"],
    usage_count: 1247,
    default_config: {},
    default_personality: "professional",
    default_instructions: "Monitor support emails and create tasks for customer inquiries that need attention. Prioritize based on urgency and customer sentiment.",
  },
  {
    id: "sales-lead-tracker",
    name: "Sales Lead Tracker",
    description: "Monitors emails for potential leads and creates follow-up tasks",
    agent_type: "email_monitor",
    icon: "🎯",
    category: "Productivity",
    capabilities: ["Lead Scoring", "Follow-up Scheduling", "CRM Integration"],
    usage_count: 892,
    default_config: {},
    default_personality: "enthusiastic",
    default_instructions: "Track sales-related emails and identify potential leads. Create follow-up tasks with suggested messaging based on conversation context.",
  },
  {
    id: "meeting-scheduler",
    name: "Meeting Scheduler",
    description: "Automatically detects meeting requests and manages your calendar",
    agent_type: "calendar_monitor",
    icon: "📅",
    category: "Calendar",
    capabilities: ["Scheduling", "Conflict Detection", "Reminder Creation"],
    usage_count: 1563,
    default_config: {},
    default_personality: "friendly",
    default_instructions: "Monitor calendar for scheduling requests and conflicts. Create tasks for meeting preparation and follow-ups.",
  },
  {
    id: "document-summarizer",
    name: "Document Summarizer",
    description: "Analyzes documents and creates summary tasks with key insights",
    agent_type: "document_analyzer",
    icon: "📄",
    category: "Documents",
    capabilities: ["Text Extraction", "Summarization", "Key Points Extraction"],
    usage_count: 734,
    default_config: {},
    default_personality: "professional",
    default_instructions: "Review documents and create summary tasks highlighting important information, action items, and deadlines.",
  },
  {
    id: "project-coordinator",
    name: "Project Coordinator",
    description: "Tracks project updates and ensures tasks are progressing",
    agent_type: "task_manager",
    icon: "📊",
    category: "Productivity",
    capabilities: ["Task Tracking", "Progress Monitoring", "Deadline Management"],
    usage_count: 1089,
    default_config: {},
    default_personality: "professional",
    default_instructions: "Monitor task progress and create follow-up reminders for overdue or approaching deadline items.",
  },
  {
    id: "email-organizer",
    name: "Email Organizer",
    description: "Categorizes and prioritizes incoming emails automatically",
    agent_type: "email_organizer",
    icon: "📧",
    category: "Communication",
    capabilities: ["Auto-categorization", "Priority Detection", "Spam Filtering"],
    usage_count: 2156,
    default_config: {},
    default_personality: "professional",
    default_instructions: "Organize emails by importance and create tasks for high-priority messages requiring action.",
  },
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Try to get template from database first
    const { data: template, error: templateError } = await supabase
      .from("agent_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    // If not found in database, check mock templates
    let templateData = template;
    if (templateError || !template) {
      const mockTemplate = MOCK_TEMPLATES.find(t => t.id === templateId);
      if (!mockTemplate) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      templateData = mockTemplate;
    }

    const { data: agent, error: createError } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: templateData.name,
        description: templateData.description,
        agent_type: templateData.agent_type,
        config: templateData.default_config,
        personality: templateData.default_personality,
        instructions: templateData.default_instructions,
        enabled: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }

    // Only update usage count if template is from database
    if (template) {
      await supabase
        .from("agent_templates")
        .update({ usage_count: templateData.usage_count + 1 })
        .eq("id", templateId);
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Install template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
