import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check which integrations are configured via environment variables
    const integrations = [
      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Sync and manage your calendar events with Google Calendar",
        icon: "Calendar",
        color: "text-blue-500",
        connected: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        oauth: true,
        setupUrl: "/api/integrations/google/auth",
        env_vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      },
      {
        id: "gmail",
        name: "Gmail",
        description: "Send and receive emails through your Gmail account",
        icon: "Mail",
        color: "text-red-500",
        connected: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        oauth: true,
        setupUrl: "/api/integrations/google/auth",
        env_vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      },
      {
        id: "whatsapp",
        name: "WhatsApp (Twilio)",
        description: "Send and receive WhatsApp messages via Twilio",
        icon: "MessageCircle",
        color: "text-green-500",
        connected: !!(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_WHATSAPP_NUMBER
        ),
        oauth: false,
        env_vars: [
          "TWILIO_ACCOUNT_SID",
          "TWILIO_AUTH_TOKEN",
          "TWILIO_WHATSAPP_NUMBER",
        ],
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Process payments and manage subscriptions",
        icon: "CreditCard",
        color: "text-purple-500",
        connected: !!(
          process.env.STRIPE_SECRET_KEY &&
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        ),
        oauth: false,
        env_vars: [
          "STRIPE_SECRET_KEY",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
          "STRIPE_WEBHOOK_SECRET",
        ],
      },
      {
        id: "openai",
        name: "OpenAI",
        description: "Power AI features with OpenAI's language models",
        icon: "Sparkles",
        color: "text-emerald-500",
        connected: !!process.env.OPENAI_API_KEY,
        oauth: false,
        env_vars: ["OPENAI_API_KEY"],
      },
      {
        id: "anthropic",
        name: "Anthropic (Claude)",
        description: "Use Claude AI models for advanced reasoning",
        icon: "Sparkles",
        color: "text-orange-500",
        connected: !!process.env.ANTHROPIC_API_KEY,
        oauth: false,
        env_vars: ["ANTHROPIC_API_KEY"],
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Integrations status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
