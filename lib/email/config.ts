import { Resend } from "resend";

// Allow graceful degradation if RESEND_API_KEY is not set
const resendApiKey = process.env.RESEND_API_KEY;
// Don't throw during build - only warn
if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not defined - email functionality will be disabled");
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email configuration - all addresses should be configurable via environment variables
export const EMAIL_CONFIG = {
  // Primary from address for transactional emails
  from: process.env.EMAIL_FROM_ADDRESS || process.env.RESEND_FROM_EMAIL || "noreply@perpetualcore.com",

  // Support email for customer inquiries
  support: process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com",

  // Sales email for lead notifications
  sales: process.env.EMAIL_SALES_ADDRESS || "sales@perpetualcore.com",

  // Admin notification recipients (comma-separated)
  adminNotifications: process.env.ADMIN_NOTIFICATION_EMAILS || "admin@perpetualcore.com",

  // Company branding
  companyName: process.env.NEXT_PUBLIC_APP_NAME || "Perpetual Core",

  // App URL for links in emails
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.perpetualcore.com",
};

// Legacy exports for backward compatibility
export const EMAIL_FROM = EMAIL_CONFIG.from;
export const COMPANY_NAME = EMAIL_CONFIG.companyName;
export const APP_URL = EMAIL_CONFIG.appUrl;
