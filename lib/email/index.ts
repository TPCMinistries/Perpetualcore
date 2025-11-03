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
      from: from || "Perpetual Core <noreply@aios.com>",
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
                Questions? Reply to this email or contact us at <a href="mailto:partners@aios.com" style="color: #667eea; text-decoration: none;">partners@aios.com</a>
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
                Questions? Contact us at <a href="mailto:api@aios.com" style="color: #10b981; text-decoration: none;">api@aios.com</a>
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
                Questions? Contact us at <a href="mailto:support@aios.com" style="color: #6366f1; text-decoration: none;">support@aios.com</a>
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
  const signupUrl = `https://perpetualcore.com/signup`;

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
        <a href="https://perpetualcore.com" style="color: #667eea;">perpetualcore.com</a>
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
  const dashboardUrl = `https://perpetualcore.com/dashboard`;

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
        <a href="https://perpetualcore.com" style="color: #667eea;">perpetualcore.com</a>
      </p>
    </div>
  </body>
</html>
  `;

  return sendEmail(email, subject, html, "Perpetual Core <noreply@perpetualcore.com>");
}
