import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTOTP, decryptSecret, verifyBackupCode } from "@/lib/2fa/totp";

// POST /api/auth/2fa/verify
// Verify a 2FA code (for login or sensitive operations)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, useBackupCode = false } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
      usedBackupCode,
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
