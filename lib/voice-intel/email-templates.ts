// Voice Intelligence - Email Templates for Action Delivery
// Used by the executor to send prophecy deliveries, meeting follow-ups, and delegations

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";

// ============================================================
// Interfaces
// ============================================================

export interface ProphecyEmailData {
  recipientName: string;
  recipientEmail: string;
  propheticWord: string;
  spokenBy: string;
  spokenDate: string;
  audioClipUrl?: string;
  memoTitle?: string;
}

export interface MeetingFollowUpData {
  recipientName: string;
  recipientEmail: string;
  meetingSummary: string;
  actionItems: { title: string; assignee?: string }[];
  attendees: string[];
  meetingDate: string;
  memoTitle?: string;
}

export interface DelegationEmailData {
  recipientName: string;
  recipientEmail: string;
  taskTitle: string;
  taskDescription: string;
  delegatedBy: string;
  dueDate?: string;
  context?: string;
  relatedEntity?: string;
}

// ============================================================
// Shared layout helpers
// ============================================================

function wrapInLayout(headerTitle: string, bodyHtml: string, footerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${headerTitle}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              ${footerHtml}
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                Powered by <a href="${APP_URL}" style="color: #667eea; text-decoration: none;">Perpetual Core</a>
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// Prophecy Delivery
// ============================================================

export function buildProphecyDeliveryEmail(data: ProphecyEmailData): {
  to: string;
  subject: string;
  html: string;
} {
  const audioButtonHtml = data.audioClipUrl
    ? `<div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(data.audioClipUrl)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Listen to the Word
        </a>
      </div>`
    : "";

  const memoRef = data.memoTitle
    ? ` during &ldquo;${escapeHtml(data.memoTitle)}&rdquo;`
    : "";

  const bodyHtml = `
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      A word was spoken over you by ${escapeHtml(data.spokenBy)} and we wanted to make sure it reached you.
    </p>

    <!-- Prophetic Word -->
    <div style="border-left: 4px solid #764ba2; background-color: #faf5ff; border-radius: 0 6px 6px 0; padding: 24px 28px; margin: 30px 0;">
      <p style="margin: 0; color: #1f2937; font-size: 17px; line-height: 1.8; font-style: italic;">
        &ldquo;${escapeHtml(data.propheticWord)}&rdquo;
      </p>
    </div>

    ${audioButtonHtml}

    <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      This word was spoken${memoRef} on ${escapeHtml(data.spokenDate)} and delivered through Perpetual Core.
    </p>`;

  const footerHtml = `
    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
      If you believe you received this in error, please disregard this message.
    </p>`;

  return {
    to: data.recipientEmail,
    subject: "A Word for You from Lorenzo",
    html: wrapInLayout("A Word for You", bodyHtml, footerHtml),
  };
}

// ============================================================
// Meeting Follow-Up
// ============================================================

export function buildMeetingFollowUpEmail(data: MeetingFollowUpData): {
  to: string;
  subject: string;
  html: string;
} {
  const actionItemsHtml = data.actionItems.length > 0
    ? `<div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #111827; font-size: 16px; font-weight: 600;">Action Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.actionItems
            .map(
              (item) => `<tr>
              <td style="padding: 8px 0; color: #374151; font-size: 15px; line-height: 1.6; vertical-align: top;" width="24">&#9744;</td>
              <td style="padding: 8px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${escapeHtml(item.title)}${item.assignee ? ` <span style="color: #6b7280; font-size: 13px;">(${escapeHtml(item.assignee)})</span>` : ""}
              </td>
            </tr>`
            )
            .join("")}
        </table>
      </div>`
    : "";

  const attendeesHtml =
    data.attendees.length > 0
      ? `<p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          <strong style="color: #374151;">Attendees:</strong> ${data.attendees.map(escapeHtml).join(", ")}
        </p>`
      : "";

  const subjectSuffix = data.memoTitle || data.meetingDate;

  const bodyHtml = `
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hi ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Here is a follow-up summary from our meeting on ${escapeHtml(data.meetingDate)}.
    </p>

    <!-- Summary -->
    <div style="border-left: 4px solid #667eea; background-color: #f0f4ff; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 25px 0;">
      <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.7;">
        ${escapeHtml(data.meetingSummary)}
      </p>
    </div>

    ${actionItemsHtml}
    ${attendeesHtml}`;

  const footerHtml = `
    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
      This follow-up was generated from a voice memo recorded on ${escapeHtml(data.meetingDate)}.
    </p>`;

  return {
    to: data.recipientEmail,
    subject: `Meeting Follow-Up: ${subjectSuffix}`,
    html: wrapInLayout("Meeting Follow-Up", bodyHtml, footerHtml),
  };
}

// ============================================================
// Delegation
// ============================================================

export function buildDelegationEmail(data: DelegationEmailData): {
  to: string;
  subject: string;
  html: string;
} {
  const dueDateHtml = data.dueDate
    ? `<tr>
        <td style="padding: 8px 12px; color: #6b7280; font-size: 14px; font-weight: 600; vertical-align: top;" width="120">Due Date</td>
        <td style="padding: 8px 12px; color: #1f2937; font-size: 14px;">${escapeHtml(data.dueDate)}</td>
      </tr>`
    : "";

  const entityHtml = data.relatedEntity
    ? `<tr>
        <td style="padding: 8px 12px; color: #6b7280; font-size: 14px; font-weight: 600; vertical-align: top;" width="120">Entity</td>
        <td style="padding: 8px 12px; color: #1f2937; font-size: 14px;">${escapeHtml(data.relatedEntity)}</td>
      </tr>`
    : "";

  const contextHtml = data.context
    ? `<div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 10px; color: #111827; font-size: 15px; font-weight: 600;">Context</h3>
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${escapeHtml(data.context)}</p>
      </div>`
    : "";

  const bodyHtml = `
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hi ${escapeHtml(data.recipientName)},
    </p>

    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
      ${escapeHtml(data.delegatedBy)} has delegated a task to you.
    </p>

    <!-- Task Details -->
    <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin: 25px 0;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 14px 20px;">
        <h3 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${escapeHtml(data.taskTitle)}</h3>
      </div>
      <div style="padding: 20px;">
        <p style="margin: 0 0 15px; color: #374151; font-size: 15px; line-height: 1.6;">
          ${escapeHtml(data.taskDescription)}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
          <tr>
            <td style="padding: 8px 12px; color: #6b7280; font-size: 14px; font-weight: 600; vertical-align: top;" width="120">Delegated By</td>
            <td style="padding: 8px 12px; color: #1f2937; font-size: 14px;">${escapeHtml(data.delegatedBy)}</td>
          </tr>
          ${dueDateHtml}
          ${entityHtml}
        </table>
      </div>
    </div>

    ${contextHtml}

    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Open Dashboard
      </a>
    </div>`;

  const footerHtml = `
    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
      If you believe you received this in error, please disregard this message.
    </p>`;

  return {
    to: data.recipientEmail,
    subject: `Task Delegated: ${data.taskTitle}`,
    html: wrapInLayout("Task Delegated to You", bodyHtml, footerHtml),
  };
}
