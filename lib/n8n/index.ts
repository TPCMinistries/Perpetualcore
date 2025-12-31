/**
 * n8n Integration Module
 * Deep integration with n8n workflow automation
 */

// Client
export {
  N8nClient,
  createN8nClient,
  type N8nCredentials,
  type N8nWorkflow,
  type N8nExecution,
  type N8nWebhook,
} from "./client";

// Sync
export {
  syncWorkflowsFromN8n,
  executeWorkflow,
  pollExecutionStatus,
  triggerWorkflowsForEvent,
  type SyncResult,
} from "./sync";

// Templates
export {
  getTemplates,
  getTemplateCategories,
  getTemplate,
  installTemplate,
  getInstalledTemplates,
  uninstallTemplate,
  type N8nTemplate,
  type TemplateInstallResult,
} from "./templates";
