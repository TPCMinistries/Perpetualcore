/**
 * Vellum early-access confirmation email template.
 *
 * Vellum by Perpetual Core — institutional memory for organizations.
 * STUDIO-VW-01 / Plan 12-04.
 *
 * 30% mission-driven discount sourced from BRAND_ARCHITECTURE.md §8
 * (Lorenzo's pricing lock, locked 2026-05-10). Do not change this
 * percentage without Lorenzo's explicit approval.
 */

export interface VellumEarlyAccessEmailProps {
  firstName?: string;
  tierPreference: "free" | "operator" | "team" | "institution";
  is501c3: boolean;
}

function getTierBody(tier: VellumEarlyAccessEmailProps["tierPreference"]): string {
  switch (tier) {
    case "free":
      return "You're set. We'll email when free-tier accounts open.";
    case "operator":
      return "We've held a spot for the $299/month Operator tier. We'll reach out when invitations go out — no charge until you confirm.";
    case "team":
      return "We've held a spot for the $1,500/month Team tier. We'll reach out when invitations go out — no charge until you confirm.";
    case "institution":
      return "We'll reach out within five business days to scope an Institution tier engagement.";
    default:
      return "We'll be in touch when early access opens.";
  }
}

/**
 * Returns an HTML string (plain HTML template pattern matching existing codebase).
 * Used by sendVellumEarlyAccessEmail in lib/email/send-vellum-early-access.ts.
 */
export function VellumEarlyAccessEmail({
  firstName,
  tierPreference,
  is501c3,
}: VellumEarlyAccessEmailProps): string {
  const greeting = `Hi ${firstName ?? "there"},`;
  const tierBody = getTierBody(tierPreference);
  const show501c3 = is501c3 && (tierPreference === "operator" || tierPreference === "team");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the Vellum early-access list</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Perpetual Core</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Vellum</h1>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Institutional memory for organizations</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thanks for joining the Vellum early-access list. Vellum is institutional memory for organizations — calls, docs, voice notes, and channels synthesized into one queryable mind.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 16px 20px; margin: 28px 0; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6; font-weight: 500;">
                  ${tierBody}
                </p>
              </div>

              ${show501c3 ? `
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We've flagged your account for the <strong>30% mission-driven discount</strong> on Operator and Team tiers.
              </p>
              ` : ""}

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                10% of every Vellum subscription funds the <a href="https://theiha.org" style="color: #0f172a; font-weight: 600; text-decoration: underline;">Institute for Human Advancement</a> — workforce development for low-income New Yorkers and field health programs in East Africa.
              </p>

              <p style="margin: 32px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                — Lorenzo and the Perpetual Core team
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                Vellum by Perpetual Core &nbsp;&middot;&nbsp; <a href="https://perpetualcore.com" style="color: #64748b; text-decoration: none;">perpetualcore.com</a>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                You're receiving this because you joined the Vellum early-access list.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default VellumEarlyAccessEmail;
