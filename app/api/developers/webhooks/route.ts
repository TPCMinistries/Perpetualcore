import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - List webhooks
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select(`
        id,
        name,
        url,
        events,
        is_active,
        retry_count,
        timeout_seconds,
        last_triggered_at,
        last_success_at,
        last_failure_at,
        consecutive_failures,
        created_at,
        updated_at
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      if (isDev) console.error("Error fetching webhooks:", error);
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
    }

    return NextResponse.json({
      webhooks: webhooks || [],
      available_events: Object.values(WEBHOOK_EVENTS),
    });
  } catch (error: any) {
    if (isDev) console.error("Webhooks fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Create webhook
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      url,
      events = [],
      headers = {},
      retry_count = 3,
      timeout_seconds = 30,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as any));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate signing secret
    const secret = `whsec_${crypto.randomBytes(24).toString("base64url")}`;

    // Create webhook
    const { data: webhook, error } = await supabase
      .from("webhooks")
      .insert({
        organization_id: profile.organization_id,
        name,
        url,
        secret,
        events,
        headers,
        retry_count: Math.min(Math.max(retry_count, 1), 5),
        timeout_seconds: Math.min(Math.max(timeout_seconds, 5), 60),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (isDev) console.error("Error creating webhook:", error);
      return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret, // Only shown once
        is_active: webhook.is_active,
      },
      warning: "Save the signing secret securely. You won't be able to see it again!",
    });
  } catch (error: any) {
    if (isDev) console.error("Webhook creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT - Update webhook
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const { webhook_id, name, url, events, headers, is_active, retry_count, timeout_seconds } = body;

    if (!webhook_id) {
      return NextResponse.json({ error: "webhook_id is required" }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (url !== undefined) {
      try {
        new URL(url);
        updates.url = url;
      } catch {
        return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 });
      }
    }
    if (events !== undefined) {
      const validEvents = Object.values(WEBHOOK_EVENTS);
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e as any));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(", ")}` },
          { status: 400 }
        );
      }
      updates.events = events;
    }
    if (headers !== undefined) updates.headers = headers;
    if (is_active !== undefined) updates.is_active = is_active;
    if (retry_count !== undefined) updates.retry_count = Math.min(Math.max(retry_count, 1), 5);
    if (timeout_seconds !== undefined) updates.timeout_seconds = Math.min(Math.max(timeout_seconds, 5), 60);

    // Reset consecutive failures if re-enabling
    if (is_active === true) {
      updates.consecutive_failures = 0;
    }

    const { data: webhook, error } = await supabase
      .from("webhooks")
      .update(updates)
      .eq("id", webhook_id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      if (isDev) console.error("Error updating webhook:", error);
      return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        is_active: webhook.is_active,
        retry_count: webhook.retry_count,
        timeout_seconds: webhook.timeout_seconds,
      },
    });
  } catch (error: any) {
    if (isDev) console.error("Webhook update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Delete webhook
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("webhook_id");

    if (!webhookId) {
      return NextResponse.json({ error: "webhook_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", webhookId)
      .eq("organization_id", profile.organization_id);

    if (error) {
      if (isDev) console.error("Error deleting webhook:", error);
      return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error: any) {
    if (isDev) console.error("Webhook deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
