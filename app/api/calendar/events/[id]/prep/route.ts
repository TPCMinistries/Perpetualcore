import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AttendeeInput {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

interface MeetingPrepRequest {
  title: string;
  attendees: AttendeeInput[];
  description?: string;
  start: string;
}

/**
 * POST /api/calendar/events/[id]/prep
 * Generate AI-powered meeting prep with attendee context
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: MeetingPrepRequest = await req.json();
    const { title, attendees, description, start } = body;

    // 1. Look up attendees in contacts
    const attendeeEmails = attendees.map((a) => a.email.toLowerCase());

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, company, job_title, relationship_strength, tags, last_contacted_at")
      .eq("user_id", user.id)
      .in("email", attendeeEmails);

    // Map contacts by email for easy lookup
    const contactsByEmail = new Map(
      (contacts || []).map((c) => [c.email?.toLowerCase(), c])
    );

    // 2. Build attendee context
    const attendeeContext = attendees.map((a) => {
      const contact = contactsByEmail.get(a.email.toLowerCase());
      return {
        email: a.email,
        name: a.displayName || (contact ? `${contact.first_name} ${contact.last_name || ""}`.trim() : undefined),
        contactId: contact?.id,
        relationshipStrength: contact?.relationship_strength,
        lastInteraction: contact?.last_contacted_at
          ? formatRelativeDate(new Date(contact.last_contacted_at))
          : undefined,
        company: contact?.company,
        jobTitle: contact?.job_title,
        tags: contact?.tags,
      };
    });

    // 3. Fetch recent emails with attendees
    const { data: recentEmails } = await supabase
      .from("emails")
      .select("id, subject, received_at, from_address")
      .eq("user_id", user.id)
      .or(attendeeEmails.map((e) => `from_address.ilike.%${e}%`).join(","))
      .order("received_at", { ascending: false })
      .limit(5);

    // 4. Fetch notes related to contacts
    const contactIds = attendeeContext
      .filter((a) => a.contactId)
      .map((a) => a.contactId);

    let relatedNotes: any[] = [];
    if (contactIds.length > 0) {
      const { data: notes } = await supabase
        .from("contact_notes")
        .select("id, content, created_at")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: false })
        .limit(5);
      relatedNotes = notes || [];
    }

    // 5. Generate AI-powered prep
    let aiPrep = {
      context: "",
      talkingPoints: [] as string[],
      suggestedActions: [] as string[],
    };

    try {
      const anthropic = new Anthropic();

      // Build context for AI
      const attendeeDetails = attendeeContext
        .map((a) => {
          let detail = `- ${a.name || a.email}`;
          if (a.company) detail += ` (${a.company})`;
          if (a.jobTitle) detail += ` - ${a.jobTitle}`;
          if (a.relationshipStrength) detail += ` | Relationship: ${a.relationshipStrength}%`;
          if (a.lastInteraction) detail += ` | Last contact: ${a.lastInteraction}`;
          return detail;
        })
        .join("\n");

      const prompt = `You are a professional meeting prep assistant. Generate helpful prep for this upcoming meeting.

Meeting: ${title}
Date: ${new Date(start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
${description ? `Description: ${description}` : ""}

Attendees:
${attendeeDetails || "No attendee details available"}

${recentEmails && recentEmails.length > 0 ? `Recent email subjects with attendees:\n${recentEmails.map((e) => `- ${e.subject}`).join("\n")}` : ""}

Provide a JSON response with:
1. "context": A brief 1-2 sentence summary of what this meeting likely involves
2. "talkingPoints": An array of 3-4 specific, actionable talking points for this meeting
3. "suggestedActions": An array of 2-3 prep actions to take before the meeting

Keep responses concise and professional. Focus on being helpful, not generic.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          // Try to parse JSON from response
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiPrep = {
              context: parsed.context || "",
              talkingPoints: parsed.talkingPoints || [],
              suggestedActions: parsed.suggestedActions || [],
            };
          }
        } catch (parseError) {
          // If JSON parsing fails, use defaults
          aiPrep = {
            context: `Meeting with ${attendees.length} attendee${attendees.length > 1 ? "s" : ""} about "${title}".`,
            talkingPoints: [
              "Review agenda and objectives",
              "Prepare status updates",
              "Note any blockers or concerns",
            ],
            suggestedActions: [
              "Review previous meeting notes",
              "Prepare questions",
            ],
          };
        }
      }
    } catch (aiError) {
      console.error("AI prep generation error:", aiError);
      // Fallback to basic prep
      aiPrep = {
        context: `Upcoming meeting: "${title}" with ${attendees.length} attendee${attendees.length > 1 ? "s" : ""}.`,
        talkingPoints: [
          "Review meeting objectives",
          "Discuss progress and updates",
          "Identify next steps and action items",
        ],
        suggestedActions: [
          "Review relevant documents",
          "Prepare talking points",
        ],
      };
    }

    return NextResponse.json({
      attendees: attendeeContext,
      ...aiPrep,
      relatedEmails: (recentEmails || []).map((e) => ({
        id: e.id,
        subject: e.subject,
        date: e.received_at,
      })),
      relatedNotes: relatedNotes.map((n) => ({
        id: n.id,
        title: n.content?.substring(0, 50) + "...",
      })),
    });
  } catch (error) {
    console.error("Meeting prep error:", error);
    return NextResponse.json(
      { error: "Failed to generate meeting prep" },
      { status: 500 }
    );
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
