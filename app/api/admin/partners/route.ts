import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch all partner applications (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch all partners
    const { data: partners, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching partners:", error);
      return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: partners?.length || 0,
      pending: partners?.filter((p) => p.status === "pending").length || 0,
      approved: partners?.filter((p) => p.status === "approved").length || 0,
      rejected: partners?.filter((p) => p.status === "rejected").length || 0,
    };

    return NextResponse.json({
      partners: partners || [],
      summary,
    });
  } catch (error: any) {
    console.error("Partners fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update partner status (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { partner_id, status, rejection_reason } = body;

    if (!partner_id || !status) {
      return NextResponse.json(
        { error: "partner_id and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    // Get partner details for email
    const { data: partner } = await supabase
      .from("partners")
      .select("*")
      .eq("id", partner_id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Update partner status
    const updateData: Record<string, any> = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    if (status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("partners")
      .update(updateData)
      .eq("id", partner_id);

    if (updateError) {
      console.error("Error updating partner:", updateError);
      return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
    }

    // Send email notification
    if (status === "approved") {
      await sendEmail(
        partner.contact_email,
        "Your Partner Application Has Been Approved!",
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Partner Application Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Congratulations!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827;">Welcome to the Partner Program!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${partner.contact_name},
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your application to the Perpetual Core Partner Program has been approved.
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Your Referral Code</p>
                <p style="margin: 0; color: #111827; font-size: 28px; font-weight: 700; letter-spacing: 2px;">${partner.referral_code}</p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You can now access your partner dashboard to track referrals, commissions, and payouts.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/partners" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Partner Dashboard</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      );
    } else if (status === "rejected") {
      await sendEmail(
        partner.contact_email,
        "Update on Your Partner Application",
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Partner Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Partner Application Update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${partner.contact_name},
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in the Perpetual Core Partner Program. After reviewing your application, we've decided not to move forward at this time.
              </p>
              ${rejection_reason ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Reason:</strong> ${rejection_reason}
                </p>
              </div>
              ` : ""}
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                This doesn't mean the door is closed! You're welcome to reapply in the future. If you have questions, feel free to reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      );
    }

    return NextResponse.json({
      success: true,
      message: `Partner ${status} successfully`,
    });
  } catch (error: any) {
    console.error("Partner update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update partner" },
      { status: 500 }
    );
  }
}
