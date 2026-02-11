// Voice Intelligence Module - Type Definitions
// 3-dimension classification: Entity × Activity × Action

// ============================================================
// Enums / Union Types
// ============================================================

export type EntityType =
  | "IHA"
  | "Uplift Communities"
  | "DeepFutures Capital"
  | "TPC Ministries"
  | "Perpetual Core"
  | "Personal/Family";

export type ActivityType =
  | "Revenue"
  | "Fundraising"
  | "Operations"
  | "Relationships"
  | "Strategy"
  | "Ministry"
  | "Content";

export type ActionType =
  | "Deliver"
  | "Decide"
  | "Delegate"
  | "Document"
  | "Develop";

export type ActionTier = "red" | "yellow" | "green";

export type ActionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "auto_completed";

export type ContextType = "entity" | "person" | "project" | "keyword";

export type VoiceMemoSource = "manual" | "plaud" | "upload" | "transcript_paste";

export type ClassificationStatus = "pending" | "processing" | "completed" | "failed";

// ============================================================
// Brain Classification Output (from Claude)
// ============================================================

export interface ExtractedPerson {
  name: string;
  entity_link: string | null;
  role: string | null;
  is_known: boolean;
}

export interface PropheticWord {
  recipient: string;
  content: string;
  timestamp_label: string | null;
  srt_start: string | null;
  srt_end: string | null;
}

export interface Discovery {
  type: "person" | "entity" | "project";
  name: string;
  inferred_context: string;
}

export interface BrainActionItem {
  tier: ActionTier;
  action_type: ActionType;
  title: string;
  description: string;
  related_entity: string;
  related_people: string[];
  delivery_payload?: Record<string, unknown>;
}

export interface BrainClassificationOutput {
  entity: EntityType;
  activity: ActivityType;
  action_type: ActionType;
  confidence: {
    entity: number;
    activity: number;
    action: number;
  };
  summary: string;
  people: ExtractedPerson[];
  prophetic_words: PropheticWord[];
  has_prophetic_content: boolean;
  discoveries: Discovery[];
  action_items: BrainActionItem[];
  title_suggestion: string | null;
}

// ============================================================
// Database Row Types
// ============================================================

export interface VoiceIntelContext {
  id: string;
  user_id: string;
  context_type: ContextType;
  name: string;
  aliases: string[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceIntelClassification {
  id: string;
  voice_memo_id: string;
  user_id: string;
  entity: string;
  activity: string;
  action_type: string;
  confidence_scores: BrainClassificationOutput["confidence"];
  people: ExtractedPerson[];
  prophetic_words: PropheticWord[];
  has_prophetic_content: boolean;
  discoveries: Discovery[];
  brain_summary: string | null;
  brain_raw_output: BrainClassificationOutput;
  action_items: BrainActionItem[];
  processing_model: string;
  processing_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceIntelAction {
  id: string;
  user_id: string;
  classification_id: string | null;
  voice_memo_id: string | null;
  tier: ActionTier;
  action_type: string;
  title: string;
  description: string | null;
  related_entity: string | null;
  related_people: string[];
  delivery_payload: Record<string, unknown>;
  status: ActionStatus;
  priority: number;
  approved_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface ClassifyVoiceMemoResult {
  classification: VoiceIntelClassification;
  actions: VoiceIntelAction[];
  discoveries: Discovery[];
}

export interface ContextCreateRequest {
  context_type: ContextType;
  name: string;
  aliases?: string[];
  metadata?: Record<string, unknown>;
}

export interface ActionUpdateRequest {
  status?: ActionStatus;
  rejection_reason?: string;
}

export interface PlaudWebhookEvent {
  event: string;
  data: {
    workflow_id: string;
    file_id: string;
    file_name: string;
    status: string;
    transcript_url?: string;
    audio_url?: string;
  };
  timestamp: string;
}
