import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile to verify organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      return new Response("Profile not found", { status: 400 });
    }

    // Get voice selection from request body (default to "alloy")
    const body = await req.json().catch(() => ({}));
    const voice = body.voice || "alloy";

    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      if (isDev) console.error("OPENAI_API_KEY is not set in environment variables");
      return new Response("Server configuration error: OpenAI API key not found", { status: 500 });
    }

    if (isDev) console.log("Creating Realtime API session with API key:", apiKey.substring(0, 10) + "...");

    // For the Realtime API, we just return the API key directly
    // The client will use it to connect via WebSocket
    // Note: In production, you'd want to use ephemeral tokens, but for now this works
    return Response.json({
      client_secret: apiKey,
      voice: voice,
    });
  } catch (error) {
    if (isDev) console.error("Voice token error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
