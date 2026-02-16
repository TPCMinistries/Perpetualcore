import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCredential, deleteCredential, getCredentialSource } from "@/lib/skills/credentials";

const GITHUB_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/skills/github/oauth`;

/**
 * GET — Check connection status OR handle OAuth callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  // OAuth callback — exchange code for token
  if (code) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        return NextResponse.redirect(
          new URL("/dashboard/settings/skills/github?error=auth_failed", request.url)
        );
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return NextResponse.redirect(
          new URL(`/dashboard/settings/skills/github?error=${tokenData.error}`, request.url)
        );
      }

      // Get user info for the label
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "PerpetualCore/2.0",
        },
      });
      const userData = userResponse.ok ? await userResponse.json() : null;

      await saveCredential("github", tokenData.access_token, {
        userId: user.id,
        label: userData?.login || "GitHub",
        scopes: tokenData.scope?.split(",") || [],
      });

      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/github?connected=true", request.url)
      );
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/github?error=callback_failed", request.url)
      );
    }
  }

  // Status check
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const credSource = await getCredentialSource("github", user.id);
    return NextResponse.json({
      connected: credSource.hasCredential,
      source: credSource.source,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

/**
 * POST — Initiate OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!GITHUB_CLIENT_ID) {
      return NextResponse.json(
        { error: "GitHub OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID." },
        { status: 500 }
      );
    }

    const scopes = "repo,read:org,workflow,read:user";
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI!)}&scope=${scopes}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 });
  }
}

/**
 * DELETE — Disconnect integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteCredential("github", user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
