/**
 * List Slack Channels API
 * Returns channels the user's Slack integration has access to
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSlackCredentials, listSlackChannels } from "@/lib/slack/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Slack credentials
    const credentials = await getSlackCredentials(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: "Slack not connected", channels: [] },
        { status: 200 }
      );
    }

    // List channels
    const channels = await listSlackChannels(credentials.accessToken);

    return NextResponse.json({
      ok: true,
      team: {
        id: credentials.teamId,
        name: credentials.teamName,
      },
      channels,
    });
  } catch (error) {
    console.error("List Slack channels error:", error);
    return NextResponse.json(
      { error: "Failed to list Slack channels" },
      { status: 500 }
    );
  }
}
