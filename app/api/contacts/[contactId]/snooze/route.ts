import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

type SnoozeDuration = "1_week" | "1_month" | "3_months" | "custom" | "clear";

/**
 * POST - Snooze reminder for a contact
 * Body: { duration: '1_week' | '1_month' | '3_months' | 'custom' | 'clear', custom_date?: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact ownership
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, full_name")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { duration, custom_date } = body as {
      duration: SnoozeDuration;
      custom_date?: string;
    };

    if (!duration) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 });
    }

    // Calculate snooze date
    let snoozeUntil: string | null = null;

    switch (duration) {
      case "1_week":
        snoozeUntil = addDays(new Date(), 7);
        break;
      case "1_month":
        snoozeUntil = addDays(new Date(), 30);
        break;
      case "3_months":
        snoozeUntil = addDays(new Date(), 90);
        break;
      case "custom":
        if (!custom_date) {
          return NextResponse.json(
            { error: "Custom date is required for custom duration" },
            { status: 400 }
          );
        }
        snoozeUntil = custom_date;
        break;
      case "clear":
        snoozeUntil = null;
        break;
      default:
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Update contact
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        reminder_snoozed_until: snoozeUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      console.error("Error snoozing contact:", updateError);
      return NextResponse.json({ error: "Failed to snooze reminder" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contact_id: contactId,
      snoozed_until: snoozeUntil,
      message: snoozeUntil
        ? `Reminder snoozed until ${new Date(snoozeUntil).toLocaleDateString()}`
        : "Reminder snooze cleared",
    });
  } catch (error) {
    console.error("Snooze POST error:", error);
    return NextResponse.json({ error: "Failed to snooze reminder" }, { status: 500 });
  }
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}
