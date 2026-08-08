import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import OpenAI from "openai";
import {
  OutreachMessageType,
  OutreachTone,
  GeneratedMessage,
  OUTREACH_MESSAGE_TYPE_CONFIG,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - Generate AI outreach message for a contact
 * Body: { message_type: OutreachMessageType, context?: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select(`
        id,
        full_name,
        nickname,
        company,
        job_title,
        relationship_strength,
        how_we_met,
        interests,
        skills,
        can_help_with,
        looking_for,
        last_interaction_at
      `)
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get recent interactions for context
    const { data: interactions } = await supabase
      .from("contact_interactions")
      .select("summary, key_points, interaction_type, interaction_date")
      .eq("contact_id", contactId)
      .order("interaction_date", { ascending: false })
      .limit(3);

    // Get shared projects
    const { data: contactProjects } = await supabase
      .from("contact_projects")
      .select(`
        project:projects (
          id,
          name,
          emoji
        )
      `)
      .eq("contact_id", contactId);

    const sharedProjects = contactProjects?.map((cp) => cp.project?.name).filter(Boolean) || [];

    // Parse request body
    const body = await req.json();
    const {
      message_type = "check_in",
      context: additionalContext,
    } = body as {
      message_type?: OutreachMessageType;
      context?: string;
    };

    // Calculate days since last contact
    const lastInteraction = contact.last_interaction_at
      ? new Date(contact.last_interaction_at)
      : null;
    const daysSinceContact = lastInteraction
      ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Build context for AI
    const contactName = contact.nickname || contact.full_name.split(" ")[0];
    const relationshipConfig = RELATIONSHIP_STRENGTH_CONFIG[contact.relationship_strength as keyof typeof RELATIONSHIP_STRENGTH_CONFIG];
    const messageTypeConfig = OUTREACH_MESSAGE_TYPE_CONFIG[message_type];

    const interactionsSummary = interactions?.length
      ? interactions.map((i) => `- ${i.summary}`).join("\n")
      : "No previous interactions recorded.";

    const prompt = buildPrompt({
      contactName,
      fullName: contact.full_name,
      company: contact.company,
      jobTitle: contact.job_title,
      relationshipStrength: relationshipConfig?.label || contact.relationship_strength,
      howWeMet: contact.how_we_met,
      interests: contact.interests,
      skills: contact.skills,
      canHelpWith: contact.can_help_with,
      lookingFor: contact.looking_for,
      daysSinceContact,
      recentInteractions: interactionsSummary,
      sharedProjects,
      messageType: message_type,
      messageTypeDescription: messageTypeConfig?.description,
      additionalContext,
    });

    // Generate 3 variations with different tones
    const variations: GeneratedMessage[] = [];
    const tones: OutreachTone[] = ["casual", "professional", "formal"];

    for (const tone of tones) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getSystemPrompt(tone),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "";
      const parsed = parseMessageResponse(content);

      variations.push({
        subject: parsed.subject,
        body: parsed.body,
        tone,
      });
    }

    // Return the generated messages
    return NextResponse.json({
      variations,
      context: {
        contact_name: contact.full_name,
        relationship_strength: contact.relationship_strength,
        last_interaction: contact.last_interaction_at,
        days_since_contact: daysSinceContact,
        shared_projects: sharedProjects,
      },
    });
  } catch (error) {
    console.error("Generate message error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}

interface PromptContext {
  contactName: string;
  fullName: string;
  company?: string;
  jobTitle?: string;
  relationshipStrength: string;
  howWeMet?: string;
  interests?: string[];
  skills?: string[];
  canHelpWith?: string[];
  lookingFor?: string[];
  daysSinceContact: number | null;
  recentInteractions: string;
  sharedProjects: string[];
  messageType: OutreachMessageType;
  messageTypeDescription?: string;
  additionalContext?: string;
}

function buildPrompt(ctx: PromptContext): string {
  let prompt = `Generate an outreach message for ${ctx.fullName}`;

  if (ctx.company) {
    prompt += ` who works at ${ctx.company}`;
    if (ctx.jobTitle) prompt += ` as ${ctx.jobTitle}`;
  }

  prompt += `.\n\n`;

  prompt += `**Relationship Level:** ${ctx.relationshipStrength}\n`;

  if (ctx.howWeMet) {
    prompt += `**How We Met:** ${ctx.howWeMet}\n`;
  }

  if (ctx.daysSinceContact !== null) {
    prompt += `**Days Since Last Contact:** ${ctx.daysSinceContact} days\n`;
  } else {
    prompt += `**Days Since Last Contact:** No recorded interactions\n`;
  }

  if (ctx.interests?.length) {
    prompt += `**Their Interests:** ${ctx.interests.join(", ")}\n`;
  }

  if (ctx.skills?.length) {
    prompt += `**Their Skills:** ${ctx.skills.join(", ")}\n`;
  }

  if (ctx.lookingFor?.length) {
    prompt += `**What They're Looking For:** ${ctx.lookingFor.join(", ")}\n`;
  }

  if (ctx.sharedProjects.length) {
    prompt += `**Shared Projects:** ${ctx.sharedProjects.join(", ")}\n`;
  }

  prompt += `\n**Recent Interactions:**\n${ctx.recentInteractions}\n`;

  prompt += `\n**Message Type:** ${ctx.messageType}`;
  if (ctx.messageTypeDescription) {
    prompt += ` - ${ctx.messageTypeDescription}`;
  }
  prompt += `\n`;

  if (ctx.additionalContext) {
    prompt += `\n**Additional Context:** ${ctx.additionalContext}\n`;
  }

  prompt += `\nGenerate a personalized message using their first name (${ctx.contactName}).`;

  return prompt;
}

function getSystemPrompt(tone: OutreachTone): string {
  const toneDescriptions: Record<OutreachTone, string> = {
    casual: "friendly, relaxed, and conversational. Use contractions and a warm tone.",
    professional: "business-appropriate but personable. Balance professionalism with warmth.",
    formal: "polished and structured. Suitable for more formal business relationships.",
  };

  return `You are helping compose a ${tone} outreach message. The tone should be ${toneDescriptions[tone]}

Generate a message with:
1. A subject line (for email) - concise and relevant
2. A message body (2-3 short paragraphs)

Format your response exactly like this:
SUBJECT: [subject line here]
BODY:
[message body here]

Important guidelines:
- Be genuine and personal, not generic
- Reference specific details about the person when available
- Keep it concise - busy people appreciate brevity
- Don't be overly effusive or use too many exclamation marks
- Sound like a real person, not a template
- If it's been a while since contact, acknowledge it naturally
- End with a clear but low-pressure next step`;
}

function parseMessageResponse(content: string): { subject: string; body: string } {
  const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/is);
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);

  return {
    subject: subjectMatch?.[1]?.trim() || "Catching up",
    body: bodyMatch?.[1]?.trim() || content.trim(),
  };
}
