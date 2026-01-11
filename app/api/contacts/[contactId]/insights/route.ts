import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

const anthropic = new Anthropic();

// GET - Get AI-powered insights about a contact
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch contact with all related data
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Fetch recent interactions
    let interactions: any[] = [];
    const { data: interactionsData } = await supabase
      .from("contact_interactions")
      .select("*")
      .eq("contact_id", contactId)
      .order("interaction_date", { ascending: false })
      .limit(10);
    interactions = interactionsData || [];

    // Fetch recent emails from this contact
    let emails: any[] = [];
    if (contact.email) {
      const { data: emailsData } = await supabase
        .from("emails")
        .select("subject, snippet, sent_at, ai_category, ai_sentiment")
        .eq("user_id", user.id)
        .ilike("from_email", contact.email)
        .order("sent_at", { ascending: false })
        .limit(5);
      emails = emailsData || [];
    }

    // Fetch notes
    let notes: any[] = [];
    const { data: notesData } = await supabase
      .from("contact_notes")
      .select("content, created_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(5);
    notes = notesData || [];

    // Build context for AI
    const contactContext = `
Contact: ${contact.full_name}
Company: ${contact.company || "Unknown"}
Job Title: ${contact.job_title || "Unknown"}
Contact Type: ${contact.contact_type}
Relationship Strength: ${contact.relationship_strength || "new"}
Last Interaction: ${contact.last_interaction_at || "Never"}
How We Met: ${contact.how_we_met || "Unknown"}
Tags: ${contact.tags?.join(", ") || "None"}
Skills: ${contact.skills?.join(", ") || "None"}
Can Help With: ${contact.can_help_with?.join(", ") || "Unknown"}
Looking For: ${contact.looking_for?.join(", ") || "Unknown"}

Recent Interactions (${interactions.length}):
${interactions.map(i => `- ${i.interaction_type}: ${i.summary} (${new Date(i.interaction_date).toLocaleDateString()})`).join("\n") || "None recorded"}

Recent Emails (${emails.length}):
${emails.map(e => `- ${e.subject} (${e.ai_sentiment || "neutral"}) - ${new Date(e.sent_at).toLocaleDateString()}`).join("\n") || "None"}

Notes (${notes.length}):
${notes.map(n => `- ${n.content.substring(0, 100)}...`).join("\n") || "None"}
    `.trim();

    const prompt = `Analyze this contact and provide strategic insights. Return a JSON object with the following structure:

${contactContext}

Return JSON with:
{
  "summary": "1-2 sentence summary of the relationship and its current state",
  "relationship_health": "strong" | "good" | "needs_attention" | "at_risk" | "new",
  "health_reasoning": "Brief explanation of the health assessment",
  "suggested_actions": ["Array of 2-4 specific action items to strengthen the relationship"],
  "talking_points": ["Array of 2-3 conversation topics based on their interests/work"],
  "connection_opportunities": ["Array of 1-2 ways they could help or be helped"],
  "next_best_action": "The single most important thing to do next",
  "follow_up_urgency": "high" | "medium" | "low",
  "sentiment_trend": "improving" | "stable" | "declining" | "unknown"
}

Respond with valid JSON only, no markdown.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let insights;
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback insights
      insights = {
        summary: `${contact.full_name} is a ${contact.contact_type} contact${contact.company ? ` at ${contact.company}` : ""}.`,
        relationship_health: contact.relationship_strength || "new",
        health_reasoning: "Based on available information",
        suggested_actions: ["Schedule a catch-up call", "Check their recent activity on LinkedIn"],
        talking_points: ["Ask about their current projects"],
        connection_opportunities: [],
        next_best_action: "Reach out to reconnect",
        follow_up_urgency: "medium",
        sentiment_trend: "unknown",
      };
    }

    // Cache insights in contact record
    await supabase
      .from("contacts")
      .update({
        ai_summary: insights.summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    return NextResponse.json({
      contact_id: contactId,
      contact_name: contact.full_name,
      insights,
      generated_at: new Date().toISOString(),
      data_sources: {
        interactions: interactions.length,
        emails: emails.length,
        notes: notes.length,
      },
    });
  } catch (error) {
    console.error("Error generating contact insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
