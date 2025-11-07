import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/email/gmail/callback"
);

/**
 * Generate Gmail OAuth URL
 */
export function getGmailAuthUrl(userId: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://mail.google.com/", // Full access for drafts
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent to get refresh token
    state: userId, // Pass user ID for callback
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGmailCode(
  code: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's email address
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });

    const supabase = createClient();

    // Save to database
    const { error } = await supabase.from("email_accounts").upsert({
      user_id: userId,
      organization_id: organizationId,
      provider: "gmail",
      provider_account_id: profile.data.emailAddress || "",
      email_address: profile.data.emailAddress || "",
      access_token: tokens.access_token || null,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      sync_enabled: true,
    });

    if (error) {
      console.error("Error saving Gmail account:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error exchanging Gmail code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refresh access token if expired
 */
async function refreshTokenIfNeeded(account: any): Promise<string | null> {
  if (!account.refresh_token) return account.access_token;

  const expiresAt = new Date(account.token_expires_at);
  const now = new Date();

  // Refresh if expired or expiring in next 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    oauth2Client.setCredentials({
      refresh_token: account.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update database
    const supabase = createClient();
    await supabase
      .from("email_accounts")
      .update({
        access_token: credentials.access_token,
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq("id", account.id);

    return credentials.access_token || null;
  }

  return account.access_token;
}

/**
 * Parse email body from Gmail message
 */
function parseEmailBody(message: any): { text: string; html: string } {
  let text = "";
  let html = "";

  function extractBody(part: any) {
    if (part.mimeType === "text/plain" && part.body.data) {
      text = Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.mimeType === "text/html" && part.body.data) {
      html = Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.parts) {
      part.parts.forEach(extractBody);
    }
  }

  if (message.payload.body.data) {
    text = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  } else if (message.payload.parts) {
    message.payload.parts.forEach(extractBody);
  }

  return { text, html };
}

/**
 * Extract header value
 */
function getHeader(headers: any[], name: string): string | null {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || null;
}

/**
 * AI triage: Analyze email and assign priority/category
 */
async function triageEmail(email: {
  subject: string;
  from: string;
  body: string;
}): Promise<{
  priority_score: number;
  category: string;
  summary: string;
  requires_response: boolean;
  sentiment: string;
}> {
  try {
    const prompt = `Analyze this email and provide triage information.

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 2000)}

Provide JSON with:
- priority_score: 0.0-1.0 (1.0 = most urgent)
- category: "urgent", "important", "newsletter", "promotional", "personal", "spam"
- summary: One sentence summary
- requires_response: true/false
- sentiment: "positive", "negative", "neutral"

Respond with JSON only.`;

    const response = await getChatCompletion("gpt-4o-mini", [
      {
        role: "system",
        content:
          "You are an expert email assistant. Respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        priority_score: 0.5,
        category: "personal",
        summary: email.subject,
        requires_response: false,
        sentiment: "neutral",
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error triaging email:", error);
    return {
      priority_score: 0.5,
      category: "personal",
      summary: email.subject,
      requires_response: false,
      sentiment: "neutral",
    };
  }
}

/**
 * Sync Gmail messages
 */
export async function syncGmailMessages(
  userId: string,
  organizationId: string,
  maxResults: number = 50
): Promise<{ success: boolean; emailsCount: number; error?: string }> {
  try {
    const supabase = createClient();

    // Get account
    const { data: account } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .single();

    if (!account) {
      return { success: false, emailsCount: 0, error: "No Gmail account found" };
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(account);
    if (!accessToken) {
      return { success: false, emailsCount: 0, error: "Failed to refresh token" };
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: account.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: "in:inbox", // Only sync inbox for now
    });

    const messages = listResponse.data.messages || [];
    let syncedCount = 0;

    for (const message of messages) {
      if (!message.id) continue;

      // Get full message details
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const headers = fullMessage.data.payload?.headers || [];
      const { text, html } = parseEmailBody(fullMessage.data);

      const subject = getHeader(headers, "Subject") || "(No Subject)";
      const from = getHeader(headers, "From") || "";
      const to = getHeader(headers, "To") || "";
      const cc = getHeader(headers, "Cc");
      const date = getHeader(headers, "Date");
      const messageId = getHeader(headers, "Message-ID");
      const inReplyTo = getHeader(headers, "In-Reply-To");

      // AI triage
      const triage = await triageEmail({
        subject,
        from,
        body: text || html,
      });

      // Parse labels/category
      const labels = fullMessage.data.labelIds || [];
      let category = "primary";
      if (labels.includes("CATEGORY_SOCIAL")) category = "social";
      else if (labels.includes("CATEGORY_PROMOTIONS")) category = "promotions";
      else if (labels.includes("CATEGORY_UPDATES")) category = "updates";
      else if (labels.includes("CATEGORY_FORUMS")) category = "forums";

      // Check for attachments
      const hasAttachments = fullMessage.data.payload?.parts?.some(
        (part) => part.filename && part.filename.length > 0
      );

      const emailData = {
        email_account_id: account.id,
        organization_id: organizationId,
        user_id: userId,
        provider_message_id: message.id,
        provider_thread_id: fullMessage.data.threadId || null,
        provider: "gmail",
        subject,
        from_email: from.match(/<(.+?)>/)?.[1] || from,
        from_name: from.replace(/<.+?>/, "").trim() || null,
        to_emails: to.split(",").map((e) => e.trim()),
        cc_emails: cc ? cc.split(",").map((e) => e.trim()) : [],
        body_text: text || null,
        body_html: html || null,
        snippet: fullMessage.data.snippet || null,
        labels,
        category,
        is_read: !labels.includes("UNREAD"),
        is_starred: labels.includes("STARRED"),
        is_important: labels.includes("IMPORTANT"),
        sent_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        has_attachments: hasAttachments || false,
        ai_priority_score: triage.priority_score,
        ai_category: triage.category,
        ai_summary: triage.summary,
        ai_sentiment: triage.sentiment,
        requires_response: triage.requires_response,
        in_reply_to: inReplyTo,
        raw_headers: headers,
      };

      const { error } = await supabase.from("emails").upsert(emailData, {
        onConflict: "email_account_id,provider_message_id",
      });

      if (!error) syncedCount++;
    }

    // Update sync timestamp
    await supabase
      .from("email_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", account.id);

    return { success: true, emailsCount: syncedCount };
  } catch (error) {
    console.error("Error syncing Gmail:", error);
    return {
      success: false,
      emailsCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate email draft with AI
 */
export async function generateEmailDraft(
  prompt: string,
  context?: {
    inReplyTo?: string;
    recipient?: string;
    subject?: string;
  }
): Promise<{
  subject: string;
  body_text: string;
  body_html: string;
}> {
  try {
    const systemPrompt = `You are an expert email writer. Generate professional, clear, and concise emails.

Guidelines:
- Be professional but warm
- Get to the point quickly
- Use proper email formatting
- Include appropriate greeting and closing
- Match the tone to the context`;

    let userPrompt = `Generate an email: ${prompt}`;

    if (context?.inReplyTo) {
      userPrompt += `\n\nThis is a reply to an email with subject: "${context.subject}"`;
    }
    if (context?.recipient) {
      userPrompt += `\n\nRecipient: ${context.recipient}`;
    }

    userPrompt += `\n\nProvide JSON with:
- subject: Email subject line
- body: Email body in plain text

Respond with JSON only.`;

    const response = await getChatCompletion("gpt-4o", [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Convert plain text to simple HTML
    const body_html = parsed.body
      .split("\n\n")
      .map((p: string) => `<p>${p}</p>`)
      .join("\n");

    return {
      subject: parsed.subject,
      body_text: parsed.body,
      body_html,
    };
  } catch (error) {
    console.error("Error generating email draft:", error);
    throw error;
  }
}

/**
 * Send email via Gmail
 */
export async function sendGmailMessage(
  userId: string,
  draft: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    inReplyTo?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const supabase = createClient();

    const { data: account } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .single();

    if (!account) {
      return { success: false, error: "No Gmail account found" };
    }

    const accessToken = await refreshTokenIfNeeded(account);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: account.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build email message
    const lines = [
      `From: ${account.email_address}`,
      `To: ${draft.to.join(", ")}`,
    ];

    if (draft.cc?.length) {
      lines.push(`Cc: ${draft.cc.join(", ")}`);
    }
    if (draft.bcc?.length) {
      lines.push(`Bcc: ${draft.bcc.join(", ")}`);
    }

    lines.push(`Subject: ${draft.subject}`);
    lines.push("Content-Type: text/plain; charset=utf-8");
    lines.push("");
    lines.push(draft.body);

    const message = lines.join("\n");
    const encodedMessage = Buffer.from(message).toString("base64url");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error("Error sending Gmail message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
