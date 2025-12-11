import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId } = await request.json();

    // Fetch the integration to get tokens
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("integration_id", integrationId)
      .single();

    // For Google integrations, revoke the token
    if (integrationId === "google-calendar" || integrationId === "gmail") {
      if (integration?.access_token) {
        try {
          // Revoke the access token with Google
          await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.access_token}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        } catch (revokeError) {
          console.error("Failed to revoke Google token:", revokeError);
          // Continue with disconnection even if revocation fails
        }
      }
    }

    // For Slack integrations, revoke the token
    if (integrationId === "slack") {
      if (integration?.access_token) {
        try {
          await fetch("https://slack.com/api/auth.revoke", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${integration.access_token}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
        } catch (revokeError) {
          console.error("Failed to revoke Slack token:", revokeError);
        }
      }
    }

    // For GitHub integrations, delete the authorization
    if (integrationId === "github") {
      if (integration?.access_token) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (clientId && clientSecret) {
          try {
            await fetch(`https://api.github.com/applications/${clientId}/token`, {
              method: "DELETE",
              headers: {
                "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: integration.access_token }),
            });
          } catch (revokeError) {
            console.error("Failed to revoke GitHub token:", revokeError);
          }
        }
      }
    }

    // Update the integration record to disconnect
    await supabase
      .from("user_integrations")
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
      })
      .eq("user_id", user.id)
      .eq("integration_id", integrationId);

    return NextResponse.json({
      success: true,
      message: `${integrationId} disconnected successfully`,
    });
  } catch (error) {
    console.error("Integration disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
