/**
 * Gmail Skill
 *
 * AI-powered email management via Gmail.
 * Leverages existing sync infrastructure in lib/email/gmail.ts
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { createClient } from "@/lib/supabase/server";
import {
  syncGmailMessages,
  triageEmail,
  generateEmailDraft,
  sendGmailMessage,
} from "@/lib/email/gmail";
import { getChatCompletion } from "@/lib/ai/router";

/**
 * Search/list emails with filters
 */
async function searchEmails(
  params: {
    query?: string;
    from?: string;
    subject?: string;
    unreadOnly?: boolean;
    importantOnly?: boolean;
    limit?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const supabase = await createClient();
    const limit = params.limit || 10;

    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", context.userId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (params.unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (params.importantOnly) {
      query = query.eq("is_important", true);
    }

    if (params.from) {
      query = query.ilike("from_email", `%${params.from}%`);
    }

    if (params.subject) {
      query = query.ilike("subject", `%${params.subject}%`);
    }

    if (params.query) {
      // Search in subject and snippet
      query = query.or(`subject.ilike.%${params.query}%,snippet.ilike.%${params.query}%`);
    }

    const { data: emails, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!emails || emails.length === 0) {
      return {
        success: true,
        data: { emails: [], count: 0 },
        display: {
          type: "text",
          content: "No emails found matching your criteria.",
        },
      };
    }

    const formattedEmails = emails.map((e: any) => ({
      id: e.id,
      subject: e.subject,
      from: e.from_name || e.from_email,
      fromEmail: e.from_email,
      snippet: e.snippet,
      sentAt: e.sent_at,
      isRead: e.is_read,
      isImportant: e.is_important,
      hasAttachments: e.has_attachments,
      category: e.category,
    }));

    return {
      success: true,
      data: { emails: formattedEmails, count: formattedEmails.length },
      display: {
        type: "table",
        content: {
          headers: ["", "From", "Subject", "Date"],
          rows: formattedEmails.slice(0, 10).map((e: any) => {
            const date = new Date(e.sentAt);
            const isToday = date.toDateString() === new Date().toDateString();
            return [
              e.isRead ? "📭" : "📬",
              (e.from || "Unknown").substring(0, 20),
              e.subject.substring(0, 40) + (e.subject.length > 40 ? "..." : ""),
              isToday
                ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            ];
          }),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get unread email summary
 */
async function getUnreadSummary(params: {}, context: ToolContext): Promise<ToolResult> {
  try {
    const supabase = await createClient();

    // Count unread
    const { count: unreadCount } = await supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);

    // Get important unread
    const { data: importantUnread } = await supabase
      .from("emails")
      .select("subject, from_name, from_email, snippet, sent_at")
      .eq("user_id", context.userId)
      .eq("is_read", false)
      .eq("is_important", true)
      .order("sent_at", { ascending: false })
      .limit(5);

    // Get categories breakdown
    const { data: categoryData } = await supabase
      .from("emails")
      .select("category")
      .eq("user_id", context.userId)
      .eq("is_read", false);

    const categories: Record<string, number> = {};
    (categoryData || []).forEach((e: any) => {
      categories[e.category || "primary"] = (categories[e.category || "primary"] || 0) + 1;
    });

    const summary = {
      totalUnread: unreadCount || 0,
      importantCount: importantUnread?.length || 0,
      byCategory: categories,
      important: (importantUnread || []).map((e: any) => ({
        subject: e.subject,
        from: e.from_name || e.from_email,
        snippet: e.snippet?.substring(0, 100),
      })),
    };

    let displayText = `📬 **Inbox Summary**\n\n`;
    displayText += `Total unread: ${summary.totalUnread}\n`;

    if (Object.keys(categories).length > 0) {
      displayText += `\nBy category:\n`;
      Object.entries(categories).forEach(([cat, count]) => {
        displayText += `  • ${cat}: ${count}\n`;
      });
    }

    if (summary.important.length > 0) {
      displayText += `\n⭐ **Important emails:**\n`;
      summary.important.forEach((e: any, i: number) => {
        displayText += `${i + 1}. From ${e.from}: "${e.subject}"\n`;
      });
    }

    return {
      success: true,
      data: summary,
      display: {
        type: "markdown",
        content: displayText,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered draft reply to an email
 */
async function draftReply(
  params: { emailId: string; instructions?: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const supabase = await createClient();

    // Get the original email
    const { data: email } = await supabase
      .from("emails")
      .select("*")
      .eq("id", params.emailId)
      .eq("user_id", context.userId)
      .single();

    if (!email) {
      return { success: false, error: "Email not found" };
    }

    // Build prompt for AI
    const prompt = params.instructions
      ? `Reply to this email: ${params.instructions}`
      : `Write a professional reply to this email`;

    const contextInfo = {
      inReplyTo: email.provider_message_id,
      recipient: email.from_email,
      subject: email.subject,
    };

    // Generate draft using existing function
    const draft = await generateEmailDraft(
      `${prompt}\n\nOriginal email subject: "${email.subject}"\nFrom: ${email.from_name || email.from_email}\nContent:\n${email.body_text?.substring(0, 2000) || email.snippet}`,
      contextInfo
    );

    return {
      success: true,
      data: {
        draft,
        replyTo: email.from_email,
        originalSubject: email.subject,
      },
      display: {
        type: "card",
        content: {
          title: `Draft Reply: ${draft.subject}`,
          description: `To: ${email.from_email}`,
          fields: [{ label: "Body", value: draft.body_text.substring(0, 500) + "..." }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send an email
 */
async function sendEmail(
  params: {
    to: string | string[];
    subject: string;
    body: string;
    cc?: string | string[];
    bcc?: string | string[];
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const toArray = Array.isArray(params.to) ? params.to : [params.to];
    const ccArray = params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined;
    const bccArray = params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined;

    const result = await sendGmailMessage(context.userId, {
      to: toArray,
      cc: ccArray,
      bcc: bccArray,
      subject: params.subject,
      body: params.body,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send email",
      };
    }

    return {
      success: true,
      data: { messageId: result.messageId },
      display: {
        type: "text",
        content: `✅ Email sent successfully to ${toArray.join(", ")}`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered email composition
 */
async function composeEmail(
  params: {
    prompt: string;
    to?: string;
    context?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const draft = await generateEmailDraft(params.prompt, {
      recipient: params.to,
    });

    return {
      success: true,
      data: { draft, to: params.to },
      display: {
        type: "card",
        content: {
          title: `Draft: ${draft.subject}`,
          description: params.to ? `To: ${params.to}` : "Ready to send",
          fields: [{ label: "Body", value: draft.body_text.substring(0, 500) + "..." }],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Summarize an email thread
 */
async function summarizeThread(
  params: { emailId: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const supabase = await createClient();

    // Get the email
    const { data: email } = await supabase
      .from("emails")
      .select("*")
      .eq("id", params.emailId)
      .eq("user_id", context.userId)
      .single();

    if (!email) {
      return { success: false, error: "Email not found" };
    }

    // Get all emails in the thread
    const { data: threadEmails } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", context.userId)
      .eq("provider_thread_id", email.provider_thread_id)
      .order("sent_at", { ascending: true });

    if (!threadEmails || threadEmails.length === 0) {
      return { success: false, error: "No thread found" };
    }

    // Build thread content for AI
    const threadContent = threadEmails
      .map((e: any) => `From: ${e.from_name || e.from_email}\nDate: ${e.sent_at}\n\n${e.body_text || e.snippet}`)
      .join("\n\n---\n\n");

    // Generate summary
    const summaryPrompt = `Summarize this email thread concisely. Include:
1. Main topic/purpose
2. Key points discussed
3. Any decisions made or action items
4. Current status

Thread:\n${threadContent.substring(0, 8000)}`;

    const summary = await getChatCompletion("gpt-4o-mini", [
      { role: "system", content: "You are an expert email summarizer. Be concise and highlight key information." },
      { role: "user", content: summaryPrompt },
    ]);

    return {
      success: true,
      data: {
        summary,
        threadLength: threadEmails.length,
        subject: email.subject,
        participants: [...new Set(threadEmails.map((e: any) => e.from_email))],
      },
      display: {
        type: "markdown",
        content: `**Thread Summary: ${email.subject}**\n\n${summary}\n\n_${threadEmails.length} emails in thread_`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * AI triage of inbox - categorize and prioritize
 */
async function triageInbox(
  params: { limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const supabase = await createClient();
    const limit = params.limit || 20;

    // Get unread emails that haven't been triaged
    const { data: emails } = await supabase
      .from("emails")
      .select("id, subject, from_name, from_email, body_text, snippet")
      .eq("user_id", context.userId)
      .eq("is_read", false)
      .is("ai_triaged_at", null)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (!emails || emails.length === 0) {
      return {
        success: true,
        data: { triaged: 0 },
        display: {
          type: "text",
          content: "No untriaged emails to process. Your inbox is organized!",
        },
      };
    }

    const results: Array<{
      id: string;
      subject: string;
      priority: number;
      category: string;
      summary: string;
    }> = [];

    // Triage each email
    for (const email of emails) {
      try {
        const triage = await triageEmail({
          subject: email.subject,
          from: email.from_name || email.from_email,
          body: email.body_text || email.snippet || "",
        });

        // Update the email with triage results
        await supabase
          .from("emails")
          .update({
            ai_priority_score: triage.priority_score,
            ai_category: triage.category,
            ai_summary: triage.summary,
            ai_sentiment: triage.sentiment,
            requires_response: triage.requires_response,
            ai_triaged_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        results.push({
          id: email.id,
          subject: email.subject,
          priority: triage.priority_score,
          category: triage.category,
          summary: triage.summary,
        });
      } catch (e) {
        console.error(`Failed to triage email ${email.id}:`, e);
      }
    }

    // Sort by priority (highest first)
    results.sort((a, b) => b.priority - a.priority);

    // Group by category for summary
    const byCategory: Record<string, number> = {};
    results.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    const highPriority = results.filter((r) => r.priority >= 0.7);

    let displayText = `**Inbox Triage Complete**\n\nProcessed: ${results.length} emails\n\n`;

    displayText += `**By Category:**\n`;
    Object.entries(byCategory).forEach(([cat, count]) => {
      displayText += `  • ${cat}: ${count}\n`;
    });

    if (highPriority.length > 0) {
      displayText += `\n**⚠️ High Priority (${highPriority.length}):**\n`;
      highPriority.slice(0, 5).forEach((e, i) => {
        displayText += `${i + 1}. "${e.subject}" - ${e.summary}\n`;
      });
    }

    return {
      success: true,
      data: {
        triaged: results.length,
        byCategory,
        highPriority: highPriority.map((r) => ({ subject: r.subject, summary: r.summary })),
      },
      display: {
        type: "markdown",
        content: displayText,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync emails from Gmail
 */
async function syncEmails(
  params: { limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const result = await syncGmailMessages(
      context.userId,
      context.organizationId,
      params.limit || 50
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to sync emails",
      };
    }

    return {
      success: true,
      data: {
        synced: result.emailsCount,
        skippedSpam: result.skippedSpam,
        skippedFiltered: result.skippedFiltered,
      },
      display: {
        type: "text",
        content: `✅ Synced ${result.emailsCount} emails from Gmail.${
          result.skippedSpam > 0 ? ` Blocked ${result.skippedSpam} spam.` : ""
        }${result.skippedFiltered > 0 ? ` Filtered ${result.skippedFiltered}.` : ""}`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const gmailSkill: Skill = {
  id: "gmail",
  name: "Gmail",
  description: "AI-powered email management - search, compose, triage, and send emails via Gmail",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "communication",
  tags: ["email", "gmail", "google", "communication", "inbox"],

  icon: "📧",
  color: "#EA4335",

  tier: "free",
  isBuiltIn: true,

  requiredIntegrations: ["google_gmail"],

  tools: [
    {
      name: "search",
      description: "Search and list emails with filters",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (searches subject and content)",
          },
          from: {
            type: "string",
            description: "Filter by sender email/name",
          },
          subject: {
            type: "string",
            description: "Filter by subject line",
          },
          unreadOnly: {
            type: "boolean",
            description: "Only show unread emails (default: false)",
          },
          importantOnly: {
            type: "boolean",
            description: "Only show important emails (default: false)",
          },
          limit: {
            type: "number",
            description: "Maximum emails to return (default: 10)",
          },
        },
      },
      execute: searchEmails,
    },
    {
      name: "unread_summary",
      description: "Get a summary of unread emails and inbox status",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: getUnreadSummary,
    },
    {
      name: "draft_reply",
      description: "Generate an AI-powered draft reply to an email",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "ID of the email to reply to",
          },
          instructions: {
            type: "string",
            description: "Instructions for the reply (e.g., 'politely decline', 'accept and confirm')",
          },
        },
        required: ["emailId"],
      },
      execute: draftReply,
    },
    {
      name: "compose",
      description: "AI-powered email composition - describe what you want to say",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "What you want the email to say (e.g., 'Follow up on our meeting about the Q4 budget')",
          },
          to: {
            type: "string",
            description: "Recipient email address (optional)",
          },
          context: {
            type: "string",
            description: "Additional context for the AI (optional)",
          },
        },
        required: ["prompt"],
      },
      execute: composeEmail,
    },
    {
      name: "send",
      description: "Send an email",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Recipient email address(es) - comma-separated for multiple",
          },
          subject: {
            type: "string",
            description: "Email subject line",
          },
          body: {
            type: "string",
            description: "Email body text",
          },
          cc: {
            type: "string",
            description: "CC recipients (optional, comma-separated)",
          },
          bcc: {
            type: "string",
            description: "BCC recipients (optional, comma-separated)",
          },
        },
        required: ["to", "subject", "body"],
      },
      execute: sendEmail,
    },
    {
      name: "summarize_thread",
      description: "AI-powered summary of an email thread",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "ID of any email in the thread",
          },
        },
        required: ["emailId"],
      },
      execute: summarizeThread,
    },
    {
      name: "triage",
      description: "AI triage of inbox - categorize and prioritize unread emails",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum emails to triage (default: 20)",
          },
        },
      },
      execute: triageInbox,
    },
    {
      name: "sync",
      description: "Sync emails from Gmail",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum emails to sync (default: 50)",
          },
        },
      },
      execute: syncEmails,
    },
  ],

  systemPrompt: `You have access to Gmail. When users ask about email:
- Use "unread_summary" to quickly check inbox status
- Use "search" to find specific emails
- Use "compose" to draft new emails using natural language
- Use "draft_reply" to create AI-powered replies (needs email ID from search)
- Use "send" only when user confirms they want to send
- Use "summarize_thread" for long email conversations
- Use "triage" to organize and prioritize the inbox
- Use "sync" to refresh emails if data seems stale

IMPORTANT: Never send emails without explicit user confirmation. Always show drafts first.
When composing emails, ask for the recipient if not provided.`,
};
