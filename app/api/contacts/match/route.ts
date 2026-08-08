import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { ContactMatch } from "@/types/contacts";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - Find contacts that match a project or task
 *
 * Body: {
 *   project_id?: string,      // Match contacts to this project
 *   task_description?: string, // Or match to a task/need description
 *   context?: string,          // Additional context
 *   max_results?: number       // Limit results (default 5)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { project_id, task_description, context, max_results = 5 } = body;

    if (!project_id && !task_description) {
      return NextResponse.json(
        { error: "Either project_id or task_description is required" },
        { status: 400 }
      );
    }

    // Get project details if project_id provided
    let projectContext = "";
    let projectTags: string[] = [];

    if (project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name, description, tags, current_stage")
        .eq("id", project_id)
        .single();

      if (project) {
        projectContext = `Project: ${project.name}\nDescription: ${project.description || "No description"}\nStage: ${project.current_stage || "Not set"}`;
        projectTags = project.tags || [];
      }
    }

    // Build the search context
    const searchContext = [
      projectContext,
      task_description ? `Need: ${task_description}` : "",
      context || "",
    ]
      .filter(Boolean)
      .join("\n");

    // Get user's contacts (only suggestable ones)
    const { data: contacts } = await supabase
      .from("contacts")
      .select(`
        id,
        full_name,
        company,
        job_title,
        avatar_url,
        relationship_strength,
        is_favorite,
        suggest_for_opportunities,
        skills,
        interests,
        can_help_with,
        looking_for,
        ai_relevance_tags,
        how_we_met,
        ai_summary,
        last_interaction_at
      `)
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .or(
        "relationship_strength.in.(inner_circle,close,connected),suggest_for_opportunities.eq.true,is_favorite.eq.true"
      );

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No contacts available for matching. Add some contacts first!",
      });
    }

    // Use AI to find the best matches
    const contactSummaries = contacts.map((c) => ({
      id: c.id,
      name: c.full_name,
      company: c.company,
      title: c.job_title,
      strength: c.relationship_strength,
      favorite: c.is_favorite,
      suggest: c.suggest_for_opportunities,
      skills: c.skills || [],
      interests: c.interests || [],
      can_help: c.can_help_with || [],
      looking_for: c.looking_for || [],
      how_met: c.how_we_met,
      summary: c.ai_summary,
    }));

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping match contacts from a user's network to their projects and needs.

Given a project/task context and a list of contacts, identify the most relevant contacts who could help.

For each match, provide:
1. The contact ID
2. Match reasons (why this person is relevant)
3. A relevance score from 0-100

Consider:
- Skills and expertise alignment
- What they've offered to help with
- Their interests matching the project domain
- Relationship strength (inner_circle/close = higher priority)
- Whether they're marked as favorite or suggest_for_opportunities

Return JSON array of matches, sorted by relevance. Format:
[
  {
    "contact_id": "uuid",
    "match_reasons": ["Has React skills needed for frontend", "Previously worked on similar project"],
    "relevance_score": 85
  }
]

Only include contacts with relevance_score > 40. Return empty array if no good matches.`,
        },
        {
          role: "user",
          content: `Context:
${searchContext}

Available Contacts:
${JSON.stringify(contactSummaries, null, 2)}

Find the top ${max_results} most relevant contacts for this project/need.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const aiContent = aiResponse.choices[0]?.message?.content || "{}";
    let aiMatches: Array<{
      contact_id: string;
      match_reasons: string[];
      relevance_score: number;
    }> = [];

    try {
      const parsed = JSON.parse(aiContent);
      aiMatches = parsed.matches || parsed || [];
      if (!Array.isArray(aiMatches)) {
        aiMatches = [];
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      aiMatches = [];
    }

    // Enrich matches with contact details
    const enrichedMatches: ContactMatch[] = aiMatches
      .slice(0, max_results)
      .map((match) => {
        const contact = contacts.find((c) => c.id === match.contact_id);
        if (!contact) return null;

        return {
          contact_id: contact.id,
          full_name: contact.full_name,
          company: contact.company,
          avatar_url: contact.avatar_url,
          relationship_strength: contact.relationship_strength,
          match_reasons: match.match_reasons,
          relevance_score: match.relevance_score,
        };
      })
      .filter(Boolean) as ContactMatch[];

    // Update project with suggested contacts if project_id provided
    if (project_id && enrichedMatches.length > 0) {
      await supabase
        .from("projects")
        .update({
          suggested_contact_ids: enrichedMatches.map((m) => m.contact_id),
          ai_contacts_matched_at: new Date().toISOString(),
        })
        .eq("id", project_id);
    }

    return NextResponse.json({
      matches: enrichedMatches,
      context: searchContext,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Contact matching error:", error);
    return NextResponse.json(
      { error: "Failed to find matching contacts" },
      { status: 500 }
    );
  }
}
