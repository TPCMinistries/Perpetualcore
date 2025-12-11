/**
 * Email Monitor Agent
 *
 * Monitors emails and automatically creates tasks for actionable items
 */

import { createClient } from "@/lib/supabase/server";
import { fetchUnreadEmails, isGmailConnected, markAsRead } from "@/lib/integrations/gmail";
import { logger } from "@/lib/logging";

export interface EmailAnalysis {
  isActionable: boolean;
  isUrgent: boolean;
  suggestedTaskTitle: string;
  suggestedDescription: string;
  priority: "low" | "medium" | "high";
  executionType: "manual" | "semi_automated" | "fully_automated";
  estimatedMinutes?: number;
}

/**
 * Analyze email content to determine if it requires action
 * 
 * In a real implementation, this would call an LLM to analyze the email.
 * For now, we use keyword-based heuristics.
 */
export async function analyzeEmail(email: {
  subject: string;
  from: string;
  body: string;
  receivedAt: Date;
}): Promise<EmailAnalysis> {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  const combined = `${subject} ${body}`;

  // Check for urgency indicators
  const urgencyKeywords = ["urgent", "asap", "emergency", "immediately", "critical", "deadline"];
  const isUrgent = urgencyKeywords.some(keyword => combined.includes(keyword));

  // Check for action indicators
  const actionKeywords = [
    "please", "can you", "could you", "would you", "need", "require",
    "respond", "reply", "review", "check", "confirm", "approve", "send"
  ];
  const isActionable = actionKeywords.some(keyword => combined.includes(keyword));

  // Determine priority
  let priority: "low" | "medium" | "high" = "medium";
  if (isUrgent) {
    priority = "high";
  } else if (subject.includes("fyi") || subject.includes("for your information")) {
    priority = "low";
  }

  // Determine execution type
  let executionType: "manual" | "semi_automated" | "fully_automated" = "semi_automated";
  if (combined.includes("respond") || combined.includes("reply")) {
    executionType = "semi_automated"; // AI can draft response
  } else if (combined.includes("review") || combined.includes("approve")) {
    executionType = "manual"; // Requires human judgment
  }

  // Generate task title and description
  const suggestedTaskTitle = `Respond to email from ${email.from}: ${email.subject.substring(0, 60)}${email.subject.length > 60 ? "..." : ""}`;
  const suggestedDescription = `Email received ${email.receivedAt.toLocaleDateString()}\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body.substring(0, 500)}${email.body.length > 500 ? "..." : ""}`;

  return {
    isActionable,
    isUrgent,
    suggestedTaskTitle,
    suggestedDescription,
    priority,
    executionType,
    estimatedMinutes: isUrgent ? 15 : 30,
  };
}

/**
 * Process emails for a specific agent
 */
export async function processEmailsForAgent(agentId: string) {
  const supabase = await createClient();

  // Get agent details with creator's profile
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(organization_id, id)")
    .eq("id", agentId)
    .eq("enabled", true)
    .single();

  if (agentError || !agent) {
    logger.warn(`Agent ${agentId} not found or disabled`);
    return { processed: 0, created: 0, error: "Agent not found or disabled" };
  }

  const userId = agent.profiles.id;
  const organizationId = agent.profiles.organization_id;

  // Check if user has Gmail connected
  const gmailConnected = await isGmailConnected(userId);
  if (!gmailConnected) {
    logger.info(`Gmail not connected for agent ${agentId}`, { userId, agentId });

    // Log the check action
    await supabase.from("agent_actions").insert({
      agent_id: agentId,
      action_type: "check_emails",
      action_data: { reason: "Gmail not connected" },
      status: "skipped",
    });

    return { processed: 0, created: 0, error: "Gmail not connected" };
  }

  // Get agent config for last check time
  const agentConfig = (agent.config as Record<string, unknown>) || {};
  const lastCheckTime = agentConfig.last_email_check
    ? new Date(agentConfig.last_email_check as string)
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24 hours ago

  // Fetch unread emails from Gmail
  const emails = await fetchUnreadEmails(userId, 20, lastCheckTime);

  if (emails.length === 0) {
    logger.debug(`No new emails for agent ${agentId}`, { userId, agentId });

    // Update last check time
    await supabase
      .from("ai_agents")
      .update({
        config: { ...agentConfig, last_email_check: new Date().toISOString() },
      })
      .eq("id", agentId);

    return { processed: 0, created: 0 };
  }

  logger.info(`Processing ${emails.length} emails for agent ${agentId}`, { userId, agentId });

  let processed = 0;
  let created = 0;

  for (const email of emails) {
    processed++;

    const analysis = await analyzeEmail({
      subject: email.subject,
      from: email.from,
      body: email.body,
      receivedAt: email.receivedAt,
    });

    if (analysis.isActionable) {
      // Create task
      try {
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            organization_id: organizationId,
            title: analysis.suggestedTaskTitle,
            description: analysis.suggestedDescription,
            priority: analysis.priority,
            execution_type: analysis.executionType,
            execution_status: "pending",
            source_type: "agent",
            agent_id: agentId,
            ai_context: JSON.stringify({
              email_id: email.id,
              email_thread_id: email.threadId,
              email_from: email.from,
              email_subject: email.subject,
              email_received_at: email.receivedAt,
              ai_analysis: analysis,
            }),
          })
          .select()
          .single();

        if (taskError) {
          logger.error(`Failed to create task for agent ${agentId}`, {
            agentId,
            error: taskError,
            emailId: email.id,
          });

          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "create_task",
            action_data: {
              email_id: email.id,
              email_subject: email.subject,
              email_from: email.from,
            },
            status: "failed",
            error_message: taskError.message,
          });
        } else {
          created++;

          // Log successful action
          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "create_task",
            action_data: {
              email_id: email.id,
              email_subject: email.subject,
              email_from: email.from,
              task_title: analysis.suggestedTaskTitle,
              task_id: task.id,
            },
            status: "success",
            task_id: task.id,
          });

          // Optionally mark email as read if configured
          if (agentConfig.mark_processed_as_read) {
            await markAsRead(userId, email.id);
          }

          logger.info(`Created task from email for agent ${agentId}`, {
            agentId,
            taskId: task.id,
            emailSubject: email.subject,
          });
        }
      } catch (error) {
        logger.error(`Error creating task for agent ${agentId}`, { error, agentId });
      }
    } else {
      // Log skipped email
      await supabase.from("agent_actions").insert({
        agent_id: agentId,
        action_type: "analyze_email",
        action_data: {
          email_id: email.id,
          email_subject: email.subject,
          email_from: email.from,
          analysis_result: "not_actionable",
        },
        status: "success",
      });
    }
  }

  // Update last check time
  await supabase
    .from("ai_agents")
    .update({
      config: { ...agentConfig, last_email_check: new Date().toISOString() },
    })
    .eq("id", agentId);

  logger.info(`Email processing complete for agent ${agentId}`, {
    agentId,
    processed,
    created,
  });

  return { processed, created };
}

/**
 * Process all enabled email monitor agents
 */
export async function processAllEmailMonitorAgents() {
  const supabase = await createClient();

  const { data: agents, error } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("agent_type", "email_monitor")
    .eq("enabled", true);

  if (error) {
    logger.error("Failed to fetch email monitor agents", { error });
    return { totalAgents: 0, totalProcessed: 0, totalCreated: 0 };
  }

  let totalProcessed = 0;
  let totalCreated = 0;

  for (const agent of agents || []) {
    try {
      const result = await processEmailsForAgent(agent.id);
      totalProcessed += result.processed;
      totalCreated += result.created;
      logger.info(`Agent "${agent.name}" processed`, {
        agentId: agent.id,
        agentName: agent.name,
        processed: result.processed,
        created: result.created,
      });
    } catch (error) {
      logger.error(`Error processing agent ${agent.id}`, { error, agentId: agent.id });
    }
  }

  return {
    totalAgents: agents?.length || 0,
    totalProcessed,
    totalCreated,
  };
}
