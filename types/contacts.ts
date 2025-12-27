// Relationship Intelligence System Types

export type ContactType = 'personal' | 'professional' | 'both';
export type RelationshipStrength = 'new' | 'acquaintance' | 'connected' | 'close' | 'inner_circle';
export type InteractionType = 'email' | 'call' | 'video_call' | 'meeting' | 'message' | 'social_media' | 'event' | 'introduction' | 'note' | 'other';
export type InteractionDirection = 'inbound' | 'outbound' | 'mutual';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type OutreachMessageType = 'check_in' | 'project_update' | 'opportunity' | 'meeting_request' | 'introduction';
export type OutreachTone = 'casual' | 'professional' | 'formal';
export type OutreachStatus = 'draft' | 'sent' | 'scheduled';
export type FollowupUrgency = 'urgent' | 'overdue' | 'due_soon' | 'upcoming';
export type PreferredContactMethod = 'email' | 'call' | 'message' | 'any';

export interface Contact {
  id: string;
  organization_id: string;
  user_id: string;

  // Basic Info
  full_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;

  // Classification
  contact_type: ContactType;
  relationship_strength: RelationshipStrength;
  tags: string[];

  // Context
  how_we_met?: string;
  first_met_date?: string;
  location?: string;
  timezone?: string;

  // Skills & Interests
  skills: string[];
  interests: string[];
  can_help_with: string[];
  looking_for: string[];

  // AI Fields
  ai_summary?: string;
  ai_suggested_actions?: string[];
  ai_connection_score?: number;
  ai_last_analyzed_at?: string;
  ai_relevance_tags?: string[];
  suggest_for_opportunities: boolean;

  // Status
  is_favorite: boolean;
  is_archived: boolean;
  last_interaction_at?: string;
  next_followup_date?: string;
  followup_reminder_sent: boolean;

  // Reminder Settings
  reminder_enabled: boolean;
  reminder_frequency_days?: number;
  reminder_snoozed_until?: string;
  preferred_contact_method?: PreferredContactMethod;

  // Metadata
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Computed/joined fields
  interaction_count?: number;
  project_count?: number;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  user_id: string;

  // Interaction Details
  interaction_type: InteractionType;
  direction?: InteractionDirection;

  // Content
  subject?: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  sentiment?: Sentiment;

  // Context
  location?: string;
  duration_minutes?: number;
  participants: string[];

  // Links
  related_project_id?: string;
  related_task_id?: string;
  attachments: Array<{ name: string; url: string; type: string }>;

  // AI Analysis
  ai_summary?: string;
  ai_topics: string[];

  // Metadata
  interaction_date: string;
  created_at: string;
}

export interface ContactProject {
  id: string;
  contact_id: string;
  project_id: string;
  role?: string;
  notes?: string;
  added_by?: string;
  added_at: string;

  // Joined data
  project?: {
    id: string;
    name: string;
    emoji?: string;
    current_stage?: string;
  };
}

export interface ContactConnection {
  id: string;
  contact_a_id: string;
  contact_b_id: string;
  relationship_type?: string;
  strength: 'known' | 'connected' | 'close';
  notes?: string;
  created_by?: string;
  created_at: string;

  // Joined data
  connected_contact?: Contact;
}

export interface ContactMessage {
  id: string;
  contact_id: string;
  user_id: string;
  direction: 'sent' | 'received';
  content: string;
  is_read: boolean;
  external_message_id?: string;
  external_thread_id?: string;
  created_at: string;
}

// AI Matching types
export interface ContactMatch {
  contact_id: string;
  full_name: string;
  company?: string;
  avatar_url?: string;
  relationship_strength: RelationshipStrength;
  match_reasons: string[];
  relevance_score: number;
}

export interface ProjectContactSuggestion {
  project_id: string;
  project_name: string;
  suggested_contacts: ContactMatch[];
  generated_at: string;
}

// Form/Input types
export interface CreateContactInput {
  full_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  contact_type?: ContactType;
  relationship_strength?: RelationshipStrength;
  tags?: string[];
  how_we_met?: string;
  first_met_date?: string;
  location?: string;
  timezone?: string;
  skills?: string[];
  interests?: string[];
  can_help_with?: string[];
  looking_for?: string[];
  custom_fields?: Record<string, any>;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
  is_favorite?: boolean;
  is_archived?: boolean;
  next_followup_date?: string;
}

export interface CreateInteractionInput {
  contact_id: string;
  interaction_type: InteractionType;
  direction?: InteractionDirection;
  subject?: string;
  summary: string;
  key_points?: string[];
  action_items?: string[];
  sentiment?: Sentiment;
  location?: string;
  duration_minutes?: number;
  participants?: string[];
  related_project_id?: string;
  related_task_id?: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  interaction_date?: string;
}

export interface ContactFilters {
  search?: string;
  contact_type?: ContactType;
  relationship_strength?: RelationshipStrength;
  tags?: string[];
  is_favorite?: boolean;
  is_archived?: boolean;
  needs_followup?: boolean;
}

// Relationship strength labels and colors
export const RELATIONSHIP_STRENGTH_CONFIG: Record<RelationshipStrength, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  followupDays: number;
}> = {
  new: {
    label: 'New',
    description: 'Just met, initial contact',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    followupDays: 7,
  },
  acquaintance: {
    label: 'Acquaintance',
    description: 'Know each other, occasional contact',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    followupDays: 90,
  },
  connected: {
    label: 'Connected',
    description: 'Regular contact, working relationship',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    followupDays: 60,
  },
  close: {
    label: 'Close',
    description: 'Strong relationship, frequent contact',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    followupDays: 30,
  },
  inner_circle: {
    label: 'Inner Circle',
    description: 'Core network, very close relationship',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    followupDays: 14,
  },
};

export const INTERACTION_TYPE_CONFIG: Record<InteractionType, {
  label: string;
  icon: string;
  color: string;
}> = {
  email: { label: 'Email', icon: 'Mail', color: 'text-blue-500' },
  call: { label: 'Phone Call', icon: 'Phone', color: 'text-green-500' },
  video_call: { label: 'Video Call', icon: 'Video', color: 'text-purple-500' },
  meeting: { label: 'Meeting', icon: 'Users', color: 'text-amber-500' },
  message: { label: 'Message', icon: 'MessageSquare', color: 'text-cyan-500' },
  social_media: { label: 'Social Media', icon: 'Share2', color: 'text-pink-500' },
  event: { label: 'Event', icon: 'Calendar', color: 'text-indigo-500' },
  introduction: { label: 'Introduction', icon: 'UserPlus', color: 'text-teal-500' },
  note: { label: 'Note', icon: 'FileText', color: 'text-slate-500' },
  other: { label: 'Other', icon: 'MoreHorizontal', color: 'text-gray-500' },
};

export const CONTACT_TYPE_CONFIG: Record<ContactType, {
  label: string;
  description: string;
}> = {
  personal: { label: 'Personal', description: 'Friends, family, personal connections' },
  professional: { label: 'Professional', description: 'Business contacts, colleagues, clients' },
  both: { label: 'Both', description: 'Personal and professional relationship' },
};

// Outreach & Follow-up Types
export interface OutreachMessage {
  id: string;
  contact_id: string;
  user_id: string;
  message_type: OutreachMessageType;
  subject?: string;
  body: string;
  tone: OutreachTone;
  status: OutreachStatus;
  sent_at?: string;
  sent_via?: 'email' | 'copied' | 'in_app';
  ai_generated: boolean;
  ai_context?: {
    contact_name: string;
    relationship_strength: string;
    last_interaction?: string;
    shared_projects?: string[];
    days_since_contact?: number;
  };
  created_at: string;
}

export interface FollowupContact {
  contact_id: string;
  full_name: string;
  company?: string;
  email?: string;
  avatar_url?: string;
  relationship_strength: RelationshipStrength;
  last_interaction_at?: string;
  next_followup_date?: string;
  days_overdue: number;
  urgency: FollowupUrgency;
}

export interface GeneratedMessage {
  subject: string;
  body: string;
  tone: OutreachTone;
}

export interface GenerateMessageResponse {
  variations: GeneratedMessage[];
  context: {
    contact_name: string;
    relationship_strength: string;
    last_interaction?: string;
    days_since_contact?: number;
    shared_projects?: string[];
  };
}

export const OUTREACH_MESSAGE_TYPE_CONFIG: Record<OutreachMessageType, {
  label: string;
  description: string;
  icon: string;
}> = {
  check_in: {
    label: 'Casual Check-in',
    description: 'Friendly message to reconnect',
    icon: 'MessageCircle',
  },
  project_update: {
    label: 'Project Update',
    description: 'Share progress on a shared project',
    icon: 'FolderKanban',
  },
  opportunity: {
    label: 'Share Opportunity',
    description: 'Share something that might interest them',
    icon: 'Sparkles',
  },
  meeting_request: {
    label: 'Meeting Request',
    description: 'Request a call or meeting',
    icon: 'Calendar',
  },
  introduction: {
    label: 'Introduction Offer',
    description: 'Offer to introduce them to someone',
    icon: 'UserPlus',
  },
};

export const OUTREACH_TONE_CONFIG: Record<OutreachTone, {
  label: string;
  description: string;
}> = {
  casual: { label: 'Casual', description: 'Friendly and relaxed tone' },
  professional: { label: 'Professional', description: 'Business-appropriate tone' },
  formal: { label: 'Formal', description: 'Very professional and structured' },
};

export const FOLLOWUP_URGENCY_CONFIG: Record<FollowupUrgency, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  overdue: {
    label: 'Overdue',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  due_soon: {
    label: 'Due Soon',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  upcoming: {
    label: 'Upcoming',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};
