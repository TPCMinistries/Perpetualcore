"use server";

import { resend, EMAIL_FROM, COMPANY_NAME, APP_URL } from "./config";

interface ConsultationConfirmationProps {
  email: string;
  full_name: string;
  company_name?: string;
}

interface EnterpriseDemoConfirmationProps {
  email: string;
  full_name: string;
  company_name: string;
}

/**
 * Send confirmation email to prospect who booked a consultation
 */
export async function sendConsultationConfirmation(data: ConsultationConfirmationProps) {
  try {
    const firstName = data.full_name.split(' ')[0];

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject: `We received your consultation request`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Consultation Request Received</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We'll be in touch shortly</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Thanks for your interest in ${COMPANY_NAME}! We've received your consultation request and are excited to learn more about ${data.company_name ? `${data.company_name}'s` : 'your'} needs.
              </p>

              <div style="background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">What happens next?</p>
                <p style="margin: 0; font-size: 14px; color: #075985;">
                  Our team will reach out to you <strong>within 2 hours</strong> to schedule your consultation call. We'll work with you to find a time that fits your schedule.
                </p>
              </div>

              <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">During Your Consultation</h2>

              <ul style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  Learn how ${COMPANY_NAME} can streamline your team's workflow
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  Discuss your specific use cases and requirements
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  Get a personalized demo tailored to your needs
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  Explore pricing options that fit your budget
                </li>
              </ul>

              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>💡 Pro Tip:</strong> Think about your team's biggest workflow challenges before the call. This will help us show you exactly how ${COMPANY_NAME} can solve them!
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 15px; color: #6b7280;">
                In the meantime, feel free to explore our website or check out our documentation to learn more about what we can do for you.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <a href="${APP_URL}"
                   style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Visit Our Website
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Questions in the meantime? Just reply to this email and we'll be happy to help!
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Best regards,<br/>
                <strong>The ${COMPANY_NAME} Team</strong>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">
                © 2025 ${COMPANY_NAME}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0;">
                AI-powered knowledge platform with persistent memory, RAG, and multi-model intelligence
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[SendConsultationConfirmation] Resend error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[SendConsultationConfirmation] Error:", error);
    return { error: error.message || "Failed to send confirmation" };
  }
}

/**
 * Send confirmation email to prospect who requested an enterprise demo
 */
export async function sendEnterpriseDemoConfirmation(data: EnterpriseDemoConfirmationProps) {
  try {
    const firstName = data.full_name.split(' ')[0];

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject: `Your enterprise demo request has been received`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enterprise Demo Request Received</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You, ${data.company_name}!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your enterprise demo is being scheduled</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for ${data.company_name}'s interest in ${COMPANY_NAME} Enterprise! We're excited about the opportunity to show you how our platform can transform your team's productivity.
              </p>

              <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #581c87; font-weight: 600;">What happens next?</p>
                <p style="margin: 0; font-size: 14px; color: #6b21a8;">
                  Our enterprise team will contact you <strong>within 24 hours</strong> to schedule your personalized demo. We'll arrange a time that works best for your key stakeholders.
                </p>
              </div>

              <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Your Enterprise Demo Will Include</h2>

              <ul style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Custom walkthrough</strong> tailored to ${data.company_name}'s specific use cases
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Security & compliance</strong> review including SOC 2, GDPR, and enterprise-grade features
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Integration options</strong> with your existing tools and workflows
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Scalability discussion</strong> for your team size and growth plans
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Custom pricing</strong> and implementation roadmap
                </li>
                <li style="margin-bottom: 12px; font-size: 15px; color: #374151;">
                  <strong>Q&A session</strong> with our product and engineering teams
                </li>
              </ul>

              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #065f46; font-weight: 600;">
                  🚀 Prepare for Your Demo
                </p>
                <p style="margin: 0; font-size: 14px; color: #047857;">
                  To make the most of your demo, consider inviting key decision-makers and preparing a list of specific workflows or challenges you'd like us to address. This helps us tailor the demo to your exact needs.
                </p>
              </div>

              <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Enterprise Features at a Glance</h2>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px;">✓ SSO & Advanced Security</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px;">✓ Dedicated Support</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 14px;">✓ Custom Integrations</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 14px;">✓ Advanced Analytics</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px;">✓ Unlimited Usage</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px;">✓ White-glove Onboarding</td>
                </tr>
              </table>

              <p style="margin-top: 30px; font-size: 15px; color: #6b7280;">
                In the meantime, feel free to explore our enterprise case studies or reach out with any preliminary questions.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <a href="${APP_URL}"
                   style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Learn More About Enterprise
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Have questions before your demo? Just reply to this email or call us directly. We're here to help!
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Best regards,<br/>
                <strong>The ${COMPANY_NAME} Enterprise Team</strong>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">
                © 2025 ${COMPANY_NAME}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0;">
                AI-powered knowledge platform with persistent memory, RAG, and multi-model intelligence
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[SendEnterpriseDemoConfirmation] Resend error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[SendEnterpriseDemoConfirmation] Error:", error);
    return { error: error.message || "Failed to send confirmation" };
  }
}
