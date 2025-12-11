export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          content: string;
          file_url: string | null;
          file_type: string | null;
          file_size: number | null;
          status: 'processing' | 'completed' | 'failed';
          error_message: string | null;
          embedding: number[] | null;
          metadata: Json | null;
          summary: string | null;
          key_points: string[] | null;
          document_type: string | null;
          summary_generated_at: string | null;
          summary_tokens_used: number | null;
          summary_cost_usd: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['document_chunks']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['document_chunks']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'done';
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          conversation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      usage_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          feature: string;
          tokens_used: number | null;
          cost: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['usage_logs']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['usage_logs']['Insert']>;
      };
      whatsapp_accounts: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          phone_number: string;
          twilio_phone_number: string | null;
          status: string;
          verification_code: string | null;
          verified_at: string | null;
          enabled: boolean;
          ai_enabled: boolean;
          notification_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_accounts']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['whatsapp_accounts']['Insert']>;
      };
      whatsapp_messages: {
        Row: {
          id: string;
          whatsapp_account_id: string;
          organization_id: string;
          user_id: string;
          twilio_message_sid: string | null;
          direction: string;
          from_number: string;
          to_number: string;
          body: string | null;
          media_url: string | null;
          media_content_type: string | null;
          num_media: number;
          status: string;
          error_message: string | null;
          ai_response: boolean;
          ai_model: string | null;
          processing_time_ms: number | null;
          twilio_status: string | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_messages']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['whatsapp_messages']['Insert']>;
      };
      whatsapp_conversations: {
        Row: {
          id: string;
          whatsapp_account_id: string;
          organization_id: string;
          user_id: string;
          phone_number: string;
          title: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          message_count: number;
          unread_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_conversations']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['whatsapp_conversations']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Application Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  embedding: number[] | null;
  metadata: Json | null;
  folder_id: string | null;
  matter_id: string | null;
  summary: string | null;
  key_points: string[] | null;
  document_type: string | null;
  summary_generated_at: string | null;
  summary_tokens_used: number | null;
  summary_cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_folder_id: string | null;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DocumentTag {
  document_id: string;
  tag_id: string;
  created_at: string;
}

// Many-to-many junction table types
export interface DocumentProject {
  id: string;
  document_id: string;
  project_id: string;
  added_by: string | null;
  added_at: string;
}

export interface DocumentFolder {
  id: string;
  document_id: string;
  folder_id: string;
  added_by: string | null;
  added_at: string;
  position: number;
}

export interface DocumentKnowledgeSpace {
  id: string;
  document_id: string;
  knowledge_space_id: string;
  added_by: string | null;
  added_at: string;
  is_pinned: boolean;
}

// Project type
export interface Project {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  emoji: string;
  is_archived: boolean;
  sort_order: number;
  conversation_count: number;
  created_at: string;
  updated_at: string;
}

// Knowledge Space type
export interface KnowledgeSpace {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  space_type: 'team' | 'project' | 'department' | 'client';
  emoji: string;
  color: string;
  owner_id: string;
  member_ids: string[];
  moderator_ids: string[];
  is_private: boolean;
  is_archived: boolean;
  document_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

// Related document with context overlap
export interface RelatedDocument {
  related_document_id: string;
  document_title: string;
  similarity_score: number;
  shared_projects: number;
  shared_folders: number;
  shared_spaces: number;
  shared_tags: number;
  relationship_strength: 'very_strong' | 'strong' | 'moderate' | 'weak';
}

export interface DocumentWithDetails extends Document {
  folder?: Folder | null;
  folders?: Folder[];  // Multiple folders support
  tags?: Tag[];
  projects?: Project[];  // Multiple projects support
  knowledge_spaces?: KnowledgeSpace[];  // Multiple spaces support
  user?: {
    full_name: string | null;
    email: string;
  };
  related_documents?: RelatedDocument[];  // Contextual intelligence
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  organization_id: string;
  user_id: string;
  feature: string;
  tokens_used: number | null;
  cost: number | null;
  created_at: string;
}

export type AIModel = 'auto' | 'claude-opus-4' | 'claude-sonnet-4' | 'gpt-4o' | 'gpt-4o-mini' | 'gemini-2.0-flash-exp' | 'gamma';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'gamma';
  costPer1kTokens: number;
  maxTokens: number;
  icon?: string;
}

export interface ModelSelection {
  model: string;
  reason: string;
  provider: 'anthropic' | 'openai' | 'google' | 'gamma';
  displayName: string;
  icon?: string;
}

// Integrations
export type IntegrationProvider =
  | 'slack'
  | 'zoom'
  | 'google_drive'
  | 'google'
  | 'notion'
  | 'microsoft'
  | 'linear'
  | 'github'
  | 'stripe'
  | 'airtable'
  | 'twilio'
  | 'dropbox'
  | 'discord'
  | 'whatsapp'
  | 'telegram';

export interface Integration {
  id: string;
  organization_id: string;
  user_id: string;
  provider: IntegrationProvider;
  provider_user_id: string | null;
  provider_team_id: string | null;
  access_token: string; // Should be encrypted
  refresh_token: string | null; // Should be encrypted
  token_expires_at: string | null;
  scopes: string[];
  metadata: Json;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAction {
  id: string;
  integration_id: string;
  action_type: string;
  status: 'pending' | 'success' | 'failed';
  request_data: Json | null;
  response_data: Json | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface IntegrationConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  scopes: string[];
}

// SSO/SAML Types
export type SSOProviderType = 'saml' | 'oauth2' | 'oidc';

export interface SSOProvider {
  id: string;
  organization_id: string;
  provider_type: SSOProviderType;
  provider_name: string;
  enabled: boolean;

  // SAML Configuration
  saml_entity_id: string | null;
  saml_sso_url: string | null;
  saml_slo_url: string | null;
  saml_certificate: string | null;
  saml_signature_algorithm: string | null;
  saml_name_id_format: string | null;

  // OAuth2/OIDC Configuration
  oauth_client_id: string | null;
  oauth_client_secret: string | null;
  oauth_authorization_url: string | null;
  oauth_token_url: string | null;
  oauth_user_info_url: string | null;
  oauth_scopes: string[] | null;

  // Attribute mapping
  attribute_mapping: Json;

  // Settings
  auto_provision_users: boolean;
  enforce_sso: boolean;
  allowed_domains: string[] | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SSOSession {
  id: string;
  provider_id: string;
  user_id: string | null;
  session_index: string | null;
  name_id: string | null;
  external_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  login_at: string;
  logout_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface SSOLoginAttempt {
  id: string;
  provider_id: string | null;
  user_id: string | null;
  email: string | null;
  success: boolean;
  error_message: string | null;
  error_code: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SSOConfig {
  id: string;
  provider_type: SSOProviderType;
  provider_name: string;
  enabled: boolean;
  enforce_sso: boolean;
  allowed_domains: string[] | null;
  saml_entity_id: string | null;
  saml_sso_url: string | null;
  oauth_authorization_url: string | null;
  oauth_client_id: string | null;
  oauth_scopes: string[] | null;
}

// Audit Logs Types
export type AuditEventCategory =
  | "authentication"
  | "authorization"
  | "data_access"
  | "data_modification"
  | "configuration"
  | "security"
  | "integration"
  | "admin";

export type AuditEventAction =
  | "created"
  | "updated"
  | "deleted"
  | "accessed"
  | "exported"
  | "shared"
  | "login"
  | "logout"
  | "failed_login"
  | "permission_granted"
  | "permission_revoked"
  | "configuration_changed"
  | "integration_connected"
  | "integration_disconnected";

export type AuditEventStatus = "success" | "failure" | "warning";

export type AuditEventSeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_ip_address: string | null;
  actor_user_agent: string | null;
  event_type: string;
  event_category: AuditEventCategory;
  event_action: AuditEventAction;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  description: string;
  metadata: Json;
  status: AuditEventStatus;
  error_message: string | null;
  severity: AuditEventSeverity;
  created_at: string;
  expires_at: string | null;
}

export interface AuditLogExport {
  id: string;
  organization_id: string;
  user_id: string;
  export_format: "csv" | "json" | "pdf";
  filters: Json | null;
  record_count: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AuditLogStats {
  total_events: number;
  successful_events: number;
  failed_events: number;
  critical_events: number;
  events_by_category: Record<string, number>;
  events_by_action: Record<string, number>;
  top_users: Array<{
    email: string;
    name: string;
    count: number;
  }>;
  recent_critical: Array<{
    event_type: string;
    description: string;
    created_at: string;
    actor_email: string;
  }>;
}

// RBAC Types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  group_id: string | null;
  created_at: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Role {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system_role: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  conditions: Json | null;
  created_at: string;
}

export interface UserCustomPermission {
  id: string;
  user_id: string;
  permission_id: string;
  grant_type: 'grant' | 'deny';
  resource_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  permission_count: number;
}

export interface UserPermission {
  permission_name: string;
  permission_description: string;
  resource: string;
  action: string;
  source: 'role' | 'custom';
}

// Matter/Case Management Types
export type MatterStatus = 'active' | 'pending' | 'closed' | 'archived';
export type MatterPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Matter {
  id: string;
  organization_id: string;
  user_id: string;

  // Matter details
  matter_number: string;
  matter_name: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;

  // Classification
  matter_type: string;
  status: MatterStatus;
  priority: MatterPriority;

  // Dates
  opened_date: string;
  closed_date: string | null;
  statute_of_limitations_date: string | null;

  // Financial
  billing_type: string | null;
  hourly_rate: number | null;
  estimated_value: number | null;

  // Details
  description: string | null;
  notes: string | null;
  tags: string[] | null;

  // Metadata
  metadata: Json | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MatterWithStats extends Matter {
  document_count: number;
  total_storage_bytes: number;
  documents_with_summaries: number;
  last_document_uploaded: string | null;
}

// Training System Types
export type TrainingDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type TrainingEnrollmentType = 'self_enrolled' | 'assigned' | 'mandatory';
export type TrainingEnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';
export type TrainingProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type TrainingContentType = 'document' | 'video' | 'quiz' | 'interactive' | 'external_link';

export interface TrainingModule {
  id: string;
  organization_id: string;
  created_by: string;

  // Module details
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: TrainingDifficultyLevel | null;
  estimated_duration_minutes: number | null;

  // Configuration
  is_mandatory: boolean;
  requires_completion: boolean;
  passing_score_percentage: number;
  certificate_enabled: boolean;

  // Visibility
  is_published: boolean;
  is_public: boolean;
  assigned_roles: string[] | null;

  // Content
  cover_image_url: string | null;
  tags: string[] | null;

  // Metadata
  metadata: Json | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface TrainingLesson {
  id: string;
  module_id: string;

  // Lesson details
  title: string;
  description: string | null;
  lesson_order: number;
  content_type: TrainingContentType;

  // Content
  document_id: string | null;
  content_url: string | null;
  content_text: string | null;

  // Configuration
  estimated_duration_minutes: number | null;
  is_required: boolean;

  // Metadata
  metadata: Json | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  module_id: string;
  user_id: string;

  // Enrollment details
  enrolled_by: string | null;
  enrollment_type: TrainingEnrollmentType;

  // Status
  status: TrainingEnrollmentStatus;
  progress_percentage: number;

  // Dates
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;

  // Metadata
  metadata: Json | null;
}

export interface TrainingProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  user_id: string;

  // Progress
  status: TrainingProgressStatus;
  completion_percentage: number;
  time_spent_seconds: number;

  // Assessment results
  score_percentage: number | null;
  passed: boolean | null;
  attempts: number;

  // Timestamps
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;

  // Metadata
  metadata: Json | null;
}

export interface TrainingAssessment {
  id: string;
  lesson_id: string;

  // Assessment details
  title: string;
  description: string | null;
  passing_score_percentage: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;

  // Questions
  questions: Json;

  // Configuration
  randomize_questions: boolean;
  show_correct_answers: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TrainingCertificate {
  id: string;
  enrollment_id: string;
  module_id: string;
  user_id: string;
  organization_id: string;

  // Certificate details
  certificate_number: string;
  issued_at: string;
  expires_at: string | null;

  // Certificate data
  completion_data: Json | null;
  certificate_url: string | null;

  // Metadata
  metadata: Json | null;

  created_at: string;
}

// Extended types with relations
export interface TrainingModuleWithStats extends TrainingModule {
  lesson_count: number;
  enrollment_count: number;
  completed_count: number;
  avg_progress_percentage: number;
  total_duration_minutes: number;
}

export interface TrainingModuleWithLessons extends TrainingModule {
  lessons: TrainingLesson[];
}

export interface TrainingEnrollmentWithModule extends TrainingEnrollment {
  module: TrainingModule;
}

export interface TrainingEnrollmentWithProgress extends TrainingEnrollment {
  module: TrainingModule;
  progress: TrainingProgress[];
}

// ===========================================
// Social & Collaboration Types
// ===========================================

// Share Types
export type ShareType = 'team' | 'organization' | 'specific_users';
export type ParticipantRole = 'owner' | 'moderator' | 'participant' | 'viewer';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ContextType = 'document' | 'general' | 'training' | 'project';
export type ContributionType = 'document' | 'training_module' | 'conversation' | 'annotation';

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  organization_id: string;

  // Sharing scope
  share_type: ShareType;
  shared_with_users: string[] | null;

  // Permissions
  can_view: boolean;
  can_edit: boolean;
  can_reshare: boolean;

  // Metadata
  share_message: string | null;
  metadata: Json | null;

  // Timestamps
  created_at: string;
  expires_at: string | null;
}

export interface SharedConversation {
  id: string;
  organization_id: string;
  created_by: string;

  // Conversation details
  title: string;
  description: string | null;

  // Context
  document_id: string | null;
  context_type: ContextType | null;

  // Visibility
  is_private: boolean;
  is_archived: boolean;

  // Metadata
  tags: string[] | null;
  metadata: Json | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;

  // Participant role
  role: ParticipantRole;

  // Permissions
  can_send_messages: boolean;
  can_invite_others: boolean;
  can_edit_conversation: boolean;

  // Activity tracking
  joined_at: string;
  last_read_at: string | null;
  notification_enabled: boolean;

  // Metadata
  metadata: Json | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string | null;

  // Message details
  role: MessageRole;
  content: string;

  // AI response metadata
  model_used: string | null;
  tokens_used: number | null;
  cost_usd: number | null;

  // Message status
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;

  // Reactions and engagement
  reactions: Json | null;

  // Reply threading
  reply_to_message_id: string | null;

  // Metadata
  metadata: Json | null;

  // Timestamps
  created_at: string;
}

export interface KnowledgeContribution {
  id: string;
  user_id: string;
  organization_id: string;

  // Contribution details
  contribution_type: ContributionType;
  resource_id: string;
  resource_title: string | null;

  // Impact metrics
  views_count: number;
  shares_count: number;
  helpful_votes: number;

  // Metadata
  tags: string[] | null;
  metadata: Json | null;

  // Timestamps
  created_at: string;
}

export interface ConversationBookmark {
  id: string;
  user_id: string;
  conversation_id: string;

  // Bookmark details
  note: string | null;

  // Timestamps
  created_at: string;
}

// Extended types with relations
export interface DocumentShareWithDetails extends DocumentShare {
  document: Document;
  shared_by_profile: Profile;
}

export interface SharedConversationWithParticipants extends SharedConversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  message_count: number;
  last_message: ConversationMessage | null;
}

export interface SharedConversationWithMessages extends SharedConversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  messages: (ConversationMessage & { user_profile?: Profile })[];
}

export interface ConversationMessageWithUser extends ConversationMessage {
  user_profile: Profile | null;
}

export interface KnowledgeContributionWithUser extends KnowledgeContribution {
  user_profile: Profile;
}

// Stats types
export interface ConversationStats {
  conversation_id: string;
  title: string;
  organization_id: string;
  participant_count: number;
  message_count: number;
  last_message_at: string | null;
  total_tokens_used: number | null;
  total_cost_usd: number | null;
}

export interface KnowledgeContributorStats {
  user_id: string;
  full_name: string | null;
  email: string;
  organization_id: string;
  total_contributions: number;
  documents_contributed: number;
  training_contributed: number;
  conversations_contributed: number;
  total_views: number;
  total_shares: number;
  total_helpful_votes: number;
}

// Accessible documents view type
export interface AccessibleDocument extends Document {
  access_type: 'owner' | 'shared' | null;
  shared_by: string | null;
  can_edit_shared: boolean | null;
  shared_by_name: string | null;
}
