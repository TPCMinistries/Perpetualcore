import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendConsultationBookingNotification } from "@/lib/email/send-lead-notifications";
import { sendConsultationConfirmation } from "@/lib/email/send-lead-confirmations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      full_name,
      company_name,
      phone,
      company_size,
      budget_range,
      notes,
    } = body;

    // Validation
    if (!email || !full_name) {
      return NextResponse.json(
        { error: "Email and name are required" },
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

    // Save consultation booking
    const { data: booking, error: bookingError } = await supabase
      .from("consultation_bookings")
      .insert({
        email,
        full_name,
        company_name: company_name || null,
        phone: phone || null,
        company_size: company_size || null,
        budget_range: budget_range || null,
        notes: notes || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer: referer,
        status: "pending",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating consultation booking:", bookingError);
      return NextResponse.json(
        { error: "Failed to book consultation" },
        { status: 500 }
      );
    }

    // Track conversion event
    await supabase.rpc("track_conversion_event", {
      p_event_type: "consultation_booking",
      p_metadata: {
        company_size,
        budget_range,
      },
      p_utm_source: utmSource,
      p_utm_medium: utmMedium,
      p_utm_campaign: utmCampaign,
      p_referrer: referer,
      p_page_url: referer,
      p_user_agent: userAgent,
    });

    // Send email notifications (non-blocking - don't fail if emails fail)
    try {
      // Send admin notification
      await sendConsultationBookingNotification({
        id: booking.id,
        email,
        full_name,
        company_name: company_name || undefined,
        phone: phone || undefined,
        company_size: company_size || undefined,
        budget_range: budget_range || undefined,
        notes: notes || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
      });

      // Send confirmation to prospect
      await sendConsultationConfirmation({
        email,
        full_name,
        company_name: company_name || undefined,
      });
    } catch (emailError) {
      // Log email errors but don't fail the request
      console.error("[ConsultationBooking] Email error:", emailError);
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      message: "Consultation booked successfully! We'll be in touch within 2 hours.",
    });
  } catch (error: any) {
    console.error("Error in POST /api/consultation/book:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
