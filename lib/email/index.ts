/**
 * Email Service
 *
 * Handles all transactional emails for the platform.
 * Uses Resend for email delivery.
 *
 * Environment variables required:
 * - RESEND_API_KEY: API key from Resend
 * - NEXT_PUBLIC_APP_URL: Base URL of the application
 */

// Email types
export type EmailType =
  | "partner_application_received"
  | "partner_application_approved"
  | "partner_application_rejected"
  | "api_key_created"
  | "marketplace_purchase_confirmation"
  | "marketplace_item_delivered";

// Email data interfaces
export interface PartnerApplicationEmailData {
  partner_name: string;
  partner_email: string;
  referral_code?: string;
  application_id?: string;
}

export interface ApiKeyEmailData {
  user_email: string;
  user_name: string;
  key_name: string;
  environment: string;
  rate_limits: {
    per_minute: number;
    per_day: number;
  };
}

export interface MarketplacePurchaseEmailData {
  buyer_email: string;
  buyer_name: string;
  item_name: string;
  item_type: string;
  price: number;
  purchase_id: string;
  download_url?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured. Email not sent:", { to, subject });
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    // Import Resend dynamically to avoid build errors if not installed
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: from || `Perpetual Core <${process.env.RESEND_FROM_EMAIL || "noreply@perpetualcore.com"}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    console.log("Email sent successfully:", { to, subject, id: data?.id });
    return { success: true };
  } catch (error: any) {
    console.error("Email service error:", error);
    return {
      success: false,
      error: error.message || "Email service error",
    };
  }
}

/**
 * Send partner application confirmation email
 */
export async function sendPartnerApplicationEmail(
  data: PartnerApplicationEmailData
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Partner Application Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Perpetual Core Partner Program</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Application Received!</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.partner_name},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for applying to the Perpetual Core Partner Program! We've received your application and our team is reviewing it.
              </p>

              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>Our team will review your application within 24 hours</li>
                  <li>You'll receive an email with the approval decision</li>
                  <li>Once approved, you'll get access to your partner dashboard</li>
                  <li>Start earning 20% recurring commissions immediately</li>
                </ul>
              </div>

              ${data.referral_code ? `
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Referral Code</p>
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">${data.referral_code}</p>
              </div>
              ` : ''}

              <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Questions? Reply to this email or contact us at <a href="mailto:${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}" style="color: #667eea; text-decoration: none;">${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © 2025 Perpetual Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(
    data.partner_email,
    "Partner Application Received - Perpetual Core",
    html
  );
}

/**
 * Send API key created email
 */
export async function sendApiKeyCreatedEmail(
  data: ApiKeyEmailData
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Key Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">API Key Created</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Welcome to Perpetual Core API!</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.user_name},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your API key "${data.key_name}" has been successfully created for the ${data.environment} environment.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> Your API key was shown only once during creation. If you didn't save it, you'll need to create a new key.
                </p>
              </div>

              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Rate Limits</h3>
                <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px; color: #4b5563;">
                  <tr>
                    <td style="font-weight: 600;">Per Minute:</td>
                    <td style="text-align: right;">${data.rate_limits.per_minute.toLocaleString()} requests</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Per Day:</td>
                    <td style="text-align: right;">${data.rate_limits.per_day.toLocaleString()} requests</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #eff6ff; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Getting Started</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>View our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs/api" style="color: #2563eb; text-decoration: none;">API Documentation</a></li>
                  <li>Check your usage in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/developers" style="color: #2563eb; text-decoration: none;">Developer Portal</a></li>
                  <li>Join our <a href="${process.env.NEXT_PUBLIC_APP_URL}/community" style="color: #2563eb; text-decoration: none;">Developer Community</a></li>
                </ul>
              </div>

              <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Questions? Contact us at <a href="mailto:${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}" style="color: #10b981; text-decoration: none;">${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © 2025 Perpetual Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(
    data.user_email,
    `API Key Created: ${data.key_name}`,
    html
  );
}

/**
 * Send marketplace purchase confirmation email
 */
export async function sendMarketplacePurchaseEmail(
  data: MarketplacePurchaseEmailData
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Purchase Confirmed!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Thank you for your purchase!</h2>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.buyer_name},
              </p>

              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your purchase has been confirmed and your ${data.item_type} is ready to use!
              </p>

              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px; font-weight: 600;">Order Details</h3>
                <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px; color: #4b5563;">
                  <tr>
                    <td style="font-weight: 600;">Item:</td>
                    <td style="text-align: right;">${data.item_name}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Type:</td>
                    <td style="text-align: right; text-transform: capitalize;">${data.item_type}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Price:</td>
                    <td style="text-align: right;">$${data.price.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Order ID:</td>
                    <td style="text-align: right; font-family: monospace; font-size: 13px;">${data.purchase_id}</td>
                  </tr>
                </table>
              </div>

              ${data.download_url ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.download_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Access Your ${data.item_type === 'agent' ? 'Agent' : 'Workflow'}
                </a>
              </div>
              ` : ''}

              <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                View your purchases anytime in <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/my-purchases" style="color: #6366f1; text-decoration: none;">My Purchases</a>.
              </p>

              <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Questions? Contact us at <a href="mailto:${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}" style="color: #6366f1; text-decoration: none;">${process.env.EMAIL_SUPPORT_ADDRESS || "support@perpetualcore.com"}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                © 2025 Perpetual Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(
    data.buyer_email,
    `Purchase Confirmed: ${data.item_name}`,
    html
  );
}

/**
 * Send beta invite email
 */
export async function sendBetaInviteEmail(
  email: string,
  inviteCode: string,
  betaTier: string
): Promise<{ success: boolean; error?: string }> {
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"}/signup`;

  const subject = "You're Invited to Beta Test Perpetual Core! 🚀";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        padding: 30px 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: white;
        margin: 0;
        font-size: 28px;
      }
      .content {
        background: #f9fafb;
        padding: 30px;
        border-radius: 10px;
        margin-bottom: 20px;
      }
      .invite-code {
        background: white;
        border: 2px dashed #667eea;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 25px 0;
      }
      .code {
        font-size: 32px;
        font-weight: bold;
        color: #667eea;
        letter-spacing: 4px;
        font-family: 'Courier New', monospace;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 40px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        margin: 20px 0;
        text-align: center;
      }
      .footer {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      .feature {
        margin: 15px 0;
        padding-left: 20px;
      }
      .feature::before {
        content: "✨";
        margin-right: 10px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Welcome to Perpetual Core</h1>
    </div>

    <div class="content">
      <p>Hey there! 👋</p>

      <p>I'm excited to personally invite you to beta test <strong>Perpetual Core</strong> - an AI-powered platform that's changing how people work with information and documents.</p>

      <h2 style="color: #667eea; margin-top: 25px;">What is Perpetual Core?</h2>
      <p>Perpetual Core is your intelligent workspace that combines:</p>

      <div class="feature">Advanced AI chat with real-time context understanding</div>
      <div class="feature">Document processing and knowledge extraction</div>
      <div class="feature">Powerful search across all your content</div>
      <div class="feature">Seamless integration with your workflow</div>

      <p style="margin-top: 25px;">Think of it as your AI brain that remembers everything, understands context, and helps you work smarter.</p>

      <h2 style="color: #667eea; margin-top: 30px;">Your Beta Access Code</h2>

      <div class="invite-code">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your exclusive invite code:</p>
        <div class="code">${inviteCode}</div>
        <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">Beta Tier: <strong>${betaTier.charAt(0).toUpperCase() + betaTier.slice(1)}</strong></p>
      </div>

      <div style="text-align: center;">
        <a href="${signupUrl}" class="cta-button">Get Started Now →</a>
      </div>

      <h2 style="color: #667eea; margin-top: 30px;">I Need Your Feedback! 💬</h2>
      <p>As a beta tester, your feedback is incredibly valuable. I want to know:</p>
      <ul style="color: #4b5563;">
        <li>What features do you love?</li>
        <li>What's confusing or not working well?</li>
        <li>What would make this indispensable for you?</li>
        <li>Any bugs or issues you encounter</li>
      </ul>

      <p>Feel free to reply directly to this email with any thoughts, questions, or feedback. I read every response personally.</p>

      <p style="margin-top: 25px;"><strong>Pro tip:</strong> The more you use it, the better it gets at understanding your needs. Don't hesitate to push it to its limits!</p>
    </div>

    <div class="footer">
      <p><strong>Thanks for being part of this journey!</strong></p>
      <p>Looking forward to hearing what you think.</p>
      <p style="margin-top: 15px;">
        Questions? Just reply to this email.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"}" style="color: #667eea;">${(process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com").replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </body>
</html>
  `;

  return sendEmail(email, subject, html, "Perpetual Core <noreply@perpetualcore.com>");
}

/**
 * Send beta follow-up email
 */
export async function sendBetaFollowUpEmail(
  email: string,
  daysInactive: number | null
): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"}/dashboard`;

  const subject = daysInactive === null
    ? "How's Your Perpetual Core Experience Going?"
    : `Miss You! Check Out What's New in Perpetual Core`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        padding: 30px 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: white;
        margin: 0;
        font-size: 28px;
      }
      .content {
        background: #f9fafb;
        padding: 30px;
        border-radius: 10px;
        margin-bottom: 20px;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 40px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        margin: 20px 0;
        text-align: center;
      }
      .footer {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      .question-box {
        background: #fff;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 25px 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${daysInactive === null ? "👋 Hey There!" : "We Miss You!"}</h1>
    </div>

    <div class="content">
      <p>Hi there! 👋</p>

      ${daysInactive === null ? `
        <p>I wanted to check in and see how you're finding <strong>Perpetual Core</strong>!</p>

        <p>As a beta tester, your experience and feedback are crucial to making this the best product possible. I'd love to hear:</p>
      ` : `
        <p>I noticed you haven't been active on <strong>Perpetual Core</strong> for a few days, and I wanted to reach out personally.</p>

        <p>I know everyone's busy, but I wanted to make sure:</p>
        <ul style="color: #4b5563;">
          <li>Is everything working smoothly for you?</li>
          <li>Did you run into any issues or frustrations?</li>
          <li>Is there something missing that would make it more useful?</li>
        </ul>

        <p style="margin-top: 25px;">Your honest feedback - even if it's critical - helps me improve this for everyone. Plus, as a beta tester, you have a direct line to me!</p>
      `}

      <div class="question-box">
        <h3 style="margin: 0 0 15px; color: #667eea;">Quick Feedback Questions:</h3>
        <ul style="color: #4b5563; margin: 0;">
          <li>What's been your favorite feature so far?</li>
          <li>What's been frustrating or confusing?</li>
          <li>What would make you use it every day?</li>
          <li>Any bugs or issues I should know about?</li>
        </ul>
      </div>

      <p>Just hit reply and let me know your thoughts - I read every email personally and really value your input.</p>

      ${daysInactive !== null ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" class="cta-button">Jump Back In →</a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 15px;">
          (We've been making improvements based on beta tester feedback!)
        </p>
      ` : `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" class="cta-button">Go to Dashboard →</a>
        </div>
      `}

      <p style="margin-top: 30px;"><strong>Thank you</strong> for being part of this beta. Your feedback is making a real difference!</p>
    </div>

    <div class="footer">
      <p>Looking forward to hearing from you!</p>
      <p style="margin-top: 15px;">
        Just reply to this email with your thoughts.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"}" style="color: #667eea;">${(process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com").replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </body>
</html>
  `;

  return sendEmail(email, subject, html, "Perpetual Core <noreply@perpetualcore.com>");
}

/**
 * Send sales inquiry email to sales team
 */
export async function sendSalesInquiryEmail(data: {
  name: string;
  email: string;
  company: string;
  phone?: string;
  employees: string;
  plan: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  const salesTeamEmail = process.env.SALES_EMAIL || "sales@perpetualcore.com";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Sales Inquiry</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">New ${data.plan} Inquiry</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">Contact Details</h2>
              <table width="100%" cellpadding="10" style="font-size: 15px; color: #4b5563;">
                <tr><td style="font-weight: 600; width: 140px;">Name:</td><td>${data.name}</td></tr>
                <tr><td style="font-weight: 600;">Email:</td><td><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></td></tr>
                <tr><td style="font-weight: 600;">Company:</td><td>${data.company}</td></tr>
                <tr><td style="font-weight: 600;">Phone:</td><td>${data.phone || "Not provided"}</td></tr>
                <tr><td style="font-weight: 600;">Company Size:</td><td>${data.employees}</td></tr>
                <tr><td style="font-weight: 600;">Interested In:</td><td><strong>${data.plan}</strong></td></tr>
              </table>
              ${data.message ? `
              <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px;">
                <p style="margin: 0 0 10px; font-weight: 600; color: #111827;">Message:</p>
                <p style="margin: 0; color: #4b5563;">${data.message}</p>
              </div>
              ` : ""}
              <div style="margin-top: 30px; text-align: center;">
                <a href="mailto:${data.email}" style="display: inline-block; background: #1e40af; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reply to ${data.name}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(salesTeamEmail, `New ${data.plan} Inquiry from ${data.company}`, html);
}

/**
 * Send confirmation email to sales prospect
 */
export async function sendSalesConfirmationEmail(data: {
  name: string;
  email: string;
  plan: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You for Your Interest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Thank You!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in Perpetual Core's <strong>${data.plan}</strong> plan! We've received your inquiry and our sales team will get back to you within 24 hours.
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">In the meantime:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>Explore our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs" style="color: #667eea;">documentation</a></li>
                  <li>Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="color: #667eea;">pricing details</a></li>
                  <li>View <a href="${process.env.NEXT_PUBLIC_APP_URL}/case-studies" style="color: #667eea;">customer success stories</a></li>
                </ul>
              </div>
              <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px;">
                Best regards,<br>
                <strong>The Perpetual Core Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, "Thanks for your interest in Perpetual Core", html);
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(data: {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${data.inviteToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on Perpetual Core as a <strong>${data.role}</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center;">
                Or copy this link: <a href="${inviteUrl}" style="color: #10b981;">${inviteUrl}</a>
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                  This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, `${data.inviterName} invited you to join ${data.organizationName}`, html);
}

/**
 * Send referral/invite email
 */
export async function sendReferralInviteEmail(data: {
  email: string;
  senderName: string;
  message?: string;
  referralLink: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation to Perpetual Core</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${data.senderName}</strong> invited you to join Perpetual Core.
              </p>
              ${data.message ? `
              <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 15px 20px; margin: 20px 0;">
                <p style="margin: 0; color: #4b5563; font-style: italic;">"${data.message}"</p>
              </div>
              ` : ""}
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Perpetual Core is an AI-powered platform that helps you work smarter with intelligent document processing, powerful search, and an AI assistant that remembers everything.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.referralLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center;">
                Or copy this link: <a href="${data.referralLink}" style="color: #6366f1;">${data.referralLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, `${data.senderName} invited you to Perpetual Core`, html);
}

/**
 * Send admin notification for new partner application
 */
export async function sendPartnerAdminNotificationEmail(data: {
  partner_name: string;
  partner_email: string;
  partner_type?: string;
  company_name?: string;
  application_id: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@perpetualcore.com";
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/partners/${data.application_id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Partner Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">New Partner Application</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px;">
                A new partner application requires review:
              </p>
              <table width="100%" cellpadding="10" style="font-size: 15px; color: #4b5563; background-color: #f3f4f6; border-radius: 6px;">
                <tr><td style="font-weight: 600; width: 140px;">Name:</td><td>${data.partner_name}</td></tr>
                <tr><td style="font-weight: 600;">Email:</td><td>${data.partner_email}</td></tr>
                ${data.company_name ? `<tr><td style="font-weight: 600;">Company:</td><td>${data.company_name}</td></tr>` : ""}
                ${data.partner_type ? `<tr><td style="font-weight: 600;">Type:</td><td>${data.partner_type}</td></tr>` : ""}
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${reviewUrl}" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Review Application</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(adminEmail, `New Partner Application: ${data.partner_name}`, html);
}

/**
 * Send trial ending notification
 */
export async function sendTrialEndingEmail(data: {
  email: string;
  name: string;
  daysRemaining: number;
  plan: string;
}): Promise<{ success: boolean; error?: string }> {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Trial is Ending Soon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Your Trial Ends in ${data.daysRemaining} Days</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your ${data.plan} trial is ending soon. To continue enjoying all the features without interruption, please add a payment method.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Upgrade Now</a>
              </div>
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, `Your Perpetual Core trial ends in ${data.daysRemaining} days`, html);
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(data: {
  email: string;
  name: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  invoicePdf?: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: data.currency.toUpperCase(),
  }).format(data.amount / 100);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for your payment. Here's your receipt:
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Amount Paid</p>
                <p style="margin: 0; color: #111827; font-size: 32px; font-weight: 700;">${formattedAmount}</p>
              </div>
              ${data.invoiceUrl || data.invoicePdf ? `
              <div style="text-align: center; margin: 30px 0;">
                ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 5px;">View Invoice</a>` : ""}
                ${data.invoicePdf ? `<a href="${data.invoicePdf}" style="display: inline-block; background: #6b7280; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 5px;">Download PDF</a>` : ""}
              </div>
              ` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, `Payment Receipt - ${formattedAmount}`, html);
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(data: {
  email: string;
  name: string;
  amount: number;
  currency: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: data.currency.toUpperCase(),
  }).format(data.amount / 100);
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We were unable to process your payment of <strong>${formattedAmount}</strong>. Please update your payment method to avoid any interruption in service.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${billingUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Update Payment Method</a>
              </div>
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px;">
                If you believe this is an error, please contact your bank or reply to this email for assistance.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, "Action Required: Payment Failed", html);
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(data: {
  email: string;
  name: string;
  planName: string;
}): Promise<{ success: boolean; error?: string }> {
  const resubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subscription Canceled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Subscription Canceled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${data.name},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your <strong>${data.planName}</strong> subscription has been canceled. You've been downgraded to the Free plan.
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If this was a mistake or you'd like to resubscribe, you can upgrade anytime from your billing settings.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resubscribeUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Resubscribe</a>
              </div>
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                We'd love to have you back. Reply to this email if you have any questions.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(data.email, "Your Perpetual Core Subscription Has Been Canceled", html);
}
