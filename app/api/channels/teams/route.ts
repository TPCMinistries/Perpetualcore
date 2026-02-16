/**
 * Microsoft Teams Bot Framework Endpoint
 *
 * POST /api/channels/teams
 *
 * Handles Bot Framework activity payloads from Microsoft Teams:
 * - Message activities: Process through the unified channel hub
 * - ConversationUpdate: Handle bot added/removed, member join/leave
 * - JWT token verification for security
 *
 * Teams Bot Setup:
 * 1. Register bot at dev.botframework.com or Azure Bot Service
 * 2. Set messaging endpoint to: https://perpetualcore.com/api/channels/teams
 * 3. Configure TEAMS_APP_ID and TEAMS_APP_PASSWORD env vars
 * 4. Install bot in Teams via App Studio or Teams Admin Center
 */

import { NextRequest, NextResponse } from "next/server";
import { processChannelMessage } from "@/lib/channels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEAMS_APP_ID = process.env.TEAMS_APP_ID;

/**
 * Bot Framework Activity Types
 */
const ActivityType = {
  MESSAGE: "message",
  CONVERSATION_UPDATE: "conversationUpdate",
  MESSAGE_REACTION: "messageReaction",
  TYPING: "typing",
  INVOKE: "invoke",
  INSTALLATION_UPDATE: "installationUpdate",
} as const;

export async function POST(request: NextRequest) {
  try {
    // Verify Bot Framework JWT token
    const authHeader = request.headers.get("authorization");
    if (TEAMS_APP_ID && authHeader) {
      const isValid = await verifyBotFrameworkToken(authHeader);
      if (!isValid) {
        console.error("[Teams Webhook] Invalid Bot Framework token");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (TEAMS_APP_ID && !authHeader) {
      console.error("[Teams Webhook] Missing authorization header");
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    } else {
      console.warn(
        "[Teams Webhook] TEAMS_APP_ID not set, accepting all requests"
      );
    }

    const body = await request.json();

    if (!body || !body.type) {
      return NextResponse.json(
        { error: "Invalid activity payload" },
        { status: 400 }
      );
    }

    switch (body.type) {
      case ActivityType.MESSAGE: {
        // Skip messages from the bot itself to avoid loops
        if (body.from?.id === TEAMS_APP_ID) {
          return NextResponse.json({ ok: true });
        }

        // Inject service URL into the payload so the adapter can send responses
        // The service URL is where we POST back responses
        if (body.serviceUrl) {
          body._serviceUrl = body.serviceUrl;
        }

        // Process through the unified channel hub
        // The TeamsAdapter will use serviceUrl from rawPayload to send responses
        await processChannelMessage("teams", body);
        return NextResponse.json({ ok: true });
      }

      case ActivityType.CONVERSATION_UPDATE: {
        // Handle bot added to conversation
        if (body.membersAdded && Array.isArray(body.membersAdded)) {
          for (const member of body.membersAdded) {
            if (member.id === body.recipient?.id) {
              // Bot was added to the conversation - send welcome message
              console.log(
                "[Teams Webhook] Bot added to conversation:",
                body.conversation?.id
              );
              await sendWelcomeMessage(body);
            }
          }
        }

        // Handle members removed
        if (body.membersRemoved && Array.isArray(body.membersRemoved)) {
          for (const member of body.membersRemoved) {
            if (member.id === body.recipient?.id) {
              console.log(
                "[Teams Webhook] Bot removed from conversation:",
                body.conversation?.id
              );
            }
          }
        }

        return NextResponse.json({ ok: true });
      }

      case ActivityType.TYPING: {
        // User is typing - acknowledge silently
        return NextResponse.json({ ok: true });
      }

      case ActivityType.INVOKE: {
        // Handle invoke activities (task modules, messaging extensions, etc.)
        console.log("[Teams Webhook] Invoke activity:", body.name);

        // Return a basic invoke response
        return NextResponse.json({
          status: 200,
          body: {},
        });
      }

      case ActivityType.INSTALLATION_UPDATE: {
        console.log(
          "[Teams Webhook] Installation update:",
          body.action
        );
        return NextResponse.json({ ok: true });
      }

      default: {
        console.warn(
          "[Teams Webhook] Unhandled activity type:",
          body.type
        );
        return NextResponse.json({ ok: true });
      }
    }
  } catch (error: any) {
    console.error("[Teams Webhook] Error:", error);
    // Return 200 to prevent Bot Framework from retrying
    return NextResponse.json({ ok: false, error: error.message });
  }
}

/**
 * Send a welcome message when the bot is added to a conversation.
 */
async function sendWelcomeMessage(activity: any): Promise<void> {
  const serviceUrl = activity.serviceUrl;
  const conversationId = activity.conversation?.id;

  if (!serviceUrl || !conversationId) return;

  try {
    // Get token for sending
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: TEAMS_APP_ID || "",
          client_secret: process.env.TEAMS_APP_PASSWORD || "",
          scope: "https://api.botframework.com/.default",
        }),
      }
    );

    if (!tokenResponse.ok) return;

    const tokenData = await tokenResponse.json();
    const normalizedServiceUrl = serviceUrl.replace(/\/$/, "");

    await fetch(
      `${normalizedServiceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "message",
          text: "Hi there! I'm your Perpetual Core AI assistant. I can help you with questions, tasks, email drafts, document lookups, and more.\n\nTo get started, just send me a message! If this is your first time, you may need to link your account at perpetualcore.com > Settings > Channels.",
        }),
      }
    );
  } catch (error) {
    console.error("[Teams Webhook] Welcome message error:", error);
  }
}

/**
 * Verify Bot Framework JWT token.
 *
 * In production, this should:
 * 1. Decode the JWT header to get the key ID (kid)
 * 2. Fetch the JWKS from https://login.botframework.com/v1/.well-known/openidconfiguration
 * 3. Verify the signature using the matching public key
 * 4. Validate claims (iss, aud, exp)
 *
 * For now, we do basic JWT structure validation and claim checks.
 * Full JWKS verification should be added for production deployment.
 */
async function verifyBotFrameworkToken(
  authHeader: string
): Promise<boolean> {
  try {
    if (!authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.substring(7);
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );

    // Validate basic claims
    const now = Math.floor(Date.now() / 1000);

    // Token must not be expired
    if (payload.exp && payload.exp < now) {
      console.error("[Teams Webhook] Token expired");
      return false;
    }

    // Token must not be used before its valid time
    if (payload.nbf && payload.nbf > now + 300) {
      console.error("[Teams Webhook] Token not yet valid");
      return false;
    }

    // Issuer should be Bot Framework or Azure AD
    const validIssuers = [
      "https://api.botframework.com",
      "https://sts.windows.net/d6d49420-f39b-4df7-a1dc-d59a935871db/",
      "https://sts.windows.net/f8cdef31-a31e-4b4a-93e4-5f571e91255a/",
    ];

    if (payload.iss && !validIssuers.some((iss) => payload.iss.startsWith(iss))) {
      // Allow any Azure AD issuer for now (Teams uses various tenant IDs)
      if (!payload.iss.startsWith("https://sts.windows.net/")) {
        console.error("[Teams Webhook] Invalid issuer:", payload.iss);
        return false;
      }
    }

    // Audience should be our app ID
    if (TEAMS_APP_ID && payload.aud && payload.aud !== TEAMS_APP_ID) {
      console.error("[Teams Webhook] Invalid audience:", payload.aud);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Teams Webhook] Token verification error:", error);
    return false;
  }
}
