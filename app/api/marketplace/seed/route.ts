import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Seed marketplace with starter items
 * Uses createAdminClient to bypass RLS (server-side seed operation)
 * Idempotent: checks for existing items by name before inserting
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Verify this is an authorized request (check for admin secret or auth)
    const authHeader = req.headers.get("authorization");
    const seedSecret = process.env.SEED_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || !authHeader.includes(seedSecret?.slice(0, 20) || "")) {
      // Fall back to checking if user is super admin
      const userClient = await import("@/lib/supabase/server").then((m) =>
        m.createClient()
      );
      const {
        data: { user },
      } = await (await userClient).auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await (await userClient)
        .from("user_profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_super_admin) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    // We need an organization_id and creator_id for the seed items.
    // Grab the first organization and its owner as the "system" creator.
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "No organization found. Create an organization first." },
        { status: 400 }
      );
    }

    // Get the first admin user in the org to use as creator_id
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", org.id)
      .limit(1)
      .single();

    if (!adminProfile) {
      return NextResponse.json(
        { error: "No user profile found in organization." },
        { status: 400 }
      );
    }

    const organizationId = org.id;
    const creatorId = adminProfile.id;

    // Define all seed items
    const seedItems = [
      // ── Workflow Templates (type: "workflow", category: "Productivity") ──
      {
        type: "workflow" as const,
        name: "Client Onboarding Workflow",
        description:
          "Automated client onboarding with welcome emails, document collection, and CRM setup. Reduces onboarding time by 80%.",
        long_description:
          "A comprehensive onboarding workflow that guides new clients through welcome communications, document uploads, contract signing, and account provisioning. Integrates with email, CRM, and document storage.",
        pricing_type: "one_time" as const,
        price: 0,
        category: "Sales",
        tags: ["onboarding", "automation", "clients", "crm"],
        features: [
          "Automated welcome email sequence",
          "Document collection checklist",
          "CRM contact creation",
          "Calendar scheduling integration",
        ],
        config: {
          steps: 6,
          integrations: ["email", "crm", "calendar"],
          template_type: "workflow",
        },
      },
      {
        type: "workflow" as const,
        name: "Content Calendar Manager",
        description:
          "Plan, schedule, and track content across all channels with AI-powered topic suggestions and performance analytics.",
        long_description:
          "An end-to-end content management workflow that helps teams plan editorial calendars, assign writers, track deadlines, and analyze post-publication performance. AI suggests trending topics in your niche.",
        pricing_type: "one_time" as const,
        price: 9.99,
        category: "Marketing",
        tags: ["content", "marketing", "scheduling", "analytics"],
        features: [
          "AI topic suggestions",
          "Multi-channel scheduling",
          "Performance tracking",
          "Team assignment board",
        ],
        config: {
          steps: 5,
          integrations: ["social_media", "analytics", "calendar"],
          template_type: "workflow",
        },
      },
      {
        type: "workflow" as const,
        name: "Sales Pipeline Automation",
        description:
          "End-to-end sales pipeline with lead scoring, automated follow-ups, and deal tracking. Close deals 3x faster.",
        long_description:
          "A full-featured sales pipeline workflow that automatically scores incoming leads, triggers personalized follow-up sequences, tracks deal stages, and generates forecasting reports. Includes Slack notifications for hot leads.",
        pricing_type: "one_time" as const,
        price: 29.99,
        category: "Sales",
        tags: ["sales", "pipeline", "leads", "crm", "automation"],
        features: [
          "AI lead scoring",
          "Automated follow-up sequences",
          "Deal stage tracking",
          "Revenue forecasting",
          "Slack notifications",
        ],
        config: {
          steps: 8,
          integrations: ["crm", "email", "slack", "analytics"],
          template_type: "workflow",
        },
      },
      {
        type: "workflow" as const,
        name: "Weekly Planning System",
        description:
          "Structured weekly planning with goal setting, task prioritization, and end-of-week retrospective. Free forever.",
        long_description:
          "A personal productivity workflow that starts each week with goal-setting, breaks goals into daily tasks with priority levels, sends daily reminders, and closes the week with an automated retrospective summary.",
        pricing_type: "one_time" as const,
        price: 0,
        category: "Other",
        tags: ["planning", "productivity", "goals", "weekly-review"],
        features: [
          "Weekly goal setting template",
          "Daily task prioritization",
          "Automated reminders",
          "Retrospective summary",
        ],
        config: {
          steps: 4,
          integrations: ["calendar", "tasks"],
          template_type: "workflow",
        },
      },
      {
        type: "workflow" as const,
        name: "Project Kickoff Bundle",
        description:
          "Launch new projects with a structured kickoff: stakeholder mapping, milestone planning, and risk assessment.",
        long_description:
          "A project management workflow that standardizes how new projects are initiated. Includes stakeholder identification, RACI matrix generation, milestone timeline creation, risk register setup, and automated kickoff meeting scheduling.",
        pricing_type: "one_time" as const,
        price: 9.99,
        category: "Other",
        tags: ["project-management", "kickoff", "planning", "stakeholders"],
        features: [
          "Stakeholder mapping",
          "RACI matrix generator",
          "Milestone timeline",
          "Risk register",
          "Kickoff meeting scheduler",
        ],
        config: {
          steps: 7,
          integrations: ["project_mgmt", "calendar", "documents"],
          template_type: "workflow",
        },
      },

      // ── Agent Configs (type: "agent") ──
      {
        type: "agent" as const,
        name: "Sales Outreach Agent",
        description:
          "AI agent that researches prospects, crafts personalized outreach emails, and tracks engagement. Your always-on SDR.",
        long_description:
          "An intelligent sales development agent that researches prospects using LinkedIn and company data, generates personalized cold outreach sequences, A/B tests subject lines, and provides engagement analytics. Learns from your best-performing emails over time.",
        pricing_type: "one_time" as const,
        price: 29.99,
        category: "Sales",
        tags: ["sales", "outreach", "email", "prospecting", "ai-agent"],
        features: [
          "Prospect research",
          "Personalized email drafting",
          "A/B testing",
          "Engagement tracking",
          "Learning from results",
        ],
        config: {
          model: "gpt-4o",
          capabilities: ["email", "research", "analytics"],
          agent_type: "sales_outreach",
        },
      },
      {
        type: "agent" as const,
        name: "Legal Review Agent",
        description:
          "AI-powered contract review that flags risky clauses, suggests edits, and compares against your standard terms.",
        long_description:
          "A specialized legal AI agent that reviews contracts, NDAs, and agreements against your organization's standard terms. Highlights risky clauses, suggests alternative language, and generates a risk summary report. Saves hours of legal review time.",
        pricing_type: "one_time" as const,
        price: 29.99,
        category: "Legal",
        tags: ["legal", "contracts", "review", "compliance", "ai-agent"],
        features: [
          "Clause risk scoring",
          "Standard terms comparison",
          "Edit suggestions",
          "Risk summary report",
          "Multi-document batch review",
        ],
        config: {
          model: "claude-sonnet",
          capabilities: ["document_analysis", "legal_review"],
          agent_type: "legal_review",
        },
      },
      {
        type: "agent" as const,
        name: "Meeting Prep Agent",
        description:
          "Automatically prepares meeting briefs with attendee context, past notes, and suggested talking points. Free.",
        long_description:
          "An AI agent that prepares you for every meeting by pulling attendee profiles, summarizing past interactions, reviewing relevant documents, and suggesting talking points. Integrates with your calendar and CRM for full context.",
        pricing_type: "one_time" as const,
        price: 0,
        category: "Other",
        tags: ["meetings", "preparation", "calendar", "context", "ai-agent"],
        features: [
          "Attendee profile lookup",
          "Past interaction summary",
          "Document review",
          "Talking points generator",
          "Calendar integration",
        ],
        config: {
          model: "gpt-4o-mini",
          capabilities: ["calendar", "crm", "documents"],
          agent_type: "meeting_prep",
        },
      },
      {
        type: "agent" as const,
        name: "Social Media Agent",
        description:
          "AI content creator that drafts posts, suggests hashtags, analyzes trends, and schedules across platforms.",
        long_description:
          "A social media management agent that generates platform-specific content (LinkedIn, Twitter/X, Instagram captions), researches trending hashtags, analyzes competitor posts, and schedules content across all your channels. Learns your brand voice over time.",
        pricing_type: "subscription" as const,
        price: 9.99,
        subscription_interval: "monthly",
        category: "Marketing",
        tags: [
          "social-media",
          "content",
          "marketing",
          "scheduling",
          "ai-agent",
        ],
        features: [
          "Multi-platform content generation",
          "Hashtag research",
          "Competitor analysis",
          "Scheduling",
          "Brand voice learning",
        ],
        config: {
          model: "gpt-4o",
          capabilities: ["content_generation", "social_media", "analytics"],
          agent_type: "social_media",
        },
      },
      {
        type: "agent" as const,
        name: "Customer Support Agent",
        description:
          "AI support agent that handles common queries, escalates complex issues, and maintains your knowledge base.",
        long_description:
          "A customer support AI agent that answers common questions from your knowledge base, creates and routes support tickets, escalates complex issues to human agents, and continuously improves its responses based on resolution data. Supports email, chat, and API channels.",
        pricing_type: "one_time" as const,
        price: 9.99,
        category: "Customer Support",
        tags: [
          "support",
          "customer-service",
          "helpdesk",
          "knowledge-base",
          "ai-agent",
        ],
        features: [
          "Knowledge base Q&A",
          "Ticket creation and routing",
          "Smart escalation",
          "Multi-channel support",
          "Self-improving responses",
        ],
        config: {
          model: "gpt-4o-mini",
          capabilities: ["knowledge_base", "ticketing", "email"],
          agent_type: "customer_support",
        },
      },

      // ── Document Templates (type: "workflow", category varies) ──
      {
        type: "workflow" as const,
        name: "Board Report Template",
        description:
          "Professional board report template with executive summary, KPI dashboards, and financial highlights. Ready to customize.",
        long_description:
          "A structured board report template that includes sections for executive summary, key performance indicators, financial overview, strategic initiatives update, risk register, and next quarter outlook. Pre-formatted for professional presentation.",
        pricing_type: "one_time" as const,
        price: 9.99,
        category: "Finance",
        tags: [
          "board-report",
          "executive",
          "template",
          "governance",
          "document",
        ],
        features: [
          "Executive summary section",
          "KPI dashboard layout",
          "Financial highlights",
          "Strategic initiatives tracker",
          "Risk register",
        ],
        config: {
          template_type: "document",
          format: "docx",
          sections: 6,
        },
      },
      {
        type: "workflow" as const,
        name: "Investor Update Template",
        description:
          "Monthly investor update template with metrics, milestones, asks, and team highlights. Used by 500+ startups.",
        long_description:
          "A clean, professional investor update template designed for startups. Includes sections for key metrics, product milestones, revenue/burn rate, fundraising status, team updates, and specific asks. Formatted for readability and impact.",
        pricing_type: "one_time" as const,
        price: 0,
        category: "Finance",
        tags: [
          "investor-update",
          "startup",
          "fundraising",
          "template",
          "document",
        ],
        features: [
          "Key metrics section",
          "Milestone tracker",
          "Financial summary",
          "Team highlights",
          "Ask section",
        ],
        config: {
          template_type: "document",
          format: "docx",
          sections: 5,
        },
      },
      {
        type: "workflow" as const,
        name: "Project Proposal Template",
        description:
          "Comprehensive project proposal with scope, timeline, budget, and risk analysis. Win more approvals.",
        long_description:
          "A detailed project proposal template that covers problem statement, proposed solution, scope of work, timeline with milestones, budget breakdown, resource requirements, risk analysis, and success metrics. Designed to win stakeholder buy-in.",
        pricing_type: "one_time" as const,
        price: 9.99,
        category: "Other",
        tags: [
          "proposal",
          "project",
          "planning",
          "template",
          "document",
        ],
        features: [
          "Problem/solution framing",
          "Scope of work section",
          "Timeline with milestones",
          "Budget breakdown",
          "Risk analysis matrix",
        ],
        config: {
          template_type: "document",
          format: "docx",
          sections: 8,
        },
      },
      {
        type: "workflow" as const,
        name: "Quarterly Review Template",
        description:
          "Quarterly business review template with OKR tracking, team performance, and next-quarter planning.",
        long_description:
          "A comprehensive quarterly review template that helps teams reflect on OKR progress, analyze wins and misses, review team performance metrics, and plan next quarter goals. Includes AI-powered summary generation from your data.",
        pricing_type: "one_time" as const,
        price: 29.99,
        category: "HR",
        tags: [
          "quarterly-review",
          "okr",
          "performance",
          "template",
          "document",
        ],
        features: [
          "OKR progress tracker",
          "Win/miss analysis",
          "Team performance metrics",
          "Next quarter planning",
          "AI summary generation",
        ],
        config: {
          template_type: "document",
          format: "docx",
          sections: 5,
        },
      },
      {
        type: "workflow" as const,
        name: "Team Standup Format",
        description:
          "Async standup template with blockers, progress, and goals. Keep your team aligned without another meeting. Free.",
        long_description:
          "A lightweight async standup format that replaces daily standup meetings. Team members fill in what they accomplished, what they're working on, and any blockers. AI aggregates responses into a team digest sent to managers.",
        pricing_type: "one_time" as const,
        price: 0,
        category: "HR",
        tags: ["standup", "async", "team", "template", "document"],
        features: [
          "Async standup format",
          "Blocker tracking",
          "Progress summaries",
          "AI team digest",
          "Slack integration",
        ],
        config: {
          template_type: "document",
          format: "markdown",
          sections: 3,
        },
      },
    ];

    // Check which items already exist (idempotent)
    const itemNames = seedItems.map((item) => item.name);
    const { data: existingItems } = await supabase
      .from("marketplace_items")
      .select("name")
      .in("name", itemNames);

    const existingNames = new Set(
      (existingItems || []).map((item) => item.name)
    );
    const newItems = seedItems.filter(
      (item) => !existingNames.has(item.name)
    );

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All marketplace items already exist. Nothing to seed.",
        inserted: 0,
        skipped: seedItems.length,
      });
    }

    // Insert new items with system creator
    const itemsToInsert = newItems.map((item) => ({
      ...item,
      creator_id: creatorId,
      organization_id: organizationId,
      status: "approved" as const,
      published_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("marketplace_items")
      .insert(itemsToInsert)
      .select("id, name, type, price");

    if (insertError) {
      console.error("Error seeding marketplace items:", insertError);
      return NextResponse.json(
        { error: "Failed to seed marketplace items", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted?.length || 0} marketplace items. Skipped ${existingNames.size} existing.`,
      inserted: inserted?.length || 0,
      skipped: existingNames.size,
      items: inserted,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to seed marketplace items";
    console.error("Marketplace seed error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
