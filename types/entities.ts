/**
 * Entity Architecture Types
 * Multi-entity, brand, and project management
 */

// =====================================================
// LOOKUP TYPES (Admin-Configurable)
// =====================================================

export interface LookupEntityType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface LookupProjectType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  default_stages: string[];
  is_active: boolean;
  sort_order: number;
}

export interface LookupProjectStage {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_terminal: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface LookupContentType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  default_platforms: string[];
  is_active: boolean;
  sort_order: number;
}

export interface LookupPlatform {
  id: string;
  name: string;
  display_name: string;
  icon: string | null;
  character_limit: number | null;
  supports_images: boolean;
  supports_video: boolean;
  supports_links: boolean;
  api_config: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

export interface LookupFocusArea {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
}

// =====================================================
// ENTITIES (Companies/Organizations)
// =====================================================

export interface Entity {
  id: string;
  owner_id: string;
  organization_id: string | null;

  name: string;
  legal_name: string | null;
  description: string | null;

  entity_type_id: string | null;
  ein: string | null;

  primary_focus_id: string | null;

  logo_url: string | null;
  color_primary: string | null;
  color_secondary: string | null;

  website: string | null;
  email: string | null;
  phone: string | null;

  ai_context: EntityAIContext;
  settings: Record<string, any>;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined data
  entity_type?: LookupEntityType;
  primary_focus?: LookupFocusArea;
  focus_areas?: LookupFocusArea[];
  brands?: Brand[];
  projects?: EntityProject[];
}

export interface EntityAIContext {
  personality?: string;
  tone?: string;
  values?: string[];
  communication_style?: string;
  key_messages?: string[];
  avoid_topics?: string[];
}

export interface EntityWithStats extends Entity {
  brand_count: number;
  project_count: number;
}

// Type aliases for "Space" terminology (UI-facing name for Entity)
export type Space = Entity;
export type SpaceWithStats = EntityWithStats;

// =====================================================
// BRANDS (Under Entities)
// =====================================================

export interface Brand {
  id: string;
  entity_id: string;
  owner_id: string;

  name: string;
  tagline: string | null;
  description: string | null;

  logo_url: string | null;
  color_primary: string | null;
  color_secondary: string | null;

  tone_config: BrandToneConfig;

  content_calendar_enabled: boolean;
  auto_schedule_enabled: boolean;
  approval_required: boolean;

  posting_frequency: Record<string, any>;
  optimal_times: Record<string, any>;

  primary_ai_model: string;
  refinement_ai_model: string;

  social_accounts: SocialAccount[];

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined data
  entity?: Entity;
  platforms?: BrandPlatform[];
}

export interface BrandToneConfig {
  voice: "professional" | "casual" | "pastoral" | "academic" | "friendly";
  personality_traits: string[];
  writing_style: string;
  avoid_words: string[];
  preferred_phrases: string[];
  emoji_usage: "none" | "minimal" | "moderate" | "heavy";
  hashtag_strategy: "none" | "minimal" | "relevant" | "trending";
  cta_style: "none" | "soft" | "direct" | "urgent";
}

export interface SocialAccount {
  platform: string;
  handle: string;
  account_id?: string;
  is_connected: boolean;
}

export interface BrandPlatform {
  id: string;
  brand_id: string;
  platform_id: string;
  account_handle: string | null;
  account_id: string | null;
  is_connected: boolean;
  credentials_id: string | null;
  tone_overrides: Partial<BrandToneConfig>;
  max_posts_per_day: number;
  min_hours_between_posts: number;
  is_active: boolean;

  platform?: LookupPlatform;
}

// =====================================================
// PROJECTS (Time-Bound Work)
// =====================================================

export interface EntityProject {
  id: string;
  entity_id: string;
  brand_id: string | null;
  owner_id: string;

  name: string;
  description: string | null;

  project_type_id: string | null;
  current_stage_id: string | null;

  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;

  budget_amount: number | null;
  budget_currency: string;
  actual_spend: number;

  priority: "low" | "medium" | "high" | "critical";
  health_status: "on_track" | "at_risk" | "blocked" | "ahead";

  external_id: string | null;
  external_url: string | null;

  ai_summary: string | null;
  ai_recommendations: string[];

  tags: string[];
  metadata: Record<string, any>;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined data
  entity?: Entity;
  brand?: Brand;
  project_type?: LookupProjectType;
  current_stage?: LookupProjectStage;
  milestones?: ProjectMilestone[];
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  is_critical: boolean;
}

// =====================================================
// CONTENT PIPELINE
// =====================================================

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "archived";

export interface ContentItem {
  id: string;
  brand_id: string;
  project_id: string | null;
  created_by: string;

  content_type_id: string | null;

  title: string | null;
  body: string;
  media_urls: string[];

  platform_versions: Record<string, string>;

  status: ContentStatus;

  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;

  scheduled_for: string | null;
  published_at: string | null;

  ai_generated: boolean;
  ai_model_used: string | null;
  ai_prompt_used: string | null;
  ai_confidence: number | null;

  performance_metrics: Record<string, any>;

  tags: string[];
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;

  // Joined data
  brand?: Brand;
  content_type?: LookupContentType;
}

export interface ContentPublishLog {
  id: string;
  content_id: string;
  platform_id: string;

  published_content: string;
  media_urls: string[];

  status: "success" | "failed" | "pending";
  platform_post_id: string | null;
  platform_url: string | null;
  error_message: string | null;

  published_at: string;

  platform?: LookupPlatform;
}

// =====================================================
// AUTOMATION QUEUE
// =====================================================

export type AutomationJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "dead"
  | "cancelled";

export type AutomationJobPriority = "low" | "normal" | "high" | "critical";

export type AutomationJobType =
  | "content_generate"
  | "content_publish"
  | "content_schedule"
  | "lead_followup"
  | "email_sequence"
  | "daily_briefing"
  | "weekly_review"
  | "data_sync"
  | "report_generate"
  | "custom";

export interface AutomationJob {
  id: string;
  owner_id: string;
  entity_id: string | null;
  brand_id: string | null;
  project_id: string | null;

  job_type: AutomationJobType | string;
  payload: Record<string, any>;

  priority: AutomationJobPriority;
  scheduled_for: string;

  status: AutomationJobStatus;

  attempts: number;
  max_attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;

  result: Record<string, any> | null;
  error_message: string | null;

  n8n_execution_id: string | null;
  n8n_workflow_id: string | null;

  created_at: string;
  updated_at: string;
}

// =====================================================
// ENTITY CONTEXT (For UI State)
// =====================================================

export interface EntityContext {
  currentEntity: Entity | null;
  currentBrand: Brand | null;
  entities: EntityWithStats[];
  isLoading: boolean;
  error: string | null;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateEntityRequest {
  name: string;
  legal_name?: string;
  description?: string;
  entity_type_id?: string;
  primary_focus_id?: string;
  website?: string;
  email?: string;
}

export interface CreateBrandRequest {
  entity_id: string;
  name: string;
  tagline?: string;
  description?: string;
  tone_config?: Partial<BrandToneConfig>;
}

export interface CreateProjectRequest {
  entity_id: string;
  brand_id?: string;
  name: string;
  description?: string;
  project_type_id?: string;
  start_date?: string;
  target_end_date?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface QueueAutomationRequest {
  job_type: AutomationJobType | string;
  payload: Record<string, any>;
  entity_id?: string;
  brand_id?: string;
  project_id?: string;
  priority?: AutomationJobPriority;
  scheduled_for?: string;
}
