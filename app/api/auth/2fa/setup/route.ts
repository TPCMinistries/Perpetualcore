import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSecret, generateTOTPUri, encryptSecret } from "@/lib/2fa/totp";

// GET /api/auth/2fa/setup
// Generate a new 2FA secret and QR code URI for setup
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("two_factor_enabled, full_name, user_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Don't allow setup if already enabled
    if (profile.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled. Disable it first to re-setup." },
        { status: 400 }
      );
    }

    // Generate new secret
    const secret = generateSecret();

    // Create QR code URI
    const accountName = profile.full_name || user.email || "User";
    const uri = generateTOTPUri(secret, accountName);

    // Temporarily store encrypted secret in session/temp storage
    // In production, you might want to use a temporary session store
    // For now, we'll return it to be stored client-side temporarily
    const encryptedSecret = encryptSecret(secret);

    return NextResponse.json({
      secret, // Plain secret for user to see/enter manually
      uri, // URI for QR code generation
      encryptedSecret, // To send back during verification
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA setup" },
      { status: 500 }
    );
  }
}
