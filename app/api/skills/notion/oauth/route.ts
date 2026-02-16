import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCredential, deleteCredential, getCredentialSource } from "@/lib/skills/credentials";

const NOTION_CLIENT_ID = process.env.NOTION_OAUTH_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/skills/notion/oauth`;

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

      const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        return NextResponse.redirect(
          new URL("/dashboard/settings/skills/notion?error=auth_failed", request.url)
        );
      }

      const tokenData = await tokenResponse.json();

      await saveCredential("notion", tokenData.access_token, {
        userId: user.id,
        label: tokenData.workspace_name || "Notion",
        scopes: ["read", "write"],
      });

      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/notion?connected=true", request.url)
      );
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/notion?error=callback_failed", request.url)
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

    const credSource = await getCredentialSource("notion", user.id);
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

    if (!NOTION_CLIENT_ID) {
      return NextResponse.json(
        { error: "Notion OAuth not configured. Set NOTION_OAUTH_CLIENT_ID." },
        { status: 500 }
      );
    }

    const url = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI!)}`;

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

    const result = await deleteCredential("notion", user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
