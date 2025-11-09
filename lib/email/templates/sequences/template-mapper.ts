import { render } from "@react-email/render";
import { NurtureDay1 } from "./NurtureDay1";
import { NurtureDay2 } from "./NurtureDay2";
import { NurtureDay3 } from "./NurtureDay3";
import { SalesDay1 } from "./SalesDay1";

interface TemplateData {
  firstName: string;
  leadMagnetName?: string;
  leadMagnetUrl?: string;
  [key: string]: any;
}

// Map template names from database to React components
const templateMap: Record<string, (data: TemplateData) => React.ReactElement> = {
  nurture_day_1: (data) => NurtureDay1({
    firstName: data.firstName,
    leadMagnetName: data.leadMagnetName || "AI Productivity Guide",
    leadMagnetUrl: data.leadMagnetUrl || `${process.env.NEXT_PUBLIC_APP_URL}/downloads/ai-productivity-guide.pdf`,
  }),
  nurture_day_2: (data) => NurtureDay2({ firstName: data.firstName }),
  nurture_day_3: (data) => NurtureDay3({ firstName: data.firstName }),
  sales_day_1: (data) => SalesDay1({
    firstName: data.firstName,
    companyName: data.companyName,
  }),
};

/**
 * Renders an email template to HTML based on the template name
 * @param templateName - The template identifier from the database
 * @param data - The data to pass to the template
 * @returns Rendered HTML string
 */
export async function renderEmailTemplate(
  templateName: string,
  data: TemplateData
): Promise<string> {
  const templateFn = templateMap[templateName];

  if (!templateFn) {
    console.warn(`Template "${templateName}" not found, using fallback`);
    // Fallback to a generic template
    return getFallbackTemplate(data);
  }

  try {
    const emailComponent = templateFn(data);
    const html = await render(emailComponent);
    return html;
  } catch (error) {
    console.error(`Error rendering template "${templateName}":`, error);
    return getFallbackTemplate(data);
  }
}

/**
 * Fallback template for when specific template doesn't exist yet
 */
function getFallbackTemplate(data: TemplateData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Perpetual Core</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.firstName || "there"}!</h2>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for being part of the Perpetual Core community. We're working on bringing you valuable AI insights and tools to transform your workflow.
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Stay tuned for more updates!
          </p>

          <div style="margin: 30px 0; padding: 20px; background-color: white; border-left: 4px solid #8b5cf6; border-radius: 4px;">
            <p style="margin: 0; color: #4b5563; font-size: 15px;">
              <strong>💡 Quick Tip:</strong> The best way to get started with AI is to pick one repetitive task and automate it first. Small wins lead to big transformations!
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Perpetual Core Team<br>
            <a href="https://www.perpetualcore.com" style="color: #8b5cf6;">www.perpetualcore.com</a>
          </p>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            <a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get list of all available templates
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(templateMap);
}

/**
 * Check if a template exists
 */
export function templateExists(templateName: string): boolean {
  return templateName in templateMap;
}
