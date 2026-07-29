import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/email/config";
import { NurtureDay1 } from "@/lib/email/templates/sequences/NurtureDay1";
import { segmentLead } from "@/lib/leads/segmentation";
import type { QuizData } from "@/lib/leads/segmentation";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().max(80),
  answer: z.string().max(120),
  points: z.number().finite().min(0).max(100),
}).strict();

const leadCaptureSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  company: z.string().trim().max(200).optional(),
  source: z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/i).optional(),
  leadMagnet: z.string().trim().min(1).max(100).regex(/^[a-z0-9_-]+$/i).optional(),
  marketingConsent: z.literal(true),
  metadata: z.object({
    variant: z.enum(["inline", "footer"]).optional(),
    magnet: z.string().max(100).optional(),
    path: z.string().max(180).optional(),
    prompt: z.string().max(100).optional(),
    quizScore: z.number().finite().min(0).max(100).optional(),
    answers: z.array(answerSchema).max(30).optional(),
  }).strict().optional(),
}).strict();

const leadCaptureRateLimits = new Map<string, { count: number; resetAt: number }>();
const LEAD_CAPTURE_WINDOW_MS = 60 * 60 * 1000;
const LEAD_CAPTURE_MAX_REQUESTS = 8;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = leadCaptureRateLimits.get(ip);
  if (!current || now >= current.resetAt) {
    leadCaptureRateLimits.set(ip, {
      count: 1,
      resetAt: now + LEAD_CAPTURE_WINDOW_MS,
    });
    return false;
  }
  if (current.count >= LEAD_CAPTURE_MAX_REQUESTS) return true;
  current.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const parsed = leadCaptureSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide valid details and explicit email consent." },
        { status: 400 }
      );
    }
    const {
      firstName,
      lastName,
      email,
      company,
      source,
      leadMagnet,
      metadata,
    } = parsed.data;

    const supabase = createAdminClient();

    // Determine lead segment from quiz data if available
    let segment = "product"; // Default segment
    let segmentData = null;

    if (metadata?.answers && Array.isArray(metadata.answers)) {
      const quizData: QuizData = {
        quizScore: metadata.quizScore,
        answers: metadata.answers,
      };
      segmentData = segmentLead(quizData, company);
      segment = segmentData.segment;
    }

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    let leadId;

    if (existingLead) {
      // Update existing lead
      const { data: updatedLead, error: updateError } = await supabase
        .from("leads")
        .update({
          first_name: firstName,
          last_name: lastName,
          company,
          source: source || "lead-magnet",
          lead_magnet: leadMagnet || "ai-productivity-guide",
          segment,
          metadata: metadata || {},
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (updateError) throw updateError;
      leadId = updatedLead.id;
    } else {
      // Create new lead (this will automatically trigger the sequence via database trigger)
      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          company,
          source: source || "lead-magnet",
          lead_magnet: leadMagnet || "ai-productivity-guide",
          segment,
          metadata: metadata || {},
          status: "active",
        })
        .select()
        .single();

      if (createError) throw createError;
      leadId = newLead.id;
    }

    // Send immediate welcome email with lead magnet
    const leadMagnetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guide/ai-implementation-buyers-guide`;

    let emailDelivery = "sent";
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Welcome - your AI Operating System Map",
        react: NurtureDay1({
          firstName,
          leadMagnetName: "AI Operating System Map",
          leadMagnetUrl,
        }),
      });
    } catch {
      emailDelivery = "unavailable";
    }

    return NextResponse.json({
      success: true,
      message: "Lead captured successfully",
      leadId,
      segment,
      segmentData,
      persisted: true,
      emailDelivery,
    });
  } catch (error: unknown) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
