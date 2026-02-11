/**
 * OAuth Token Refresh Cron
 *
 * POST /api/cron/refresh-tokens
 *
 * Proactively refreshes OAuth tokens that expire within 6 hours.
 * Runs hourly to prevent integrations from silently breaking.
 *
 * Auth: CRON_SECRET bearer token
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/integrations/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Find integrations with tokens expiring within 6 hours
    const sixHoursFromNow = new Date(
      Date.now() + 6 * 60 * 60 * 1000
    ).toISOString();

    const { data: expiringIntegrations, error } = await supabase
      .from("user_integrations")
      .select("id, user_id, provider, refresh_token, token_expires_at")
      .eq("is_active", true)
      .not("refresh_token", "is", null)
      .lt("token_expires_at", sixHoursFromNow)
      .gt("token_expires_at", new Date(0).toISOString())
      .limit(50);

    if (error) {
      console.error("Token refresh query error:", error);
      return NextResponse.json(
        { error: "Failed to query integrations" },
        { status: 500 }
      );
    }

    if (!expiringIntegrations || expiringIntegrations.length === 0) {
      return NextResponse.json({
        success: true,
        refreshed: 0,
        message: "No tokens need refreshing",
      });
    }

    let refreshed = 0;
    let failed = 0;
    const errors: { provider: string; error: string }[] = [];

    for (const integration of expiringIntegrations) {
      try {
        const result = await refreshAccessToken(
          integration.provider as any,
          integration.refresh_token
        );

        // Update the integration with new tokens
        const updateData: Record<string, unknown> = {
          access_token: result.access_token,
          updated_at: new Date().toISOString(),
        };

        if (result.expires_in) {
          updateData.token_expires_at = new Date(
            Date.now() + result.expires_in * 1000
          ).toISOString();
        }

        // Some providers rotate refresh tokens
        if (result.refresh_token) {
          updateData.refresh_token = result.refresh_token;
        }

        await supabase
          .from("user_integrations")
          .update(updateData)
          .eq("id", integration.id);

        refreshed++;
      } catch (err: any) {
        failed++;
        errors.push({
          provider: integration.provider,
          error: err.message || "Unknown error",
        });
        console.error(
          `Token refresh failed for ${integration.provider} (user: ${integration.user_id}):`,
          err.message
        );

        // If refresh fails with auth error, mark integration as inactive
        if (
          err.message?.includes("invalid_grant") ||
          err.message?.includes("unauthorized")
        ) {
          await supabase
            .from("user_integrations")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", integration.id);
        }
      }
    }

    console.log(
      `Token refresh: ${refreshed} refreshed, ${failed} failed out of ${expiringIntegrations.length}`
    );

    return NextResponse.json({
      success: true,
      total: expiringIntegrations.length,
      refreshed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Token refresh cron error:", error);
    return NextResponse.json(
      { error: "Token refresh cron failed" },
      { status: 500 }
    );
  }
}
