import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      return new Response("Profile not found", { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const voice = body.voice || "alloy";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("Voice service not configured", { status: 500 });
    }

    // Create an ephemeral token via OpenAI Realtime API sessions endpoint
    const sessionResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          voice: voice,
        }),
      }
    );

    if (!sessionResponse.ok) {
      const errText = await sessionResponse.text();
      console.error("OpenAI Realtime session error:", errText);
      return new Response("Failed to create voice session", { status: 502 });
    }

    const session = await sessionResponse.json();

    return Response.json({
      client_secret: session.client_secret?.value || session.client_secret,
      voice: voice,
      expires_at: session.client_secret?.expires_at,
    });
  } catch (error) {
    console.error("Voice token error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
