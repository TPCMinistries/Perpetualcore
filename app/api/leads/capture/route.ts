import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/email/config";
import { NurtureDay1 } from "@/lib/email/templates/sequences/NurtureDay1";
import { segmentLead } from "@/lib/leads/segmentation";
import type { QuizData } from "@/lib/leads/segmentation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, source, leadMagnet, metadata } = body;

    // Validate required fields
    if (!email || !firstName) {
      return NextResponse.json(
        { error: "Email and first name are required" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = await createClient();

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
      .single();

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
    const leadMagnetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/downloads/ai-productivity-guide.pdf`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Welcome! Here's your AI Productivity Guide 📥`,
      react: NurtureDay1({
        firstName,
        leadMagnetName: "AI Productivity Guide",
        leadMagnetUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Lead captured successfully",
      leadId,
      segment,
      segmentData,
    });
  } catch (error: any) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
