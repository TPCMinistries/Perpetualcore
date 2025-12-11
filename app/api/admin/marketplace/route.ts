import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch all marketplace items (admin only)
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

    // Fetch all marketplace items with creator info
    const { data: items, error } = await supabase
      .from("marketplace_items")
      .select(`
        *,
        profiles:creator_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching marketplace items:", error);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: items?.length || 0,
      pending_review: items?.filter((i) => i.status === "pending_review").length || 0,
      approved: items?.filter((i) => i.status === "approved").length || 0,
      rejected: items?.filter((i) => i.status === "rejected").length || 0,
      agents: items?.filter((i) => i.type === "agent").length || 0,
      workflows: items?.filter((i) => i.type === "workflow").length || 0,
    };

    return NextResponse.json({
      items: items || [],
      summary,
    });
  } catch (error: any) {
    console.error("Marketplace items fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update marketplace item status (admin only)
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
    const { item_id, status, rejection_reason } = body;

    if (!item_id || !status) {
      return NextResponse.json(
        { error: "item_id and status are required" },
        { status: 400 }
      );
    }

    if (!["pending_review", "approved", "rejected", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get item details for email
    const { data: item } = await supabase
      .from("marketplace_items")
      .select(`
        *,
        profiles:creator_id (
          full_name,
          email
        )
      `)
      .eq("id", item_id)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update item status
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
      updateData.published_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("marketplace_items")
      .update(updateData)
      .eq("id", item_id);

    if (updateError) {
      console.error("Error updating item:", updateError);
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    // Send email notification to creator
    const creatorEmail = item.profiles?.email;
    const creatorName = item.profiles?.full_name || "Creator";

    if (creatorEmail && status === "approved") {
      await sendEmail(
        creatorEmail,
        `Your ${item.type} "${item.name}" Has Been Approved!`,
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Marketplace Item Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Item Approved!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827;">Your ${item.type} is now live!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${creatorName},
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your ${item.type} <strong>"${item.name}"</strong> has been approved and is now live on the Perpetual Core Marketplace.
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="8" style="font-size: 15px; color: #4b5563;">
                  <tr>
                    <td style="font-weight: 600;">Item:</td>
                    <td>${item.name}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Type:</td>
                    <td style="text-transform: capitalize;">${item.type}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Price:</td>
                    <td>$${item.price.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${item.id}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Your Listing</a>
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
    } else if (creatorEmail && status === "rejected") {
      await sendEmail(
        creatorEmail,
        `Update on Your Marketplace Submission`,
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Marketplace Submission Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Submission Update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${creatorName},
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We've reviewed your ${item.type} <strong>"${item.name}"</strong> and unfortunately, we're unable to approve it at this time.
              </p>
              ${rejection_reason ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Reason:</strong> ${rejection_reason}
                </p>
              </div>
              ` : ""}
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You're welcome to make improvements and resubmit. If you have questions about the review process, please reply to this email.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/sell" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Edit & Resubmit</a>
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
    }

    return NextResponse.json({
      success: true,
      message: `Item ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"} successfully`,
    });
  } catch (error: any) {
    console.error("Marketplace item update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update item" },
      { status: 500 }
    );
  }
}
