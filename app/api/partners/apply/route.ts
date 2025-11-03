import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPartnerApplicationEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Submit partner application
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (optional - can apply without being signed in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      partner_name,
      partner_email,
      partner_type,
      company_name,
      website,
      audience_size,
      audience_description,
      referral_strategy,
      expected_monthly_referrals,
      why_partner,
      agree_terms,
    } = body;

    // Validate required fields
    if (!partner_name || !partner_email || !audience_description || !referral_strategy || !why_partner) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!agree_terms) {
      return NextResponse.json(
        { error: "You must agree to the terms and conditions" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partner_email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if email already has a partner application
    const { data: existingPartner } = await supabase
      .from("partners")
      .select("id, status")
      .eq("contact_email", partner_email)
      .single();

    if (existingPartner) {
      if (existingPartner.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending application. We'll review it within 24 hours." },
          { status: 400 }
        );
      } else if (existingPartner.status === "approved") {
        return NextResponse.json(
          { error: "You're already an approved partner! Please log in to access your dashboard." },
          { status: 400 }
        );
      }
    }

    // Generate unique referral code
    const referralCode = generateReferralCode(partner_name);

    // Ensure referral code is unique
    let uniqueCode = referralCode;
    let attempt = 0;
    while (attempt < 10) {
      const { data: existing } = await supabase
        .from("partners")
        .select("id")
        .eq("referral_code", uniqueCode)
        .single();

      if (!existing) break;

      // Add random suffix if code exists
      uniqueCode = `${referralCode}${Math.floor(Math.random() * 1000)}`;
      attempt++;
    }

    // Create partner application
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        user_id: user?.id || null, // Optional - can apply before signing up
        contact_name: partner_name,
        contact_email: partner_email,
        partner_type,
        company_name: company_name || null,
        website: website || null,
        audience_size: audience_size || null,
        audience_description,
        referral_strategy,
        expected_monthly_referrals: expected_monthly_referrals || null,
        why_partner,
        referral_code: uniqueCode,
        status: "pending", // Requires admin approval
        tier: "affiliate", // Start at affiliate tier
        commission_rate: 20.00, // 20% for affiliate
        commission_duration_months: 12, // 12 months for affiliate
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (partnerError) {
      console.error("Error creating partner application:", partnerError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Send confirmation email to applicant
    await sendPartnerApplicationEmail({
      partner_name,
      partner_email,
      referral_code: uniqueCode,
      application_id: partner.id,
    });

    // TODO: Send notification email to admin
    console.log("New partner application:", {
      id: partner.id,
      name: partner_name,
      email: partner_email,
      referral_code: uniqueCode,
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! We'll review it within 24 hours.",
      partner_id: partner.id,
      referral_code: uniqueCode,
    });
  } catch (error: any) {
    console.error("Partner application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

/**
 * Generate a referral code from partner name
 */
function generateReferralCode(name: string): string {
  // Remove special characters and spaces, convert to uppercase
  const cleanName = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .substring(0, 8);

  // Add 4 random alphanumeric characters
  const randomSuffix = crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase();

  return `${cleanName}${randomSuffix}`;
}
