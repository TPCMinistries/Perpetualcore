import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTOTP, decryptSecret, verifyBackupCode } from "@/lib/2fa/totp";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/validations/schemas";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

// Schema for 2FA verification - must be either TOTP (6 digits) or backup code
const verifySchema = z.object({
  token: z.string().min(1, "Token is required"),
  useBackupCode: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // If using backup code, allow alphanumeric format
    if (data.useBackupCode) {
      return /^[A-Za-z0-9]{6,12}$/.test(data.token);
    }
    // Otherwise, must be exactly 6 digits (TOTP)
    return /^\d{6}$/.test(data.token);
  },
  (data) => ({
    message: data.useBackupCode
      ? "Backup code must be 6-12 alphanumeric characters"
      : "Token must be exactly 6 digits",
  })
);

// POST /api/auth/2fa/verify
// Verify a 2FA code (for login or sensitive operations)
export async function POST(request: NextRequest) {
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

    // Validate and parse request body
    let body;
    try {
      const rawBody = await request.json();
      body = verifySchema.parse(rawBody);
    } catch (error) {
      return validationErrorResponse(error);
    }

    const { token, useBackupCode } = body;

    // Get user profile with 2FA data
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("two_factor_enabled, two_factor_secret, two_factor_backup_codes, user_id")
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

    // Check rate limiting
    const { data: rateLimitData } = await supabase.rpc("check_2fa_rate_limit", {
      p_user_id: user.id,
      p_attempt_type: "login",
    });

    if (!rateLimitData) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later." },
        { status: 429 }
      );
    }

    let isValid = false;
    let usedBackupCode = false;

    if (useBackupCode) {
      // Verify backup code
      const backupCodes = profile.two_factor_backup_codes || [];

      for (const hashedCode of backupCodes) {
        if (verifyBackupCode(token, hashedCode)) {
          isValid = true;
          usedBackupCode = true;

          // Remove used backup code
          const remainingCodes = backupCodes.filter((code) => code !== hashedCode);
          await supabase
            .from("user_profiles")
            .update({ two_factor_backup_codes: remainingCodes })
            .eq("user_id", user.id);

          // Log recovery event
          await supabase.from("two_factor_recovery").insert({
            user_id: user.id,
            recovery_method: "backup_code",
            recovery_code_hash: hashedCode,
            success: true,
          });

          break;
        }
      }
    } else {
      // Verify TOTP
      if (!profile.two_factor_secret) {
        return NextResponse.json(
          { error: "2FA secret not found" },
          { status: 500 }
        );
      }

      try {
        const secret = decryptSecret(profile.two_factor_secret);
        isValid = verifyTOTP(secret, token);
      } catch (error) {
        console.error("Error decrypting secret:", error);
        return NextResponse.json(
          { error: "Failed to verify code" },
          { status: 500 }
        );
      }
    }

    // Log attempt
    await supabase.from("two_factor_attempts").insert({
      user_id: user.id,
      attempt_type: "login",
      success: isValid,
    });

    if (!isValid) {
      // Log failed verification attempt
      logger.security("2FA verification failed", {
        userId: user.id,
        method: useBackupCode ? "backup_code" : "totp",
        path: "/api/auth/2fa/verify",
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Log successful verification
    logger.security("2FA verification successful", {
      userId: user.id,
      method: usedBackupCode ? "backup_code" : "totp",
      path: "/api/auth/2fa/verify",
    });

    return NextResponse.json({
      success: true,
      message: "Verification successful",
      usedBackupCode,
    });
  } catch (error) {
    logger.error("2FA verify error", { error, path: "/api/auth/2fa/verify" });
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
