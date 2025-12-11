import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyTOTP,
  decryptSecret,
  encryptSecret,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/2fa/totp";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

// POST /api/auth/2fa/enable
// Verify TOTP code and enable 2FA for the user
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

    const body = await request.json();
    const { encryptedSecret, token } = body;

    if (!encryptedSecret || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("two_factor_enabled, user_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Decrypt the secret
    let secret: string;
    try {
      secret = decryptSecret(encryptedSecret);
    } catch {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(secret, token);

    // Log attempt
    await supabase.from("two_factor_attempts").insert({
      user_id: user.id,
      attempt_type: "setup",
      success: isValid,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // Encrypt secret for storage
    const encryptedSecretForStorage = encryptSecret(secret);

    // Enable 2FA
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        two_factor_enabled: true,
        two_factor_secret: encryptedSecretForStorage,
        two_factor_backup_codes: hashedBackupCodes,
        two_factor_enabled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      logger.error("Error enabling 2FA", { error: updateError, userId: user.id, path: "/api/auth/2fa/enable" });
      return NextResponse.json(
        { error: "Failed to enable 2FA" },
        { status: 500 }
      );
    }

    // Log successful 2FA enablement
    logger.security("2FA enabled for user", {
      userId: user.id,
      path: "/api/auth/2fa/enable",
    });

    // Return backup codes (IMPORTANT: User must save these!)
    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully",
      backupCodes, // Return unhashed codes for user to save
    });
  } catch (error) {
    logger.error("2FA enable error", { error, path: "/api/auth/2fa/enable" });
    return NextResponse.json(
      { error: "Failed to enable 2FA" },
      { status: 500 }
    );
  }
}
