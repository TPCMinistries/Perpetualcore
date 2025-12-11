import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTOTP, decryptSecret } from "@/lib/2fa/totp";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

// GET /api/auth/2fa
// Get 2FA status for the current user
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute (auth limiter)
    const rateLimitResult = await rateLimiters.auth.check(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get 2FA status using database function
    const { data: statusData } = await supabase.rpc("get_user_2fa_status", {
      p_user_id: user.id,
    });

    const status = statusData?.[0] || {
      enabled: false,
      enabled_at: null,
      backup_codes_count: 0,
      recent_attempts: 0,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Get 2FA status error:", error);
    return NextResponse.json(
      { error: "Failed to get 2FA status" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/2fa
// Disable 2FA for the current user
export async function DELETE(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute (strict for security endpoints)
    const rateLimitResult = await rateLimiters.strict.check(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body for verification code
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("two_factor_enabled, two_factor_secret, user_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is not enabled" },
        { status: 400 }
      );
    }

    // Verify the TOTP code before disabling
    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: "2FA secret not found" },
        { status: 500 }
      );
    }

    let isValid = false;
    try {
      const secret = decryptSecret(profile.two_factor_secret);
      isValid = verifyTOTP(secret, token);
    } catch (error) {
      console.error("Error verifying code:", error);
      return NextResponse.json(
        { error: "Failed to verify code" },
        { status: 500 }
      );
    }

    // Log attempt
    await supabase.from("two_factor_attempts").insert({
      user_id: user.id,
      attempt_type: "disable",
      success: isValid,
    });

    if (!isValid) {
      // Log failed disable attempt
      logger.security("2FA disable verification failed", {
        userId: user.id,
        path: "/api/auth/2fa",
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Error disabling 2FA", { error: updateError, userId: user.id, path: "/api/auth/2fa" });
      return NextResponse.json(
        { error: "Failed to disable 2FA" },
        { status: 500 }
      );
    }

    // Log successful 2FA disable
    logger.security("2FA disabled for user", {
      userId: user.id,
      path: "/api/auth/2fa",
    });

    return NextResponse.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    logger.error("2FA disable error", { error, path: "/api/auth/2fa" });
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}
