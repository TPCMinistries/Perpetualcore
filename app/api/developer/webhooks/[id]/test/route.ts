import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHmac } from "crypto";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Fetch the webhook
    const { data: webhook, error: fetchError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    // Create test payload
    const testPayload = {
      event: "webhook.test",
      data: {
        test: true,
        message: "This is a test webhook from Perpetual Core Platform",
        timestamp: new Date().toISOString(),
      },
      webhook_id: webhook.id,
    };

    const payloadString = JSON.stringify(testPayload);

    // Generate signature
    const signature = createHmac("sha256", webhook.secret)
      .update(payloadString)
      .digest("hex");

    // Send webhook request
    const startTime = Date.now();
    let delivery: any = {
      webhook_id: webhook.id,
      event_type: "webhook.test",
      status: "pending",
      attempts: 1,
      response_code: null,
      response_time: null,
    };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "User-Agent": "AI-OS-Platform-Webhooks/1.0",
        },
        body: payloadString,
      });

      const responseTime = Date.now() - startTime;
      const responseCode = response.status;

      delivery = {
        ...delivery,
        status: response.ok ? "success" : "failed",
        response_code: responseCode,
        response_time: responseTime,
      };

      // Update webhook counts
      if (response.ok) {
        await supabase
          .from("webhooks")
          .update({
            success_count: webhook.success_count + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", webhook.id);
      } else {
        await supabase
          .from("webhooks")
          .update({
            failure_count: webhook.failure_count + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", webhook.id);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      delivery = {
        ...delivery,
        status: "failed",
        response_time: responseTime,
      };

      // Update failure count
      await supabase
        .from("webhooks")
        .update({
          failure_count: webhook.failure_count + 1,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);
    }

    // Record the delivery
    await supabase.from("webhook_deliveries").insert(delivery);

    return NextResponse.json({
      success: true,
      delivery,
    });
  } catch (error) {
    console.error("Webhook test API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
