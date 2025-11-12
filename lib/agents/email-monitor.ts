/**
 * Email Monitor Agent
 * 
 * Monitors emails and automatically creates tasks for actionable items
 */

import { createClient } from "@/lib/supabase/server";

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

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*, profiles!inner(organization_id, id)")
    .eq("id", agentId)
    .eq("enabled", true)
    .single();

  if (agentError || !agent) {
    console.error(`Agent ${agentId} not found or disabled`);
    return { processed: 0, created: 0 };
  }

  // In a real implementation, this would fetch emails from an email provider
  // For now, we simulate finding actionable emails
  // You would integrate with Gmail API, Outlook API, etc. here
  
  const simulatedEmails = [
    // Example: simulated email that would create a task
    // In production, replace with actual email fetching logic
  ];

  let processed = 0;
  let created = 0;

  for (const email of simulatedEmails) {
    processed++;

    const analysis = await analyzeEmail(email);

    if (analysis.isActionable) {
      // Create task via API
      try {
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            organization_id: agent.profiles.organization_id,
            title: analysis.suggestedTaskTitle,
            description: analysis.suggestedDescription,
            priority: analysis.priority,
            execution_type: analysis.executionType,
            execution_status: "pending",
            source_type: "agent",
            agent_id: agentId,
            ai_context: JSON.stringify({
              email_from: email.from,
              email_subject: email.subject,
              email_received_at: email.receivedAt,
              ai_analysis: analysis,
            }),
          })
          .select()
          .single();

        if (taskError) {
          console.error(`Failed to create task for agent ${agentId}:`, taskError);
          
          // Log failed action
          await supabase.from("agent_actions").insert({
            agent_id: agentId,
            action_type: "create_task",
            action_data: {
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
              email_subject: email.subject,
              email_from: email.from,
              task_title: analysis.suggestedTaskTitle,
            },
            status: "success",
            task_id: task.id,
          });
        }
      } catch (error) {
        console.error(`Error creating task for agent ${agentId}:`, error);
      }
    }
  }

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
    console.error("Failed to fetch email monitor agents:", error);
    return { totalAgents: 0, totalProcessed: 0, totalCreated: 0 };
  }

  let totalProcessed = 0;
  let totalCreated = 0;

  for (const agent of agents || []) {
    try {
      const result = await processEmailsForAgent(agent.id);
      totalProcessed += result.processed;
      totalCreated += result.created;
      console.log(`Agent "${agent.name}" (${agent.id}): processed ${result.processed}, created ${result.created} tasks`);
    } catch (error) {
      console.error(`Error processing agent ${agent.id}:`, error);
    }
  }

  return {
    totalAgents: agents?.length || 0,
    totalProcessed,
    totalCreated,
  };
}
