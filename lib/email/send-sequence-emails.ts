"use server";

import { resend, EMAIL_FROM, COMPANY_NAME, APP_URL } from "./config";

interface LeadData {
  email: string;
  full_name: string;
  company_name?: string;
}

/**
 * CONSULTATION SEQUENCE EMAILS
 */

// Day 1: Quick question about AI implementation goals
export async function sendConsultationDay1(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Quick question about your AI implementation goals",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            I wanted to reach out personally after you requested a consultation. I'd love to understand your biggest priority right now.
          </p>

          <p style="font-size: 16px; font-weight: 600;">
            What's the #1 thing you'd like AI to help your team with?
          </p>

          <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #06b6d4; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #075985;">
              <strong>Just hit reply</strong> and let me know. Some common goals I hear:
            </p>
            <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #0c4a6e;">
              <li>Reducing time spent on repetitive documentation</li>
              <li>Getting answers from internal knowledge faster</li>
              <li>Automating customer support responses</li>
              <li>Accelerating research and competitive analysis</li>
            </ul>
          </div>

          <p style="font-size: 16px;">
            Knowing your priority helps me prepare for our call and share the most relevant examples.
          </p>

          <p style="font-size: 16px;">
            Looking forward to hearing from you!
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendConsultationDay1] Error:", error);
    throw error;
  }

  return { success: true };
}

// Day 3: Quick wins
export async function sendConsultationDay3(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Here are some quick wins you can implement today",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            While we wait to chat, I wanted to share 3 quick AI wins you can implement immediately—no ${COMPANY_NAME} required (yet 😊).
          </p>

          <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">
            3 Quick Wins for Your Team
          </h2>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              1. Meeting Note Automation
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Use ChatGPT to summarize meeting transcripts. Copy/paste your meeting transcript and ask: "Summarize key decisions, action items, and owners." Saves 15-20 minutes per meeting.
            </p>
          </div>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              2. Email Response Templates
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Build a prompt library for common emails. Example: "Draft a professional follow-up email for a sales prospect who hasn't responded in 2 weeks." Build 5-10 templates your team can reuse.
            </p>
          </div>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              3. Document Q&A
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Upload your internal docs to Claude or ChatGPT and ask questions. "What's our refund policy for enterprise customers?" Much faster than Ctrl+F through 50-page PDFs.
            </p>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #047857;">
              <strong>💡 The ${COMPANY_NAME} Advantage:</strong> These are great one-off wins. We help you scale this across your entire team with shared knowledge, persistent memory, and enterprise-grade security.
            </p>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">
            Try one or two of these today and let me know how it goes!
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="${APP_URL}"
               style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Schedule Your Consultation
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendConsultationDay3] Error:", error);
    throw error;
  }

  return { success: true };
}

// Day 7: Case study
export async function sendConsultationDay7(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Case study: How a team like yours saved 750 hours/month",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            I wanted to share a real example of how a team similar to yours transformed their productivity with ${COMPANY_NAME}.
          </p>

          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 10px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #0c4a6e; font-size: 22px; margin: 0 0 20px 0;">
              The Challenge
            </h2>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #075985;">
              A 50-person product team was spending 15-20 hours per week per person on:
            </p>
            <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 15px; color: #075985;">
              <li>Searching through Slack, Notion, and Google Drive for answers</li>
              <li>Recreating work that had already been done</li>
              <li>Writing meeting summaries and documentation</li>
              <li>Onboarding new team members</li>
            </ul>

            <h2 style="color: #0c4a6e; font-size: 22px; margin: 30px 0 20px 0;">
              The Solution
            </h2>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #075985;">
              They implemented ${COMPANY_NAME} and trained it on all their internal knowledge. Now their team:
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #075985;">
              <li>Gets instant answers to questions (avg. 2 min vs 45 min before)</li>
              <li>Automatically generates meeting summaries and action items</li>
              <li>Onboards new hires 3x faster with AI-powered knowledge transfer</li>
              <li>Never loses tribal knowledge when people leave</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">
              The Results
            </h3>
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #047857;">
              <strong>750 hours saved per month</strong> (15 hours × 50 people)
            </p>
            <p style="margin: 0; font-size: 14px; color: #065f46;">
              ROI: $37,500/month in reclaimed productivity vs $1,999/month cost = <strong>18.8x ROI</strong>
            </p>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">
            Want to explore what this could look like for ${data.company_name || 'your team'}?
          </p>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${APP_URL}/consultation"
               style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Let's Talk About Your ROI
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendConsultationDay7] Error:", error);
    throw error;
  }

  return { success: true };
}

/**
 * ENTERPRISE SEQUENCE EMAILS
 */

// Day 1: Demo preparation checklist
export async function sendEnterpriseDay1(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Your enterprise demo preparation checklist",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            Thanks for requesting an enterprise demo for ${data.company_name}. To make the most of our time together, here's how to prepare:
          </p>

          <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">
            Before the Demo
          </h2>

          <div style="margin-bottom: 20px; padding: 20px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
            <h3 style="color: #6b21a8; font-size: 16px; margin: 0 0 15px 0;">
              ✓ Identify Key Stakeholders
            </h3>
            <p style="margin: 0; font-size: 14px; color: #581c87;">
              Invite decision-makers from IT, Security, and key departments. We'll address everyone's concerns in one session.
            </p>
          </div>

          <div style="margin-bottom: 20px; padding: 20px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
            <h3 style="color: #6b21a8; font-size: 16px; margin: 0 0 15px 0;">
              ✓ List Your Top 3 Use Cases
            </h3>
            <p style="margin: 0; font-size: 14px; color: #581c87;">
              What workflows are costing your team the most time? We'll show you exactly how ${COMPANY_NAME} solves them.
            </p>
          </div>

          <div style="margin-bottom: 20px; padding: 20px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
            <h3 style="color: #6b21a8; font-size: 16px; margin: 0 0 15px 0;">
              ✓ Prepare Compliance Questions
            </h3>
            <p style="margin: 0; font-size: 14px; color: #581c87;">
              Do you need SOC 2, HIPAA, GDPR compliance? Specific data residency requirements? We'll address everything upfront.
            </p>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #047857;">
              <strong>💡 Pro Tip:</strong> Bring example documents or workflows you'd like us to demonstrate with. We can show you real-time how ${COMPANY_NAME} would work with your actual data (securely, of course).
            </p>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">
            Questions before the demo? Just reply to this email!
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Enterprise Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendEnterpriseDay1] Error:", error);
    throw error;
  }

  return { success: true };
}

// Day 3: ROI Calculator
export async function sendEnterpriseDay3(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "ROI Calculator: Expected savings for your organization",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            Let's talk numbers. Here's a conservative ROI estimate for ${data.company_name}:
          </p>

          <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 10px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #6b21a8; font-size: 22px; margin: 0 0 20px 0;">
              Typical Enterprise Savings
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: white;">
                <td style="padding: 15px; border: 1px solid #e5e7eb;">Time saved per employee</td>
                <td style="padding: 15px; border: 1px solid #e5e7eb; font-weight: 600;">15 hours/month</td>
              </tr>
              <tr>
                <td style="padding: 15px; border: 1px solid #e5e7eb; background: white;">Avg. hourly rate</td>
                <td style="padding: 15px; border: 1px solid #e5e7eb; font-weight: 600; background: white;">$50/hour</td>
              </tr>
              <tr style="background: white;">
                <td style="padding: 15px; border: 1px solid #e5e7eb;">Value per employee/month</td>
                <td style="padding: 15px; border: 1px solid #e5e7eb; font-weight: 600; color: #10b981;">$750</td>
              </tr>
            </table>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 18px; color: #6b21a8; font-weight: 600;">
                For a 250-person organization:
              </p>
              <p style="margin: 0 0 5px 0; font-size: 16px; color: #374151;">
                Monthly value: <strong>$187,500</strong>
              </p>
              <p style="margin: 0 0 5px 0; font-size: 16px; color: #374151;">
                ${COMPANY_NAME} cost: <strong>$9,999/month</strong>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 20px; color: #10b981; font-weight: 700;">
                Net monthly savings: $177,501
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                ROI: <strong>1,775%</strong> | Payback period: <strong>16 days</strong>
              </p>
            </div>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>📊 Want a custom ROI analysis for ${data.company_name}?</strong><br/>
              During our demo, we'll build a detailed projection based on your actual team size, average salaries, and specific workflows.
            </p>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">
            The math is compelling, but the real value is in time your team can spend on strategic work instead of searching for information.
          </p>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${APP_URL}/enterprise-demo"
               style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Schedule Your Custom ROI Review
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Enterprise Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendEnterpriseDay3] Error:", error);
    throw error;
  }

  return { success: true };
}

// Day 7: Security & compliance
export async function sendEnterpriseDay7(data: LeadData) {
  const firstName = data.full_name.split(' ')[0];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Security & compliance: Your questions answered",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 16px;">Hi ${firstName},</p>

          <p style="font-size: 16px;">
            Security is typically the #1 concern for enterprise teams. Here's what you need to know about ${COMPANY_NAME}:
          </p>

          <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">
            Security & Compliance
          </h2>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              🔒 SOC 2 Type II Certified
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Annual audits by independent third parties. Full audit reports available upon request.
            </p>
          </div>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              🔐 Enterprise SSO & SAML
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Integrate with Okta, Azure AD, Google Workspace, or any SAML 2.0 provider. MFA enforced.
            </p>
          </div>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              🌍 Data Residency Options
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Choose where your data is stored: US, EU, or on-premise deployment for highly regulated industries.
            </p>
          </div>

          <div style="margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              📋 Compliance Ready
            </h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              GDPR, HIPAA, CCPA compliant. Full DPA and BAA available. Meets enterprise security requirements for financial services, healthcare, and government.
            </p>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #065f46; font-size: 16px; margin: 0 0 10px 0;">
              Security First by Design
            </h3>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #047857;">
              <li>End-to-end encryption for data at rest and in transit</li>
              <li>Zero-knowledge architecture - we can't access your data</li>
              <li>Comprehensive audit logs for all access and changes</li>
              <li>Regular penetration testing by independent firms</li>
              <li>24/7 security monitoring and incident response</li>
            </ul>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">
            Have specific security or compliance questions? Let's discuss them during your demo.
          </p>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${APP_URL}/enterprise-demo"
               style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Let's Address Your Security Concerns
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Best,<br/>
            <strong>The ${COMPANY_NAME} Enterprise Team</strong>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af;">
              © 2025 ${COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[SendEnterpriseDay7] Error:", error);
    throw error;
  }

  return { success: true };
}

// Template dispatcher
export async function sendSequenceEmail(template: string, data: LeadData) {
  const templates: Record<string, (data: LeadData) => Promise<{success: boolean}>> = {
    consultation_day_1: sendConsultationDay1,
    consultation_day_3: sendConsultationDay3,
    consultation_day_7: sendConsultationDay7,
    enterprise_day_1: sendEnterpriseDay1,
    enterprise_day_3: sendEnterpriseDay3,
    enterprise_day_7: sendEnterpriseDay7,
  };

  const templateFn = templates[template];
  if (!templateFn) {
    throw new Error(`Unknown email template: ${template}`);
  }

  return templateFn(data);
}
