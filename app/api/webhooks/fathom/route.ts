import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use service role for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fathom webhook secret for signature verification
const FATHOM_WEBHOOK_SECRET = process.env.FATHOM_WEBHOOK_SECRET;

/**
 * Verify Fathom webhook signature
 */
function verifyFathomSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!FATHOM_WEBHOOK_SECRET || !signature) {
    // If no secret configured, skip verification (development mode)
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", FATHOM_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Map Fathom meeting type to our meeting types
 */
function detectMeetingType(title: string, attendees: string[]): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("1:1") || titleLower.includes("one on one") || titleLower.includes("1-on-1")) {
    return "coaching";
  }
  if (titleLower.includes("investor") || titleLower.includes("pitch") || titleLower.includes("funding")) {
    return "investor";
  }
  if (titleLower.includes("board") || titleLower.includes("advisory")) {
    return "board";
  }
  if (titleLower.includes("team") || titleLower.includes("standup") || titleLower.includes("sync")) {
    return "team";
  }
  if (titleLower.includes("ministry") || titleLower.includes("church") || titleLower.includes("prayer")) {
    return "ministry";
  }
  if (titleLower.includes("partner") || titleLower.includes("partnership")) {
    return "partner";
  }

  return "other";
}

/**
 * Detect project tags from meeting content
 */
function detectProjectTags(title: string, transcript: string): string[] {
  const content = `${title} ${transcript}`.toLowerCase();
  const tags: string[] = [];

  const projectKeywords: Record<string, string[]> = {
    "kenya": ["kenya", "nairobi", "african", "africa"],
    "venture_studios": ["venture studio", "startup", "incubator", "accelerator"],
    "tpc": ["tpc", "the perpetual core", "perpetualcore"],
    "catalyst": ["catalyst", "fellowship"],
    "gdi": ["gdi", "global development"],
    "medical": ["medical", "healthcare", "health", "clinic", "hospital"],
  };

  for (const [tag, keywords] of Object.entries(projectKeywords)) {
    if (keywords.some(kw => content.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags;
}

/**
 * Extract email from attendee string (handles "Name <email>" format)
 */
function extractEmail(attendee: string): string | null {
  const emailMatch = attendee.match(/<([^>]+@[^>]+)>/);
  if (emailMatch) return emailMatch[1];

  const directEmail = attendee.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (directEmail) return directEmail[0];

  return null;
}

/**
 * Extract name from attendee string
 */
function extractName(attendee: string): string {
  // Remove email part if present
  return attendee.replace(/<[^>]+>/, "").trim() || attendee;
}

/**
 * POST /api/webhooks/fathom
 * Receive meeting data from Fathom
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let webhookLogId: string | null = null;

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-fathom-signature") ||
                      req.headers.get("x-webhook-signature");

    // Verify signature
    if (!verifyFathomSignature(rawBody, signature)) {
      console.error("Fathom webhook signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Log webhook receipt immediately
    const { data: logEntry, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        source: "fathom",
        event_type: payload.event || payload.type || "meeting.completed",
        payload: payload,
        processing_status: "processing",
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to log webhook:", logError);
    } else {
      webhookLogId = logEntry?.id;
    }

    // Extract meeting data from Fathom payload
    // Fathom's payload structure (adjust based on actual Fathom docs):
    const meetingData = payload.meeting || payload.data || payload;

    const title = meetingData.title ||
                  meetingData.meeting_title ||
                  meetingData.name ||
                  "Untitled Meeting";

    const meetingDate = meetingData.date ||
                        meetingData.meeting_date ||
                        meetingData.start_time ||
                        meetingData.started_at ||
                        new Date().toISOString();

    const transcript = meetingData.transcript ||
                       meetingData.transcription ||
                       meetingData.full_transcript ||
                       "";

    const attendeesRaw = meetingData.attendees ||
                         meetingData.participants ||
                         meetingData.guests ||
                         [];

    // Normalize attendees to string array
    const attendees: string[] = Array.isArray(attendeesRaw)
      ? attendeesRaw.map((a: any) => typeof a === "string" ? a : a.name || a.email || String(a))
      : [];

    // Extract Fathom's AI summary if provided
    const fathomSummary = meetingData.summary ||
                          meetingData.ai_summary ||
                          meetingData.highlights;

    const actionItems = meetingData.action_items ||
                        meetingData.tasks ||
                        meetingData.next_steps ||
                        [];

    // Detect meeting type and project tags
    const meetingType = meetingData.meeting_type || detectMeetingType(title, attendees);
    const projectTags = detectProjectTags(title, transcript);

    // Find user by email (first attendee is usually the organizer)
    // Or use a default user ID from env for initial setup
    let userId: string | null = null;

    // Try to find user from attendees
    for (const attendee of attendees) {
      const email = extractEmail(attendee);
      if (email) {
        const { data: user } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (user) {
          userId = user.id;
          break;
        }
      }
    }

    // Fallback: try organizer email
    if (!userId && meetingData.organizer_email) {
      const { data: user } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", meetingData.organizer_email)
        .single();

      if (user) {
        userId = user.id;
      }
    }

    // Fallback: use default user from env
    if (!userId && process.env.DEFAULT_WEBHOOK_USER_ID) {
      userId = process.env.DEFAULT_WEBHOOK_USER_ID;
    }

    if (!userId) {
      // Update webhook log with error
      if (webhookLogId) {
        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "failed",
            error_message: "Could not identify user from attendees",
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId);
      }

      return Response.json({
        success: false,
        error: "Could not identify user from meeting attendees",
        hint: "Set DEFAULT_WEBHOOK_USER_ID env var or ensure attendee email matches a user"
      }, { status: 400 });
    }

    // Build summary JSONB
    const summaryJson = fathomSummary ? {
      fathom_summary: typeof fathomSummary === "string" ? fathomSummary : fathomSummary,
      action_items: actionItems,
      source: "fathom",
      processed_at: new Date().toISOString(),
    } : null;

    // Detect opportunities mentioned
    const opportunitiesDetected = detectOpportunities(transcript, title);

    // Insert meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        meeting_title: title,
        meeting_date: meetingDate,
        meeting_type: meetingType,
        attendees: attendees,
        transcript: transcript,
        summary: summaryJson,
        executive_summary: typeof fathomSummary === "string" ? fathomSummary : fathomSummary?.summary || null,
        key_topics: fathomSummary?.topics || fathomSummary?.key_topics || [],
        decisions_made: fathomSummary?.decisions || [],
        next_steps: Array.isArray(actionItems)
          ? actionItems.map((a: any) => typeof a === "string" ? a : a.title || a.text || String(a))
          : [],
        project_tags: projectTags,
        sentiment: detectSentiment(transcript),
        follow_up_needed: actionItems.length > 0,
        suggested_follow_up_date: actionItems.length > 0
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : null,
        opportunities_detected: opportunitiesDetected,
        source: "fathom",
        webhook_payload: payload,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Failed to insert meeting:", meetingError);

      if (webhookLogId) {
        await supabase
          .from("webhook_logs")
          .update({
            processing_status: "failed",
            error_message: meetingError.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLogId);
      }

      return Response.json({
        success: false,
        error: "Failed to save meeting",
        details: meetingError.message
      }, { status: 500 });
    }

    // Insert meeting attendees
    const attendeeInserts = attendees.map((attendee: string) => ({
      meeting_id: meeting.id,
      attendee_name: extractName(attendee),
      attendee_email: extractEmail(attendee),
      role_in_meeting: attendee === attendees[0] ? "organizer" : "attendee",
    }));

    if (attendeeInserts.length > 0) {
      const { error: attendeeError } = await supabase
        .from("meeting_attendees")
        .insert(attendeeInserts);

      if (attendeeError) {
        console.error("Failed to insert attendees:", attendeeError);
      }
    }

    // Extract and insert action items
    if (actionItems.length > 0) {
      const actionItemInserts = actionItems.map((item: any, index: number) => ({
        user_id: userId,
        meeting_id: meeting.id,
        title: typeof item === "string" ? item : item.title || item.text || `Action item ${index + 1}`,
        description: typeof item === "object" ? item.description : null,
        assigned_to: typeof item === "object" ? item.assigned_to || item.assignee : null,
        due_date: typeof item === "object" && item.due_date ? item.due_date : null,
        priority: "medium",
        status: "pending",
      }));

      const { error: actionError } = await supabase
        .from("meeting_action_items")
        .insert(actionItemInserts);

      if (actionError) {
        console.error("Failed to insert action items:", actionError);
      }
    }

    // Queue AI processing if transcript is substantial and no summary
    if (transcript.length > 500 && !fathomSummary) {
      await supabase
        .from("ai_processing_queue")
        .insert({
          user_id: userId,
          job_type: "meeting_analysis",
          source_type: "meeting",
          source_id: meeting.id,
          priority: 3,
          status: "queued",
          input_data: {
            meeting_id: meeting.id,
            title: title,
            transcript_length: transcript.length,
          },
        });
    }

    // Update webhook log with success
    if (webhookLogId) {
      await supabase
        .from("webhook_logs")
        .update({
          user_id: userId,
          processing_status: "completed",
          processed_meeting_id: meeting.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLogId);
    }

    const processingTime = Date.now() - startTime;

    return Response.json({
      success: true,
      meeting_id: meeting.id,
      meeting_title: title,
      attendees_count: attendees.length,
      action_items_count: actionItems.length,
      processing_time_ms: processingTime,
      ai_processing_queued: transcript.length > 500 && !fathomSummary,
    });

  } catch (error: any) {
    console.error("Fathom webhook error:", error);

    // Update webhook log with error
    if (webhookLogId) {
      await supabase
        .from("webhook_logs")
        .update({
          processing_status: "failed",
          error_message: error.message,
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLogId);
    }

    return Response.json({
      success: false,
      error: "Webhook processing failed",
      message: error.message
    }, { status: 500 });
  }
}

/**
 * Simple sentiment detection from text
 */
function detectSentiment(text: string): string {
  if (!text) return "neutral";

  const textLower = text.toLowerCase();

  const positiveWords = ["excited", "great", "excellent", "amazing", "wonderful", "love", "fantastic", "happy", "thrilled", "pleased", "opportunity", "success"];
  const negativeWords = ["concerned", "worried", "difficult", "problem", "issue", "frustrated", "disappointed", "fail", "risk", "challenge", "unfortunately"];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    const matches = textLower.match(new RegExp(word, "gi"));
    positiveCount += matches ? matches.length : 0;
  }

  for (const word of negativeWords) {
    const matches = textLower.match(new RegExp(word, "gi"));
    negativeCount += matches ? matches.length : 0;
  }

  if (positiveCount > negativeCount * 2) return "positive";
  if (negativeCount > positiveCount * 2) return "challenging";
  return "neutral";
}

/**
 * Detect opportunities mentioned in meeting
 */
function detectOpportunities(transcript: string, title: string): object | null {
  if (!transcript && !title) return null;

  const content = `${title} ${transcript}`.toLowerCase();
  const opportunities: any = {};

  // Funding mentions
  if (content.match(/\$[\d,]+|funding|invest|raise|round|capital/)) {
    opportunities.funding_mentioned = true;
    const amountMatch = content.match(/\$([\d,]+)\s*(k|m|million|thousand)?/i);
    if (amountMatch) {
      opportunities.funding_amount_mentioned = amountMatch[0];
    }
  }

  // Partnership mentions
  if (content.match(/partner|partnership|collaborate|collaboration|joint venture/)) {
    opportunities.partnership_discussed = true;
  }

  // Deal/contract mentions
  if (content.match(/deal|contract|agreement|proposal|quote|pricing/)) {
    opportunities.deal_discussed = true;
  }

  // Hiring mentions
  if (content.match(/hire|hiring|recruit|position|role|candidate/)) {
    opportunities.hiring_discussed = true;
  }

  return Object.keys(opportunities).length > 0 ? opportunities : null;
}

/**
 * GET /api/webhooks/fathom
 * Health check endpoint
 */
export async function GET() {
  return Response.json({
    status: "ok",
    service: "fathom-webhook",
    timestamp: new Date().toISOString(),
    message: "Fathom webhook endpoint is active. POST meeting data here.",
  });
}
