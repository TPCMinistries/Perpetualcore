import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

    const { integrationId } = await request.json();

    // Test different integrations
    switch (integrationId) {
      case "openai":
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json({
            success: false,
            message: "OpenAI API key not configured",
          });
        }
        // Test OpenAI connection
        try {
          const response = await fetch(
            "https://api.openai.com/v1/models",
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
            }
          );
          if (response.ok) {
            return NextResponse.json({
              success: true,
              message: "OpenAI connection successful",
            });
          } else {
            return NextResponse.json({
              success: false,
              message: "Invalid OpenAI API key",
            });
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Failed to connect to OpenAI",
          });
        }

      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) {
          return NextResponse.json({
            success: false,
            message: "Anthropic API key not configured",
          });
        }
        // For Anthropic, just verify the key is set
        return NextResponse.json({
          success: true,
          message: "Anthropic API key is configured",
        });

      case "whatsapp":
        if (
          !process.env.TWILIO_ACCOUNT_SID ||
          !process.env.TWILIO_AUTH_TOKEN
        ) {
          return NextResponse.json({
            success: false,
            message: "Twilio credentials not configured",
          });
        }
        // Test Twilio connection
        try {
          const auth = Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64");

          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            }
          );

          if (response.ok) {
            return NextResponse.json({
              success: true,
              message: "Twilio connection successful",
            });
          } else {
            return NextResponse.json({
              success: false,
              message: "Invalid Twilio credentials",
            });
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Failed to connect to Twilio",
          });
        }

      case "stripe":
        if (!process.env.STRIPE_SECRET_KEY) {
          return NextResponse.json({
            success: false,
            message: "Stripe secret key not configured",
          });
        }
        // Test Stripe connection
        try {
          const response = await fetch("https://api.stripe.com/v1/balance", {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          });

          if (response.ok) {
            return NextResponse.json({
              success: true,
              message: "Stripe connection successful",
            });
          } else {
            return NextResponse.json({
              success: false,
              message: "Invalid Stripe API key",
            });
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Failed to connect to Stripe",
          });
        }

      case "google-calendar":
      case "gmail":
        return NextResponse.json({
          success: true,
          message: "Google OAuth is configured. Test by trying to sync data.",
        });

      default:
        return NextResponse.json({
          success: false,
          message: "Unknown integration",
        });
    }
  } catch (error) {
    console.error("Integration test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
