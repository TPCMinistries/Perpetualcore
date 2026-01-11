/**
 * Resend Email Provider
 *
 * Implements the IEmailProvider interface for Resend
 * https://resend.com/docs
 */

import {
  IEmailProvider,
  EmailSendParams,
  EmailSendResult,
  EmailProviderConfig,
} from "./interface";

export class ResendProvider implements IEmailProvider {
  readonly name = "resend";
  private apiKey: string;
  private trackOpens: boolean;
  private trackClicks: boolean;

  constructor(config: EmailProviderConfig) {
    this.apiKey = config.apiKey;
    this.trackOpens = config.trackOpens ?? true;
    this.trackClicks = config.trackClicks ?? true;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);

      // Format the from address
      const fromAddress = params.fromName
        ? `${params.fromName} <${params.from}>`
        : params.from;

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: Array.isArray(params.to) ? params.to : [params.to],
        cc: params.cc,
        bcc: params.bcc,
        replyTo: params.replyTo,
        subject: params.subject,
        html: params.html,
        text: params.text,
        headers: params.headers,
        tags: params.tags
          ? Object.entries(params.tags).map(([name, value]) => ({
              name,
              value,
            }))
          : undefined,
      });

      if (error) {
        console.error("[ResendProvider] Send error:", error);
        return {
          success: false,
          error: error.message || "Failed to send email",
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: data?.id,
        provider: this.name,
      };
    } catch (error: any) {
      console.error("[ResendProvider] Exception:", error);
      return {
        success: false,
        error: error.message || "Email service error",
        provider: this.name,
      };
    }
  }

  async verifyDomain(domain: string): Promise<{
    verified: boolean;
    records?: Array<{ type: string; name: string; value: string }>;
  }> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);

      // Create domain in Resend
      const { data, error } = await resend.domains.create({ name: domain });

      if (error) {
        console.error("[ResendProvider] Domain creation error:", error);
        return { verified: false };
      }

      // Return DNS records needed for verification
      return {
        verified: data?.status === "verified",
        records: data?.records?.map((r: any) => ({
          type: r.type,
          name: r.name,
          value: r.value,
        })),
      };
    } catch (error: any) {
      console.error("[ResendProvider] Domain verification error:", error);
      return { verified: false };
    }
  }

  async checkDomainStatus(domain: string): Promise<{
    verified: boolean;
    status: string;
  }> {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);

      // List domains and find the one we're looking for
      const { data, error } = await resend.domains.list();

      if (error) {
        console.error("[ResendProvider] Domain list error:", error);
        return { verified: false, status: "error" };
      }

      const domainInfo = data?.data?.find((d: any) => d.name === domain);

      if (!domainInfo) {
        return { verified: false, status: "not_found" };
      }

      return {
        verified: domainInfo.status === "verified",
        status: domainInfo.status,
      };
    } catch (error: any) {
      console.error("[ResendProvider] Domain status error:", error);
      return { verified: false, status: "error" };
    }
  }
}

/**
 * Factory function for creating Resend provider
 */
export function createResendProvider(
  config: EmailProviderConfig
): ResendProvider {
  return new ResendProvider(config);
}
