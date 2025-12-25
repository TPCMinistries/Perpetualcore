/**
 * Work System Types
 * Types for teams, projects, and workspace features
 */

// ============================================================================
// Team Types
// ============================================================================

export type TeamType = 'department' | 'project_team';

export type TeamTemplateCategory = 'traditional' | 'bos_2';

// ============================================================================
// Workflow Stage Types (for BOS 2.0 lifecycle-based teams)
// ============================================================================

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  description?: string;
}

// ============================================================================
// Team Template Types
// ============================================================================

export interface TeamTemplate {
  id: string;
  category: TeamTemplateCategory;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  description: string;
  team_type: TeamType;
  ai_context: TeamAIContext;
  workflow_stages?: WorkflowStage[];
}

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

// ============================================================================
// Traditional Team Templates (from Department Presets)
// ============================================================================

export const TRADITIONAL_TEAM_TEMPLATES: TeamTemplate[] = DEPARTMENT_PRESETS.map(preset => ({
  id: preset.slug,
  category: 'traditional' as TeamTemplateCategory,
  name: preset.name,
  slug: preset.slug,
  emoji: preset.emoji,
  color: preset.color,
  description: `Traditional ${preset.name.toLowerCase()} department`,
  team_type: 'department' as TeamType,
  ai_context: preset.ai_context,
}));

// ============================================================================
// BOS 2.0 Team Templates (AI-First, Lifecycle-Based)
// ============================================================================

export const BOS_2_TEAM_TEMPLATES: TeamTemplate[] = [
  // 1. Talent Engine
  {
    id: 'talent-engine',
    category: 'bos_2',
    name: 'Talent Engine',
    slug: 'talent-engine',
    emoji: '🎯',
    color: '#ef4444',
    description: 'AI-first hiring, onboarding, evaluation, and talent lifecycle management',
    team_type: 'department',
    ai_context: {
      personality: 'systematic and analytical, pattern-matching for talent fit',
      tools: ['candidate_scoring', 'interview_scheduler', 'onboarding_tracker', 'performance_analytics'],
      prompts: {
        tone: 'evaluative and process-driven',
        focus: 'identify red flags, predict success, automate screening',
      },
      content_filters: ['candidates', 'hiring', 'onboarding', 'performance', 'talent'],
      suggestions_focus: [
        'candidate pipeline status',
        'onboarding completion rates',
        'performance prediction',
        'skill gap analysis',
        'retention risk alerts',
      ],
    },
    workflow_stages: [
      { id: 'needs_assessment', name: 'Needs Assessment', order: 1, color: '#94a3b8' },
      { id: 'sourcing', name: 'Sourcing', order: 2, color: '#a78bfa' },
      { id: 'screening', name: 'AI Screening', order: 3, color: '#60a5fa' },
      { id: 'interview', name: 'Human Interview', order: 4, color: '#f59e0b' },
      { id: 'offer', name: 'Offer', order: 5, color: '#fbbf24' },
      { id: 'onboarding', name: 'Onboarding', order: 6, color: '#34d399' },
      { id: 'active', name: 'Active Employee', order: 7, color: '#10b981' },
      { id: 'evaluation', name: 'Under Evaluation', order: 8, color: '#f87171' },
    ],
  },

  // 2. Training & Development
  {
    id: 'training-development',
    category: 'bos_2',
    name: 'Training & Development',
    slug: 'training',
    emoji: '📚',
    color: '#8b5cf6',
    description: 'Upskilling, AI operator training, and capability development',
    team_type: 'department',
    ai_context: {
      personality: 'instructive and encouraging, capability-focused',
      tools: ['skill_assessment', 'learning_paths', 'progress_tracker', 'resource_library'],
      prompts: {
        tone: 'coaching and developmental',
        focus: 'identify learning needs, recommend resources, track mastery',
      },
      content_filters: ['training', 'skills', 'learning', 'development', 'certification'],
      suggestions_focus: [
        'skill gap prioritization',
        'learning recommendations',
        'AI tool proficiency',
        'prompt engineering skills',
        'certification tracking',
      ],
    },
    workflow_stages: [
      { id: 'assessment', name: 'Skill Assessment', order: 1, color: '#94a3b8' },
      { id: 'planning', name: 'Learning Path', order: 2, color: '#a78bfa' },
      { id: 'in_progress', name: 'In Training', order: 3, color: '#60a5fa' },
      { id: 'evaluation', name: 'Skill Evaluation', order: 4, color: '#f59e0b' },
      { id: 'certified', name: 'Certified', order: 5, color: '#10b981' },
    ],
  },

  // 3. Research & Intelligence
  {
    id: 'research-intelligence',
    category: 'bos_2',
    name: 'Research & Intelligence',
    slug: 'research',
    emoji: '🔬',
    color: '#06b6d4',
    description: 'Market intelligence, competitive analysis, and strategic research',
    team_type: 'department',
    ai_context: {
      personality: 'curious and thorough, evidence-based reasoning',
      tools: ['web_research', 'competitor_analysis', 'trend_scanner', 'data_synthesis'],
      prompts: {
        tone: 'investigative and analytical',
        focus: 'discover patterns, validate hypotheses, synthesize findings',
      },
      content_filters: ['research', 'intelligence', 'analysis', 'trends', 'market'],
      suggestions_focus: [
        'market trend alerts',
        'competitor movements',
        'technology changes',
        'regulatory updates',
        'emerging opportunities',
      ],
    },
    workflow_stages: [
      { id: 'question', name: 'Question Formation', order: 1, color: '#94a3b8' },
      { id: 'gathering', name: 'Data Gathering', order: 2, color: '#60a5fa' },
      { id: 'analysis', name: 'Analysis', order: 3, color: '#a78bfa' },
      { id: 'synthesis', name: 'Synthesis', order: 4, color: '#f59e0b' },
      { id: 'published', name: 'Published', order: 5, color: '#10b981' },
    ],
  },

  // 4. Partnership Engine
  {
    id: 'partnership-engine',
    category: 'bos_2',
    name: 'Partnership Engine',
    slug: 'partnerships',
    emoji: '🤝',
    color: '#f59e0b',
    description: 'Partner vetting, agreements, performance management, and ecosystem growth',
    team_type: 'department',
    ai_context: {
      personality: 'strategic and evaluative, mutual value focused',
      tools: ['partner_scoring', 'agreement_templates', 'performance_dashboard', 'nudge_automation'],
      prompts: {
        tone: 'professional and discerning',
        focus: 'assess capability fit, identify risks, optimize terms',
      },
      content_filters: ['partners', 'agreements', 'vendors', 'ecosystem', 'relationships'],
      suggestions_focus: [
        'partner pipeline health',
        'inactive partner alerts',
        'performance gaps',
        'renewal timing',
        'tier recommendations',
      ],
    },
    workflow_stages: [
      { id: 'discovery', name: 'Discovery', order: 1, color: '#94a3b8' },
      { id: 'vetting', name: 'AI Vetting', order: 2, color: '#60a5fa' },
      { id: 'negotiation', name: 'Negotiation', order: 3, color: '#a78bfa' },
      { id: 'agreement', name: 'Agreement', order: 4, color: '#fbbf24' },
      { id: 'onboarding', name: 'Onboarding', order: 5, color: '#f59e0b' },
      { id: 'active', name: 'Active Partner', order: 6, color: '#10b981' },
      { id: 'at_risk', name: 'At Risk', order: 7, color: '#f87171' },
      { id: 'churned', name: 'Churned', order: 8, color: '#6b7280' },
    ],
  },

  // 5. Technology & Tools
  {
    id: 'technology-tools',
    category: 'bos_2',
    name: 'Technology & Tools',
    slug: 'technology',
    emoji: '🛠️',
    color: '#64748b',
    description: 'Tool evaluation, bot fleet management, and technology lifecycle',
    team_type: 'department',
    ai_context: {
      personality: 'technical and pragmatic, ROI-focused',
      tools: ['tool_comparison', 'integration_mapper', 'usage_analytics', 'cost_tracker'],
      prompts: {
        tone: 'systematic and evaluative',
        focus: 'assess tool fit, monitor adoption, identify redundancy',
      },
      content_filters: ['tools', 'technology', 'integrations', 'automations', 'apis'],
      suggestions_focus: [
        'tool utilization rates',
        'integration health',
        'cost per function',
        'new tool opportunities',
        'API error rates',
      ],
    },
    workflow_stages: [
      { id: 'diagnose', name: 'Diagnose Need', order: 1, color: '#94a3b8' },
      { id: 'evaluate', name: 'Evaluate Options', order: 2, color: '#60a5fa' },
      { id: 'implement', name: 'Implementation', order: 3, color: '#a78bfa' },
      { id: 'active', name: 'Active', order: 4, color: '#10b981' },
      { id: 'review', name: 'Under Review', order: 5, color: '#f59e0b' },
      { id: 'decommission', name: 'Decommission', order: 6, color: '#6b7280' },
    ],
  },

  // 6. Marketing Engine
  {
    id: 'marketing-engine',
    category: 'bos_2',
    name: 'Marketing Engine',
    slug: 'marketing-engine',
    emoji: '📢',
    color: '#f97316',
    description: 'AI-drafted content, trend-spotting, and audience engagement',
    team_type: 'department',
    ai_context: {
      personality: 'creative yet data-driven, audience-obsessed',
      tools: ['content_generator', 'trend_scanner', 'performance_analytics', 'a_b_testing'],
      prompts: {
        tone: 'engaging and brand-aligned',
        focus: 'spot trends, draft content, optimize engagement',
      },
      content_filters: ['content', 'marketing', 'campaigns', 'audience', 'brand'],
      suggestions_focus: [
        'trending topics',
        'content performance',
        'audience patterns',
        'competitor content',
        'channel optimization',
      ],
    },
    workflow_stages: [
      { id: 'trend_spot', name: 'Trend Spotted', order: 1, color: '#94a3b8' },
      { id: 'ai_draft', name: 'AI Draft', order: 2, color: '#60a5fa' },
      { id: 'human_polish', name: 'Human Polish', order: 3, color: '#a78bfa' },
      { id: 'scheduled', name: 'Scheduled', order: 4, color: '#fbbf24' },
      { id: 'published', name: 'Published', order: 5, color: '#10b981' },
      { id: 'analyzing', name: 'Analyzing', order: 6, color: '#f59e0b' },
    ],
  },

  // 7. Sales Engine
  {
    id: 'sales-engine',
    category: 'bos_2',
    name: 'Sales Engine',
    slug: 'sales-engine',
    emoji: '💰',
    color: '#10b981',
    description: 'AI-enriched leads, automated outreach, exception-based selling',
    team_type: 'department',
    ai_context: {
      personality: 'consultative and results-focused',
      tools: ['lead_enrichment', 'script_generator', 'objection_handler', 'pipeline_tracker'],
      prompts: {
        tone: 'confident and solution-oriented',
        focus: 'qualify leads, personalize outreach, overcome objections',
      },
      content_filters: ['leads', 'deals', 'sales', 'pipeline', 'prospects'],
      suggestions_focus: [
        'lead scoring updates',
        'pipeline alerts',
        'follow-up reminders',
        'competitive positioning',
        'deal risk signals',
      ],
    },
    workflow_stages: [
      { id: 'raw_lead', name: 'Raw Lead', order: 1, color: '#94a3b8' },
      { id: 'enriched', name: 'AI Enriched', order: 2, color: '#60a5fa' },
      { id: 'outreach', name: 'Outreach', order: 3, color: '#a78bfa' },
      { id: 'qualified', name: 'Qualified', order: 4, color: '#fbbf24' },
      { id: 'proposal', name: 'Proposal', order: 5, color: '#f59e0b' },
      { id: 'negotiation', name: 'Negotiation', order: 6, color: '#f97316' },
      { id: 'closed_won', name: 'Closed Won', order: 7, color: '#10b981' },
      { id: 'closed_lost', name: 'Closed Lost', order: 8, color: '#6b7280' },
    ],
  },

  // 8. Opportunities Engine
  {
    id: 'opportunities-engine',
    category: 'bos_2',
    name: 'Opportunities Engine',
    slug: 'opportunities',
    emoji: '📋',
    color: '#6366f1',
    description: 'RFP/bid management, AI response assembly, Red Team review',
    team_type: 'department',
    ai_context: {
      personality: 'detail-oriented and strategic, deadline-conscious',
      tools: ['rfp_scanner', 'response_assembler', 'resource_matcher', 'scoring_system'],
      prompts: {
        tone: 'precise and compliant',
        focus: 'assess fit, assemble from knowledge base, ensure compliance',
      },
      content_filters: ['rfps', 'bids', 'opportunities', 'proposals', 'contracts'],
      suggestions_focus: [
        'new RFP alerts',
        'opportunity scoring',
        'resource matching',
        'deadline tracking',
        'win probability',
      ],
    },
    workflow_stages: [
      { id: 'discovered', name: 'Discovered', order: 1, color: '#94a3b8' },
      { id: 'scoring', name: 'AI Scoring', order: 2, color: '#60a5fa' },
      { id: 'go_no_go', name: 'Go/No-Go', order: 3, color: '#a78bfa' },
      { id: 'drafting', name: 'AI Drafting', order: 4, color: '#fbbf24' },
      { id: 'red_team', name: 'Red Team Review', order: 5, color: '#f59e0b' },
      { id: 'submitted', name: 'Submitted', order: 6, color: '#f97316' },
      { id: 'awaiting', name: 'Awaiting Decision', order: 7, color: '#a78bfa' },
      { id: 'won', name: 'Won', order: 8, color: '#10b981' },
      { id: 'lost', name: 'Lost', order: 9, color: '#6b7280' },
    ],
  },

  // 9. Finance Engine
  {
    id: 'finance-engine',
    category: 'bos_2',
    name: 'Finance Engine',
    slug: 'finance-engine',
    emoji: '💵',
    color: '#059669',
    description: 'Budget tracking, forecasting, and financial exception management',
    team_type: 'department',
    ai_context: {
      personality: 'precise and compliance-focused, transparency-driven',
      tools: ['budget_tracker', 'forecast_model', 'expense_analyzer', 'payout_scheduler'],
      prompts: {
        tone: 'formal and data-driven',
        focus: 'track variances, forecast cash flow, identify optimization',
      },
      content_filters: ['budget', 'finance', 'expenses', 'revenue', 'forecasts'],
      suggestions_focus: [
        'budget variance alerts',
        'cash flow projections',
        'expense anomalies',
        'payment reminders',
        'cost optimization',
      ],
    },
    workflow_stages: [
      { id: 'planning', name: 'Planning', order: 1, color: '#94a3b8' },
      { id: 'allocated', name: 'Allocated', order: 2, color: '#60a5fa' },
      { id: 'tracking', name: 'Tracking', order: 3, color: '#a78bfa' },
      { id: 'variance', name: 'Variance Review', order: 4, color: '#f59e0b' },
      { id: 'closed', name: 'Period Closed', order: 5, color: '#10b981' },
    ],
  },

  // 10. Legal Engine
  {
    id: 'legal-engine',
    category: 'bos_2',
    name: 'Legal Engine',
    slug: 'legal-engine',
    emoji: '⚖️',
    color: '#78716c',
    description: 'Agreement lifecycle, compliance tracking, and risk management',
    team_type: 'department',
    ai_context: {
      personality: 'precise and risk-aware, protective of interests',
      tools: ['agreement_generator', 'clause_library', 'compliance_checker', 'deadline_tracker'],
      prompts: {
        tone: 'formal and protective',
        focus: 'identify risk clauses, ensure compliance, track obligations',
      },
      content_filters: ['contracts', 'legal', 'compliance', 'agreements', 'regulations'],
      suggestions_focus: [
        'agreement expirations',
        'compliance deadlines',
        'risk clauses',
        'signature status',
        'dispute warnings',
      ],
    },
    workflow_stages: [
      { id: 'need_identified', name: 'Need Identified', order: 1, color: '#94a3b8' },
      { id: 'drafting', name: 'AI Drafting', order: 2, color: '#60a5fa' },
      { id: 'review', name: 'Legal Review', order: 3, color: '#a78bfa' },
      { id: 'negotiation', name: 'Negotiation', order: 4, color: '#fbbf24' },
      { id: 'execution', name: 'Execution', order: 5, color: '#f59e0b' },
      { id: 'active', name: 'Active', order: 6, color: '#10b981' },
      { id: 'renewal', name: 'Up for Renewal', order: 7, color: '#f97316' },
      { id: 'terminated', name: 'Terminated', order: 8, color: '#6b7280' },
    ],
  },
];

// ============================================================================
// All Team Templates (Combined)
// ============================================================================

export const ALL_TEAM_TEMPLATES: TeamTemplate[] = [
  ...TRADITIONAL_TEAM_TEMPLATES,
  ...BOS_2_TEAM_TEMPLATES,
];

// Helper to get template by ID
export function getTeamTemplateById(templateId: string): TeamTemplate | undefined {
  return ALL_TEAM_TEMPLATES.find(t => t.id === templateId);
}

// Helper to get templates by category
export function getTeamTemplatesByCategory(category: TeamTemplateCategory): TeamTemplate[] {
  return ALL_TEAM_TEMPLATES.filter(t => t.category === category);
}

// ============================================================================
// Work Item Types
// ============================================================================

export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkItemSource = 'manual' | 'import' | 'api' | 'automation' | 'email' | 'form';

export type WorkItemEventType =
  | 'created'
  | 'stage_changed'
  | 'assigned'
  | 'unassigned'
  | 'exception_flagged'
  | 'exception_resolved'
  | 'field_updated'
  | 'ai_analyzed'
  | 'comment_added'
  | 'attachment_added'
  | 'archived'
  | 'restored'
  | 'priority_changed';

export type WorkItemActorType = 'user' | 'system' | 'automation' | 'ai';

export type WorkItemCommentType = 'note' | 'feedback' | 'ai_insight' | 'exception_note' | 'resolution_note';

export interface WorkItemAIInsights {
  summary?: string;
  strengths?: string[];
  concerns?: string[];
  fit_assessment?: string;
  recommended_actions?: string[];
  risk_factors?: string[];
  confidence_score?: number;
  analysis_context?: Record<string, unknown>;
}

export interface WorkItem {
  id: string;
  organization_id: string;
  team_id: string;

  // Identification
  title: string;
  description?: string;
  external_id?: string;

  // Workflow state
  current_stage_id: string;
  previous_stage_id?: string;
  item_type: string;

  // Priority
  priority: WorkItemPriority;

  // Exception handling
  is_exception: boolean;
  exception_reason?: string;
  exception_flagged_at?: string;
  exception_flagged_by?: string;
  exception_resolved_at?: string;
  exception_resolved_by?: string;

  // Assignment
  assigned_to?: string;
  assigned_at?: string;

  // Dates
  due_date?: string;
  completed_at?: string;

  // Source tracking
  source?: WorkItemSource;
  source_reference?: string;

  // Custom fields
  custom_fields: Record<string, unknown>;

  // AI-generated insights
  ai_score?: number;
  ai_insights?: WorkItemAIInsights;
  ai_recommendations?: string[];
  ai_analyzed_at?: string;
  ai_model_used?: string;

  // Metadata
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Status
  is_archived: boolean;
  archived_at?: string;
  archived_by?: string;

  // Audit
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItemHistory {
  id: string;
  work_item_id: string;
  event_type: WorkItemEventType;
  from_stage_id?: string;
  to_stage_id?: string;
  field_name?: string;
  old_value?: unknown;
  new_value?: unknown;
  actor_id?: string;
  actor_type: WorkItemActorType;
  comment?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Joined data
  actor?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface WorkItemComment {
  id: string;
  work_item_id: string;
  content: string;
  is_internal: boolean;
  comment_type: WorkItemCommentType;
  mentioned_user_ids?: string[];
  author_id?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface WorkItemAttachment {
  id: string;
  work_item_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  storage_path?: string;
  document_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  uploaded_by?: string;
  created_at: string;
  // Joined data
  uploader?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Extended types with relations
export interface WorkItemWithDetails extends WorkItem {
  team?: Team;
  current_stage?: WorkflowStage;
  assigned_user?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  comments_count?: number;
  attachments_count?: number;
}

// Kanban types
export interface WorkItemKanbanColumn {
  stage: WorkflowStage;
  items: WorkItem[];
  count: number;
}

export interface WorkItemDragResult {
  itemId: string;
  sourceStageId: string;
  destinationStageId: string;
  sourceIndex: number;
  destinationIndex: number;
}

// API Request/Response types
export interface CreateWorkItemRequest {
  team_id: string;
  title: string;
  description?: string;
  external_id?: string;
  current_stage_id?: string;
  item_type?: string;
  priority?: WorkItemPriority;
  assigned_to?: string;
  due_date?: string;
  source?: WorkItemSource;
  source_reference?: string;
  custom_fields?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  external_id?: string;
  current_stage_id?: string;
  priority?: WorkItemPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  custom_fields?: Record<string, unknown>;
  tags?: string[];
  is_archived?: boolean;
}

export interface WorkItemFilterParams {
  team_id: string;
  stage_id?: string;
  item_type?: string;
  priority?: WorkItemPriority;
  assigned_to?: string;
  is_exception?: boolean;
  is_archived?: boolean;
  search?: string;
  tags?: string[];
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'ai_score';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface WorkItemStatsResponse {
  total_count: number;
  stage_counts: Record<string, number>;
  priority_counts: Record<WorkItemPriority, number>;
  exception_count: number;
  unassigned_count: number;
  overdue_count: number;
  completed_this_week: number;
  avg_ai_score?: number;
}

// Item type mapping for BOS 2.0 templates
export const TEAM_ITEM_TYPE_MAP: Record<string, string> = {
  'talent-engine': 'candidate',
  'training-development': 'trainee',
  'research-intelligence': 'research_item',
  'partnership-engine': 'partner',
  'technology-tools': 'tool',
  'marketing-engine': 'content',
  'sales-engine': 'lead',
  'opportunities-engine': 'rfp',
  'finance-engine': 'budget_item',
  'legal-engine': 'agreement',
};

// Item type labels for display
export const ITEM_TYPE_LABELS: Record<string, string> = {
  candidate: 'Candidate',
  trainee: 'Trainee',
  research_item: 'Research Item',
  partner: 'Partner',
  tool: 'Tool',
  content: 'Content',
  lead: 'Lead',
  rfp: 'RFP/Opportunity',
  budget_item: 'Budget Item',
  agreement: 'Agreement',
  item: 'Item',
};

export function getItemTypeLabel(itemType: string): string {
  return ITEM_TYPE_LABELS[itemType] || itemType.charAt(0).toUpperCase() + itemType.slice(1);
}

export function getItemTypeForTeam(templateId: string | undefined): string {
  if (!templateId) return 'item';
  return TEAM_ITEM_TYPE_MAP[templateId] || 'item';
}
