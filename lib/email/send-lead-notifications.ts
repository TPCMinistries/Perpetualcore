"use server";

import { resend, EMAIL_FROM } from "./config";

interface ConsultationBookingNotificationProps {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  company_size?: string;
  budget_range?: string;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface EnterpriseDemoNotificationProps {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  job_title?: string;
  phone?: string;
  company_size?: string;
  industry?: string;
  use_case?: string;
  estimated_users?: number;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// Admin notification email addresses
const ADMIN_EMAILS = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || ['admin@perpetualcore.com'];

/**
 * Send admin notification for new consultation booking
 */
export async function sendConsultationBookingNotification(data: ConsultationBookingNotificationProps) {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAILS,
      subject: `🔔 New Consultation Booking - ${data.full_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Consultation Booking</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📞 New Consultation Booking</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Action required within 2 hours</p>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <div style="background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                  <strong>⏰ Response Time:</strong> Contact within 2 hours to meet customer expectations
                </p>
              </div>

              <h2 style="color: #111827; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Contact Information</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                    <a href="mailto:${data.email}" style="color: #06b6d4; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                    <a href="tel:${data.phone}" style="color: #06b6d4; text-decoration: none;">${data.phone}</a>
                  </td>
                </tr>
                ` : ''}
                ${data.company_name ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Company:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.company_name}</td>
                </tr>
                ` : ''}
              </table>

              ${data.company_size || data.budget_range ? `
              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Business Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                ${data.company_size ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Company Size:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.company_size}</td>
                </tr>
                ` : ''}
                ${data.budget_range ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Budget Range:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.budget_range}</td>
                </tr>
                ` : ''}
              </table>
              ` : ''}

              ${data.notes ? `
              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Additional Notes</h2>
              <p style="background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 14px; color: #374151; margin: 0;">${data.notes}</p>
              ` : ''}

              ${data.utm_source || data.utm_medium || data.utm_campaign ? `
              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Attribution</h2>

              <table style="width: 100%; border-collapse: collapse;">
                ${data.utm_source ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Source:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_source}</td>
                </tr>
                ` : ''}
                ${data.utm_medium ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Medium:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_medium}</td>
                </tr>
                ` : ''}
                ${data.utm_campaign ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Campaign:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_campaign}</td>
                </tr>
                ` : ''}
              </table>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.perpetualcore.com'}/admin?tab=leads"
                   style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View in Admin Panel →
                </a>
              </div>

              <p style="margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 6px; font-size: 13px; color: #92400e;">
                <strong>⚡ Quick Actions:</strong><br/>
                1. Reply to ${data.email} within 2 hours<br/>
                2. Update status in admin panel<br/>
                3. Add to CRM/calendar if needed
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 15px; color: #9ca3af; font-size: 11px;">
              <p style="margin: 0;">Perpetual Core Lead Management System</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[SendConsultationNotification] Resend error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[SendConsultationNotification] Error:", error);
    return { error: error.message || "Failed to send notification" };
  }
}

/**
 * Send admin notification for new enterprise demo request
 */
export async function sendEnterpriseDemoNotification(data: EnterpriseDemoNotificationProps) {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAILS,
      subject: `🎯 New Enterprise Demo Request - ${data.company_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Enterprise Demo Request</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏢 New Enterprise Demo Request</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">High-priority enterprise lead</p>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #581c87;">
                  <strong>⏰ Response Time:</strong> Contact within 24 hours to schedule demo
                </p>
              </div>

              <h2 style="color: #111827; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Contact Information</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.full_name}</td>
                </tr>
                ${data.job_title ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Title:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.job_title}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                    <a href="mailto:${data.email}" style="color: #8b5cf6; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                    <a href="tel:${data.phone}" style="color: #8b5cf6; text-decoration: none;">${data.phone}</a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Company:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.company_name}</td>
                </tr>
              </table>

              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Company Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                ${data.industry ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Industry:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.industry}</td>
                </tr>
                ` : ''}
                ${data.company_size ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Company Size:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.company_size}</td>
                </tr>
                ` : ''}
                ${data.estimated_users ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Est. Users:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.estimated_users}</td>
                </tr>
                ` : ''}
                ${data.use_case ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Use Case:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.use_case}</td>
                </tr>
                ` : ''}
              </table>

              ${data.notes ? `
              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Additional Notes</h2>
              <p style="background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 14px; color: #374151; margin: 0;">${data.notes}</p>
              ` : ''}

              ${data.utm_source || data.utm_medium || data.utm_campaign ? `
              <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Attribution</h2>

              <table style="width: 100%; border-collapse: collapse;">
                ${data.utm_source ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;"><strong>Source:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_source}</td>
                </tr>
                ` : ''}
                ${data.utm_medium ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Medium:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_medium}</td>
                </tr>
                ` : ''}
                ${data.utm_campaign ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Campaign:</strong></td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${data.utm_campaign}</td>
                </tr>
                ` : ''}
              </table>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.perpetualcore.com'}/admin?tab=leads"
                   style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View in Admin Panel →
                </a>
              </div>

              <p style="margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 6px; font-size: 13px; color: #92400e;">
                <strong>⚡ Quick Actions:</strong><br/>
                1. Send personalized reply to ${data.email}<br/>
                2. Schedule demo call (30-60 minutes)<br/>
                3. Update status in admin panel<br/>
                4. Prepare custom demo based on use case
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 15px; color: #9ca3af; font-size: 11px;">
              <p style="margin: 0;">Perpetual Core Lead Management System</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[SendEnterpriseNotification] Resend error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[SendEnterpriseNotification] Error:", error);
    return { error: error.message || "Failed to send notification" };
  }
}
