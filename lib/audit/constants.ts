import type { AuditEventCategory, AuditEventAction, AuditEventSeverity } from "@/types";

interface AuditEventDef {
  action: string;
  category: AuditEventCategory;
  event_action: AuditEventAction;
  severity: AuditEventSeverity;
  description_template: string;
}

export const AUDIT_EVENTS = {
  // Authentication
  AUTH_LOGIN: {
    action: "auth.login",
    category: "authentication" as AuditEventCategory,
    event_action: "login" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "User logged in",
  },
  AUTH_LOGOUT: {
    action: "auth.logout",
    category: "authentication" as AuditEventCategory,
    event_action: "logout" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "User logged out",
  },
  AUTH_SSO_LOGIN: {
    action: "auth.sso_login",
    category: "authentication" as AuditEventCategory,
    event_action: "login" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "User logged in via SSO",
  },
  AUTH_SSO_LOGIN_FAILED: {
    action: "auth.sso_login_failed",
    category: "authentication" as AuditEventCategory,
    event_action: "failed_login" as AuditEventAction,
    severity: "warning" as AuditEventSeverity,
    description_template: "SSO login failed",
  },

  // Documents
  DOCUMENT_CREATED: {
    action: "document.created",
    category: "data_modification" as AuditEventCategory,
    event_action: "created" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Document created",
  },
  DOCUMENT_UPDATED: {
    action: "document.updated",
    category: "data_modification" as AuditEventCategory,
    event_action: "updated" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Document updated",
  },
  DOCUMENT_DELETED: {
    action: "document.deleted",
    category: "data_modification" as AuditEventCategory,
    event_action: "deleted" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Document deleted",
  },

  // Workflows
  WORKFLOW_CREATED: {
    action: "workflow.created",
    category: "data_modification" as AuditEventCategory,
    event_action: "created" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Workflow created",
  },
  WORKFLOW_UPDATED: {
    action: "workflow.updated",
    category: "data_modification" as AuditEventCategory,
    event_action: "updated" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Workflow updated",
  },
  WORKFLOW_DELETED: {
    action: "workflow.deleted",
    category: "data_modification" as AuditEventCategory,
    event_action: "deleted" as AuditEventAction,
    severity: "warning" as AuditEventSeverity,
    description_template: "Workflow deleted",
  },

  // SSO Providers
  SSO_PROVIDER_CREATED: {
    action: "sso_provider.created",
    category: "configuration" as AuditEventCategory,
    event_action: "created" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "SSO provider created",
  },
  SSO_PROVIDER_UPDATED: {
    action: "sso_provider.updated",
    category: "configuration" as AuditEventCategory,
    event_action: "updated" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "SSO provider updated",
  },
  SSO_PROVIDER_DELETED: {
    action: "sso_provider.deleted",
    category: "configuration" as AuditEventCategory,
    event_action: "deleted" as AuditEventAction,
    severity: "warning" as AuditEventSeverity,
    description_template: "SSO provider deleted",
  },

  // Billing
  PLAN_CHANGED: {
    action: "billing.plan_changed",
    category: "configuration" as AuditEventCategory,
    event_action: "configuration_changed" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Subscription plan changed",
  },

  // API Keys
  API_KEY_CREATED: {
    action: "api_key.created",
    category: "security" as AuditEventCategory,
    event_action: "created" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "API key created",
  },
  API_KEY_REVOKED: {
    action: "api_key.revoked",
    category: "security" as AuditEventCategory,
    event_action: "deleted" as AuditEventAction,
    severity: "warning" as AuditEventSeverity,
    description_template: "API key revoked",
  },

  // Integrations
  INTEGRATION_CONNECTED: {
    action: "integration.connected",
    category: "integration" as AuditEventCategory,
    event_action: "integration_connected" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Integration connected",
  },
  INTEGRATION_DISCONNECTED: {
    action: "integration.disconnected",
    category: "integration" as AuditEventCategory,
    event_action: "integration_disconnected" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Integration disconnected",
  },

  // Team
  TEAM_MEMBER_ADDED: {
    action: "team.member_added",
    category: "admin" as AuditEventCategory,
    event_action: "created" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Team member added",
  },
  TEAM_MEMBER_REMOVED: {
    action: "team.member_removed",
    category: "admin" as AuditEventCategory,
    event_action: "deleted" as AuditEventAction,
    severity: "warning" as AuditEventSeverity,
    description_template: "Team member removed",
  },

  // Settings
  SETTINGS_UPDATED: {
    action: "settings.updated",
    category: "configuration" as AuditEventCategory,
    event_action: "configuration_changed" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Settings updated",
  },

  // Exports
  EXPORT_GENERATED: {
    action: "export.generated",
    category: "data_access" as AuditEventCategory,
    event_action: "exported" as AuditEventAction,
    severity: "info" as AuditEventSeverity,
    description_template: "Data export generated",
  },
} as const satisfies Record<string, AuditEventDef>;

export type AuditEventKey = keyof typeof AUDIT_EVENTS;
