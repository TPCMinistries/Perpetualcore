"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendBetaCodeEmailProps {
  email: string;
  betaCode: string;
  betaTier: string;
}

export async function sendBetaCodeEmail({
  email,
  betaCode,
  betaTier,
}: SendBetaCodeEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Perpetual Core <onboarding@perpetualcore.com>",
      to: email,
      subject: "🎉 Your Perpetual Core Beta Access Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Beta Code</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Perpetual Core!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your exclusive beta access is ready</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi there! 👋</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                You've been invited to join Perpetual Core as a <strong>${betaTier === 'unlimited' ? 'Premium' : 'Standard'}</strong> beta tester!
              </p>

              <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Beta Code</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px; font-family: 'Courier New', monospace;">${betaCode}</p>
              </div>

              <h2 style="color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">Getting Started</h2>

              <ol style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 15px; font-size: 15px;">
                  <strong>Visit the signup page:</strong><br/>
                  <a href="https://perpetualcore.com/signup" style="color: #667eea; text-decoration: none;">https://perpetualcore.com/signup</a>
                </li>
                <li style="margin-bottom: 15px; font-size: 15px;">
                  <strong>Fill in your details:</strong><br/>
                  Enter your name, email address, and create a secure password
                </li>
                <li style="margin-bottom: 15px; font-size: 15px;">
                  <strong>Enter your beta code:</strong><br/>
                  Copy and paste the code above into the "Beta Invite Code" field
                </li>
                <li style="margin-bottom: 15px; font-size: 15px;">
                  <strong>Complete registration:</strong><br/>
                  Click "Sign up" and you're all set!
                </li>
              </ol>

              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Important:</strong> This code can only be used <strong>once</strong> and expires on <strong>December 6, 2025</strong>.
                </p>
              </div>

              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <a href="https://perpetualcore.com/signup" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Create Your Account →
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Need help? Reply to this email and we'll be happy to assist you.
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Best regards,<br/>
                <strong>The Perpetual Core Team</strong>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">
                © 2025 Perpetual Core. All rights reserved.
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
      console.error("[SendBetaCode] Resend error:", error);
      return { error: error.message };
    }

    return { success: true, emailId: data?.id };
  } catch (error: any) {
    console.error("[SendBetaCode] Error:", error);
    return { error: error.message || "Failed to send email" };
  }
}
