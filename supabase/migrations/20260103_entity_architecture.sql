-- =====================================================
-- PERPETUAL CORE ENTITY ARCHITECTURE
-- Multi-entity, brand, and project management system
-- =====================================================

-- =====================================================
-- PART 1: LOOKUP TABLES (Admin-Configurable)
-- No hardcoded enums - everything is a row
-- =====================================================

-- Entity Types (nonprofit, llc, corporation, personal, etc.)
CREATE TABLE IF NOT EXISTS lookup_entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon name
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Types (campaign, rfp, program, event, etc.)
CREATE TABLE IF NOT EXISTS lookup_project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  default_stages JSONB, -- Default stage flow for this type
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Stages (planning, active, review, complete, etc.)
CREATE TABLE IF NOT EXISTS lookup_project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT, -- For UI display
  is_terminal BOOLEAN DEFAULT false, -- Is this an end state?
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Types (blog, social, video, newsletter, etc.)
CREATE TABLE IF NOT EXISTS lookup_content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  default_platforms TEXT[], -- Which platforms this type typically goes to
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platforms (instagram, linkedin, twitter, youtube, etc.)
CREATE TABLE IF NOT EXISTS lookup_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  character_limit INT,
  supports_images BOOLEAN DEFAULT true,
  supports_video BOOLEAN DEFAULT true,
  supports_links BOOLEAN DEFAULT true,
  api_config JSONB, -- Platform-specific API settings
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Focus Areas (faith, workforce, technology, healthcare, etc.)
CREATE TABLE IF NOT EXISTS lookup_focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial lookup data
INSERT INTO lookup_entity_types (name, description, icon, sort_order) VALUES
  ('nonprofit', '501(c)(3) tax-exempt organization', '🏛️', 1),
  ('llc', 'Limited Liability Company', '🏢', 2),
  ('corporation', 'C-Corp or S-Corp', '🏗️', 3),
  ('personal', 'Individual/Personal brand', '👤', 4),
  ('ministry', 'Faith-based organization', '⛪', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO lookup_project_types (name, description, icon, default_stages, sort_order) VALUES
  ('campaign', 'Marketing or outreach campaign', '📢', '["planning", "active", "review", "complete"]', 1),
  ('rfp', 'Request for Proposal / Contract bid', '📋', '["research", "drafting", "review", "submitted", "awarded", "complete"]', 2),
  ('program', 'Ongoing program or initiative', '🎯', '["planning", "launch", "active", "evaluation"]', 3),
  ('event', 'One-time or recurring event', '📅', '["planning", "promotion", "execution", "followup"]', 4),
  ('product', 'Product development', '🚀', '["ideation", "development", "testing", "launch", "iteration"]', 5),
  ('content_series', 'Content series or editorial calendar', '📝', '["planning", "production", "publishing", "analysis"]', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO lookup_project_stages (name, description, color, is_terminal, sort_order) VALUES
  ('planning', 'Initial planning phase', 'blue', false, 1),
  ('research', 'Research and discovery', 'cyan', false, 2),
  ('drafting', 'Content or proposal drafting', 'purple', false, 3),
  ('review', 'Internal review', 'amber', false, 4),
  ('active', 'Actively in progress', 'green', false, 5),
  ('submitted', 'Submitted for external review', 'orange', false, 6),
  ('awarded', 'Contract awarded', 'emerald', false, 7),
  ('complete', 'Successfully completed', 'slate', true, 8),
  ('cancelled', 'Cancelled or abandoned', 'red', true, 9),
  ('on_hold', 'Temporarily paused', 'gray', false, 10)
ON CONFLICT (name) DO NOTHING;

INSERT INTO lookup_content_types (name, description, icon, default_platforms, sort_order) VALUES
  ('social_post', 'Short-form social media post', '📱', ARRAY['instagram', 'linkedin', 'twitter'], 1),
  ('blog_post', 'Long-form blog article', '📝', ARRAY['website', 'medium'], 2),
  ('newsletter', 'Email newsletter', '📧', ARRAY['email'], 3),
  ('video', 'Video content', '🎬', ARRAY['youtube', 'instagram', 'tiktok'], 4),
  ('podcast', 'Audio/podcast content', '🎙️', ARRAY['spotify', 'apple_podcasts'], 5),
  ('devotional', 'Faith-based devotional content', '🙏', ARRAY['website', 'email', 'instagram'], 6),
  ('case_study', 'Client case study', '📊', ARRAY['website', 'linkedin'], 7)
ON CONFLICT (name) DO NOTHING;

INSERT INTO lookup_platforms (name, display_name, icon, character_limit, sort_order) VALUES
  ('instagram', 'Instagram', '📸', 2200, 1),
  ('linkedin', 'LinkedIn', '💼', 3000, 2),
  ('twitter', 'X (Twitter)', '🐦', 280, 3),
  ('facebook', 'Facebook', '👥', 63206, 4),
  ('youtube', 'YouTube', '▶️', 5000, 5),
  ('tiktok', 'TikTok', '🎵', 2200, 6),
  ('website', 'Website/Blog', '🌐', NULL, 7),
  ('email', 'Email', '📧', NULL, 8),
  ('medium', 'Medium', '📰', NULL, 9)
ON CONFLICT (name) DO NOTHING;

INSERT INTO lookup_focus_areas (name, description, icon, color, sort_order) VALUES
  ('faith', 'Faith, spirituality, and ministry', '✝️', 'purple', 1),
  ('workforce', 'Workforce development and employment', '👷', 'blue', 2),
  ('technology', 'Technology and AI solutions', '💻', 'cyan', 3),
  ('healthcare', 'Healthcare and medical services', '🏥', 'red', 4),
  ('education', 'Education and training', '📚', 'amber', 5),
  ('consulting', 'Business consulting and advisory', '🎯', 'green', 6),
  ('community', 'Community development', '🏘️', 'orange', 7)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PART 2: ENTITIES (Companies/Organizations)
-- =====================================================

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  legal_name TEXT,
  description TEXT,

  -- Type and Classification
  entity_type_id UUID REFERENCES lookup_entity_types(id),
  ein TEXT, -- Tax ID for nonprofits/corps

  -- Focus Areas (many-to-many via junction)
  primary_focus_id UUID REFERENCES lookup_focus_areas(id),

  -- Branding
  logo_url TEXT,
  color_primary TEXT,
  color_secondary TEXT,

  -- Contact
  website TEXT,
  email TEXT,
  phone TEXT,

  -- AI Configuration
  ai_context JSONB DEFAULT '{}', -- Entity-level AI personality/context

  -- Settings
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity Focus Areas (many-to-many)
CREATE TABLE IF NOT EXISTS entity_focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  focus_area_id UUID NOT NULL REFERENCES lookup_focus_areas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, focus_area_id)
);

-- =====================================================
-- PART 3: BRANDS (Under Entities)
-- =====================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,

  -- Branding
  logo_url TEXT,
  color_primary TEXT,
  color_secondary TEXT,

  -- Tone Configuration (for AI content generation)
  tone_config JSONB DEFAULT '{
    "voice": "professional",
    "personality_traits": [],
    "writing_style": "clear and concise",
    "avoid_words": [],
    "preferred_phrases": [],
    "emoji_usage": "minimal",
    "hashtag_strategy": "relevant",
    "cta_style": "soft"
  }',

  -- Content Settings
  content_calendar_enabled BOOLEAN DEFAULT true,
  auto_schedule_enabled BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT true,

  -- Publishing Rules
  posting_frequency JSONB DEFAULT '{}', -- Per platform rules
  optimal_times JSONB DEFAULT '{}', -- Best posting times

  -- AI Model Preferences
  primary_ai_model TEXT DEFAULT 'claude', -- claude, gpt-4, etc.
  refinement_ai_model TEXT DEFAULT 'gpt-4',

  -- Social Accounts (linked platform accounts)
  social_accounts JSONB DEFAULT '[]',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Platforms (which platforms this brand publishes to)
CREATE TABLE IF NOT EXISTS brand_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES lookup_platforms(id) ON DELETE CASCADE,

  -- Platform-specific settings
  account_handle TEXT,
  account_id TEXT,
  is_connected BOOLEAN DEFAULT false,
  credentials_id TEXT, -- Reference to secure credential store

  -- Platform-specific tone overrides
  tone_overrides JSONB DEFAULT '{}',

  -- Posting rules for this platform
  max_posts_per_day INT DEFAULT 3,
  min_hours_between_posts INT DEFAULT 4,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform_id)
);

-- =====================================================
-- PART 4: PROJECTS (Time-Bound Work)
-- =====================================================

CREATE TABLE IF NOT EXISTS entity_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL, -- Optional brand association
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  project_type_id UUID REFERENCES lookup_project_types(id),
  current_stage_id UUID REFERENCES lookup_project_stages(id),

  -- Timeline
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,

  -- Budget (for RFPs, contracts, etc.)
  budget_amount DECIMAL(12,2),
  budget_currency TEXT DEFAULT 'USD',
  actual_spend DECIMAL(12,2) DEFAULT 0,

  -- Priority and Status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  health_status TEXT DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'blocked', 'ahead')),

  -- External References (for RFPs, contracts)
  external_id TEXT, -- RFP number, contract number, etc.
  external_url TEXT,

  -- AI Context
  ai_summary TEXT, -- AI-generated project summary
  ai_recommendations JSONB DEFAULT '[]',

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES entity_projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,

  sort_order INT DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Stage History (track stage transitions)
CREATE TABLE IF NOT EXISTS project_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES entity_projects(id) ON DELETE CASCADE,

  from_stage_id UUID REFERENCES lookup_project_stages(id),
  to_stage_id UUID NOT NULL REFERENCES lookup_project_stages(id),

  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 5: ENHANCED TASKS (Entity/Brand/Project Aware)
-- =====================================================

-- Add entity context columns to existing tasks table (if table exists)
DO $$
BEGIN
  -- Only modify tasks table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    -- Add entity_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'entity_id') THEN
      ALTER TABLE tasks ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
    END IF;

    -- Add brand_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'brand_id') THEN
      ALTER TABLE tasks ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
    END IF;

    -- Add project_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'project_id') THEN
      ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES entity_projects(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 6: CONTENT PIPELINE (With Approval Workflow)
-- =====================================================

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  project_id UUID REFERENCES entity_projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Content Type
  content_type_id UUID REFERENCES lookup_content_types(id),

  -- The Content
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[],

  -- Platform Versions (different versions for different platforms)
  platform_versions JSONB DEFAULT '{}', -- { "instagram": "...", "linkedin": "..." }

  -- Workflow Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Initial creation
    'pending_review',  -- Submitted for approval
    'changes_requested', -- Reviewer requested changes
    'approved',        -- Ready to schedule
    'scheduled',       -- Has a publish time set
    'published',       -- Live on platform(s)
    'failed',          -- Publishing failed
    'archived'         -- No longer active
  )),

  -- Approval Flow
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- AI Generation Info
  ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_prompt_used TEXT,
  ai_confidence FLOAT,

  -- Performance (after publishing)
  performance_metrics JSONB DEFAULT '{}',

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Publishing Log (track what was published where)
CREATE TABLE IF NOT EXISTS content_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES lookup_platforms(id),

  -- What was published
  published_content TEXT NOT NULL,
  media_urls TEXT[],

  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  platform_post_id TEXT, -- ID returned by the platform
  platform_url TEXT, -- URL to the published post
  error_message TEXT,

  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 7: EXTEND AI MEMORY WITH ENTITY CONTEXT
-- =====================================================

-- Add entity context to existing AI memory table (if table exists)
DO $$
BEGIN
  -- Check if user_ai_memory table exists first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_ai_memory') THEN
    -- Add entity_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_ai_memory' AND column_name = 'entity_id') THEN
      ALTER TABLE user_ai_memory ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
    END IF;

    -- Add brand_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_ai_memory' AND column_name = 'brand_id') THEN
      ALTER TABLE user_ai_memory ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 8: AUTOMATION QUEUE (Master Orchestrator)
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  project_id UUID REFERENCES entity_projects(id) ON DELETE SET NULL,

  -- Job Definition
  job_type TEXT NOT NULL, -- 'content_generate', 'content_publish', 'lead_followup', etc.
  payload JSONB NOT NULL DEFAULT '{}',

  -- Priority and Scheduling
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Waiting to be picked up
    'processing', -- Currently being processed
    'completed',  -- Successfully finished
    'failed',     -- Failed (will retry)
    'dead',       -- Failed permanently
    'cancelled'   -- Manually cancelled
  )),

  -- Execution Info
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Result
  result JSONB,
  error_message TEXT,

  -- n8n Integration
  n8n_execution_id TEXT,
  n8n_workflow_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to automation_queue if table already existed
DO $$
BEGIN
  -- Handle owner_id vs user_id naming (existing table uses user_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_queue' AND column_name = 'owner_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_queue' AND column_name = 'user_id') THEN
      -- Rename user_id to owner_id for consistency
      ALTER TABLE automation_queue RENAME COLUMN user_id TO owner_id;
    ELSE
      ALTER TABLE automation_queue ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_queue' AND column_name = 'entity_id') THEN
    ALTER TABLE automation_queue ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_queue' AND column_name = 'brand_id') THEN
    ALTER TABLE automation_queue ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_queue' AND column_name = 'project_id') THEN
    ALTER TABLE automation_queue ADD COLUMN project_id UUID REFERENCES entity_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- PART 9: INDEXES
-- =====================================================

-- Entities
CREATE INDEX IF NOT EXISTS idx_entities_owner ON entities(owner_id);
CREATE INDEX IF NOT EXISTS idx_entities_org ON entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type_id);

-- Brands
CREATE INDEX IF NOT EXISTS idx_brands_entity ON brands(entity_id);
CREATE INDEX IF NOT EXISTS idx_brands_owner ON brands(owner_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_entity ON entity_projects(entity_id);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON entity_projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON entity_projects(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON entity_projects(project_type_id);

-- Content
CREATE INDEX IF NOT EXISTS idx_content_brand ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content_items(scheduled_for) WHERE status = 'scheduled';

-- Automation Queue
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_queue_scheduled ON automation_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_automation_queue_entity ON automation_queue(entity_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_job_type ON automation_queue(job_type);

-- AI Memory entity context (created via DO block to handle column existence)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_ai_memory' AND column_name = 'entity_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_memory_entity ON user_ai_memory(entity_id) WHERE entity_id IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_ai_memory' AND column_name = 'brand_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_memory_brand ON user_ai_memory(brand_id) WHERE brand_id IS NOT NULL';
  END IF;
END $$;

-- =====================================================
-- PART 10: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;

-- Entities: Owner can manage their entities
DROP POLICY IF EXISTS "Users can view own entities" ON entities;
CREATE POLICY "Users can view own entities" ON entities
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own entities" ON entities;
CREATE POLICY "Users can manage own entities" ON entities
  FOR ALL USING (owner_id = auth.uid());

-- Brands: Owner of parent entity can manage
DROP POLICY IF EXISTS "Users can view own brands" ON brands;
CREATE POLICY "Users can view own brands" ON brands
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own brands" ON brands;
CREATE POLICY "Users can manage own brands" ON brands
  FOR ALL USING (owner_id = auth.uid());

-- Projects: Owner can manage
DROP POLICY IF EXISTS "Users can view own projects" ON entity_projects;
CREATE POLICY "Users can view own projects" ON entity_projects
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own projects" ON entity_projects;
CREATE POLICY "Users can manage own projects" ON entity_projects
  FOR ALL USING (owner_id = auth.uid());

-- Content: Created by user can manage
DROP POLICY IF EXISTS "Users can view own content" ON content_items;
CREATE POLICY "Users can view own content" ON content_items
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can manage own content" ON content_items;
CREATE POLICY "Users can manage own content" ON content_items
  FOR ALL USING (created_by = auth.uid());

-- Automation Queue: Owner can view
DROP POLICY IF EXISTS "Users can view own jobs" ON automation_queue;
CREATE POLICY "Users can view own jobs" ON automation_queue
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own jobs" ON automation_queue;
CREATE POLICY "Users can manage own jobs" ON automation_queue
  FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- PART 11: HELPER FUNCTIONS
-- =====================================================

-- Get user's entities with details
CREATE OR REPLACE FUNCTION get_user_entities(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  entity_type TEXT,
  entity_type_icon TEXT,
  primary_focus TEXT,
  brand_count BIGINT,
  project_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.description,
    lt.name as entity_type,
    lt.icon as entity_type_icon,
    lf.name as primary_focus,
    (SELECT COUNT(*) FROM brands b WHERE b.entity_id = e.id AND b.is_active) as brand_count,
    (SELECT COUNT(*) FROM entity_projects p WHERE p.entity_id = e.id AND p.is_active) as project_count
  FROM entities e
  LEFT JOIN lookup_entity_types lt ON e.entity_type_id = lt.id
  LEFT JOIN lookup_focus_areas lf ON e.primary_focus_id = lf.id
  WHERE e.owner_id = p_user_id AND e.is_active = true
  ORDER BY e.name;
END;
$$;

-- Queue an automation job
CREATE OR REPLACE FUNCTION queue_automation_job(
  p_owner_id UUID,
  p_job_type TEXT,
  p_payload JSONB,
  p_entity_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO automation_queue (
    owner_id, entity_id, brand_id, project_id,
    job_type, payload, priority, scheduled_for
  ) VALUES (
    p_owner_id, p_entity_id, p_brand_id, p_project_id,
    p_job_type, p_payload, p_priority, p_scheduled_for
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Get next pending job for processing (for n8n to poll)
CREATE OR REPLACE FUNCTION get_next_automation_job()
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  entity_id UUID,
  brand_id UUID,
  project_id UUID,
  job_type TEXT,
  payload JSONB,
  priority TEXT,
  attempts INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Select and lock the next job
  SELECT aq.id INTO v_job_id
  FROM automation_queue aq
  WHERE aq.status = 'pending'
    AND aq.scheduled_for <= NOW()
    AND aq.attempts < aq.max_attempts
  ORDER BY
    CASE aq.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
    END,
    aq.scheduled_for
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NULL THEN
    RETURN;
  END IF;

  -- Mark as processing
  UPDATE automation_queue
  SET status = 'processing',
      attempts = attempts + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
  WHERE automation_queue.id = v_job_id;

  -- Return the job
  RETURN QUERY
  SELECT
    aq.id, aq.owner_id, aq.entity_id, aq.brand_id, aq.project_id,
    aq.job_type, aq.payload, aq.priority, aq.attempts
  FROM automation_queue aq
  WHERE aq.id = v_job_id;
END;
$$;

-- Complete an automation job
CREATE OR REPLACE FUNCTION complete_automation_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL,
  p_n8n_execution_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE automation_queue
  SET status = 'completed',
      completed_at = NOW(),
      result = p_result,
      n8n_execution_id = p_n8n_execution_id,
      updated_at = NOW()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

-- Fail an automation job
CREATE OR REPLACE FUNCTION fail_automation_job(
  p_job_id UUID,
  p_error_message TEXT,
  p_permanent BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempts INT;
  v_max_attempts INT;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM automation_queue WHERE id = p_job_id;

  UPDATE automation_queue
  SET status = CASE
      WHEN p_permanent OR v_attempts >= v_max_attempts THEN 'dead'
      ELSE 'pending'
    END,
      error_message = p_error_message,
      updated_at = NOW()
  WHERE id = p_job_id;

  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_entities TO authenticated;
GRANT EXECUTE ON FUNCTION queue_automation_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_automation_job TO authenticated;
GRANT EXECUTE ON FUNCTION complete_automation_job TO authenticated;
GRANT EXECUTE ON FUNCTION fail_automation_job TO authenticated;

-- =====================================================
-- DONE! Entity architecture is ready
-- =====================================================
