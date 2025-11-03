-- SCHEDULED JOBS SCHEMA
-- This schema manages scheduled jobs/cron tasks for AI automation

-- =====================================================
-- TABLE: scheduled_jobs
-- Stores scheduled tasks that run on a recurring basis
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job identification
  name TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * *" (9am daily)
  timezone TEXT DEFAULT 'UTC',

  -- Job configuration
  job_type TEXT NOT NULL, -- 'workflow', 'agent', 'custom'
  target_id UUID, -- References workflows or agents table
  config JSONB DEFAULT '{}'::jsonb,

  -- Execution settings
  enabled BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,

  -- Tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT, -- 'success', 'failed', 'timeout'
  next_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_job_type CHECK (job_type IN ('workflow', 'agent', 'custom')),
  CONSTRAINT valid_cron CHECK (cron_expression ~ '^[0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+$')
);

-- =====================================================
-- TABLE: job_executions
-- Logs every execution of a scheduled job
-- =====================================================
CREATE TABLE IF NOT EXISTS job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed', 'timeout'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Execution data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Logs
  logs JSONB DEFAULT '[]'::jsonb, -- Array of log entries

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout', 'cancelled'))
);

-- =====================================================
-- TABLE: job_templates
-- Pre-configured scheduled job templates
-- =====================================================
CREATE TABLE IF NOT EXISTS job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'productivity', 'analytics', 'maintenance', 'communication'
  icon TEXT,

  -- Default configuration
  default_cron TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  job_type TEXT NOT NULL,

  -- Template metadata
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_template_job_type CHECK (job_type IN ('workflow', 'agent', 'custom'))
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_scheduled_jobs_org ON scheduled_jobs(organization_id);
CREATE INDEX idx_scheduled_jobs_user ON scheduled_jobs(user_id);
CREATE INDEX idx_scheduled_jobs_enabled ON scheduled_jobs(enabled) WHERE enabled = true;
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX idx_scheduled_jobs_type ON scheduled_jobs(job_type);

CREATE INDEX idx_job_executions_job ON job_executions(job_id);
CREATE INDEX idx_job_executions_org ON job_executions(organization_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started ON job_executions(started_at DESC);

CREATE INDEX idx_job_templates_category ON job_templates(category);
CREATE INDEX idx_job_templates_popular ON job_templates(is_popular) WHERE is_popular = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Scheduled Jobs Policies
CREATE POLICY "Users can view their organization's jobs"
  ON scheduled_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their organization"
  ON scheduled_jobs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own jobs"
  ON scheduled_jobs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own jobs"
  ON scheduled_jobs FOR DELETE
  USING (user_id = auth.uid());

-- Job Executions Policies
CREATE POLICY "Users can view their organization's executions"
  ON job_executions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert executions"
  ON job_executions FOR INSERT
  WITH CHECK (true); -- Will be restricted by application logic

-- Job Templates Policies (public read)
CREATE POLICY "Anyone can view job templates"
  ON job_templates FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate next run time based on cron expression
-- Note: In production, use a proper cron parser library
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, from_time TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- Simplified: Add 1 hour for demo purposes
  -- In production, use a proper cron parser like pg_cron or application-level parser
  RETURN from_time + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to update job stats after execution
CREATE OR REPLACE FUNCTION update_job_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' OR NEW.status = 'failed' THEN
    UPDATE scheduled_jobs
    SET
      last_run_at = NEW.started_at,
      last_run_status = NEW.status,
      total_runs = total_runs + 1,
      successful_runs = successful_runs + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
      failed_runs = failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      next_run_at = calculate_next_run(cron_expression, NEW.completed_at),
      updated_at = NOW()
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job stats
CREATE TRIGGER update_job_stats_trigger
  AFTER UPDATE ON job_executions
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND (NEW.status = 'success' OR NEW.status = 'failed'))
  EXECUTE FUNCTION update_job_stats();

-- =====================================================
-- SEED DATA: Job Templates
-- =====================================================
INSERT INTO job_templates (name, description, category, icon, default_cron, job_type, is_popular, default_config) VALUES
  -- Daily tasks
  (
    'Daily Morning Briefing',
    'Get a comprehensive morning briefing with tasks, calendar, and priorities',
    'productivity',
    '☀️',
    '0 8 * * *', -- 8am daily
    'agent',
    true,
    '{"agent_type": "daily_digest", "include": ["tasks", "calendar", "emails", "priorities"]}'::jsonb
  ),
  (
    'Daily Task Review',
    'Review and prioritize tasks every morning',
    'productivity',
    '✅',
    '0 9 * * 1-5', -- 9am weekdays
    'agent',
    true,
    '{"agent_type": "task_manager", "action": "prioritize"}'::jsonb
  ),
  (
    'End of Day Summary',
    'Get a summary of completed work and tomorrow''s priorities',
    'productivity',
    '🌙',
    '0 17 * * 1-5', -- 5pm weekdays
    'agent',
    true,
    '{"agent_type": "daily_digest", "mode": "eod_summary"}'::jsonb
  ),

  -- Weekly tasks
  (
    'Weekly Team Report',
    'Generate and send weekly team productivity report',
    'analytics',
    '📊',
    '0 9 * * 1', -- 9am Monday
    'workflow',
    true,
    '{"report_type": "weekly", "recipients": ["team"], "include_metrics": true}'::jsonb
  ),
  (
    'Weekly Meeting Prep',
    'Prepare materials for weekly team meetings',
    'productivity',
    '📅',
    '0 10 * * 0', -- 10am Sunday
    'agent',
    false,
    '{"agent_type": "meeting_assistant", "meeting_pattern": "weekly_team"}'::jsonb
  ),

  -- Document management
  (
    'Document Cleanup',
    'Archive old documents and clean up tags',
    'maintenance',
    '🗂️',
    '0 2 * * 0', -- 2am Sunday
    'workflow',
    false,
    '{"action": "cleanup", "archive_older_than_days": 90}'::jsonb
  ),
  (
    'Automatic Document Tagging',
    'Process untagged documents and apply AI tags',
    'maintenance',
    '🏷️',
    '0 3 * * *', -- 3am daily
    'agent',
    false,
    '{"agent_type": "document_analyzer", "action": "tag_untagged"}'::jsonb
  ),

  -- Communication
  (
    'Email Triage',
    'Automatically categorize and prioritize morning emails',
    'communication',
    '📧',
    '0 7 * * 1-5', -- 7am weekdays
    'agent',
    true,
    '{"agent_type": "email_organizer", "auto_categorize": true}'::jsonb
  ),
  (
    'Inbox Zero Reminder',
    'Remind to clear inbox at end of day',
    'communication',
    '📬',
    '0 16 * * 1-5', -- 4pm weekdays
    'workflow',
    false,
    '{"action": "notification", "message": "Time to achieve inbox zero!"}'::jsonb
  ),

  -- Analytics
  (
    'Monthly Analytics Report',
    'Generate comprehensive monthly analytics',
    'analytics',
    '📈',
    '0 9 1 * *', -- 9am on 1st of month
    'workflow',
    true,
    '{"report_type": "monthly", "include_all_metrics": true}'::jsonb
  ),
  (
    'Productivity Insights',
    'Analyze work patterns and suggest improvements',
    'analytics',
    '💡',
    '0 10 * * 5', -- 10am Friday
    'agent',
    false,
    '{"agent_type": "workflow_optimizer", "analyze_week": true}'::jsonb
  ),

  -- Custom intervals
  (
    'Hourly Task Sync',
    'Sync tasks across all platforms hourly',
    'maintenance',
    '🔄',
    '0 * * * *', -- Every hour
    'workflow',
    false,
    '{"action": "sync", "platforms": ["calendar", "email", "tasks"]}'::jsonb
  ),
  (
    'Every 15 Minutes - High Priority Check',
    'Check for high-priority items every 15 minutes',
    'productivity',
    '⚡',
    '*/15 * * * *', -- Every 15 minutes
    'agent',
    false,
    '{"agent_type": "task_manager", "filter": "high_priority"}'::jsonb
  );

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Function to initialize next_run_at for existing jobs
CREATE OR REPLACE FUNCTION initialize_next_run_times()
RETURNS void AS $$
BEGIN
  UPDATE scheduled_jobs
  SET next_run_at = calculate_next_run(cron_expression, NOW())
  WHERE next_run_at IS NULL AND enabled = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get all jobs due to run
-- SELECT * FROM scheduled_jobs
-- WHERE enabled = true
--   AND next_run_at <= NOW()
-- ORDER BY next_run_at;

-- Get job execution history with success rate
-- SELECT
--   sj.id,
--   sj.name,
--   sj.total_runs,
--   sj.successful_runs,
--   sj.failed_runs,
--   CASE
--     WHEN sj.total_runs > 0
--     THEN ROUND((sj.successful_runs::numeric / sj.total_runs * 100), 2)
--     ELSE 0
--   END as success_rate_percent
-- FROM scheduled_jobs sj
-- ORDER BY success_rate_percent DESC;

-- Get recent executions with duration
-- SELECT
--   je.id,
--   sj.name as job_name,
--   je.status,
--   je.started_at,
--   je.duration_ms / 1000.0 as duration_seconds
-- FROM job_executions je
-- JOIN scheduled_jobs sj ON je.job_id = sj.id
-- ORDER BY je.started_at DESC
-- LIMIT 20;
