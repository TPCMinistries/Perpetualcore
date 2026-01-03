import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with service role key for webhook access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook secret for n8n authentication
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

// POST /api/webhooks/email-received
// n8n sends emails here from Gmail/Outlook
export async function POST(request: Request) {
  try {
    // Verify webhook secret - support multiple auth formats
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");

    // Accept Bearer token, X-API-Key header, or no auth if secret not configured
    const providedSecret = authHeader?.replace("Bearer ", "") || apiKeyHeader;

    if (WEBHOOK_SECRET && providedSecret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret provided:", providedSecret ? "***" : "none");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Support both single email and batch
    const emails = Array.isArray(body) ? body : [body];

    if (emails.length === 0) {
      return NextResponse.json({ error: "No emails provided" }, { status: 400 });
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as { id: string; error: string }[],
    };

    for (const emailData of emails) {
      try {
        // Validate required fields
        if (!emailData.user_id && !emailData.user_email) {
          results.errors.push({
            id: emailData.provider_message_id || "unknown",
            error: "user_id or user_email is required"
          });
          continue;
        }

        // Find user if only email provided
        let userId = emailData.user_id;
        let organizationId = emailData.organization_id;
        let emailAccountId = emailData.email_account_id;

        if (!userId && emailData.user_email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, organization_id")
            .eq("email", emailData.user_email)
            .single();

          if (profile) {
            userId = profile.id;
            organizationId = organizationId || profile.organization_id;
          } else {
            results.errors.push({
              id: emailData.provider_message_id || "unknown",
              error: `User not found for email: ${emailData.user_email}`
            });
            continue;
          }
        }

        // Get or create email account if not provided
        if (!emailAccountId && emailData.account_email) {
          const { data: account } = await supabase
            .from("email_accounts")
            .select("id")
            .eq("user_id", userId)
            .eq("email_address", emailData.account_email)
            .single();

          if (account) {
            emailAccountId = account.id;
          } else {
            // Create a new email account for n8n integration
            const { data: newAccount, error: accountError } = await supabase
              .from("email_accounts")
              .insert({
                user_id: userId,
                organization_id: organizationId,
                provider: emailData.provider || "gmail",
                provider_account_id: emailData.account_email,
                email_address: emailData.account_email,
                sync_enabled: true,
              })
              .select("id")
              .single();

            if (accountError) {
              console.error("Failed to create email account:", accountError);
              results.errors.push({
                id: emailData.provider_message_id || "unknown",
                error: `Failed to create email account: ${accountError.message}`
              });
              continue;
            }
            emailAccountId = newAccount.id;
          }
        }

        if (!emailAccountId) {
          results.errors.push({
            id: emailData.provider_message_id || "unknown",
            error: "email_account_id or account_email is required"
          });
          continue;
        }

        // Check if email already exists (upsert based on provider_message_id)
        const { data: existingEmail } = await supabase
          .from("emails")
          .select("id")
          .eq("email_account_id", emailAccountId)
          .eq("provider_message_id", emailData.provider_message_id || emailData.message_id || emailData.id)
          .single();

        // Prepare email record
        const emailRecord = {
          email_account_id: emailAccountId,
          organization_id: organizationId,
          user_id: userId,
          provider_message_id: emailData.provider_message_id || emailData.message_id || emailData.id,
          provider_thread_id: emailData.provider_thread_id || emailData.thread_id,
          provider: emailData.provider || "gmail",
          subject: emailData.subject || "(No Subject)",
          from_email: emailData.from_email || emailData.from?.email || emailData.from,
          from_name: emailData.from_name || emailData.from?.name,
          to_emails: normalizeEmailArray(emailData.to_emails || emailData.to),
          cc_emails: normalizeEmailArray(emailData.cc_emails || emailData.cc || []),
          bcc_emails: normalizeEmailArray(emailData.bcc_emails || emailData.bcc || []),
          body_text: emailData.body_text || emailData.text || emailData.body,
          body_html: emailData.body_html || emailData.html,
          snippet: emailData.snippet || (emailData.body_text || emailData.text || "").substring(0, 200),
          labels: emailData.labels || [],
          category: emailData.category || "primary",
          is_read: emailData.is_read ?? false,
          is_starred: emailData.is_starred ?? false,
          is_important: emailData.is_important ?? false,
          is_draft: emailData.is_draft ?? false,
          is_archived: emailData.is_archived ?? false,
          sent_at: emailData.sent_at || emailData.date,
          received_at: emailData.received_at || new Date().toISOString(),
          has_attachments: emailData.has_attachments ?? (emailData.attachments?.length > 0) ?? false,
          attachments: emailData.attachments,
          direction: emailData.direction || "inbound",
          status: emailData.status || "received",
          in_reply_to: emailData.in_reply_to,
          message_references: emailData.message_references || emailData.references,
          raw_headers: emailData.raw_headers || emailData.headers,
          raw_data: emailData.raw_data,
        };

        if (existingEmail) {
          // Update existing email
          const { error: updateError } = await supabase
            .from("emails")
            .update(emailRecord)
            .eq("id", existingEmail.id);

          if (updateError) {
            results.errors.push({
              id: emailData.provider_message_id,
              error: updateError.message
            });
          } else {
            results.updated.push(existingEmail.id);
          }
        } else {
          // Insert new email
          const { data: newEmail, error: insertError } = await supabase
            .from("emails")
            .insert(emailRecord)
            .select("id")
            .single();

          if (insertError) {
            console.error("Failed to insert email:", insertError);
            results.errors.push({
              id: emailData.provider_message_id,
              error: insertError.message
            });
          } else {
            results.created.push(newEmail.id);

            // Log activity
            try {
              await supabase.from("activity_feed").insert({
                organization_id: organizationId,
                user_id: userId,
                action_type: "email_received",
                entity_type: "email",
                entity_id: newEmail.id,
                title: `Email received: ${emailRecord.subject}`,
                description: `From: ${emailRecord.from_email}`,
                metadata: {
                  from: emailRecord.from_email,
                  subject: emailRecord.subject,
                  source: "n8n",
                },
              });
            } catch (activityError) {
              console.error("Failed to log activity:", activityError);
            }
          }
        }
      } catch (emailError: any) {
        console.error("Error processing email:", emailError);
        results.errors.push({
          id: emailData.provider_message_id || "unknown",
          error: emailError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: emails.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error: any) {
    console.error("Email webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to normalize email arrays from various formats
function normalizeEmailArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item.email) return item.email;
      if (typeof item === "object" && item.address) return item.address;
      return String(item);
    }).filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(",").map((e) => e.trim()).filter(Boolean);
  }
  if (typeof input === "object" && input.email) {
    return [input.email];
  }
  return [];
}

// GET - Health check for the webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/email-received",
    method: "POST",
    description: "Webhook for n8n to push emails from Gmail/Outlook",
    required_fields: [
      "provider_message_id or message_id",
      "user_id or user_email",
      "email_account_id or account_email",
      "from_email or from",
      "to_emails or to",
      "subject",
    ],
    optional_fields: [
      "body_text/body_html",
      "cc_emails/bcc_emails",
      "labels",
      "is_read/is_starred/is_important",
      "attachments",
      "sent_at",
    ],
    auth: "Bearer token in Authorization header (optional, uses N8N_WEBHOOK_SECRET)",
  });
}
