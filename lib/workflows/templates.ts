import type { WorkflowNode, WorkflowEdge } from "@/lib/workflow-engine";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "customer-support",
    name: "Customer Support",
    description: "Route incoming support requests through AI classification, then branch to email or ticket creation based on urgency.",
    category: "support",
    icon: "headphones",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Webhook Trigger", trigger_type: "webhook" } },
      { id: "assistant-1", type: "assistant", data: { label: "Classify Request", assistantRole: "customer_support", prompt: "Classify this support request by urgency (high/low) and category." } },
      { id: "condition-1", type: "condition", data: { label: "Urgency Check", field: "urgency", operator: "equals", value: "high" } },
      { id: "output-1", type: "output", data: { label: "Create Ticket", destination: "database" } },
      { id: "output-2", type: "output", data: { label: "Send Email", destination: "email" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "condition-1" },
      { source: "condition-1", target: "output-1", label: "High" },
      { source: "condition-1", target: "output-2", label: "Low" },
    ],
  },
  {
    id: "content-pipeline",
    name: "Content Pipeline",
    description: "Take raw content input, summarize it with AI, format for publication, and output the result.",
    category: "content",
    icon: "pen-tool",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Content Input", trigger_type: "manual" } },
      { id: "assistant-1", type: "assistant", data: { label: "Summarize Content", assistantRole: "writing", prompt: "Summarize the following content into a concise article." } },
      { id: "assistant-2", type: "assistant", data: { label: "Format for Publication", assistantRole: "writing", prompt: "Format this summary for blog publication with headers and bullet points." } },
      { id: "output-1", type: "output", data: { label: "Publish Result", destination: "database" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "assistant-2" },
      { source: "assistant-2", target: "output-1" },
    ],
  },
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Receive leads via webhook, classify them with AI, and route qualified leads to CRM or send nurture emails.",
    category: "automation",
    icon: "target",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Lead Webhook", trigger_type: "webhook" } },
      { id: "assistant-1", type: "assistant", data: { label: "Qualify Lead", assistantRole: "marketing", prompt: "Score this lead 1-100 based on the data. Output a JSON with score and reason." } },
      { id: "condition-1", type: "condition", data: { label: "Score Check", field: "score", operator: "greater_than", value: "70" } },
      { id: "output-1", type: "output", data: { label: "Add to CRM", destination: "webhook" } },
      { id: "output-2", type: "output", data: { label: "Nurture Email", destination: "email" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "condition-1" },
      { source: "condition-1", target: "output-1", label: "Qualified" },
      { source: "condition-1", target: "output-2", label: "Nurture" },
    ],
  },
  {
    id: "meeting-summarizer",
    name: "Meeting Summarizer",
    description: "Input meeting notes or transcripts and get an AI-generated summary with action items.",
    category: "content",
    icon: "clipboard",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Meeting Notes", trigger_type: "manual" } },
      { id: "assistant-1", type: "assistant", data: { label: "Summarize Meeting", assistantRole: "general", prompt: "Summarize these meeting notes. Include: key decisions, action items with owners, and next steps." } },
      { id: "output-1", type: "output", data: { label: "Save Summary", destination: "database" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "output-1" },
    ],
  },
  {
    id: "email-drafter",
    name: "Email Drafter",
    description: "Provide context and get a professionally drafted email ready to send.",
    category: "content",
    icon: "mail",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Email Context", trigger_type: "manual" } },
      { id: "assistant-1", type: "assistant", data: { label: "Draft Email", assistantRole: "writing", prompt: "Draft a professional email based on the provided context. Include subject line, greeting, body, and sign-off." } },
      { id: "output-1", type: "output", data: { label: "Email Output", destination: "email" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "output-1" },
    ],
  },
  {
    id: "document-analyzer",
    name: "Document Analyzer",
    description: "Analyze documents with AI, check for specific criteria, and route results accordingly.",
    category: "analysis",
    icon: "file-search",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Document Input", trigger_type: "manual" } },
      { id: "assistant-1", type: "assistant", data: { label: "Analyze Document", assistantRole: "research", prompt: "Analyze this document. Extract key findings, risks, and recommendations." } },
      { id: "condition-1", type: "condition", data: { label: "Risk Level", field: "risk_level", operator: "equals", value: "high" } },
      { id: "output-1", type: "output", data: { label: "Alert Team", destination: "slack" } },
      { id: "output-2", type: "output", data: { label: "Archive", destination: "database" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "condition-1" },
      { source: "condition-1", target: "output-1", label: "High Risk" },
      { source: "condition-1", target: "output-2", label: "Normal" },
    ],
  },
  {
    id: "slack-bot",
    name: "Slack Bot",
    description: "Process incoming Slack messages with AI and send intelligent responses back.",
    category: "automation",
    icon: "message-square",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Slack Webhook", trigger_type: "webhook" } },
      { id: "assistant-1", type: "assistant", data: { label: "Process Message", assistantRole: "general", prompt: "You are a helpful Slack bot. Respond to the user's message concisely and helpfully." } },
      { id: "output-1", type: "output", data: { label: "Reply to Slack", destination: "webhook" } },
    ],
    edges: [
      { source: "input-1", target: "assistant-1" },
      { source: "assistant-1", target: "output-1" },
    ],
  },
  {
    id: "webhook-processor",
    name: "Webhook Processor",
    description: "Receive webhook data, evaluate conditions, and route to multiple output destinations.",
    category: "automation",
    icon: "webhook",
    nodes: [
      { id: "input-1", type: "input", data: { label: "Webhook Input", trigger_type: "webhook" } },
      { id: "condition-1", type: "condition", data: { label: "Event Type", field: "event_type", operator: "equals", value: "payment" } },
      { id: "output-1", type: "output", data: { label: "Process Payment", destination: "webhook" } },
      { id: "output-2", type: "output", data: { label: "Log Event", destination: "database" } },
      { id: "output-3", type: "output", data: { label: "Notify Team", destination: "email" } },
    ],
    edges: [
      { source: "input-1", target: "condition-1" },
      { source: "condition-1", target: "output-1", label: "Payment" },
      { source: "condition-1", target: "output-2", label: "Other" },
      { source: "input-1", target: "output-3" },
    ],
  },
];

export type { WorkflowTemplate };
