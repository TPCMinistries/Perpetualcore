import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/notify - Send notifications about a decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    const body = await request.json();
    const { recipient_ids, message, send_email, notification_type } = body;

    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return NextResponse.json({ error: "recipient_ids is required" }, { status: 400 });
    }

    const notificationType = notification_type || (decision.status === "decided" ? "decision_made" : "status_changed");
    const title = decision.status === "decided"
      ? `Decision Made: ${decision.title}`
      : `Decision Update: ${decision.title}`;

    const notificationMessage = message || (
      decision.status === "decided"
        ? `A decision has been made: ${decision.decision_made || decision.title}`
        : `The decision "${decision.title}" has been updated.`
    );

    // Create in-app notifications for each recipient
    const notifications = recipient_ids.map((recipientId: string) => ({
      user_id: recipientId,
      decision_id: id,
      notification_type: notificationType,
      title,
      message: notificationMessage,
      triggered_by: user.id,
      sent_in_app: true,
      sent_email: send_email || false,
    }));

    const { data: createdNotifications, error: notifError } = await supabase
      .from("decision_notifications")
      .insert(notifications)
      .select();

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      // Try to create in the general notifications table as fallback
      const generalNotifications = recipient_ids.map((recipientId: string) => ({
        user_id: recipientId,
        organization_id: profile.organization_id,
        type: "system",
        title,
        message: notificationMessage,
        triggered_by: user.id,
        sent_in_app: true,
        sent_email: send_email || false,
        metadata: { decision_id: id, notification_type: notificationType },
      }));

      await supabase.from("notifications").insert(generalNotifications);
    }

    // If email is requested, queue emails for sending
    if (send_email) {
      // Get recipient details
      const { data: recipients } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", recipient_ids);

      if (recipients && recipients.length > 0) {
        const emails = recipients.map((recipient) => ({
          organization_id: profile.organization_id,
          sent_by: user.id,
          recipient_user_id: recipient.id,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name,
          subject: title,
          body_text: `${notificationMessage}\n\nFrom: ${profile.full_name}\n\nDecision: ${decision.title}${decision.decision_made ? `\nOutcome: ${decision.decision_made}` : ""}`,
          body_html: null,
          context_type: "decision",
          context_id: id,
          status: "pending",
        }));

        const { error: emailError } = await supabase
          .from("email_outbox")
          .insert(emails);

        if (emailError) {
          console.error("Error queuing emails:", emailError);
          // Don't fail the request, just log the error
        }
      }
    }

    // Record event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "reminder_sent",
      comment: `Notifications sent to ${recipient_ids.length} recipient(s)`,
      performed_by: user.id,
      performed_by_system: false,
      metadata: { recipient_count: recipient_ids.length, send_email: send_email || false },
    });

    return NextResponse.json({
      success: true,
      notifications_sent: recipient_ids.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
