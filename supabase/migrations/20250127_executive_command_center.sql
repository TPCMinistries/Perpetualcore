-- =====================================================
-- EXECUTIVE COMMAND CENTER - DATABASE MIGRATION
-- Transforms DevOps Command Center into Executive Suite
-- =====================================================

-- =====================================================
-- MODULE 1: DAILY COMMAND VIEW
-- =====================================================

-- Executive priorities (top 5 daily priorities)
CREATE TABLE IF NOT EXISTS executive_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Priority details
  title TEXT NOT NULL,
  description TEXT,
  priority_rank INTEGER NOT NULL CHECK (priority_rank >= 1 AND priority_rank <= 10),

  -- Source linking (what this priority relates to)
  source_type TEXT CHECK (source_type IN ('task', 'work_item', 'decision', 'opportunity', 'manual')),
  source_id UUID,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'deferred', 'cancelled')),

  -- AI-generated metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  ai_confidence DECIMAL(3,2),

  -- Date scope
  priority_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI risk analysis snapshots
CREATE TABLE IF NOT EXISTS risk_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Analysis content
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  risk_items JSONB NOT NULL DEFAULT '[]', -- Array of {title, severity, source_type, source_id, recommendation}
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Summary
  executive_summary TEXT,
  key_recommendations TEXT[],

  -- AI metadata
  model_used TEXT,
  tokens_used INTEGER,

  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, analysis_date)
);

-- Indexes for Module 1
CREATE INDEX IF NOT EXISTS idx_executive_priorities_org_date ON executive_priorities(organization_id, priority_date);
CREATE INDEX IF NOT EXISTS idx_executive_priorities_user ON executive_priorities(user_id, priority_date);
CREATE INDEX IF NOT EXISTS idx_executive_priorities_active ON executive_priorities(organization_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_risk_analyses_org_date ON risk_analyses(organization_id, analysis_date);

-- =====================================================
-- MODULE 2: DECISION INBOX
-- =====================================================

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Decision details
  title TEXT NOT NULL,
  description TEXT,
  context TEXT, -- Background/rationale

  -- Source (where this decision came from)
  source_type TEXT CHECK (source_type IN ('document', 'conversation', 'email', 'meeting', 'manual', 'opportunity')),
  source_id UUID,
  source_reference TEXT,

  -- Options for complex decisions
  options JSONB DEFAULT '[]', -- [{title, pros, cons, recommendation, selected}]

  -- AI analysis
  ai_analysis TEXT,
  ai_recommendation TEXT,
  ai_confidence DECIMAL(3,2),
  ai_analyzed_at TIMESTAMPTZ,

  -- Workflow status (Decide/Delegate/Defer)
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting action
    'decided',      -- Decision made
    'delegated',    -- Assigned to someone else
    'deferred',     -- Postponed
    'cancelled'     -- No longer relevant
  )),

  -- Decision outcome
  decision_made TEXT,
  decision_rationale TEXT,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES profiles(id),

  -- Delegation
  delegated_to UUID REFERENCES profiles(id),
  delegated_at TIMESTAMPTZ,
  delegation_notes TEXT,
  delegation_due_date DATE,

  -- Deferral
  deferred_until DATE,
  defer_reason TEXT,

  -- Priority and timing
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,

  -- Memory integration
  logged_to_memory BOOLEAN DEFAULT false,
  memory_context_id UUID,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decision events audit log
CREATE TABLE IF NOT EXISTS decision_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'updated', 'decided', 'delegated', 'deferred',
    'commented', 'logged_to_memory', 'reopened', 'cancelled',
    'ai_analyzed', 'reminder_sent', 'escalated'
  )),

  from_status TEXT,
  to_status TEXT,
  comment TEXT,

  performed_by UUID REFERENCES profiles(id),
  performed_by_system BOOLEAN DEFAULT false,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Module 2
CREATE INDEX IF NOT EXISTS idx_decisions_org ON decisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_decisions_user ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(organization_id, status) WHERE status IN ('pending', 'delegated', 'deferred');
CREATE INDEX IF NOT EXISTS idx_decisions_due ON decisions(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_decisions_priority ON decisions(organization_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_decision_events_decision ON decision_events(decision_id);

-- =====================================================
-- MODULE 3: PEOPLE & TASKS ENHANCEMENTS
-- =====================================================

-- Add columns to tasks table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'blocked_since') THEN
    ALTER TABLE tasks ADD COLUMN blocked_since TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'blocking_reason') THEN
    ALTER TABLE tasks ADD COLUMN blocking_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'workload_weight') THEN
    ALTER TABLE tasks ADD COLUMN workload_weight INTEGER DEFAULT 1;
  END IF;
END $$;

-- Task health flags (AI-detected issues)
CREATE TABLE IF NOT EXISTS task_health_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'stuck_task',           -- Task not progressing
    'overloaded_person',    -- Person has too many tasks
    'missed_deadline',      -- Past due date
    'dependency_blocked',   -- Waiting on another task
    'no_progress',          -- No updates in X days
    'unassigned_urgent',    -- Urgent task without assignee
    'approaching_deadline'  -- Due soon, not started
  )),

  -- Reference
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  person_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Details
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- AI analysis
  ai_analysis TEXT,
  ai_suggestion TEXT,
  ai_confidence DECIMAL(3,2),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Module 3
CREATE INDEX IF NOT EXISTS idx_task_health_flags_org ON task_health_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_health_flags_active ON task_health_flags(organization_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_task_health_flags_person ON task_health_flags(person_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_task_health_flags_task ON task_health_flags(task_id);

-- =====================================================
-- MODULE 4: OPPORTUNITIES TRACKER (Decision Framework)
-- =====================================================

-- Extend work_items table with opportunity and decision framework fields
DO $$
BEGIN
  -- Opportunity type and source
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'opportunity_type') THEN
    ALTER TABLE work_items ADD COLUMN opportunity_type TEXT CHECK (opportunity_type IN (
      'grant', 'rfp', 'partnership', 'contract', 'sponsorship', 'investment', 'acquisition'
    ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'opportunity_source') THEN
    ALTER TABLE work_items ADD COLUMN opportunity_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'estimated_value') THEN
    ALTER TABLE work_items ADD COLUMN estimated_value DECIMAL(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'probability_percent') THEN
    ALTER TABLE work_items ADD COLUMN probability_percent INTEGER CHECK (probability_percent >= 0 AND probability_percent <= 100);
  END IF;

  -- DECISION FRAMEWORK: Hurdle Rate (30% weight)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'hurdle_category') THEN
    ALTER TABLE work_items ADD COLUMN hurdle_category TEXT CHECK (hurdle_category IN ('standard', 'high_risk', 'strategic'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'hurdle_rate_score') THEN
    ALTER TABLE work_items ADD COLUMN hurdle_rate_score DECIMAL(5,2);
  END IF;

  -- DECISION FRAMEWORK: Risk Assessment (15% weight) - each 1-3
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'risk_financial') THEN
    ALTER TABLE work_items ADD COLUMN risk_financial INTEGER CHECK (risk_financial >= 1 AND risk_financial <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'risk_operational') THEN
    ALTER TABLE work_items ADD COLUMN risk_operational INTEGER CHECK (risk_operational >= 1 AND risk_operational <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'risk_reputational') THEN
    ALTER TABLE work_items ADD COLUMN risk_reputational INTEGER CHECK (risk_reputational >= 1 AND risk_reputational <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'risk_legal') THEN
    ALTER TABLE work_items ADD COLUMN risk_legal INTEGER CHECK (risk_legal >= 1 AND risk_legal <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'risk_composite_score') THEN
    ALTER TABLE work_items ADD COLUMN risk_composite_score DECIMAL(5,2);
  END IF;

  -- DECISION FRAMEWORK: Brand Alignment (25% weight) - each 1-5
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'brand_values_alignment') THEN
    ALTER TABLE work_items ADD COLUMN brand_values_alignment INTEGER CHECK (brand_values_alignment >= 1 AND brand_values_alignment <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'brand_quality_standards') THEN
    ALTER TABLE work_items ADD COLUMN brand_quality_standards INTEGER CHECK (brand_quality_standards >= 1 AND brand_quality_standards <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'brand_audience_fit') THEN
    ALTER TABLE work_items ADD COLUMN brand_audience_fit INTEGER CHECK (brand_audience_fit >= 1 AND brand_audience_fit <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'brand_longterm_impact') THEN
    ALTER TABLE work_items ADD COLUMN brand_longterm_impact INTEGER CHECK (brand_longterm_impact >= 1 AND brand_longterm_impact <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'brand_composite_score') THEN
    ALTER TABLE work_items ADD COLUMN brand_composite_score DECIMAL(5,2);
  END IF;

  -- DECISION FRAMEWORK: Strategic Fit (25% weight) - each 1-5
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'strategic_goals_alignment') THEN
    ALTER TABLE work_items ADD COLUMN strategic_goals_alignment INTEGER CHECK (strategic_goals_alignment >= 1 AND strategic_goals_alignment <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'strategic_future_opportunities') THEN
    ALTER TABLE work_items ADD COLUMN strategic_future_opportunities INTEGER CHECK (strategic_future_opportunities >= 1 AND strategic_future_opportunities <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'strategic_competencies_match') THEN
    ALTER TABLE work_items ADD COLUMN strategic_competencies_match INTEGER CHECK (strategic_competencies_match >= 1 AND strategic_competencies_match <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'strategic_revenue_diversification') THEN
    ALTER TABLE work_items ADD COLUMN strategic_revenue_diversification INTEGER CHECK (strategic_revenue_diversification >= 1 AND strategic_revenue_diversification <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'strategic_composite_score') THEN
    ALTER TABLE work_items ADD COLUMN strategic_composite_score DECIMAL(5,2);
  END IF;

  -- DECISION FRAMEWORK: Resource Demand (5% weight) - each 1-5, lower is better
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'resource_time_required') THEN
    ALTER TABLE work_items ADD COLUMN resource_time_required INTEGER CHECK (resource_time_required >= 1 AND resource_time_required <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'resource_capital_required') THEN
    ALTER TABLE work_items ADD COLUMN resource_capital_required INTEGER CHECK (resource_capital_required >= 1 AND resource_capital_required <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'resource_energy_required') THEN
    ALTER TABLE work_items ADD COLUMN resource_energy_required INTEGER CHECK (resource_energy_required >= 1 AND resource_energy_required <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'resource_opportunity_cost') THEN
    ALTER TABLE work_items ADD COLUMN resource_opportunity_cost INTEGER CHECK (resource_opportunity_cost >= 1 AND resource_opportunity_cost <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'resource_composite_score') THEN
    ALTER TABLE work_items ADD COLUMN resource_composite_score DECIMAL(5,2);
  END IF;

  -- Weighted Composite Score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'weighted_composite_score') THEN
    ALTER TABLE work_items ADD COLUMN weighted_composite_score DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'score_recommendation') THEN
    ALTER TABLE work_items ADD COLUMN score_recommendation TEXT CHECK (score_recommendation IN ('strong_yes', 'yes', 'maybe', 'no'));
  END IF;

  -- Final Decision
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'final_decision') THEN
    ALTER TABLE work_items ADD COLUMN final_decision TEXT CHECK (final_decision IN ('approved', 'rejected', 'pending', 'withdrawn'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'decision_notes') THEN
    ALTER TABLE work_items ADD COLUMN decision_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'decision_date') THEN
    ALTER TABLE work_items ADD COLUMN decision_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_items' AND column_name = 'decision_by') THEN
    ALTER TABLE work_items ADD COLUMN decision_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Trigger function to calculate opportunity scores
CREATE OR REPLACE FUNCTION calculate_opportunity_scores()
RETURNS TRIGGER AS $$
DECLARE
  hurdle_threshold DECIMAL(15,2);
BEGIN
  -- Only process opportunities
  IF NEW.item_type != 'opportunity' THEN
    RETURN NEW;
  END IF;

  -- Calculate Hurdle Rate Score based on category
  IF NEW.hurdle_category IS NOT NULL AND NEW.estimated_value IS NOT NULL THEN
    CASE NEW.hurdle_category
      WHEN 'standard' THEN hurdle_threshold := 50000;
      WHEN 'high_risk' THEN hurdle_threshold := 100000;
      WHEN 'strategic' THEN hurdle_threshold := 25000;
      ELSE hurdle_threshold := 50000;
    END CASE;

    IF NEW.estimated_value >= hurdle_threshold THEN
      NEW.hurdle_rate_score := 100;
    ELSE
      NEW.hurdle_rate_score := LEAST((NEW.estimated_value / hurdle_threshold) * 100, 100);
    END IF;
  END IF;

  -- Calculate Risk Composite (100 - normalized average, higher score = lower risk)
  IF NEW.risk_financial IS NOT NULL OR NEW.risk_operational IS NOT NULL OR
     NEW.risk_reputational IS NOT NULL OR NEW.risk_legal IS NOT NULL THEN
    NEW.risk_composite_score := 100 - (
      (COALESCE(NEW.risk_financial, 2) + COALESCE(NEW.risk_operational, 2) +
       COALESCE(NEW.risk_reputational, 2) + COALESCE(NEW.risk_legal, 2)) / 4.0 - 1
    ) * 50;
  END IF;

  -- Calculate Brand Composite (average * 20)
  IF NEW.brand_values_alignment IS NOT NULL OR NEW.brand_quality_standards IS NOT NULL OR
     NEW.brand_audience_fit IS NOT NULL OR NEW.brand_longterm_impact IS NOT NULL THEN
    NEW.brand_composite_score := (
      COALESCE(NEW.brand_values_alignment, 3) + COALESCE(NEW.brand_quality_standards, 3) +
      COALESCE(NEW.brand_audience_fit, 3) + COALESCE(NEW.brand_longterm_impact, 3)
    ) / 4.0 * 20;
  END IF;

  -- Calculate Strategic Composite (average * 20)
  IF NEW.strategic_goals_alignment IS NOT NULL OR NEW.strategic_future_opportunities IS NOT NULL OR
     NEW.strategic_competencies_match IS NOT NULL OR NEW.strategic_revenue_diversification IS NOT NULL THEN
    NEW.strategic_composite_score := (
      COALESCE(NEW.strategic_goals_alignment, 3) + COALESCE(NEW.strategic_future_opportunities, 3) +
      COALESCE(NEW.strategic_competencies_match, 3) + COALESCE(NEW.strategic_revenue_diversification, 3)
    ) / 4.0 * 20;
  END IF;

  -- Calculate Resource Composite (inverted - lower demand = higher score)
  IF NEW.resource_time_required IS NOT NULL OR NEW.resource_capital_required IS NOT NULL OR
     NEW.resource_energy_required IS NOT NULL OR NEW.resource_opportunity_cost IS NOT NULL THEN
    NEW.resource_composite_score := 100 - (
      (COALESCE(NEW.resource_time_required, 3) + COALESCE(NEW.resource_capital_required, 3) +
       COALESCE(NEW.resource_energy_required, 3) + COALESCE(NEW.resource_opportunity_cost, 3)) / 4.0 - 1
    ) * 25;
  END IF;

  -- Calculate Weighted Composite Score
  -- Hurdle: 30%, Brand: 25%, Strategic: 25%, Risk: 15%, Resource: 5%
  NEW.weighted_composite_score := (
    COALESCE(NEW.hurdle_rate_score, 50) * 0.30 +
    COALESCE(NEW.brand_composite_score, 50) * 0.25 +
    COALESCE(NEW.strategic_composite_score, 50) * 0.25 +
    COALESCE(NEW.risk_composite_score, 50) * 0.15 +
    COALESCE(NEW.resource_composite_score, 50) * 0.05
  );

  -- Set recommendation based on composite score
  IF NEW.weighted_composite_score >= 80 THEN
    NEW.score_recommendation := 'strong_yes';
  ELSIF NEW.weighted_composite_score >= 70 THEN
    NEW.score_recommendation := 'yes';
  ELSIF NEW.weighted_composite_score >= 60 THEN
    NEW.score_recommendation := 'maybe';
  ELSE
    NEW.score_recommendation := 'no';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for opportunity scoring
DROP TRIGGER IF EXISTS trigger_calculate_opportunity_scores ON work_items;
CREATE TRIGGER trigger_calculate_opportunity_scores
  BEFORE INSERT OR UPDATE ON work_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_opportunity_scores();

-- Indexes for Module 4
CREATE INDEX IF NOT EXISTS idx_work_items_opportunity ON work_items(organization_id, item_type) WHERE item_type = 'opportunity';
CREATE INDEX IF NOT EXISTS idx_work_items_weighted_score ON work_items(weighted_composite_score DESC) WHERE item_type = 'opportunity';
CREATE INDEX IF NOT EXISTS idx_work_items_opportunity_type ON work_items(opportunity_type) WHERE item_type = 'opportunity';

-- =====================================================
-- MODULE 5: NOTES & MEMORY (Organization Context)
-- =====================================================

-- Organization context notes (structured memory)
CREATE TABLE IF NOT EXISTS organization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Context type
  context_type TEXT NOT NULL CHECK (context_type IN (
    'vision', 'mission', 'values', 'strategy', 'decision_principle',
    'operational_preference', 'key_relationship', 'important_date',
    'lesson_learned', 'competitive_insight', 'market_intelligence'
  )),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',

  -- Importance and validity
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('critical', 'high', 'normal', 'low')),
  effective_from DATE,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,

  -- AI embedding for retrieval
  embedding vector(1536),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  source_id UUID,
  related_context_ids UUID[] DEFAULT '{}',

  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Module 5
CREATE INDEX IF NOT EXISTS idx_organization_context_org ON organization_context(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_context_type ON organization_context(organization_id, context_type);
CREATE INDEX IF NOT EXISTS idx_organization_context_active ON organization_context(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organization_context_importance ON organization_context(organization_id, importance);

-- Vector search index (if pgvector extension is enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE INDEX IF NOT EXISTS idx_organization_context_embedding
      ON organization_context USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE executive_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_health_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_context ENABLE ROW LEVEL SECURITY;

-- Executive Priorities policies
CREATE POLICY "Users can view their organization's priorities" ON executive_priorities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage priorities" ON executive_priorities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = executive_priorities.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

-- Risk Analyses policies
CREATE POLICY "Users can view their organization's risk analyses" ON risk_analyses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage risk analyses" ON risk_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = risk_analyses.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

-- Decisions policies
CREATE POLICY "Users can view their organization's decisions" ON decisions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create decisions" ON decisions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own decisions or admins can update any" ON decisions
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = decisions.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

CREATE POLICY "Users can delete their own decisions or admins can delete any" ON decisions
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = decisions.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

-- Decision Events policies
CREATE POLICY "Users can view decision events for their decisions" ON decision_events
  FOR SELECT USING (
    decision_id IN (
      SELECT id FROM decisions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create decision events" ON decision_events
  FOR INSERT WITH CHECK (
    decision_id IN (
      SELECT id FROM decisions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Task Health Flags policies
CREATE POLICY "Users can view their organization's task health flags" ON task_health_flags
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage task health flags" ON task_health_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = task_health_flags.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

-- Organization Context policies
CREATE POLICY "Users can view their organization's context" ON organization_context
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization context" ON organization_context
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = organization_context.organization_id
      AND (user_role IN ('admin', 'manager') OR is_super_admin = true)
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get today's executive summary
CREATE OR REPLACE FUNCTION get_executive_daily_summary(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'priorities', (
      SELECT COALESCE(jsonb_agg(row_to_json(ep.*) ORDER BY ep.priority_rank), '[]')
      FROM executive_priorities ep
      WHERE ep.organization_id = p_organization_id
      AND ep.priority_date = CURRENT_DATE
      AND ep.status = 'active'
      LIMIT 5
    ),
    'pending_decisions', (
      SELECT COUNT(*)
      FROM decisions d
      WHERE d.organization_id = p_organization_id
      AND d.status = 'pending'
    ),
    'urgent_decisions', (
      SELECT COUNT(*)
      FROM decisions d
      WHERE d.organization_id = p_organization_id
      AND d.status = 'pending'
      AND d.priority = 'urgent'
    ),
    'active_opportunities', (
      SELECT COUNT(*)
      FROM work_items wi
      WHERE wi.organization_id = p_organization_id
      AND wi.item_type = 'opportunity'
      AND wi.final_decision = 'pending'
    ),
    'task_health_issues', (
      SELECT COUNT(*)
      FROM task_health_flags thf
      WHERE thf.organization_id = p_organization_id
      AND thf.status = 'active'
    ),
    'risk_level', (
      SELECT ra.overall_risk_level
      FROM risk_analyses ra
      WHERE ra.organization_id = p_organization_id
      AND ra.analysis_date = CURRENT_DATE
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
