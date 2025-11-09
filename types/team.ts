import { Json } from './index';

// ===========================================
// TEAM MANAGEMENT ENHANCED TYPES
// ===========================================

// Permission System
export type ResourceType = 'documents' | 'projects' | 'ai_agents' | 'knowledge_spaces' | 'team' | 'settings';
export type ActionType = 'view' | 'edit' | 'delete' | 'create' | 'manage' | 'share';
export type UserRole = 'admin' | 'member' | 'viewer' | 'manager' | 'contributor';

export interface TeamPermission {
  id: string;
  name: string;
  resource_type: ResourceType;
  action: ActionType;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  resource_id: string | null; // Specific document/project/space ID
  granted: boolean; // true = grant, false = revoke
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
}

export interface UserPermissionWithDetails extends UserPermission {
  permission: TeamPermission;
  granted_by_profile?: {
    full_name: string | null;
    email: string;
  };
}

// Activity Tracking
export type ActivityType =
  | 'document_view'
  | 'document_upload'
  | 'document_edit'
  | 'document_delete'
  | 'conversation_create'
  | 'conversation_message'
  | 'project_create'
  | 'project_update'
  | 'team_invite'
  | 'team_join'
  | 'permission_grant'
  | 'permission_revoke'
  | 'settings_update';

export type ActivityResourceType = 'document' | 'project' | 'conversation' | 'knowledge_space' | 'team' | 'settings';

export interface TeamActivity {
  id: string;
  organization_id: string;
  user_id: string;
  activity_type: ActivityType;
  resource_type: ActivityResourceType | null;
  resource_id: string | null;
  resource_title: string | null;
  metadata: Json;
  created_at: string;
}

export interface TeamActivityWithUser extends TeamActivity {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Team Groups & Departments
export interface TeamGroup {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'leader' | 'member';
  added_by: string | null;
  added_at: string;
}

export interface TeamGroupWithMembers extends TeamGroup {
  members: (TeamGroupMember & {
    profile: {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
      job_title: string | null;
    };
  })[];
  member_count: number;
}

// Enhanced Profile Fields
export interface EnhancedProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  role: UserRole;

  // Enhanced fields
  bio: string | null;
  expertise: string[] | null;
  department: string | null;
  job_title: string | null;
  is_online: boolean;
  last_active_at: string | null;
  onboarding_completed: boolean;

  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithActivity extends EnhancedProfile {
  recent_activity: TeamActivity[];
  activity_count_7d: number;
  activity_count_30d: number;
  documents_uploaded: number;
  conversations_started: number;
  groups: TeamGroup[];
}

// Document Access Logs
export type AccessType = 'view' | 'download' | 'edit' | 'share';

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id: string;
  access_type: AccessType;
  metadata: Json;
  accessed_at: string;
}

export interface DocumentAccessLogWithUser extends DocumentAccessLog {
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface DocumentAccessStats {
  document_id: string;
  total_views: number;
  unique_viewers: number;
  total_downloads: number;
  total_edits: number;
  total_shares: number;
  last_accessed_at: string | null;
  most_active_user: {
    user_id: string;
    full_name: string | null;
    access_count: number;
  } | null;
}

// Analytics
export type MetricType =
  | 'daily_active_users'
  | 'documents_uploaded'
  | 'conversations_created'
  | 'ai_queries'
  | 'storage_used_bytes'
  | 'total_tokens_used'
  | 'total_cost_usd';

export interface TeamAnalytics {
  id: string;
  organization_id: string;
  metric_type: MetricType;
  metric_value: number;
  metadata: Json;
  date: string;
  created_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  metric_type: MetricType;
  metric_value: number;
  metadata: Json;
  date: string;
  created_at: string;
}

// Dashboard Stats
export interface TeamDashboardStats {
  // Current stats
  total_members: number;
  active_members_7d: number;
  active_members_30d: number;

  // Activity stats
  total_activities_7d: number;
  total_activities_30d: number;
  most_active_members: {
    user_id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    activity_count: number;
  }[];

  // Content stats
  documents_uploaded_7d: number;
  documents_uploaded_30d: number;
  conversations_created_7d: number;
  conversations_created_30d: number;

  // Resource usage
  storage_used_bytes: number;
  storage_limit_bytes: number;
  total_cost_7d_usd: number;
  total_cost_30d_usd: number;
}

export interface UserDashboardStats {
  user_id: string;

  // Activity
  activities_7d: number;
  activities_30d: number;
  most_used_features: {
    feature: string;
    count: number;
  }[];

  // Content
  documents_uploaded: number;
  conversations_created: number;
  documents_viewed_7d: number;

  // Collaboration
  shared_documents: number;
  shared_conversations: number;
  groups_member_of: number;

  // Usage
  tokens_used_30d: number;
  cost_30d_usd: number;
}

// Real-time Presence
export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
  current_page: string | null;
  current_resource_id: string | null;
  current_resource_type: ActivityResourceType | null;
}

export interface OnlineUser {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  current_page: string | null;
  last_active_at: string;
}

// Permissions Check Result
export interface PermissionCheckResult {
  has_permission: boolean;
  source: 'role' | 'user_override' | 'none';
  permission_name: string | null;
  expires_at: string | null;
}

// Activity Feed Item
export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  resource_type: ActivityResourceType | null;
  resource_id: string | null;
  resource_title: string | null;
  description: string;
  created_at: string;
  metadata: Json;
}

// Bulk Operations
export interface BulkPermissionUpdate {
  user_ids: string[];
  permission_id: string;
  granted: boolean;
  resource_id: string | null;
  expires_at: string | null;
}

export interface BulkGroupAssignment {
  user_ids: string[];
  group_id: string;
  role: 'leader' | 'member';
}

// Team Settings
export interface TeamSettings {
  organization_id: string;

  // Onboarding
  onboarding_enabled: boolean;
  onboarding_checklist: string[];

  // Permissions
  default_role: UserRole;
  allow_self_signup: boolean;
  allowed_email_domains: string[];

  // Features
  enable_groups: boolean;
  enable_activity_tracking: boolean;
  enable_analytics: boolean;

  // Notifications
  notify_on_new_member: boolean;
  notify_on_permission_change: boolean;

  updated_at: string;
}
