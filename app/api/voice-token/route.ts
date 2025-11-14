import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REALTIME_MODEL =
  process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview-2024-12-17";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Ensure authenticated session
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
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return new Response("Profile not found", { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const voice = body.voice || "alloy";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return new Response("Server configuration error", { status: 500 });
    }

    const sessionResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          model: REALTIME_MODEL,
          voice,
          instructions:
            "You are the Perpetual Core voice assistant. Keep responses concise, helpful, and proactive.",
          modalities: ["text", "audio"],
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
        }),
      }
    );

    if (!sessionResponse.ok) {
      const errorBody = await sessionResponse.text();
      console.error("Failed to create realtime session:", errorBody);
      return new Response("Failed to create voice session", { status: 500 });
    }

    const session = await sessionResponse.json();
    const clientSecret =
      session?.client_secret?.value ?? session?.client_secret ?? null;

    if (!clientSecret) {
      console.error("Realtime session response missing client_secret", session);
      return new Response("Failed to create voice session", { status: 500 });
    }

    return Response.json({
      client_secret: clientSecret,
      expires_at: session?.client_secret?.expires_at ?? null,
      session_id: session?.id ?? null,
      voice,
      model: REALTIME_MODEL,
    });
  } catch (error) {
    console.error("Voice token error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
