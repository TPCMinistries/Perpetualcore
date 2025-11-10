import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEnterpriseDemoNotification } from "@/lib/email/send-lead-notifications";
import { sendEnterpriseDemoConfirmation } from "@/lib/email/send-lead-confirmations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      full_name,
      company_name,
      job_title,
      phone,
      company_size,
      industry,
      use_case,
      estimated_users,
      required_features,
      compliance_requirements,
      notes,
    } = body;

    // Validation
    if (!email || !full_name || !company_name) {
      return NextResponse.json(
        { error: "Email, name, and company name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Extract UTM parameters and referrer from headers/cookies
    const referer = req.headers.get("referer") || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Get UTM params from URL if available
    const url = new URL(req.url);
    const utmSource = url.searchParams.get("utm_source") || null;
    const utmMedium = url.searchParams.get("utm_medium") || null;
    const utmCampaign = url.searchParams.get("utm_campaign") || null;

    // Save enterprise demo request
    const { data: demo, error: demoError } = await supabase
      .from("enterprise_demo_requests")
      .insert({
        email,
        full_name,
        company_name,
        job_title: job_title || null,
        phone: phone || null,
        company_size: company_size || null,
        industry: industry || null,
        use_case: use_case || null,
        estimated_users: estimated_users || null,
        required_features: required_features || [],
        compliance_requirements: compliance_requirements || [],
        notes: notes || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer: referer,
        status: "pending",
      })
      .select()
      .single();

    if (demoError) {
      console.error("Error creating enterprise demo request:", demoError);
      return NextResponse.json(
        { error: "Failed to request demo" },
        { status: 500 }
      );
    }

    // Track conversion event
    await supabase.rpc("track_conversion_event", {
      p_event_type: "enterprise_demo_request",
      p_metadata: {
        company_size,
        industry,
        estimated_users,
      },
      p_utm_source: utmSource,
      p_utm_medium: utmMedium,
      p_utm_campaign: utmCampaign,
      p_referrer: referer,
      p_page_url: referer,
      p_user_agent: userAgent,
    });

    // Enroll lead in email sequence
    try {
      await supabase.rpc("enroll_lead_in_sequence", {
        p_lead_type: "enterprise_demo",
        p_lead_id: demo.id,
        p_sequence_name: "enterprise_demo_follow_up"
      });
      console.log(`[EnterpriseDemoRequest] Enrolled lead ${demo.id} in sequence`);
    } catch (seqError) {
      console.error(`[EnterpriseDemoRequest] Failed to enroll in sequence:`, seqError);
      // Don't fail the demo request if sequence enrollment fails
    }

    // Send email notifications (non-blocking - don't fail if emails fail)
    try {
      // Send admin notification
      await sendEnterpriseDemoNotification({
        id: demo.id,
        email,
        full_name,
        company_name,
        job_title: job_title || undefined,
        phone: phone || undefined,
        company_size: company_size || undefined,
        industry: industry || undefined,
        use_case: use_case || undefined,
        estimated_users: estimated_users || undefined,
        notes: notes || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
      });

      // Send confirmation to prospect
      await sendEnterpriseDemoConfirmation({
        email,
        full_name,
        company_name,
      });
    } catch (emailError) {
      // Log email errors but don't fail the request
      console.error("[EnterpriseDemoRequest] Email error:", emailError);
    }

    return NextResponse.json({
      success: true,
      demo_id: demo.id,
      message: "Demo request received! Our enterprise team will contact you within 24 hours.",
    });
  } catch (error: any) {
    console.error("Error in POST /api/enterprise/demo:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
