-- Agent Execution Tables
-- Creates tables for tracking code executions and browser sessions
-- Used by the sandboxed code execution service (E2B) and browser automation service (Browserless)

-- ============================================================================
-- Code Executions Table
-- Tracks every code execution request, including quota-rejected attempts.
-- ============================================================================
CREATE TABLE IF NOT EXISTS code_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER,
  execution_time_ms INTEGER,
  sandbox_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- Browser Sessions Table
-- Tracks every browser automation action (screenshot, scrape, pdf, etc.).
-- ============================================================================
CREATE TABLE IF NOT EXISTS browser_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  action TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout')),
  result_type TEXT,
  result_size_bytes INTEGER,
  timing_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- Indexes for efficient quota checking and user history queries
-- ============================================================================
CREATE INDEX idx_code_executions_user ON code_executions(user_id, created_at DESC);
CREATE INDEX idx_code_executions_status ON code_executions(status);
CREATE INDEX idx_browser_sessions_user ON browser_sessions(user_id, created_at DESC);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);

-- ============================================================================
-- Row Level Security (RLS)
-- Users can only see and create their own executions and sessions.
-- Admin/service role bypasses RLS for logging from server-side code.
-- ============================================================================
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

-- Code executions: users can view their own
CREATE POLICY "Users can view own executions"
  ON code_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Code executions: users can insert their own
CREATE POLICY "Users can insert own executions"
  ON code_executions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Browser sessions: users can view their own
CREATE POLICY "Users can view own browser sessions"
  ON browser_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Browser sessions: users can insert their own
CREATE POLICY "Users can insert own browser sessions"
  ON browser_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
