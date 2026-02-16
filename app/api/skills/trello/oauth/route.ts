import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveCredential, deleteCredential, getCredentialSource } from "@/lib/skills/credentials";

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/skills/trello/oauth`;

/**
 * GET — Check connection status OR handle OAuth callback
 * Trello uses OAuth 1.0a style — user authorizes and gets a token
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  // OAuth callback — save the token
  if (token) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Verify token by fetching user info
      const verifyResponse = await fetch(
        `https://api.trello.com/1/members/me?key=${TRELLO_API_KEY}&token=${token}&fields=username,fullName`
      );

      if (!verifyResponse.ok) {
        return NextResponse.redirect(
          new URL("/dashboard/settings/skills/trello?error=invalid_token", request.url)
        );
      }

      const userData = await verifyResponse.json();

      // Save the token credential
      await saveCredential("trello", token, {
        userId: user.id,
        label: userData.fullName || userData.username || "Trello",
      });

      // Also save the API key if not already in system env
      if (TRELLO_API_KEY) {
        await saveCredential("trello_api_key", TRELLO_API_KEY, {
          userId: user.id,
          label: "Trello API Key",
        });
      }

      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/trello?connected=true", request.url)
      );
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings/skills/trello?error=callback_failed", request.url)
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

    const credSource = await getCredentialSource("trello", user.id);
    return NextResponse.json({
      connected: credSource.hasCredential,
      source: credSource.source,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

/**
 * POST — Initiate Trello authorization
 * Trello uses a simple token-based auth (authorize URL returns token via fragment)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TRELLO_API_KEY) {
      return NextResponse.json(
        { error: "Trello not configured. Set TRELLO_API_KEY." },
        { status: 500 }
      );
    }

    const url = `https://trello.com/1/authorize?expiration=never&name=PerpetualCore&scope=read,write&response_type=token&key=${TRELLO_API_KEY}&return_url=${encodeURIComponent(REDIRECT_URI!)}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Failed to initiate authorization" }, { status: 500 });
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

    // Delete both token and API key credentials
    await deleteCredential("trello", user.id);
    await deleteCredential("trello_api_key", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
