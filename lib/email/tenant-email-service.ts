/**
 * Tenant Email Service
 *
 * Multi-tenant email service that handles per-organization email configuration.
 * Supports different email providers (Resend, SendGrid, etc.) per tenant.
 *
 * Architecture:
 * 1. Lookup organization's email config from database
 * 2. Fall back to system defaults (env vars) if no config
 * 3. Use appropriate provider to send
 * 4. Apply branding (signature, footer)
 * 5. Track sends in database
 */

import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto/encryption";
import { createResendProvider } from "./providers/resend";
import type { IEmailProvider, EmailSendResult } from "./providers/interface";

// Types
export interface EmailProviderConfigRecord {
  id: string;
  organization_id: string;
  provider: string;
  api_key_encrypted: string | null;
  sending_domain: string | null;
  is_domain_verified: boolean;
  default_from_email: string;
  default_from_name: string;
  default_reply_to: string | null;
  email_signature_html: string | null;
  email_footer_html: string | null;
  logo_url: string | null;
  primary_color: string;
  track_opens: boolean;
  track_clicks: boolean;
  daily_send_limit: number;
  sends_today: number;
  is_active: boolean;
}

export interface TenantEmailParams {
  organizationId: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  fromEmail?: string; // Override from address
  fromName?: string; // Override from name
  includeSignature?: boolean;
  includeFooter?: boolean;
  tags?: Record<string, string>;
  outboxId?: string; // Link to email_outbox record
}

export interface TenantEmailResult extends EmailSendResult {
  configId?: string;
  fromEmail?: string;
}

// System defaults from environment
const SYSTEM_DEFAULTS = {
  apiKey: process.env.RESEND_API_KEY || "",
  fromEmail: process.env.RESEND_FROM_EMAIL || "noreply@perpetualcore.com",
  fromName: "Perpetual Core",
  provider: "resend",
};

/**
 * Get email configuration for an organization
 * Returns null if no custom config exists (will use system defaults)
 */
export async function getEmailConfig(
  organizationId: string
): Promise<EmailProviderConfigRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("email_provider_configs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No custom config, will use system defaults
    return null;
  }

  return data as EmailProviderConfigRecord;
}

/**
 * Create an email provider instance based on config
 */
function createProvider(
  config: EmailProviderConfigRecord | null
): IEmailProvider {
  // Determine API key
  let apiKey: string;

  if (config?.api_key_encrypted) {
    // Decrypt org-specific API key
    apiKey = decryptSecret(config.api_key_encrypted);
  } else {
    // Use system default
    apiKey = SYSTEM_DEFAULTS.apiKey;
  }

  if (!apiKey) {
    throw new Error("No email API key configured");
  }

  // For now, only Resend is implemented
  // Add more providers as needed
  const provider = config?.provider || SYSTEM_DEFAULTS.provider;

  switch (provider) {
    case "resend":
    default:
      return createResendProvider({
        apiKey,
        trackOpens: config?.track_opens ?? true,
        trackClicks: config?.track_clicks ?? true,
      });
  }
}

/**
 * Apply email signature and footer to HTML content
 */
function applyBranding(
  html: string,
  config: EmailProviderConfigRecord | null,
  options: { includeSignature?: boolean; includeFooter?: boolean }
): string {
  let brandedHtml = html;

  // Add signature if enabled and exists
  if (options.includeSignature !== false && config?.email_signature_html) {
    brandedHtml += `\n<div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">${config.email_signature_html}</div>`;
  }

  // Add footer if enabled and exists
  if (options.includeFooter !== false && config?.email_footer_html) {
    brandedHtml += `\n<div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">${config.email_footer_html}</div>`;
  }

  return brandedHtml;
}

/**
 * Update email_outbox record with send result
 */
async function updateOutboxRecord(
  outboxId: string,
  result: TenantEmailResult,
  fromEmail: string
): Promise<void> {
  const supabase = await createClient();

  const updateData: Record<string, any> = {
    from_email: fromEmail,
  };

  if (result.success) {
    updateData.status = "sent";
    updateData.sent_at = new Date().toISOString();
    updateData.resend_id = result.messageId;
  } else {
    updateData.status = "failed";
    updateData.error_message = result.error;
  }

  await supabase.from("email_outbox").update(updateData).eq("id", outboxId);
}

/**
 * Increment the organization's daily send count
 */
async function incrementSendCount(configId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_email_send_count", { config_id: configId });
}

/**
 * Check if organization is within their daily send limit
 */
async function checkSendLimit(
  config: EmailProviderConfigRecord
): Promise<boolean> {
  // Check if we need to reset the counter
  const today = new Date().toISOString().split("T")[0];
  if (config.sends_today >= config.daily_send_limit) {
    console.warn(
      `[TenantEmailService] Organization ${config.organization_id} has reached daily send limit`
    );
    return false;
  }
  return true;
}

/**
 * Send an email using the organization's email configuration
 *
 * This is the main entry point for sending tenant-aware emails.
 */
export async function sendTenantEmail(
  params: TenantEmailParams
): Promise<TenantEmailResult> {
  try {
    // Get organization's email config
    const config = await getEmailConfig(params.organizationId);

    // Check send limits if config exists
    if (config && !(await checkSendLimit(config))) {
      return {
        success: false,
        error: "Daily email send limit reached",
        configId: config.id,
      };
    }

    // Create provider
    const provider = createProvider(config);

    // Determine from address and name
    const fromEmail =
      params.fromEmail || config?.default_from_email || SYSTEM_DEFAULTS.fromEmail;
    const fromName =
      params.fromName || config?.default_from_name || SYSTEM_DEFAULTS.fromName;
    const replyTo =
      params.replyTo || config?.default_reply_to || undefined;

    // Apply branding to HTML
    const brandedHtml = applyBranding(params.html, config, {
      includeSignature: params.includeSignature,
      includeFooter: params.includeFooter,
    });

    // Send the email
    const result = await provider.send({
      from: fromEmail,
      fromName,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      replyTo,
      subject: params.subject,
      html: brandedHtml,
      text: params.text,
      tags: params.tags,
    });

    const tenantResult: TenantEmailResult = {
      ...result,
      configId: config?.id,
      fromEmail,
    };

    // Update outbox record if provided
    if (params.outboxId) {
      await updateOutboxRecord(params.outboxId, tenantResult, fromEmail);
    }

    // Increment send count if successful
    if (result.success && config) {
      await incrementSendCount(config.id);
    }

    return tenantResult;
  } catch (error: any) {
    console.error("[TenantEmailService] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Get or create email config for an organization
 * Used when setting up a new organization
 */
export async function upsertEmailConfig(
  organizationId: string,
  config: Partial<EmailProviderConfigRecord>
): Promise<EmailProviderConfigRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("email_provider_configs")
    .upsert(
      {
        organization_id: organizationId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,sending_domain" }
    )
    .select()
    .single();

  if (error) {
    console.error("[TenantEmailService] Upsert config error:", error);
    return null;
  }

  return data as EmailProviderConfigRecord;
}

/**
 * Backwards-compatible wrapper for existing code
 * Maps to sendTenantEmail with sensible defaults
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string,
  organizationId?: string
): Promise<{ success: boolean; error?: string }> {
  // If no organization ID, use system defaults directly
  if (!organizationId) {
    // Use the original implementation for backwards compatibility
    const { sendEmail: legacySend } = await import("./index");
    return legacySend(to, subject, html, from);
  }

  const result = await sendTenantEmail({
    organizationId,
    to,
    subject,
    html,
    fromEmail: from?.match(/<(.+)>/)?.[1] || from,
    fromName: from?.match(/^([^<]+)/)?.[1]?.trim(),
  });

  return {
    success: result.success,
    error: result.error,
  };
}
