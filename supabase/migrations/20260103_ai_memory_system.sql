-- =====================================================
-- AI MEMORY SYSTEM
-- Persistent context that makes AI truly intelligent
-- =====================================================

-- 1. User AI Memory - Facts the AI learns about each user
CREATE TABLE IF NOT EXISTS user_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Memory categories
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'fact',           -- "User prefers formal communication"
    'preference',     -- "User likes bullet points"
    'project',        -- "Working on Q1 sales campaign"
    'relationship',   -- "John is their main client contact"
    'goal',           -- "Wants to increase revenue 20%"
    'style',          -- "Writes in conversational tone"
    'context',        -- "Running a coaching business"
    'skill',          -- "Expert in marketing"
    'challenge',      -- "Struggling with lead conversion"
    'workflow'        -- "Reviews emails every morning"
  )),

  -- The actual memory
  content TEXT NOT NULL,

  -- Structured data for queries
  key TEXT,                    -- e.g., "communication_style", "primary_goal"
  value JSONB,                 -- Structured value if applicable

  -- Memory metadata
  confidence FLOAT DEFAULT 0.8,  -- How confident AI is in this memory
  source TEXT,                   -- Where this was learned (conversation_id, manual, inferred)
  source_id UUID,                -- Reference to source

  -- Temporal
  learned_at TIMESTAMPTZ DEFAULT NOW(),
  last_reinforced_at TIMESTAMPTZ DEFAULT NOW(),
  reinforcement_count INT DEFAULT 1,
  expires_at TIMESTAMPTZ,        -- Some memories can expire

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,  -- User confirmed this is accurate

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Conversation Context - What's happening in ongoing conversations
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context extracted from conversation
  topic TEXT,
  entities JSONB DEFAULT '[]',        -- People, companies, projects mentioned
  action_items JSONB DEFAULT '[]',    -- Tasks identified
  decisions JSONB DEFAULT '[]',       -- Decisions made
  questions JSONB DEFAULT '[]',       -- Open questions
  sentiment TEXT,                     -- Overall sentiment

  -- Summary for quick reference
  summary TEXT,
  key_points JSONB DEFAULT '[]',

  -- For continuity
  last_discussed_at TIMESTAMPTZ DEFAULT NOW(),
  continuation_prompt TEXT,           -- AI's suggested follow-up

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Learning Log - Track what AI learns and when
CREATE TABLE IF NOT EXISTS ai_learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'memory_created',
    'memory_updated',
    'memory_reinforced',
    'memory_contradicted',
    'memory_expired',
    'context_extracted',
    'insight_generated',
    'preference_detected'
  )),

  memory_id UUID REFERENCES user_ai_memory(id) ON DELETE SET NULL,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON user_ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON user_ai_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_key ON user_ai_memory(key);
CREATE INDEX IF NOT EXISTS idx_ai_memory_active ON user_ai_memory(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_context_conv ON conversation_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_user ON conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_user ON ai_learning_log(user_id);

-- 5. RLS Policies
ALTER TABLE user_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own memories
CREATE POLICY "Users can view own memories" ON user_ai_memory
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own memories" ON user_ai_memory
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own conversation context" ON conversation_context
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own conversation context" ON conversation_context
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own learning log" ON ai_learning_log
  FOR SELECT USING (user_id = auth.uid());

-- 6. Function to get user's AI context for chat
CREATE OR REPLACE FUNCTION get_user_ai_context(p_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
  memory_type TEXT,
  content TEXT,
  key TEXT,
  confidence FLOAT,
  reinforcement_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.memory_type,
    m.content,
    m.key,
    m.confidence,
    m.reinforcement_count
  FROM user_ai_memory m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY
    m.reinforcement_count DESC,
    m.confidence DESC,
    m.last_reinforced_at DESC
  LIMIT p_limit;
END;
$$;

-- 7. Function to add or reinforce a memory
CREATE OR REPLACE FUNCTION upsert_ai_memory(
  p_user_id UUID,
  p_memory_type TEXT,
  p_content TEXT,
  p_key TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'conversation',
  p_source_id UUID DEFAULT NULL,
  p_confidence FLOAT DEFAULT 0.8
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_memory_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if similar memory exists
  SELECT id INTO v_existing_id
  FROM user_ai_memory
  WHERE user_id = p_user_id
    AND memory_type = p_memory_type
    AND (key = p_key OR (key IS NULL AND p_key IS NULL))
    AND content = p_content
    AND is_active = true
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Reinforce existing memory
    UPDATE user_ai_memory
    SET
      reinforcement_count = reinforcement_count + 1,
      last_reinforced_at = NOW(),
      confidence = LEAST(confidence + 0.05, 1.0),
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_memory_id;

    -- Log reinforcement
    INSERT INTO ai_learning_log (user_id, event_type, memory_id, details)
    VALUES (p_user_id, 'memory_reinforced', v_memory_id, jsonb_build_object('source', p_source));
  ELSE
    -- Create new memory
    INSERT INTO user_ai_memory (
      user_id, memory_type, content, key, source, source_id, confidence
    ) VALUES (
      p_user_id, p_memory_type, p_content, p_key, p_source, p_source_id, p_confidence
    )
    RETURNING id INTO v_memory_id;

    -- Log creation
    INSERT INTO ai_learning_log (user_id, event_type, memory_id, details)
    VALUES (p_user_id, 'memory_created', v_memory_id, jsonb_build_object('source', p_source));
  END IF;

  RETURN v_memory_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_ai_context TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_ai_memory TO authenticated;

-- =====================================================
-- DONE! AI now has persistent memory
-- =====================================================
