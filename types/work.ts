/**
 * Work System Types
 * Types for teams, projects, and workspace features
 */

// ============================================================================
// Team Types
// ============================================================================

export type TeamType = 'department' | 'project_team';

export type TeamMemberRole = 'lead' | 'manager' | 'member' | 'viewer';

export interface TeamAIContext {
  personality: string;
  tools: string[];
  prompts: Record<string, string>;
  content_filters: string[];
  suggestions_focus: string[];
}

export interface TeamDashboardConfig {
  metrics: string[];
  widgets: string[];
  kpis: TeamKPI[];
}

export interface TeamKPI {
  id: string;
  name: string;
  type: 'number' | 'percentage' | 'currency' | 'trend';
  query?: string;
  target?: number;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  team_type: TeamType;
  color: string;
  icon: string;
  emoji?: string;
  ai_context: TeamAIContext;
  dashboard_config: TeamDashboardConfig;
  is_archived: boolean;
  sort_order: number;
  parent_team_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  can_manage_members: boolean;
  can_edit_settings: boolean;
  can_manage_projects: boolean;
  can_view_analytics: boolean;
  joined_at: string;
  invited_by?: string;
  // Joined profile data
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  member_count: number;
  project_count?: number;
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectStage = 'ideation' | 'planning' | 'in_progress' | 'review' | 'complete';

export type ProjectMemberRole = 'owner' | 'lead' | 'member' | 'viewer';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectSettings {
  visibility: 'team' | 'organization' | 'private';
  allow_external_members: boolean;
  auto_archive_completed: boolean;
  default_task_assignee?: string;
}

export interface Project {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  emoji: string;
  current_stage: ProjectStage;
  team_id?: string;
  start_date?: string;
  target_date?: string;
  completed_at?: string;
  progress_percent: number;
  tasks_total: number;
  tasks_completed: number;
  ai_context: Record<string, unknown>;
  settings: ProjectSettings;
  priority: ProjectPriority;
  is_archived: boolean;
  sort_order: number;
  conversation_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  can_edit_project: boolean;
  can_manage_tasks: boolean;
  can_upload_files: boolean;
  can_invite_members: boolean;
  can_manage_milestones: boolean;
  joined_at: string;
  invited_by?: string;
  // Joined profile data
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  stage?: ProjectStage;
  sort_order: number;
  is_key_milestone: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithDetails extends Project {
  team?: Team;
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  member_count: number;
}

// ============================================================================
// Kanban Types
// ============================================================================

export interface KanbanColumn {
  id: ProjectStage;
  title: string;
  color: string;
  icon: string;
  description: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'ideation',
    title: 'Ideation',
    color: '#a855f7', // purple
    icon: 'lightbulb',
    description: 'New ideas and concepts being explored',
  },
  {
    id: 'planning',
    title: 'Planning',
    color: '#3b82f6', // blue
    icon: 'clipboard-list',
    description: 'Defining scope, requirements, and timeline',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: '#f59e0b', // amber
    icon: 'play-circle',
    description: 'Actively being worked on',
  },
  {
    id: 'review',
    title: 'Review',
    color: '#10b981', // emerald
    icon: 'eye',
    description: 'Under review or testing',
  },
  {
    id: 'complete',
    title: 'Complete',
    color: '#22c55e', // green
    icon: 'check-circle',
    description: 'Successfully completed',
  },
];

export interface KanbanDragResult {
  projectId: string;
  sourceStage: ProjectStage;
  destinationStage: ProjectStage;
  sourceIndex: number;
  destinationIndex: number;
}

// ============================================================================
// Context Types
// ============================================================================

export interface WorkContext {
  activeTeamId?: string;
  activeProjectId?: string;
  team?: Team;
  project?: Project;
}

export interface TeamContextState {
  isLoading: boolean;
  activeContext?: WorkContext;
  availableTeams: Team[];
  switchTeamContext: (teamId: string | null) => Promise<void>;
  switchProjectContext: (projectId: string | null) => Promise<void>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTeamRequest {
  name: string;
  slug?: string;
  description?: string;
  team_type: TeamType;
  color?: string;
  emoji?: string;
  ai_context?: Partial<TeamAIContext>;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  color?: string;
  emoji?: string;
  ai_context?: Partial<TeamAIContext>;
  dashboard_config?: Partial<TeamDashboardConfig>;
  is_archived?: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  emoji?: string;
  team_id?: string;
  start_date?: string;
  target_date?: string;
  priority?: ProjectPriority;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  emoji?: string;
  current_stage?: ProjectStage;
  team_id?: string;
  start_date?: string;
  target_date?: string;
  priority?: ProjectPriority;
  settings?: Partial<ProjectSettings>;
  is_archived?: boolean;
}

export interface AddTeamMemberRequest {
  user_id: string;
  role?: TeamMemberRole;
  can_manage_members?: boolean;
  can_manage_projects?: boolean;
}

export interface AddProjectMemberRequest {
  user_id: string;
  role?: ProjectMemberRole;
  can_edit_project?: boolean;
  can_manage_tasks?: boolean;
  can_upload_files?: boolean;
  can_invite_members?: boolean;
  can_manage_milestones?: boolean;
}

export interface CreateMilestoneRequest {
  name: string;
  description?: string;
  due_date?: string;
  stage?: ProjectStage;
  is_key_milestone?: boolean;
}

export interface UpdateMilestoneRequest {
  name?: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  stage?: ProjectStage;
  is_key_milestone?: boolean;
  sort_order?: number;
}

// ============================================================================
// Department Presets (for default team creation)
// ============================================================================

export interface DepartmentPreset {
  name: string;
  slug: string;
  emoji: string;
  color: string;
  ai_context: TeamAIContext;
}

export const DEPARTMENT_PRESETS: DepartmentPreset[] = [
  {
    name: 'Marketing',
    slug: 'marketing',
    emoji: '📣',
    color: '#f59e0b',
    ai_context: {
      personality: 'creative and engaging',
      tools: ['social_media', 'content_calendar', 'analytics'],
      prompts: { tone: 'persuasive and brand-focused' },
      content_filters: ['marketing', 'campaigns', 'content'],
      suggestions_focus: ['content ideas', 'campaign optimization', 'audience engagement'],
    },
  },
  {
    name: 'Sales',
    slug: 'sales',
    emoji: '💼',
    color: '#10b981',
    ai_context: {
      personality: 'professional and results-driven',
      tools: ['crm', 'email_templates', 'pipeline'],
      prompts: { tone: 'confident and solution-oriented' },
      content_filters: ['deals', 'prospects', 'revenue'],
      suggestions_focus: ['deal closing', 'follow-up reminders', 'prospect research'],
    },
  },
  {
    name: 'Operations',
    slug: 'operations',
    emoji: '⚙️',
    color: '#6366f1',
    ai_context: {
      personality: 'efficient and process-oriented',
      tools: ['task_automation', 'process_docs', 'scheduling'],
      prompts: { tone: 'clear and procedural' },
      content_filters: ['processes', 'workflows', 'operations'],
      suggestions_focus: ['workflow optimization', 'resource allocation', 'bottleneck identification'],
    },
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    emoji: '🔧',
    color: '#8b5cf6',
    ai_context: {
      personality: 'technical and precise',
      tools: ['code_review', 'documentation', 'debugging'],
      prompts: { tone: 'accurate and detailed' },
      content_filters: ['code', 'technical', 'development'],
      suggestions_focus: ['code quality', 'architecture decisions', 'technical debt'],
    },
  },
  {
    name: 'Finance',
    slug: 'finance',
    emoji: '💰',
    color: '#059669',
    ai_context: {
      personality: 'analytical and thorough',
      tools: ['spreadsheets', 'reports', 'forecasting'],
      prompts: { tone: 'formal and data-driven' },
      content_filters: ['financial', 'budget', 'reports'],
      suggestions_focus: ['budget analysis', 'cost optimization', 'financial planning'],
    },
  },
  {
    name: 'HR',
    slug: 'hr',
    emoji: '🤝',
    color: '#ec4899',
    ai_context: {
      personality: 'empathetic and supportive',
      tools: ['onboarding', 'policies', 'performance'],
      prompts: { tone: 'warm and professional' },
      content_filters: ['people', 'culture', 'policies'],
      suggestions_focus: ['employee engagement', 'policy compliance', 'team culture'],
    },
  },
];
