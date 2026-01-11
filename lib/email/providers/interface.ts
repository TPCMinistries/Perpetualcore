/**
 * Email Provider Interface
 *
 * Defines the contract for email providers (Resend, SendGrid, SES, etc.)
 * Enables swappable email backends per organization
 */

export interface EmailSendParams {
  from: string;
  fromName?: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface EmailProviderConfig {
  apiKey: string;
  domain?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

/**
 * Abstract email provider interface
 * All email providers must implement this interface
 */
export interface IEmailProvider {
  /**
   * Provider identifier (e.g., 'resend', 'sendgrid', 'ses')
   */
  readonly name: string;

  /**
   * Send an email
   */
  send(params: EmailSendParams): Promise<EmailSendResult>;

  /**
   * Verify domain for sending (if supported)
   */
  verifyDomain?(domain: string): Promise<{
    verified: boolean;
    records?: Array<{
      type: string;
      name: string;
      value: string;
    }>;
  }>;

  /**
   * Check domain verification status
   */
  checkDomainStatus?(domain: string): Promise<{
    verified: boolean;
    status: string;
  }>;
}

/**
 * Email provider factory type
 */
export type EmailProviderFactory = (
  config: EmailProviderConfig
) => IEmailProvider;
