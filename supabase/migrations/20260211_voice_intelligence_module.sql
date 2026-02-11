-- Voice Intelligence Module
-- 3 new tables + columns on voice_memos for Brain classifier, action queue, and Plaud integration

-- ============================================================
-- 1. voice_intel_context — Lorenzo's knowledge base
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_intel_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('entity', 'person', 'project', 'keyword')),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_intel_context_unique
  ON voice_intel_context(user_id, context_type, name);

CREATE INDEX IF NOT EXISTS idx_voice_intel_context_user
  ON voice_intel_context(user_id, context_type, is_active);

ALTER TABLE voice_intel_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own context" ON voice_intel_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context" ON voice_intel_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context" ON voice_intel_context
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own context" ON voice_intel_context
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on voice_intel_context" ON voice_intel_context
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. voice_intel_classifications — Brain's 3-dimension output
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_intel_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_memo_id UUID NOT NULL REFERENCES voice_memos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  activity TEXT NOT NULL,
  action_type TEXT NOT NULL,
  confidence_scores JSONB DEFAULT '{}',
  people JSONB DEFAULT '[]',
  prophetic_words JSONB DEFAULT '[]',
  has_prophetic_content BOOLEAN DEFAULT false,
  discoveries JSONB DEFAULT '[]',
  brain_summary TEXT,
  brain_raw_output JSONB DEFAULT '{}',
  action_items JSONB DEFAULT '[]',
  processing_model TEXT DEFAULT 'claude-sonnet-4-5',
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_intel_classifications_user
  ON voice_intel_classifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_intel_classifications_memo
  ON voice_intel_classifications(voice_memo_id);

CREATE INDEX IF NOT EXISTS idx_voice_intel_classifications_entity
  ON voice_intel_classifications(user_id, entity, activity);

ALTER TABLE voice_intel_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classifications" ON voice_intel_classifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own classifications" ON voice_intel_classifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on voice_intel_classifications" ON voice_intel_classifications
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. voice_intel_actions — The Action Queue
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_intel_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classification_id UUID REFERENCES voice_intel_classifications(id) ON DELETE SET NULL,
  voice_memo_id UUID REFERENCES voice_memos(id) ON DELETE SET NULL,
  tier TEXT NOT NULL CHECK (tier IN ('red', 'yellow', 'green')),
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_entity TEXT,
  related_people TEXT[] DEFAULT '{}',
  delivery_payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'auto_completed')),
  priority INTEGER DEFAULT 0,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_intel_actions_user_status
  ON voice_intel_actions(user_id, status, tier);

CREATE INDEX IF NOT EXISTS idx_voice_intel_actions_classification
  ON voice_intel_actions(classification_id);

CREATE INDEX IF NOT EXISTS idx_voice_intel_actions_tier
  ON voice_intel_actions(user_id, tier, created_at DESC);

ALTER TABLE voice_intel_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON voice_intel_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own actions" ON voice_intel_actions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions" ON voice_intel_actions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on voice_intel_actions" ON voice_intel_actions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 4. Add columns to existing voice_memos table
-- ============================================================
ALTER TABLE voice_memos ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE voice_memos ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE voice_memos ADD COLUMN IF NOT EXISTS srt_transcript TEXT;
ALTER TABLE voice_memos ADD COLUMN IF NOT EXISTS classification_status TEXT DEFAULT 'pending';
ALTER TABLE voice_memos ADD COLUMN IF NOT EXISTS classification_id UUID REFERENCES voice_intel_classifications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_voice_memos_external_id
  ON voice_memos(external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_memos_classification_status
  ON voice_memos(user_id, classification_status);

-- ============================================================
-- 5. Updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_voice_intel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_intel_context_updated_at
  BEFORE UPDATE ON voice_intel_context
  FOR EACH ROW EXECUTE FUNCTION update_voice_intel_updated_at();

CREATE TRIGGER voice_intel_classifications_updated_at
  BEFORE UPDATE ON voice_intel_classifications
  FOR EACH ROW EXECUTE FUNCTION update_voice_intel_updated_at();

CREATE TRIGGER voice_intel_actions_updated_at
  BEFORE UPDATE ON voice_intel_actions
  FOR EACH ROW EXECUTE FUNCTION update_voice_intel_updated_at();

COMMENT ON TABLE voice_intel_context IS 'Lorenzo Brain knowledge base - entities, people, projects, keywords for voice memo classification';
COMMENT ON TABLE voice_intel_classifications IS 'Brain 3-dimension classification output (Entity × Activity × Action) for each voice memo';
COMMENT ON TABLE voice_intel_actions IS 'Human-in-the-loop action queue with red/yellow/green tiers';
