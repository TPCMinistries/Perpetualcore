import type { NodeType } from "@/lib/workflow-engine";

interface ConfigField {
  name: string;
  type: "text" | "textarea" | "select" | "number" | "boolean";
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface NodeRegistryEntry {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  configSchema: {
    fields: ConfigField[];
  };
}

export const NODE_REGISTRY: Record<NodeType, NodeRegistryEntry> = {
  input: {
    type: "input",
    label: "Input",
    description: "Trigger or entry point for the workflow",
    icon: "zap",
    category: "Triggers",
    color: "emerald",
    configSchema: {
      fields: [
        {
          name: "trigger_type",
          type: "select",
          label: "Trigger Type",
          required: true,
          options: [
            { value: "webhook", label: "Webhook" },
            { value: "schedule", label: "Schedule" },
            { value: "manual", label: "Manual" },
          ],
        },
        {
          name: "webhook_url",
          type: "text",
          label: "Webhook URL",
          required: false,
          placeholder: "https://...",
        },
        {
          name: "schedule_expression",
          type: "text",
          label: "Schedule (cron)",
          required: false,
          placeholder: "0 9 * * *",
        },
      ],
    },
  },
  assistant: {
    type: "assistant",
    label: "AI Assistant",
    description: "Process data using AI",
    icon: "brain",
    category: "AI",
    color: "purple",
    configSchema: {
      fields: [
        {
          name: "model",
          type: "select",
          label: "Model",
          required: true,
          options: [
            { value: "gpt-4o-mini", label: "GPT-4o Mini" },
            { value: "gpt-4o", label: "GPT-4o" },
            { value: "claude-sonnet", label: "Claude Sonnet" },
          ],
        },
        {
          name: "system_prompt",
          type: "textarea",
          label: "System Prompt",
          required: false,
          placeholder: "You are a helpful assistant...",
        },
        {
          name: "temperature",
          type: "number",
          label: "Temperature",
          required: false,
          placeholder: "0.7",
        },
        {
          name: "max_tokens",
          type: "number",
          label: "Max Tokens",
          required: false,
          placeholder: "4096",
        },
      ],
    },
  },
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch based on a condition",
    icon: "branch",
    category: "Logic",
    color: "amber",
    configSchema: {
      fields: [
        {
          name: "field",
          type: "text",
          label: "Field",
          required: true,
          placeholder: "data.status",
        },
        {
          name: "operator",
          type: "select",
          label: "Operator",
          required: true,
          options: [
            { value: "equals", label: "Equals" },
            { value: "not_equals", label: "Not Equals" },
            { value: "contains", label: "Contains" },
            { value: "greater_than", label: "Greater Than" },
            { value: "less_than", label: "Less Than" },
          ],
        },
        {
          name: "value",
          type: "text",
          label: "Value",
          required: true,
          placeholder: "expected value",
        },
      ],
    },
  },
  output: {
    type: "output",
    label: "Output",
    description: "Send results to a destination",
    icon: "send",
    category: "Output",
    color: "blue",
    configSchema: {
      fields: [
        {
          name: "destination",
          type: "select",
          label: "Destination",
          required: true,
          options: [
            { value: "email", label: "Email" },
            { value: "webhook", label: "Webhook" },
            { value: "database", label: "Database" },
            { value: "slack", label: "Slack" },
          ],
        },
        {
          name: "format",
          type: "select",
          label: "Format",
          required: false,
          options: [
            { value: "json", label: "JSON" },
            { value: "text", label: "Plain Text" },
            { value: "html", label: "HTML" },
          ],
        },
        {
          name: "destination_url",
          type: "text",
          label: "Destination URL / Address",
          required: false,
          placeholder: "https://... or email@example.com",
        },
      ],
    },
  },
  custom: {
    type: "custom",
    label: "Custom",
    description: "User-defined processing step",
    icon: "code",
    category: "Custom",
    color: "slate",
    configSchema: {
      fields: [
        {
          name: "code",
          type: "textarea",
          label: "Processing Logic",
          required: false,
          placeholder: "Describe what this step should do...",
        },
        {
          name: "prompt",
          type: "textarea",
          label: "AI Prompt",
          required: false,
          placeholder: "Process the input by...",
        },
      ],
    },
  },
};

export type { ConfigField, NodeRegistryEntry };
