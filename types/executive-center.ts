// =====================================================
// EXECUTIVE COMMAND CENTER - TYPE DEFINITIONS
// =====================================================

// =====================================================
// MODULE 1: DAILY COMMAND VIEW
// =====================================================

export type PrioritySourceType = 'task' | 'work_item' | 'decision' | 'opportunity' | 'manual';
export type PriorityStatus = 'active' | 'completed' | 'deferred' | 'cancelled';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ExecutivePriority {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority_rank: number; // 1-10
  source_type?: PrioritySourceType;
  source_id?: string;
  status: PriorityStatus;
  ai_generated: boolean;
  ai_reasoning?: string;
  ai_confidence?: number;
  priority_date: string; // DATE
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskItem {
  title: string;
  severity: RiskLevel;
  source_type?: string;
  source_id?: string;
  recommendation?: string;
  description?: string;
}

export interface RiskAnalysis {
  id: string;
  organization_id: string;
  analysis_date: string; // DATE
  risk_items: RiskItem[];
  overall_risk_level: RiskLevel;
  executive_summary?: string;
  key_recommendations?: string[];
  model_used?: string;
  tokens_used?: number;
  generated_at: string;
}

export interface DailyCommandSummary {
  priorities: ExecutivePriority[];
  pending_decisions: number;
  urgent_decisions: number;
  active_opportunities: number;
  task_health_issues: number;
  risk_level: RiskLevel | null;
  deadlines_7_days: DeadlineItem[];
  deadlines_30_days: DeadlineItem[];
}

export interface DeadlineItem {
  id: string;
  title: string;
  due_date: string;
  source_type: 'task' | 'opportunity' | 'decision' | 'project';
  source_id: string;
  priority: Priority;
  status?: string;
  days_until_due: number;
}

// =====================================================
// MODULE 2: DECISION INBOX
// =====================================================

export type DecisionSourceType = 'document' | 'conversation' | 'email' | 'meeting' | 'manual' | 'opportunity';
export type DecisionStatus = 'pending' | 'decided' | 'delegated' | 'deferred' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface DecisionOption {
  title: string;
  pros: string[];
  cons: string[];
  recommendation?: string;
  selected?: boolean;
}

export interface Decision {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;
  context?: string;
  source_type?: DecisionSourceType;
  source_id?: string;
  source_reference?: string;
  options: DecisionOption[];
  ai_analysis?: string;
  ai_recommendation?: string;
  ai_confidence?: number;
  ai_analyzed_at?: string;
  status: DecisionStatus;
  decision_made?: string;
  decision_rationale?: string;
  decided_at?: string;
  decided_by?: string;
  delegated_to?: string;
  delegated_at?: string;
  delegation_notes?: string;
  delegation_due_date?: string;
  deferred_until?: string;
  defer_reason?: string;
  priority: Priority;
  due_date?: string;
  logged_to_memory: boolean;
  memory_context_id?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Joined data
  user?: { full_name: string; avatar_url?: string };
  decided_by_user?: { full_name: string; avatar_url?: string };
  delegated_to_user?: { full_name: string; avatar_url?: string };
}

export type DecisionEventType =
  | 'created'
  | 'updated'
  | 'decided'
  | 'delegated'
  | 'deferred'
  | 'commented'
  | 'logged_to_memory'
  | 'reopened'
  | 'cancelled'
  | 'ai_analyzed'
  | 'reminder_sent'
  | 'escalated';

export interface DecisionEvent {
  id: string;
  decision_id: string;
  event_type: DecisionEventType;
  from_status?: string;
  to_status?: string;
  comment?: string;
  performed_by?: string;
  performed_by_system: boolean;
  metadata: Record<string, unknown>;
  created_at: string;

  // Joined data
  performer?: { full_name: string; avatar_url?: string };
}

// =====================================================
// MODULE 3: PEOPLE & TASKS
// =====================================================

export type TaskHealthFlagType =
  | 'stuck_task'
  | 'overloaded_person'
  | 'missed_deadline'
  | 'dependency_blocked'
  | 'no_progress'
  | 'unassigned_urgent'
  | 'approaching_deadline';

export type HealthFlagSeverity = 'low' | 'medium' | 'high' | 'critical';
export type HealthFlagStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface TaskHealthFlag {
  id: string;
  organization_id: string;
  flag_type: TaskHealthFlagType;
  task_id?: string;
  person_id?: string;
  title: string;
  description?: string;
  severity: HealthFlagSeverity;
  ai_analysis?: string;
  ai_suggestion?: string;
  ai_confidence?: number;
  status: HealthFlagStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  detected_at: string;
  created_at: string;

  // Joined data
  task?: { title: string; status: string };
  person?: { full_name: string; avatar_url?: string };
}

export interface PersonWorkload {
  person_id: string;
  full_name: string;
  avatar_url?: string;
  pending_tasks: number;
  active_tasks: number;
  blocked_tasks: number;
  total_workload: number;
  next_due_date?: string;
  overdue_count: number;
  workload_status: 'light' | 'normal' | 'heavy' | 'overloaded';
}

// =====================================================
// MODULE 4: OPPORTUNITIES TRACKER (Decision Framework)
// =====================================================

export type OpportunityType = 'grant' | 'rfp' | 'partnership' | 'contract' | 'sponsorship' | 'investment' | 'acquisition';
export type HurdleCategory = 'standard' | 'high_risk' | 'strategic';
export type ScoreRecommendation = 'strong_yes' | 'yes' | 'maybe' | 'no';
export type FinalDecision = 'approved' | 'rejected' | 'pending' | 'withdrawn';

// Risk levels for the 4-dimension matrix (1-3 scale)
export type RiskScore = 1 | 2 | 3; // 1=Low, 2=Medium, 3=High

// Brand/Strategic/Resource scores (1-5 scale)
export type AlignmentScore = 1 | 2 | 3 | 4 | 5;

export interface DecisionFrameworkScores {
  // Hurdle Rate (30% weight)
  hurdle_category?: HurdleCategory;
  hurdle_rate_score?: number; // 0-100

  // Risk Assessment (15% weight)
  risk_financial?: RiskScore;
  risk_operational?: RiskScore;
  risk_reputational?: RiskScore;
  risk_legal?: RiskScore;
  risk_composite_score?: number; // 0-100

  // Brand Alignment (25% weight)
  brand_values_alignment?: AlignmentScore;
  brand_quality_standards?: AlignmentScore;
  brand_audience_fit?: AlignmentScore;
  brand_longterm_impact?: AlignmentScore;
  brand_composite_score?: number; // 0-100

  // Strategic Fit (25% weight)
  strategic_goals_alignment?: AlignmentScore;
  strategic_future_opportunities?: AlignmentScore;
  strategic_competencies_match?: AlignmentScore;
  strategic_revenue_diversification?: AlignmentScore;
  strategic_composite_score?: number; // 0-100

  // Resource Demand (5% weight)
  resource_time_required?: AlignmentScore;
  resource_capital_required?: AlignmentScore;
  resource_energy_required?: AlignmentScore;
  resource_opportunity_cost?: AlignmentScore;
  resource_composite_score?: number; // 0-100

  // Weighted Composite
  weighted_composite_score?: number; // 0-100
  score_recommendation?: ScoreRecommendation;
}

export interface Opportunity extends DecisionFrameworkScores {
  id: string;
  organization_id: string;
  team_id: string;
  title: string;
  description?: string;

  // Opportunity-specific fields
  item_type: 'opportunity';
  opportunity_type?: OpportunityType;
  opportunity_source?: string;
  estimated_value?: number;
  probability_percent?: number;

  // Workflow
  current_stage_id?: string;
  priority: Priority;
  due_date?: string;

  // Decision
  final_decision?: FinalDecision;
  decision_notes?: string;
  decision_date?: string;
  decision_by?: string;

  // AI Analysis
  ai_score?: number;
  ai_insights?: {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  };

  // Metadata
  tags: string[];
  created_at: string;
  updated_at: string;

  // Joined data
  team?: { name: string; color?: string };
  decision_by_user?: { full_name: string; avatar_url?: string };
}

export interface OpportunityScoreBreakdown {
  hurdle: { score: number; weight: 0.30; contribution: number; label: string };
  brand: { score: number; weight: 0.25; contribution: number; label: string };
  strategic: { score: number; weight: 0.25; contribution: number; label: string };
  risk: { score: number; weight: 0.15; contribution: number; label: string };
  resource: { score: number; weight: 0.05; contribution: number; label: string };
  total: number;
  recommendation: ScoreRecommendation;
  color: 'green' | 'yellow' | 'red';
}

// =====================================================
// MODULE 5: NOTES & MEMORY (Organization Context)
// =====================================================

export type ContextType =
  | 'vision'
  | 'mission'
  | 'values'
  | 'strategy'
  | 'decision_principle'
  | 'operational_preference'
  | 'key_relationship'
  | 'important_date'
  | 'lesson_learned'
  | 'competitive_insight'
  | 'market_intelligence';

export type ContextImportance = 'critical' | 'high' | 'normal' | 'low';

export interface OrganizationContext {
  id: string;
  organization_id: string;
  context_type: ContextType;
  title: string;
  content: string;
  key_points: string[];
  importance: ContextImportance;
  effective_from?: string;
  effective_until?: string;
  is_active: boolean;
  embedding?: number[]; // vector(1536)
  tags: string[];
  source?: string;
  source_id?: string;
  related_context_ids: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  creator?: { full_name: string; avatar_url?: string };
}

export interface ContextSearchResult {
  context: OrganizationContext;
  similarity: number;
  relevance_reason?: string;
}

// =====================================================
// COMMAND CENTER MODE
// =====================================================

export type CommandCenterMode = 'executive' | 'system';

export interface CommandCenterState {
  mode: CommandCenterMode;
  activeModule: ExecutiveModule | SystemModule;
}

export type ExecutiveModule = 'daily' | 'decisions' | 'people' | 'opportunities' | 'memory';
export type SystemModule = 'health' | 'exceptions';

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateDecisionRequest {
  title: string;
  description?: string;
  context?: string;
  source_type?: DecisionSourceType;
  source_id?: string;
  options?: DecisionOption[];
  priority?: Priority;
  due_date?: string;
  tags?: string[];
}

export interface DecideRequest {
  decision_made: string;
  decision_rationale?: string;
}

export interface DelegateRequest {
  delegated_to: string;
  delegation_notes?: string;
  delegation_due_date?: string;
}

export interface DeferRequest {
  deferred_until: string;
  defer_reason?: string;
}

export interface CreateOpportunityRequest {
  team_id: string;
  title: string;
  description?: string;
  opportunity_type?: OpportunityType;
  opportunity_source?: string;
  estimated_value?: number;
  due_date?: string;
  priority?: Priority;
}

export interface UpdateOpportunityScoreRequest {
  hurdle_category?: HurdleCategory;

  risk_financial?: RiskScore;
  risk_operational?: RiskScore;
  risk_reputational?: RiskScore;
  risk_legal?: RiskScore;

  brand_values_alignment?: AlignmentScore;
  brand_quality_standards?: AlignmentScore;
  brand_audience_fit?: AlignmentScore;
  brand_longterm_impact?: AlignmentScore;

  strategic_goals_alignment?: AlignmentScore;
  strategic_future_opportunities?: AlignmentScore;
  strategic_competencies_match?: AlignmentScore;
  strategic_revenue_diversification?: AlignmentScore;

  resource_time_required?: AlignmentScore;
  resource_capital_required?: AlignmentScore;
  resource_energy_required?: AlignmentScore;
  resource_opportunity_cost?: AlignmentScore;
}

export interface CreateContextRequest {
  context_type: ContextType;
  title: string;
  content: string;
  key_points?: string[];
  importance?: ContextImportance;
  effective_from?: string;
  effective_until?: string;
  tags?: string[];
  source?: string;
}

export interface CreatePriorityRequest {
  title: string;
  description?: string;
  priority_rank: number;
  source_type?: PrioritySourceType;
  source_id?: string;
  priority_date?: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate the color for a composite score (traffic light system)
 */
export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

/**
 * Get human-readable recommendation text
 */
export function getRecommendationText(recommendation: ScoreRecommendation): string {
  switch (recommendation) {
    case 'strong_yes': return 'Strong Yes';
    case 'yes': return 'Yes';
    case 'maybe': return 'Maybe';
    case 'no': return 'No';
    default: return 'Unknown';
  }
}

/**
 * Calculate score breakdown from raw scores
 */
export function calculateScoreBreakdown(scores: DecisionFrameworkScores): OpportunityScoreBreakdown {
  const hurdle = scores.hurdle_rate_score ?? 50;
  const brand = scores.brand_composite_score ?? 50;
  const strategic = scores.strategic_composite_score ?? 50;
  const risk = scores.risk_composite_score ?? 50;
  const resource = scores.resource_composite_score ?? 50;

  const total = scores.weighted_composite_score ??
    (hurdle * 0.30 + brand * 0.25 + strategic * 0.25 + risk * 0.15 + resource * 0.05);

  const recommendation = scores.score_recommendation ?? (
    total >= 80 ? 'strong_yes' :
    total >= 70 ? 'yes' :
    total >= 60 ? 'maybe' : 'no'
  );

  return {
    hurdle: { score: hurdle, weight: 0.30, contribution: hurdle * 0.30, label: 'Hurdle Rate' },
    brand: { score: brand, weight: 0.25, contribution: brand * 0.25, label: 'Brand Alignment' },
    strategic: { score: strategic, weight: 0.25, contribution: strategic * 0.25, label: 'Strategic Fit' },
    risk: { score: risk, weight: 0.15, contribution: risk * 0.15, label: 'Risk Level' },
    resource: { score: resource, weight: 0.05, contribution: resource * 0.05, label: 'Resource Demand' },
    total,
    recommendation,
    color: getScoreColor(total),
  };
}

/**
 * Get risk label from score
 */
export function getRiskLabel(score: RiskScore): string {
  switch (score) {
    case 1: return 'Low';
    case 2: return 'Medium';
    case 3: return 'High';
    default: return 'Unknown';
  }
}

/**
 * Get alignment label from score
 */
export function getAlignmentLabel(score: AlignmentScore): string {
  switch (score) {
    case 1: return 'Very Poor';
    case 2: return 'Poor';
    case 3: return 'Average';
    case 4: return 'Good';
    case 5: return 'Excellent';
    default: return 'Unknown';
  }
}

/**
 * Get hurdle category thresholds
 */
export function getHurdleThreshold(category: HurdleCategory): { roi: string; minValue: number } {
  switch (category) {
    case 'standard': return { roi: '15%', minValue: 50000 };
    case 'high_risk': return { roi: '25%', minValue: 100000 };
    case 'strategic': return { roi: '10%', minValue: 25000 };
    default: return { roi: '15%', minValue: 50000 };
  }
}
