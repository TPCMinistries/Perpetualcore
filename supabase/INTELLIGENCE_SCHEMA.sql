-- =====================================================
-- AI INTELLIGENCE & LEARNING SYSTEM
-- Enables true learning, insights, and pattern recognition
-- =====================================================

-- =====================================================
-- 1. INSIGHTS TABLE - Stores learned insights and patterns
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = organization-wide
  
  -- Insight classification
  insight_type TEXT NOT NULL, -- 'preference', 'pattern', 'preference', 'trend', 'relationship', 'recommendation'
  category TEXT, -- 'workflow', 'communication', 'productivity', 'content', 'behavior'
  
  -- Insight content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  key_findings JSONB, -- Structured findings
  evidence JSONB, -- Sources: conversation_ids, document_ids, etc.
  
  -- Intelligence metrics
  confidence_score FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  relevance_score FLOAT DEFAULT 0.5, -- How relevant to user
  frequency_count INTEGER DEFAULT 1, -- How often this pattern appears
  
  -- Context
  context_tags TEXT[], -- Tags for categorization
  related_insights UUID[], -- Links to other insights
  related_conversations UUID[], -- Conversations that contributed
  related_documents UUID[], -- Documents that contributed
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'superseded'
  verified_at TIMESTAMPTZ, -- When manually verified
  verified_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW() -- When last referenced
);

-- =====================================================
-- 2. USER PREFERENCES TABLE - Learned user preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Preference type
  preference_type TEXT NOT NULL, -- 'model', 'tone', 'verbosity', 'format', 'workflow', 'notification'
  preference_key TEXT NOT NULL, -- e.g., 'default_model', 'email_tone'
  preference_value JSONB NOT NULL, -- The actual preference value
  
  -- Learning metadata
  confidence FLOAT DEFAULT 0.5, -- How confident we are in this preference
  evidence_count INTEGER DEFAULT 1, -- Number of times observed
  sources JSONB, -- Where this preference was learned from
  
  -- Context
  context_tags TEXT[], -- When this preference applies
  is_explicit BOOLEAN DEFAULT false, -- User explicitly set vs learned
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, preference_type, preference_key)
);

-- =====================================================
-- 3. KNOWLEDGE GRAPH TABLE - Relationships between concepts
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Nodes (concepts)
  source_concept TEXT NOT NULL, -- e.g., "project management"
  target_concept TEXT NOT NULL, -- e.g., "task tracking"
  relationship_type TEXT NOT NULL, -- 'related_to', 'depends_on', 'similar_to', 'opposite_of', 'part_of'
  
  -- Relationship strength
  strength FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  confidence FLOAT DEFAULT 0.5, -- How confident in this relationship
  
  -- Evidence
  evidence_count INTEGER DEFAULT 1,
  evidence_sources JSONB, -- Where this relationship was observed
  
  -- Context
  context_tags TEXT[],
  domain TEXT, -- 'business', 'technical', 'personal', etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, source_concept, target_concept, relationship_type)
);

-- =====================================================
-- 4. PATTERN RECOGNITION TABLE - Recognized patterns
-- =====================================================

CREATE TABLE IF NOT EXISTS recognized_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = organization-wide
  
  -- Pattern classification
  pattern_type TEXT NOT NULL, -- 'temporal', 'behavioral', 'content', 'workflow', 'communication'
  pattern_name TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  
  -- Pattern data
  pattern_data JSONB NOT NULL, -- Structured pattern information
  conditions JSONB, -- When this pattern applies
  
  -- Recognition metrics
  occurrence_count INTEGER DEFAULT 1,
  frequency TEXT, -- 'rare', 'occasional', 'frequent', 'constant'
  confidence FLOAT DEFAULT 0.5,
  
  -- Evidence
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  evidence_sources JSONB,
  
  -- Context
  context_tags TEXT[],
  related_patterns UUID[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. PREDICTIVE SUGGESTIONS TABLE - AI-generated suggestions
-- =====================================================

CREATE TABLE IF NOT EXISTS predictive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggestion content
  suggestion_type TEXT NOT NULL, -- 'action', 'optimization', 'reminder', 'recommendation', 'insight'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action JSONB, -- What action to take
  
  -- Intelligence
  relevance_score FLOAT DEFAULT 0.5,
  confidence FLOAT DEFAULT 0.5,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Basis
  based_on_insights UUID[], -- Insights that led to this suggestion
  based_on_patterns UUID[], -- Patterns that led to this suggestion
  based_on_preferences UUID[], -- Preferences that led to this suggestion
  
  -- Context
  context_tags TEXT[],
  applicable_scenarios JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'shown', 'accepted', 'dismissed', 'completed'
  shown_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. LEARNING EVENTS TABLE - Track what AI learns from
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type TEXT NOT NULL, -- 'conversation', 'document', 'action', 'preference_change', 'feedback'
  event_source TEXT NOT NULL, -- 'chat', 'document_upload', 'task_completion', etc.
  
  -- Event data
  source_id UUID, -- ID of the source (conversation_id, document_id, etc.)
  event_data JSONB NOT NULL, -- What happened
  
  -- Learning outcomes
  insights_generated UUID[], -- Insights created from this event
  patterns_updated UUID[], -- Patterns updated from this event
  preferences_updated UUID[], -- Preferences updated from this event
  
  -- Metadata
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_org ON ai_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON ai_insights(category);
CREATE INDEX IF NOT EXISTS idx_ai_insights_confidence ON ai_insights(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_user_preferences_active ON user_preferences(is_active) WHERE is_active = true;

-- Knowledge graph indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_org ON knowledge_graph(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_source ON knowledge_graph(source_concept);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_target ON knowledge_graph(target_concept);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_type ON knowledge_graph(relationship_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_strength ON knowledge_graph(strength DESC);

-- Pattern recognition indexes
CREATE INDEX IF NOT EXISTS idx_patterns_org ON recognized_patterns(organization_id);
CREATE INDEX IF NOT EXISTS idx_patterns_user ON recognized_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON recognized_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON recognized_patterns(is_active) WHERE is_active = true;

-- Predictive suggestions indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_org ON predictive_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON predictive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON predictive_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON predictive_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_relevance ON predictive_suggestions(relevance_score DESC);

-- Learning events indexes
CREATE INDEX IF NOT EXISTS idx_learning_events_org ON learning_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_user ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_learning_events_processed ON learning_events(processed) WHERE processed = false;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognized_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

-- Insights policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_insights'
    AND policyname = 'Users can view insights in their organization'
  ) THEN
    CREATE POLICY "Users can view insights in their organization"
      ON ai_insights FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_insights'
    AND policyname = 'System can manage insights'
  ) THEN
    CREATE POLICY "System can manage insights"
      ON ai_insights FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- User preferences policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_preferences'
    AND policyname = 'Users can view their own preferences'
  ) THEN
    CREATE POLICY "Users can view their own preferences"
      ON user_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_preferences'
    AND policyname = 'Users can manage their own preferences'
  ) THEN
    CREATE POLICY "Users can manage their own preferences"
      ON user_preferences FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_preferences'
    AND policyname = 'System can manage preferences'
  ) THEN
    CREATE POLICY "System can manage preferences"
      ON user_preferences FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Knowledge graph policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'knowledge_graph'
    AND policyname = 'Users can view knowledge graph in their organization'
  ) THEN
    CREATE POLICY "Users can view knowledge graph in their organization"
      ON knowledge_graph FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'knowledge_graph'
    AND policyname = 'System can manage knowledge graph'
  ) THEN
    CREATE POLICY "System can manage knowledge graph"
      ON knowledge_graph FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Pattern recognition policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recognized_patterns'
    AND policyname = 'Users can view patterns in their organization'
  ) THEN
    CREATE POLICY "Users can view patterns in their organization"
      ON recognized_patterns FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recognized_patterns'
    AND policyname = 'System can manage patterns'
  ) THEN
    CREATE POLICY "System can manage patterns"
      ON recognized_patterns FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Predictive suggestions policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'predictive_suggestions'
    AND policyname = 'Users can view their own suggestions'
  ) THEN
    CREATE POLICY "Users can view their own suggestions"
      ON predictive_suggestions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'predictive_suggestions'
    AND policyname = 'Users can update their own suggestions'
  ) THEN
    CREATE POLICY "Users can update their own suggestions"
      ON predictive_suggestions FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'predictive_suggestions'
    AND policyname = 'System can create suggestions'
  ) THEN
    CREATE POLICY "System can create suggestions"
      ON predictive_suggestions FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Learning events policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'learning_events'
    AND policyname = 'Users can view learning events in their organization'
  ) THEN
    CREATE POLICY "Users can view learning events in their organization"
      ON learning_events FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'learning_events'
    AND policyname = 'System can manage learning events'
  ) THEN
    CREATE POLICY "System can manage learning events"
      ON learning_events FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps (only create if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_ai_insights_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_insights_updated_at
      BEFORE UPDATE ON ai_insights
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_knowledge_graph_updated_at'
  ) THEN
    CREATE TRIGGER update_knowledge_graph_updated_at
      BEFORE UPDATE ON knowledge_graph
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_patterns_updated_at'
  ) THEN
    CREATE TRIGGER update_patterns_updated_at
      BEFORE UPDATE ON recognized_patterns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_suggestions_updated_at'
  ) THEN
    CREATE TRIGGER update_suggestions_updated_at
      BEFORE UPDATE ON predictive_suggestions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's learned preferences
CREATE OR REPLACE FUNCTION get_user_preferences(
  p_user_id UUID,
  p_preference_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  preference_type TEXT,
  preference_key TEXT,
  preference_value JSONB,
  confidence FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.preference_type,
    up.preference_key,
    up.preference_value,
    up.confidence
  FROM user_preferences up
  WHERE up.user_id = p_user_id
    AND up.is_active = true
    AND (p_preference_type IS NULL OR up.preference_type = p_preference_type)
  ORDER BY up.confidence DESC, up.last_used_at DESC;
END;
$$;

-- Function to get relevant insights for a context
CREATE OR REPLACE FUNCTION get_relevant_insights(
  p_organization_id UUID,
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  insight_type TEXT,
  confidence_score FLOAT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai.id,
    ai.title,
    ai.description,
    ai.insight_type,
    ai.confidence_score,
    ai.relevance_score
  FROM ai_insights ai
  WHERE ai.organization_id = p_organization_id
    AND (ai.user_id IS NULL OR ai.user_id = p_user_id)
    AND ai.status = 'active'
    AND (p_category IS NULL OR ai.category = p_category)
  ORDER BY (ai.confidence_score * ai.relevance_score) DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- DONE! Intelligence system schema is ready
-- =====================================================

