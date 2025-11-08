import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBetaInviteEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/admin";

// Simple helper to generate a random code
function generateCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like I, O, 0, 1
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authorization
    const { user } = await requireAdmin();

    const { count = 1, maxUses = 1, betaTier = "standard", expiresInDays, email } =
      await request.json();

    const supabase = await createClient();

    const codes = [];
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    for (let i = 0; i < count; i++) {
      const code = generateCode();
      codes.push({
        code,
        max_uses: maxUses,
        beta_tier: betaTier,
        expires_at: expiresAt,
        created_by: user.id,
        invited_email: email || null,
      });
    }

    const { data, error } = await supabase
      .from("beta_invite_codes")
      .insert(codes)
      .select();

    if (error) {
      console.error("Error creating invite codes:", error);
      return NextResponse.json(
        { error: "Failed to create invite codes" },
        { status: 500 }
      );
    }

    // Send email if this is an individual code generation (count = 1 and email provided)
    if (email && count === 1 && data && data.length > 0) {
      const generatedCode = data[0].code;

      // Send email asynchronously (don't wait for it to complete)
      sendBetaInviteEmail(email, generatedCode, betaTier)
        .then((result) => {
          if (result.success) {
            console.log(`Beta invite email sent to ${email} with code ${generatedCode}`);
          } else {
            console.error(`Failed to send beta invite email to ${email}:`, result.error);
          }
        })
        .catch((err) => {
          console.error(`Error sending beta invite email to ${email}:`, err);
        });
    }

    return NextResponse.json({
      success: true,
      codes: data,
    });
  } catch (error: any) {
    console.error("Error generating invite codes:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message.includes("Forbidden") ? 403 : 500;
    const message = status === 500 ? "Failed to generate invite codes" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}

// GET all codes (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // Require admin authorization
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invite codes:", error);
      return NextResponse.json(
        { error: "Failed to fetch invite codes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ codes: data });
  } catch (error: any) {
    console.error("Error fetching invite codes:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message.includes("Forbidden") ? 403 : 500;
    const message = status === 500 ? "Failed to fetch invite codes" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
